// 图片添加页

import Header from '@/components/shared/Header'
import React from 'react'
import { transformationTypes } from '@/constants'
import TransformationForm from '@/components/shared/TransformationForm';
import { getUserById } from '@/lib/actions/user.actions';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';


//params是next.js的路由参数,等于[type],等于动态路径的名称如restore
const AddTransformationTypePage = async ( {params: {type}}: SearchParamProps) => {
  const transformationType = transformationTypes[type];
  
  const { userId } = await auth();  //获取当前用户的ID，来自Clerk认证
  if (!userId) redirect('/sign-in'); //如果没有用户ID，重定向到登录页面
  const user = await getUserById(userId); //获取用户信息，来自数据库
  
  return (
    <>
      <Header 
        title={transformationType.title}
        subtitle={transformationType.subTitle}
      />
      <section className='mt-10'>
        <TransformationForm 
          action='Add'
          userId={user._id}  //传入用户的真实ID，来自数据库
          type={transformationType.type as TransformationTypeKey}  //传入转换类型的键
          creditBalance={user.creditBalance}  //传入用户的信用余额
        />

      </section>

      
    </>
   
  )
}

export default AddTransformationTypePage

 