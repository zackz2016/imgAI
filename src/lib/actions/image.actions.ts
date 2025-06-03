// 操作数据库的方法，用于增删改查图片信息

"use server"

import { revalidatePath } from "next/cache";
import { handleError } from "../utils";
import { connectToDatabase } from "../database/mongoose";
import User from "../database/models/user.model";
import Image from "../database/models/image.model";
import { redirect } from 'next/navigation';
import {v2 as cloudinary} from 'cloudinary';

const populateUser = (query: any) => query.populate({    // populate是mongoose的填充方法，用于引用其他模型的字段
    path: "author",   // 引用的字段
    model: "User",    // 引用的模型
    select:'_id firstName lastName clerkId'  // 返回的字段，用空格分隔
});

// ADD IMAGE
export async function addImage({image, userId, path}: AddImageParams) {
    try {
        await connectToDatabase();

        const author = await User.findById(userId);

        if(!author) throw new Error("User not found");

        const newImage = await Image.create({
             ...image, 
             author: author._id
            });

        revalidatePath(path);  //刷新指定路径的缓存，相当于强制刷新页面，为了看到新的图片

        return JSON.parse(JSON.stringify(newImage));
    }
    catch (error) {
        handleError(error);
    }
}


// UPDATE IMAGE
export async function updateImage({image, userId, path}: UpdateImageParams) {
    try {
        await connectToDatabase();

        const imageToUpdate = await Image.findById(image._id);

        if(!imageToUpdate || imageToUpdate.author.toHexString() !== userId) throw new Error("Unauthorized or Image not found");  //toHexstring比toString更安全

        const updateImage = await Image.findByIdAndUpdate(
            imageToUpdate._id,
            image,
            { new: true }
        );

        revalidatePath(path);  //刷新指定路径的缓存，相当于强制刷新页面，为了看到新的图片

        return JSON.parse(JSON.stringify(updateImage));
    }
    catch (error) {
        handleError(error);
    }
}

// DELETE IMAGE
export async function deleteImage( imageId: string ) {
    try {
        await connectToDatabase();

        await Image.findByIdAndDelete(imageId);   
    } catch (error) {
        handleError(error);
    } finally {
      redirect('/');  // 重定向到首页
    }
}

// GET IMAGE
export async function getImageById( imageId: string ) {
    try {
        await connectToDatabase();

        const image = await populateUser(Image.findById(imageId));  //用填空方法返回图片和作者的信息

        if(!image) throw new Error("Image not found");

        return JSON.parse(JSON.stringify(image));
    }
    catch (error) {
        handleError(error);
    }
}


// GET ALL IMAGES
export async function getAllImages( { limit = 9, page = 1, searchQuery = '' }: {
    limit?: number;
    page: number;
    searchQuery?: string;
} ) {
    try {
        await connectToDatabase();
        // Cloudinary 云配置
        cloudinary.config({ 
            cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
        });

        let expression = 'folder=imgai000';

        if (searchQuery) {
            expression += `AND ${searchQuery}`;  
        }

        const { resources } = await cloudinary.search
            .expression(expression)
            .execute();

        const resourceIds = resources.map((resource: any) => resource.public_id);

        let query = {};

        if(searchQuery) {
            query = {
                publicId: { $in: resourceIds },
            }
        }

        // 分页
        const skipAmount = (Number(page)-1) * limit;  // 从第几个开始
        const images = await populateUser(Image.find(query))
            .sort({ updateAt: -1 })
            .skip(skipAmount)
            .limit(limit);

        const totalImages = await Image.find(query).countDocuments();  // 获取总数
        const savedImages = await Image.find().countDocuments;  // 获取所有图片

        return {
            data: JSON.parse(JSON.stringify(images)),
            totalPage: Math.ceil(totalImages / limit),
            savedImages,
        }

    }
    catch (error) {
        handleError(error);
    }
}

// GET IMAGES BY USER
export async function getUserImages({
  limit = 9,
  page = 1,
  userId,
}: {
  limit?: number;
  page: number;
  userId: string;
}) {
  try {
    await connectToDatabase();

    const skipAmount = (Number(page) - 1) * limit;

    const images = await populateUser(Image.find({ author: userId }))
      .sort({ updatedAt: -1 })
      .skip(skipAmount)
      .limit(limit);

    const totalImages = await Image.find({ author: userId }).countDocuments();

    return {
      data: JSON.parse(JSON.stringify(images)),
      totalPages: Math.ceil(totalImages / limit),
    };
  } catch (error) {
    handleError(error);
  }
}