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

  // Approximate aspect ratio for horizontal logo (text + emblem)
  // Adjust these if needed based on actual logo dimensions
  const widthMultiplier = 3.5 // Horizontal logo is wider than tall

  return (
    <div className={`flex items-center ${className} transition-opacity hover:opacity-90`}>
      <Image
        src="/images/logo.png"
        alt="Magnolia Logo"
        width={200}
        height={57}
        className={`${sizeClasses[size]} w-auto object-contain`}
        priority
        style={{ 
          maxWidth: '100%',
          height: 'auto'
        }}
      />
    </div>
  )
}

