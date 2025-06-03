"use client"

import { useToast } from "@/hooks/use-toast"
import { dataUrl } from "@/lib/utils";
import { CldImage, CldUploadWidget } from "next-cloudinary"
import { getImageSize } from "@/lib/utils";
import { PlaceholderValue } from "next/dist/shared/lib/get-img-props";
import Image from "next/image";


type MediaUploderProps = {
  onValueChange: (value:string) => void;  //函数类型，不返回值
  setImage: React.Dispatch<any>;
  publicId: string;
  image: any;
  type: string;
}

// 图片上传组件
const MediaUploader = ({
  onValueChange, // 用于在上传成功后更新图片的publicId
  setImage,      // 用于在上传成功后更新图片信息（如宽高、secureUrl等）
  image,         // 当前图片对象，包含所有相关信息
  publicId,      // 图片的公共标识符，用于在云存储中引用图片
  type           // 图片的转换类型，用于确定处理逻辑
}: MediaUploderProps) => {

    const { toast } = useToast()

    // 图片上传成功后，更新图片信息image，result是cloudinary返回的结果，包含图片的信息
    const onUploadSuccessHandler = (result: any) => {
      setImage((prevState: any) => ({
         ...prevState, 
         publicId: result?.info?.public_id,   //如果result存在，info也存在，则返回public_id
         width: result?.info?.width,
         height: result?.info?.height,
         secureURL: result?.info?.secure_url
        }))

       onValueChange(result?.info?.public_id)  // 调用onValueChange函数，实际上是调用field.onChange更新图片的publicId

       // 显示一条临时信息
       toast({
          title: 'Image uploading successfully',
          description: '1 credit was deducted from your account',
          duration: 5000,
          className: 'success-toast'
       })
    }

    const onUploadErrorHandler = () => {
        toast({
          title: 'something went wrong while uploading',
          description: 'Please try again',
          duration: 5000,
          className: 'error-toast'
        })
    }

    // 渲染UI和处理执行逻辑
  return ( 
    <CldUploadWidget             //图像上传组件
      uploadPreset="imgai000"    //与cloudinary的上传预设同名
      options={{
        multiple:false,
        resourceType:"image",
      }}
      onSuccess={onUploadSuccessHandler}
      onError={onUploadErrorHandler}
    >
      {( {open} ) => (                     
        <div className="flex flex-col gap-4">
          <h3 className="h3-bold text-dark-600">
            Original
          </h3>

          {publicId ?(          //条件渲染逻辑，如果publicId有值，代表图片已上传
            <>
              <div>
                <CldImage       //获取cloudinary上的图片并显示
                  width={getImageSize(type, image, "width")}   
                  height={getImageSize(type, image, "height")}
                  src={publicId}   
                  alt="image"
                  sizes={"(max-width:767px) 100vw, 50vw"} 
                  placeholder={dataUrl as PlaceholderValue}   //闪烁效果的占位符
                  className="media-uploader_cldImage"
                />
              </div>
            </>
          ): (                 //如果没有publicId，代表图片未上传，显示上传按钮
            <div className="media-uploader_cta"  onClick = {() => open()}>   
              <div className="media-uploader_cta-image">
                <Image 
                  src="/assets/icons/add.svg"
                  alt="Add Image"
                  width={24}
                  height={24}
                />                
              </div>
              <p className="p-14-medium">Click here to upload image</p>
            </div>
          )}

        </div>
      )}
    </CldUploadWidget>
  )
}

export default MediaUploader
