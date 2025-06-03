import React from 'react'

const Header = ( {title, subtitle}: {title: string, subtitle?: string}) => {
  return (
    <>
     <h2 className='h2-bold text-dark-600 '>{title}</h2>
     {subtitle && <p className='text-gray-500'>{subtitle}</p>}
    </>
  )
}

export default Header
