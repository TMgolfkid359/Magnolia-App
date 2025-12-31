'use client'

import Image from 'next/image'

interface MagnoliaLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'light' | 'dark'
}

export default function MagnoliaLogo({ className = '', size = 'md', variant = 'light' }: MagnoliaLogoProps) {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  }

  const imageSizes = {
    sm: 32,
    md: 48,
    lg: 64,
  }

  return (
    <div className={`flex items-center ${className} transition-opacity hover:opacity-90`}>
      <Image
        src="/images/logo.png"
        alt="Magnolia Logo"
        width={imageSizes[size]}
        height={imageSizes[size]}
        className={`${sizeClasses[size]} w-auto object-contain`}
        priority
      />
    </div>
  )
}

