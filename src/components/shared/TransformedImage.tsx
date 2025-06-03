"use client"

import { dataUrl, debounce, download, getImageSize } from '@/lib/utils'
import { set } from 'mongoose'
import { CldImage, getCldImageUrl } from 'next-cloudinary'
import { PlaceholderValue } from 'next/dist/shared/lib/get-img-props'
import Image from 'next/image'
import React from 'react'

const TransformedImage = ({image, type, title, transformationConfig, isTransforming, 
  setIsTransforming, hasDownload = false}: TransformedImageProps) => {

  // 图片下载
  const downloadHandler = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.preventDefault();
    download(getCldImageUrl({
      width: image?.width,
      height: image?.height,
      src: image?.publicId,
      ...transformationConfig
    }), title)
  }

  //转换后的图片渲染逻辑
  return (
    <div className='flex flex-col gap-4'>
      <div className='flex-between'>   {/* 子元素两端对齐 */}
        <h3 className='h3-bold text-dark-600'>Transformed</h3>     

        {/* 有下载时，显示下载按钮 */}
        {hasDownload && (
          <button className='download-btn' onClick={() => {downloadHandler}}>
            <Image 
              src="/assets/icons/download.svg"
              alt="Download"
              width={24}
              height={24}
              className='pb-[6px]'>
            </Image>
          </button>
        )}                  
      </div>

      {/* 如果图片存在且转换配置存在，显示转换后的图片 */}
      {image?.publicId && transformationConfig? (
        <div className='relative'>  
          <CldImage       
            width={getImageSize(type, image, "width")}   
            height={getImageSize(type, image, "height")}
            src={image?.publicId}       //图片来自image state
            alt={image?.title}
            sizes={"(max-width:767px) 100vw, 50vw"} 
            placeholder={dataUrl as PlaceholderValue}   //闪烁效果的占位符
            className="transformed-image"
            onLoad={() => {
              setIsTransforming && setIsTransforming(false)  //加载完成后，禁用转换按钮
            }}
            onError={() => {
              debounce(() => {
                setIsTransforming && setIsTransforming(false)  //加载失败后，禁用转换按钮
              }, 8000)()
            }}
            {...transformationConfig}  //展开全部变换配置
          />

          {isTransforming && (
            <div className='transforming-loader'>
              <Image 
                src="/assets/icons/spinner.svg" 
                alt="spinner" 
                width={50}
                height={50} 
              />
              <p className='text-white/80'>Please wait...</p>
              
            </div>
          )}
        </div>
      ): (
        <div className='transformed-placeholder'>
          Transformed image
        </div>
      )}
      
    </div>
  )
}

export default TransformedImage
