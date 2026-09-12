import React from 'react'

/**
 * BananaLoader
 * Replaces generic loading spinners with a subtle, premium bobbing banana loader.
 */
const BananaLoader = ({ text = 'Pazham loading aanu...', size = 'md', className = '' }) => {
  const pixelSize = size === 'sm' ? 32 : size === 'lg' ? 64 : 44

  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center select-none ${className}`}>
      {/* Animated Bobbing Banana */}
      <div className="relative animate-banana-loader mb-2">
        <svg
          width={pixelSize}
          height={pixelSize}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stalk */}
          <path d="M24 5 C24 3, 25.5 2, 26.5 2 C27 3.5, 25.5 5, 24 5 Z" fill="#854d0e" />

          {/* Fruit core */}
          <path
            d="M21 8 C20 15, 21 31, 24 37 C27 31, 28 15, 27 8 Z"
            fill="#fef08a"
            stroke="#fde047"
            strokeWidth="1.2"
          />

          {/* Outer curved skin */}
          <path
            d="M20 9 C18 17, 18 29, 23 38 C19 32, 17 21, 20 9 Z"
            fill="#facc15"
            stroke="#d97706"
            strokeWidth="1.2"
          />
          <path
            d="M28 9 C30 17, 30 29, 25 38 C29 32, 31 21, 28 9 Z"
            fill="#eab308"
            stroke="#b45309"
            strokeWidth="1.2"
          />

          {/* Subtle hanging string sway */}
          <path
            d="M24 38 Q22 41, 23 44"
            stroke="#fef08a"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="animate-banana-string origin-top"
          />
        </svg>

        {/* Subtle shadow */}
        <div className="w-8 h-1.5 bg-amber-900/15 rounded-full mx-auto mt-1 blur-2xs" />
      </div>

      {/* Loading caption in natural Manglish */}
      <span className="text-xs font-bold text-amber-900 tracking-tight">
        {text}
      </span>
      <span className="text-[10px] text-slate-400 mt-0.5">
        Spot Mandi Live Data
      </span>
    </div>
  )
}

export default BananaLoader
