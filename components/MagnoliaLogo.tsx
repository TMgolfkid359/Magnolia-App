'use client'

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
    <div className={`flex items-center ${className} ${bgColor} px-2 py-1 rounded transition-opacity hover:opacity-90`}>
      {/* Text */}
      <span className={`${textSizes[size]} font-serif font-bold tracking-wider ${textColor} mr-3 drop-shadow-sm`}>
        MAGNOLIA
      </span>
      
      {/* Emblem - Refined airplane tail fin shape with magnolia flower */}
      <svg
        className={sizeClasses[size]}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Airplane tail fin shape - dark green with smooth curves */}
        <path
          d="M15 15 Q25 10 35 18 L45 35 Q50 50 55 65 L65 75 Q70 80 80 85 L90 75 Q85 60 80 45 L70 25 Q65 15 55 10 Q45 8 35 12 Q25 10 15 15 Z"
          fill="#1a5f3f"
          stroke="#0d3d26"
          strokeWidth="1"
          className="drop-shadow-sm"
        />
        
        {/* Magnolia flower - black outline, positioned on tail fin */}
        <g transform="translate(45, 50)">
          {/* Outer petals - elegant magnolia bloom */}
          <path
            d="M0,-15 Q-6,-20 -10,-12 Q-12,-6 -10,0 Q-8,6 -4,10 Q0,12 4,10 Q8,6 10,0 Q12,-6 10,-12 Q6,-20 0,-15 Z"
            fill="none"
            stroke="#000000"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <path
            d="M-6,-8 Q-12,-15 -15,-6 Q-16,-1 -15,4 Q-12,10 -6,12 Q0,15 6,12 Q12,10 15,4 Q16,-1 15,-6 Q12,-15 6,-8 Q0,-4 -6,-8 Z"
            fill="none"
            stroke="#000000"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            transform="rotate(30)"
          />
          <path
            d="M-8,0 Q-15,4 -16,10 Q-15,16 -10,20 Q-4,23 0,23 Q4,23 10,20 Q15,16 16,10 Q15,4 8,0 Q0,-2 -8,0 Z"
            fill="none"
            stroke="#000000"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            transform="rotate(60)"
          />
          <path
            d="M-4,6 Q-10,12 -12,18 Q-10,20 -5,25 Q0,27 5,25 Q10,20 12,18 Q10,12 4,6 Q0,4 -4,6 Z"
            fill="none"
            stroke="#000000"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            transform="rotate(90)"
          />
          
          {/* Center of flower - subtle detail */}
          <circle
            cx="0"
            cy="5"
            r="4"
            fill="none"
            stroke="#000000"
            strokeWidth="1.5"
          />
        </g>
      </svg>
    </div>
  )
}

