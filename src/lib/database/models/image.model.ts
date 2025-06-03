import { Document, model, models, Schema } from "mongoose";

// 定义数据库模型的接口，用于描述数据的结构和类型，只在代码中起作用
export interface IImage extends Document {   
  title: string;
  transformationType: string;
  publicId: string;
  secureURL: string; 
  width?: number;
  height?: number;
  config?: object; 
  transformationURL?: string;
  aspectRatio?: string;
  color?: string;
  prompt?: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

//定义一个数据库模型,控制数据如何存储在MongoDB中，只在数据库中起作用
const ImageSchema = new Schema ({

    title: { type: String, required: true },
    transformationType: { type: String, required: true },
    publicId: { type: String, required: true },  // 图片的唯一ID
    secureURL: { type: String, required: true }, // 图片的安全URL
    width: { type: Number },
    height: { type: Number },
    config: { type: Object },
    transformationURL: { type: String },  // 图片的转换URL
    aspectRatio: { type: String },
    color: { type: String },
    prompt: { type: String },
    author: { type: Schema.Types.ObjectId, ref: 'User' },  // author是对象类型，引用User集合，是一个外键
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

const Image = models?.Image || model('Image', ImageSchema); //创建集合'Image'（数据库里面的表）,如果已存在就用现有的，否则创建一个新的

export default Image;