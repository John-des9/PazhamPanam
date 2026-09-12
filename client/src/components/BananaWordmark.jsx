import React from 'react'

/**
 * BananaWordmark
 * Custom curved brand wordmark for PAZHAM PANAM inspired by the banana-shaped lettering reference.
 * The chunky uppercase letters physically follow the organic cradle curve of a Kerala banana,
 * with bold 3D extrusion, ripe golden-yellow gradients, banana stem on the left, and tapering tip on the right.
 */
const BananaWordmark = ({ className = 'h-7 sm:h-8 w-auto' }) => {
  // 100% Vector glyph paths for each letter (fillRule="evenodd")
  // Ensures pixel-perfect, font-independent rendering on any screen/OS
  const glyphs = {
    P: 'M 0 0 L 8.5 0 C 10.8 0 12 1.8 12 4.5 C 12 7.2 10.8 9 8.5 9 L 3.8 9 L 3.8 16 L 0 16 Z M 3.8 2.6 L 8 2.6 C 9.2 2.6 9.8 3.4 9.8 4.5 C 9.8 5.6 9.2 6.4 8 6.4 L 3.8 6.4 Z',
    A: 'M 4.5 0 L 8.5 0 L 13 16 L 9.4 16 L 8.4 11.5 L 4.6 11.5 L 3.6 16 L 0 16 Z M 6.5 3.5 L 7.6 9 L 5.4 9 Z',
    Z: 'M 0 0 L 12 0 L 12 3.5 L 4.4 12.5 L 12 12.5 L 12 16 L 0 16 L 0 12.5 L 7.6 3.5 L 0 3.5 Z',
    H: 'M 0 0 L 3.8 0 L 3.8 6.2 L 9.2 6.2 L 9.2 0 L 13 0 L 13 16 L 9.2 16 L 9.2 9.8 L 3.8 9.8 L 3.8 16 L 0 16 Z',
    M: 'M 0 0 L 3.6 0 L 7.5 7.5 L 11.4 0 L 15 0 L 15 16 L 11.6 16 L 11.6 5.8 L 7.5 11.2 L 3.4 5.8 L 3.4 16 L 0 16 Z',
    N: 'M 0 0 L 3.6 0 L 9.4 10.5 L 9.4 0 L 13 0 L 13 16 L 9.4 16 L 3.6 5.5 L 3.6 16 L 0 16 Z'
  }

  // Letters precisely calculated along the banana cradle curve
  // Center is at x=105, dipping naturally into the belly and sweeping up at the tips
  const letters = [
    // PAZHAM
    { char: 'P', x: 20, y: 9.3, rot: -9.1, w: 12 },
    { char: 'A', x: 34, y: 10.3, rot: -7.5, w: 13 },
    { char: 'Z', x: 49, y: 11.0, rot: -5.8, w: 12 },
    { char: 'H', x: 63, y: 11.6, rot: -4.1, w: 13 },
    { char: 'A', x: 78, y: 12.0, rot: -2.4, w: 13 },
    { char: 'M', x: 93, y: 12.2, rot: -0.5, w: 15 },
    // PANAM
    { char: 'P', x: 118, y: 12.0, rot: 2.2, w: 12 },
    { char: 'A', x: 132, y: 11.7, rot: 3.9, w: 13 },
    { char: 'N', x: 147, y: 11.1, rot: 5.6, w: 13 },
    { char: 'A', x: 162, y: 10.3, rot: 7.4, w: 13 },
    { char: 'M', x: 177, y: 9.3, rot: 9.2, w: 15 }
  ]

  return (
    <svg
      viewBox="0 0 222 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block overflow-visible select-none transition-transform duration-200 hover:scale-[1.02] ${className}`}
      aria-label="PAZHAM PANAM"
      role="img"
    >
      <defs>
        {/* Ripe Golden Banana Skin Gradient */}
        <linearGradient id="bananaFaceGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="35%" stopColor="#facc15" />
          <stop offset="75%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Banana Stem Gradient */}
        <linearGradient id="bananaStemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#451a03" />
          <stop offset="35%" stopColor="#713f12" />
          <stop offset="65%" stopColor="#84cc16" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>

        {/* Banana Belly Ribbon Gradient */}
        <linearGradient id="bananaBellyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#b45309" stopOpacity="0.3" />
          <stop offset="25%" stopColor="#f59e0b" stopOpacity="0.9" />
          <stop offset="75%" stopColor="#fbbf24" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#b45309" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {/* 1. Banana Belly Cradle Arc (Organic physical banana contour underneath) */}
      <path
        d="M 8,22 C 45,34 165,35 210,16"
        stroke="url(#bananaBellyGrad)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />

      {/* 2. Banana Stem (Left end pedicel) */}
      <g>
        {/* Stem body */}
        <path
          d="M 4,4 C 7,2 12,6 19,10 L 18,13 C 12,9 7,6 3,7 Z"
          fill="url(#bananaStemGrad)"
          stroke="#78350f"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
        {/* Dark severed stalk cap */}
        <ellipse cx="3.5" cy="5.5" rx="1.8" ry="1.2" fill="#451a03" />
      </g>

      {/* 3. 3D Extrusion Shadow Layer for Letters (Deep Amber-Brown Depth) */}
      <g fill="#78350f" opacity="0.92">
        {letters.map((l, i) => (
          <path
            key={`shadow-${i}`}
            d={glyphs[l.char]}
            fillRule="evenodd"
            transform={`translate(${l.x + 0.9}, ${l.y + 1.8}) rotate(${l.rot}, ${l.w / 2}, 8)`}
          />
        ))}
      </g>

      {/* 4. Banana Word Separator (Golden seed dot between PAZHAM and PANAM) */}
      <circle cx="110" cy="19.5" r="2" fill="#f59e0b" stroke="#78350f" strokeWidth="0.6" />

      {/* 5. Front Face Letter Layer (Chunky Golden Banana Vector Glyphs) */}
      <g>
        {letters.map((l, i) => (
          <path
            key={`face-${i}`}
            d={glyphs[l.char]}
            fillRule="evenodd"
            fill="url(#bananaFaceGrad)"
            stroke="#78350f"
            strokeWidth="0.85"
            strokeLinejoin="round"
            transform={`translate(${l.x}, ${l.y}) rotate(${l.rot}, ${l.w / 2}, 8)`}
          />
        ))}
      </g>

      {/* 6. Banana Tip (Right blossom end) */}
      <g>
        {/* Tapering crescent tip */}
        <path
          d="M 193,11 C 201,9 207,6 213,3 L 214,6 C 208,10 202,13 193,14 Z"
          fill="url(#bananaFaceGrad)"
          stroke="#78350f"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
        {/* Dark blossom end cap */}
        <ellipse cx="214" cy="4.5" rx="1.6" ry="1.1" fill="#451a03" />
      </g>
    </svg>
  )
}

export default BananaWordmark
