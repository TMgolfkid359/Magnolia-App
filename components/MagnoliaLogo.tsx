'use client'

import React from 'react'

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

  const textSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl',
  }

  const textColor = variant === 'dark' ? 'text-white' : 'text-magnolia-800'
  const bgColor = variant === 'dark' ? 'bg-black' : 'bg-transparent'

  return (
    <div className={`flex items-center ${className} ${bgColor} px-2 py-1 rounded`}>
      {/* Text */}
      <span className={`${textSizes[size]} font-serif font-bold tracking-wide ${textColor} mr-3`}>
        MAGNOLIA
      </span>
      
      {/* Emblem */}
      <svg
        className={sizeClasses[size]}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Airplane tail fin shape (dark green) - curved upward pointing */}
        <path
          d="M15 15 L15 85 L70 85 L90 50 L70 15 Z"
          fill="#1a5f3f"
          stroke="#000000"
          strokeWidth="2"
        />
        
        {/* Magnolia flower inside the lower-right portion of the emblem */}
        <g transform="translate(45, 55)">
          {/* Outer petals - overlapping */}
          <ellipse
            cx="0"
            cy="-12"
            rx="10"
            ry="15"
            fill="#1a5f3f"
            stroke="#000000"
            strokeWidth="1.2"
            opacity="0.95"
            transform="rotate(-20)"
          />
          <ellipse
            cx="10"
            cy="-4"
            rx="10"
            ry="15"
            fill="#1a5f3f"
            stroke="#000000"
            strokeWidth="1.2"
            opacity="0.95"
            transform="rotate(20)"
          />
          <ellipse
            cx="10"
            cy="8"
            rx="10"
            ry="15"
            fill="#1a5f3f"
            stroke="#000000"
            strokeWidth="1.2"
            opacity="0.95"
            transform="rotate(40)"
          />
          <ellipse
            cx="0"
            cy="16"
            rx="10"
            ry="15"
            fill="#1a5f3f"
            stroke="#000000"
            strokeWidth="1.2"
            opacity="0.95"
            transform="rotate(60)"
          />
          <ellipse
            cx="-10"
            cy="8"
            rx="10"
            ry="15"
            fill="#1a5f3f"
            stroke="#000000"
            strokeWidth="1.2"
            opacity="0.95"
            transform="rotate(-40)"
          />
          <ellipse
            cx="-10"
            cy="-4"
            rx="10"
            ry="15"
            fill="#1a5f3f"
            stroke="#000000"
            strokeWidth="1.2"
            opacity="0.95"
            transform="rotate(-20)"
          />
          
          {/* Center of flower */}
          <circle
            cx="0"
            cy="4"
            r="6"
            fill="#1a5f3f"
            stroke="#000000"
            strokeWidth="1.2"
          />
        </g>
      </svg>
    </div>
  )
}

