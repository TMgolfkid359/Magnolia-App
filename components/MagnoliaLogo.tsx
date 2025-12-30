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
    <div className={`flex items-center ${className} ${bgColor} px-2 py-1 rounded`}>
      {/* Text */}
      <span className={`${textSizes[size]} font-serif font-bold tracking-wide ${textColor} mr-3`}>
        MAGNOLIA
      </span>
      
      {/* Emblem - Dark green curved/triangular shape with black outline magnolia flower */}
      <svg
        className={sizeClasses[size]}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dark green curved/triangular shape (stylized leaf or section) */}
        <path
          d="M20 20 Q30 15 40 25 L50 45 Q55 60 60 75 L70 85 Q75 90 85 95 L95 85 Q90 70 85 55 L75 35 Q70 25 60 20 Q50 15 40 20 Q30 18 20 20 Z"
          fill="#1a5f3f"
          stroke="#000000"
          strokeWidth="1.5"
        />
        
        {/* Black outline magnolia flower overlaid on lower-right portion */}
        <g transform="translate(50, 60)">
          {/* Outer petals - black outline only, overlapping full bloom */}
          <path
            d="M0,-18 Q-8,-25 -12,-15 Q-15,-8 -12,0 Q-10,8 -5,12 Q0,15 5,12 Q10,8 12,0 Q15,-8 12,-15 Q8,-25 0,-18 Z"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M-8,-10 Q-15,-18 -18,-8 Q-20,-2 -18,5 Q-15,12 -8,15 Q0,18 8,15 Q15,12 18,5 Q20,-2 18,-8 Q15,-18 8,-10 Q0,-5 -8,-10 Z"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinejoin="round"
            transform="rotate(30)"
          />
          <path
            d="M-10,0 Q-18,5 -20,12 Q-18,20 -12,25 Q-5,28 0,28 Q5,28 12,25 Q18,20 20,12 Q18,5 10,0 Q0,-3 -10,0 Z"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinejoin="round"
            transform="rotate(60)"
          />
          <path
            d="M-5,8 Q-12,15 -15,22 Q-12,28 -5,30 Q0,32 5,30 Q12,28 15,22 Q12,15 5,8 Q0,5 -5,8 Z"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinejoin="round"
            transform="rotate(90)"
          />
          <path
            d="M0,12 Q-8,18 -10,25 Q-8,30 0,32 Q8,30 10,25 Q8,18 0,12 Z"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            strokeLinejoin="round"
            transform="rotate(120)"
          />
          
          {/* Center of flower - black outline */}
          <circle
            cx="0"
            cy="8"
            r="6"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  )
}

