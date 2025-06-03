"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { aspectRatioOptions, creditFee, defaultValues, transformationTypes } from "@/constants"
import { CustomField } from "./CustomField"
import { use, useEffect, useState, useTransition } from "react"
import { AspectRatioKey, debounce, deepMergeObjects } from "@/lib/utils"
import { updateCredits } from "@/lib/actions/user.actions"
import MediaUploader from "./MediaUploader"
import TransformedImage from "./TransformedImage"
import { getCldImageUrl } from "next-cloudinary"
import { addImage, updateImage } from "@/lib/actions/image.actions"
import { useRouter } from "next/navigation"
import { InsufficientCreditsModal } from "./InsufficientCreditsModal"

// 定义表单字段的属性类型，用zod来验证表单数据
export const formSchema = z.object({
  title:z.string(),
  aspectRatio:z.string().optional(),
  color: z.string().optional(),
  prompt: z.string().optional(),
  publicId: z.string(),
})

//定义表单组件，设置表单的默认值，如果数据存在且操作为更新，则使用数据中的值，否则使用默认值
//data代表图片信息，如果父组件传入data，则使用data中的值，否则使用空值
const TransformationForm = ( { data = null, action, userId, type, creditBalance, config = null}: TransformationFormProps ) => {
    
    const transformationType = transformationTypes[type]; 
    const [image, setImage] = useState(data);    // image存放图像的信息,初始是空值，在MediaUploader组件中onUploadSuccessHandler会更新image为实际的图片信息
    const [newTransformation, setNewTransformation] = useState<Transformations | null>(null);  //用户新输入的变换配置，是个临时状态，但还没确认，类似购物车
    const [isSubmitting, setIsSubmitting] = useState(false);    //是否正在保存图像
    const [isTransforming, setIsTransforming] = useState(false);  //是否正在图像变换
    const [transformationConfig, setTransformationConfig] = useState(config);  //完整的用户配置，已经确认，相当于订单
    const [isPending, startTransition] = useTransition();  // startTransition用于包裹异步操作，把低优先级操作放到后台执行，不阻塞UI，isPending代表是否正在执行
    const router = useRouter();  

    // 如果传入的data存在且action为'Update'，则使用data中的值，否则使用默认值
    const initialValues = data && action === 'Update' ? {
        title: data?.title,
        aspectRatio: data?.aspectRatio,
        color: data?.color,
        prompt: data?.prompt,
        publicId: data?.publicId,
    } : defaultValues

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })
 
  // 用户点击Save image按钮后的操作
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsTransforming(true)

    if(data || image) {                            // 如果data存在或者image存在，表示有图像信息
      const transformationUrl= getCldImageUrl({    // 获取图像变换后的信息
        width: image?.width,
        height: image?.height,
        src: image?.publicId,
        ...transformationConfig
      })

      const imageData = {
        title: values.title,
        publicId: image?.publicId,
        transformationType: type,
        width: image?.width,
        height: image?.height,
        config: transformationConfig,
        secureURL: image?.secureURL,
        transformationURL: transformationUrl,    // 图像的变换后的URL
        aspectRatio: values.aspectRatio,
        prompt: values.prompt,
        color: values.color    
      }

      if(action === 'Add') {
        try {
          const newImage = await addImage({
            image: imageData,
            userId, 
            path:'/'       
          })

          if(newImage) {
            form.reset();
            setImage(data);
            router.push(`/transformations/${newImage._id}`)  //跳转到新图像的详情页
          }
        } catch (error) {
          console.log(error) 
        }
      }

      if(action === 'Update') {
        try {
          const updatedImage = await updateImage({
            image: {
              ...imageData,   // 传入要更新的图像信息，新图
              _id: data._id   // 传入要更新的图像的ID，原图
            },
            userId,
            path:`/transformations/${data._id}`       
          })

          if(updatedImage) {
            router.push(`/transformations/${updatedImage._id}`)  //跳转到更新后的图像的详情页
          }
        } catch (error) {
          console.log(error) 
        }
      }
    }
      
    setIsSubmitting(false);
  }

  // 用户选择宽高比例时的操作
  const onSelectFieldHandler = (value: string, onChangeField: (value: string) => void) => {
    const imageSize = aspectRatioOptions[value as AspectRatioKey]; // 根据用户选择的值，获取选中的宽高比例，as是类型断言，告诉TypeScript这个值是AspectRatioKey类型

    setImage((prevState: any) => ({             //保留之前的状态prevState，只更新宽高和宽高比
      ...prevState,                             //展开对象
      aspectRatio:imageSize.aspectRatio,
      width: imageSize.width,
      height: imageSize.height,
      }));

    setNewTransformation(transformationType.config)  // 设置当前的转换类型，比如fillbackground，以便后续操作

    return onChangeField(value);
  }
  
  // 用户在输入框中输入内容时的操作
  const onInputChangeHandler = (fieldName:string, value: string, type: string, onChangeField: (value: string) => void) => {
    debounce(() => {
      setNewTransformation((prevState: any) => (
        {
          ...prevState,
          [type]: {
            ...prevState?.[type],                            
          [fieldName === 'prompt' ? 'prompt' : 'to']: value, // 更新对应的字段
        }}
      ))
    },1000)() // 使用防抖函数，避免频繁触发

    return onChangeField(value); // 更新表单字段的值

  }

  // 用户点击Apply transformatino按钮后的操作
  const onTransformHandler = async () => {
    setIsTransforming(true)

    setTransformationConfig(                                      //合并新旧配置，配置就是用户在界面上输入的各种参数和选择，用来指导生成图像的一套参数清单
      deepMergeObjects(newTransformation,transformationConfig)    //transformationConfig有值后，直接触发图片变换和渲染，代码在TransformedImage里
    )

    setNewTransformation(null)

    startTransition( async () => {                 //启动过渡，等待图片变换完成后，更新积分
      await updateCredits(userId, creditFee)              //startTransition用来包裹异步操作，让它低优先级执行
    })
  }

  useEffect(() => {
    if(image && (type === 'restore'|| type === 'removeBackground')) {
      setNewTransformation(transformationType.config)  // transformationType.config有值后，直接触发图片变换和渲染
    }
  }, [image, transformationType.config, type])   // 如果有图片，类型为restore或removeBackground，更新newTransformation


  // 渲染表单
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {creditBalance < Math.abs(creditFee) && <InsufficientCreditsModal />}      {/* 如果积分不足，显示提示 */}
        <CustomField 
            control={form.control}  // 使用自定义字段组件
            name="title"
            formLabel="Image title"
            className="w-full"
            render={( { field }) => <Input {...field} 
            className="input-field" />}
        />

        {type === 'fill' && (
          <CustomField 
            control={form.control}
            name="aspectRatio"
            formLabel="Aspect Ratio"
            className="w-full"
            render={({ field }) => (
                <Select
                    onValueChange={(value) => onSelectFieldHandler(value, field.onChange)}  // 用户选择宽高比例时的操作
                    value={field.value}    // 选中的宽高比例??
                    >
                    <SelectTrigger className="select-field">
                        <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(aspectRatioOptions).map(
                        (key) => (
                            <SelectItem
                                key={key}  // 使用key作为唯一标识符
                                value={key}  // 使用key作为value
                                className="select-item"
                            >
                                {aspectRatioOptions[key as keyof typeof aspectRatioOptions].label}
                            </SelectItem>
                        )
                      )}
                    </SelectContent>
                </Select>
            )}
          />)}

        {(type === 'remove' || type === 'recolor') && ( 
            <div className="prompt-field">
                <CustomField
                    control={form.control}
                    name="prompt"
                    formLabel={
                        type === 'remove' ? 'Objec to remove' : 'Object to recolor'
                    }
                    className="w-full"
                    render={({ field }) => (
                        <Input 
                            value={field.value}
                            className="input-field"
                            onChange={(e) => onInputChangeHandler(
                                'prompt',
                                e.target.value,
                                type,
                                field.onChange
                            )}
                        />
                    )}
                />

                {type === 'recolor' && (
                    <CustomField
                        control={form.control}
                        name="color"
                        formLabel="Replacement Color"
                        className="w-full"
                        render={({ field }) => (
                            <Input 
                                value={field.value}
                                className="input-field"
                                onChange={(e) => onInputChangeHandler(
                                    'color',
                                    e.target.value,
                                    'recolor',
                                    field.onChange
                            )}
                            />
                        )}
                    />
                )}

            </div>
        )}

        {/* 图片上传 */}
        <div className="media-uploader-field">  
          <CustomField              
            control={form.control}  // 使用react-hook-form的control对象来管理字段的状态
            /**
             * 使用publicId作为字段的名称，因为MediaUploader组件返回的值是一个publicId，用于在Cloudinary中引用图片。
             * 在react-hook-form中，name属性用于指定字段的名称，以便在onSubmit回调函数中可以使用这个名称来访问该字段的值。
             */
            name="publicId"
            className="flex size-full flex-col"
            render={({ field }) => (
              <MediaUploader                 
                onValueChange={field.onChange} // 将函数{field.onChange}传递给MediaUploader组件                
                setImage={setImage}   // 传递setImage函数，以便在MediaUploader组件内更新图片信息                
                publicId={field.value}  // 传递当前的publicId，用于在MediaUploader组件内显示当前图片                
                image={image}  // 传递当前的图片信息，用于在MediaUploader组件内显示当前图片                
                type={type}  // 传递当前的转换类型，用于在MediaUploader组件内确定上传和处理逻辑

              />
            )}
          />

          {/* 渲染转换后的图片 */}
          <TransformedImage
            image={image}
            type={type}
            title={form.getValues().title}
            isTransforming={isTransforming}
            setIsTransforming={setIsTransforming}
            transformationConfig={transformationConfig}
          />
        </div>

        <div className="flex flex-col gap-4">
            <Button 
                type="button"
                className="submit-button capitalize"
                disabled={isTransforming || newTransformation === null}
                onClick={onTransformHandler}
                >{isTransforming ? "Transforming..." : "Apply Transformation"}
            </Button>

            <Button 
                type="submit"
                className="submit-button capitalize"
                disabled={isSubmitting}
                >{isSubmitting ? "Submitting..." : "Save Image"}
            </Button>
        </div>        

      </form>
    </Form>
  )
}

export default TransformationForm
