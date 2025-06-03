//侧边栏模块，文件就是模块
"use client"

import Link from 'next/link'
import Image from 'next/image'
import React from 'react'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { navLinks } from '@/constants'
import { link } from 'fs'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'
import { usePathname } from 'next/navigation'
import { Button } from '../ui/button'

// 侧边栏组件，函数式组件
// 该组件用于显示侧边栏的内容
const Sidebar = () => {
  const pathname = usePathname();  // 获取当前路径

  return (
    <aside className='sidebar'>
      <div className='flex size-full flex-col gap-4'>
        <Link href='/' className='sidebar-logo'>
          <Image src="/assets/images/logo-text.svg" alt="logo" width={180} height={28} />
        </Link>

        <nav className='sidebar-nav'>
          <SignedIn>                                    
            <ul className='sidebar-nav_elements'>            
              {navLinks.slice(0,6).map((link) => {        // 从navlinks中获取链接名称，直接显示在侧边栏上
                const isActive = link.route === pathname  // 判断当前路径是否与导航链接的路由匹配

                return (
                  <li key={link.route} className={`sidebar-nav_element group ${                 // key的用途是在 React 中用于标识元素的唯一性
                    isActive ? 'bg-purple-gradient text-white' : 'text-gray-700'}`}>
                    <Link className='sidebar-link' href={link.route}>
                      <Image src={link.icon} alt='logo' width={24} height={24} className={`${isActive && "brightness-200"}`} />
                      {link.label}   
                    </Link>
                  </li>
                )
              })}
            </ul>

            <ul className='sidebar-nav_elements'>
              {navLinks.slice(6).map((link) => {
                const isActive = link.route === pathname  // 判断当前路径是否与导航链接的路由匹配

                return (
                  <li key={link.route} className={`sidebar-nav_element group ${                 // key的用途是在 React 中用于标识元素的唯一性
                    isActive ? 'bg-purple-gradient text-white' : 'text-gray-700'}`}>
                    <Link className='sidebar-link' href={link.route}>
                      <Image src={link.icon} alt='logo' width={24} height={24} className={`${isActive && "brightness-200"}`} />
                      {link.label}
                    </Link>
                  </li>
                )
              })}
              
              <li>
                <UserButton afterSignOutUrl="/" showName/>
              </li>              
            </ul>
          </SignedIn>

          <SignedOut>
            <Button asChild className='button bg-purple-gradient bg-cover'>
              <Link href="/sign-in">Login</Link>
            </Button>
          </SignedOut>
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
