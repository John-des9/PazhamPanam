import React, { useState, useEffect } from 'react'

/**
 * BananaPeelInteractive
 * Subtle, polished interactive banana with natural peeling flaps and swinging fiber string.
 */
const BananaPeelInteractive = ({
  size = 40,
  trigger = false,
  isCelebration = false,
  isSlip = false,
  onPeel = null,
  showString = true,
  className = ''
}) => {
  const [peeled, setPeeled] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (trigger || isCelebration) {
      handlePeel()
    }
  }, [trigger, isCelebration])

  const handlePeel = () => {
    if (animating) return
    setAnimating(true)
    setPeeled(true)
    if (onPeel) onPeel()

    // Gracefully restore after 2 seconds
    setTimeout(() => {
      setPeeled(false)
      setAnimating(false)
    }, 2200)
  }

  return (
    <div
      onClick={handlePeel}
      title="Click to peel! 🍌"
      className={`relative inline-flex items-center justify-center cursor-pointer select-none transition-transform hover:scale-105 active:scale-95 ${
        isSlip ? 'animate-banana-slip' : ''
      } ${animating && isCelebration ? 'animate-profit-bounce' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        {/* Drop shadow on peel */}
        <ellipse cx="24" cy="42" rx="14" ry="3" fill="#000000" fillOpacity="0.08" />

        {/* Banana Stem (Top brown stalk) */}
        <path
          d="M24 6 C24 4, 25 3, 26 2.5 C26.8 2, 27.5 2.2, 27 3.5 C26.5 4.8, 25 6, 24 6 Z"
          fill="#854d0e"
        />

        {/* Revealed Soft Cream Banana Fruit Inside */}
        <path
          d="M21 9 C20 16, 21 32, 24 37 C27 32, 28 16, 27 9 C25.5 8, 22.5 8, 21 9 Z"
          fill="#fef08a"
          stroke="#fde047"
          strokeWidth="1.2"
        />

        {/* Subtle Banana Fruit Core Texture Ridges */}
        <path
          d="M24 10 L24 34"
          stroke="#fef9c3"
          strokeWidth="0.8"
          strokeLinecap="round"
        />

        {/* Left Peel Skin */}
        <path
          d="M21 9 C18 16, 17 28, 22 38 C19 33, 17 22, 21 9 Z"
          fill="#facc15"
          stroke="#d97706"
          strokeWidth="1.2"
          className={`transition-all duration-500 origin-top-left ${
            peeled ? 'peel-flap-left' : ''
          }`}
        />

        {/* Right Peel Skin */}
        <path
          d="M27 9 C30 16, 31 28, 26 38 C29 33, 31 22, 27 9 Z"
          fill="#eab308"
          stroke="#b45309"
          strokeWidth="1.2"
          className={`transition-all duration-500 origin-top-right ${
            peeled ? 'peel-flap-right' : ''
          }`}
        />

        {/* Center Main Peel Covering (slides down subtly when peeled) */}
        <path
          d="M21 9 C23 7.8, 25 7.8, 27 9 C28.5 17, 28.5 28, 24 39 C19.5 28, 19.5 17, 21 9 Z"
          fill="#facc15"
          stroke="#ca8a04"
          strokeWidth="1"
          style={{
            transform: peeled ? 'translateY(12px) scaleY(0.65)' : 'translateY(0) scaleY(1)',
            opacity: peeled ? 0.35 : 1,
            transition: 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.5s ease'
          }}
        />

        {/* Hanging Banana String / Fiber (Requirement 2) */}
        {showString && (
          <path
            d="M24 38 Q22 41, 23 44"
            stroke="#fef08a"
            strokeWidth="1.2"
            strokeLinecap="round"
            className="animate-banana-string origin-top"
          />
        )}
      </svg>

      {/* Floating Gold Sparkle Particles on Peel (Celebration micro-particles) */}
      {peeled && isCelebration && (
        <>
          <span
            className="absolute text-[10px] animate-banana-particle pointer-events-none"
            style={{ top: '-12px', left: '-6px' }}
          >
            ✨
          </span>
          <span
            className="absolute text-[9px] animate-banana-particle pointer-events-none"
            style={{ top: '-16px', right: '-4px', animationDelay: '0.2s' }}
          >
            🍌
          </span>
          <span
            className="absolute text-[10px] animate-banana-particle pointer-events-none"
            style={{ top: '-8px', right: '12px', animationDelay: '0.4s' }}
          >
            🔥
          </span>
        </>
      )}
    </div>
  )
}

export default BananaPeelInteractive
