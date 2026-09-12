import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'

const BananaMascot3D = () => {
  const containerRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const mousePos = useRef({ x: 0, y: 0 })
  const targetRotation = useRef({ x: 0, y: 0.25 }) // Base subtle turn toward right content

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let animationFrameId
    let isVisible = true

    // Scene setup
    const scene = new THREE.Scene()

    // Camera setup
    const width = container.clientWidth || 400
    const height = container.clientHeight || 500
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100)
    camera.position.set(0, 0.2, 5.2)

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setSize(width, height)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    renderer.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(renderer.domElement)

    // Lighting setup - Studio Fintech lighting
    // 1. Ambient Light - soft warm fill
    const ambientLight = new THREE.AmbientLight(0xfff7db, 1.1)
    scene.add(ambientLight)

    // 2. Key Light - warm gold from front-right
    const keyLight = new THREE.DirectionalLight(0xfff3ad, 2.4)
    keyLight.position.set(4, 6, 5)
    scene.add(keyLight)

    // 3. Fill Light - cool slate/cyan from front-left
    const fillLight = new THREE.DirectionalLight(0x94a3b8, 1.0)
    fillLight.position.set(-4, 3, 4)
    scene.add(fillLight)

    // 4. Rim Light - bright gold from top-back
    const rimLight = new THREE.DirectionalLight(0xf59e0b, 3.2)
    rimLight.position.set(-2, 7, -4)
    scene.add(rimLight)

    // 5. Bottom Bounce Light - warm gold glow
    const bounceLight = new THREE.DirectionalLight(0xd97706, 0.8)
    bounceLight.position.set(0, -4, 2)
    scene.add(bounceLight)

    // Soft dynamic contact shadow on floor
    const shadowCanvas = document.createElement('canvas')
    shadowCanvas.width = 128
    shadowCanvas.height = 128
    const ctx = shadowCanvas.getContext('2d')
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 60)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.55)')
    gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.25)')
    gradient.addColorStop(0.8, 'rgba(234, 179, 8, 0.05)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas)
    const shadowGeo = new THREE.PlaneGeometry(2.4, 2.4)
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false
    })
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat)
    shadowMesh.rotation.x = -Math.PI / 2
    shadowMesh.position.y = -1.95
    scene.add(shadowMesh)

    // Mascot Group for floating and rotation animation
    const mascotGroup = new THREE.Group()
    scene.add(mascotGroup)

    // Premium Banana Material
    const bananaGoldMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#FACC15'), // Kerala Golden Yellow
      emissive: new THREE.Color('#2A1A02'), // Warm internal depth
      roughness: 0.32,
      metalness: 0.12,
      clearcoat: 0.45,
      clearcoatRoughness: 0.22,
      reflectivity: 0.55
    })

    // Load OBJ Model (with optional MTL check)
    const objLoader = new OBJLoader()
    const mtlLoader = new MTLLoader()

    const loadModel = (materials = null) => {
      if (materials) {
        materials.preload()
        objLoader.setMaterials(materials)
      }

      objLoader.load(
        '/Peely.obj',
        (obj) => {
          // Traverse and inspect meshes
          obj.traverse((child) => {
            if (child.isMesh) {
              if (!child.geometry.attributes.normal) {
                child.geometry.computeVertexNormals()
              }
              // If material has no texture map, apply our premium physical banana gold finish
              if (!child.material || !child.material.map) {
                child.material = bananaGoldMaterial
              }
            }
          })

          // Compute exact bounding box and center
          const box = new THREE.Box3().setFromObject(obj)
          const center = box.getCenter(new THREE.Vector3())
          const size = box.getSize(new THREE.Vector3())

          // Scale model to comfortably fit the viewport (~3.6 units height)
          const maxDim = Math.max(size.x, size.y, size.z)
          const targetHeight = 3.65
          const scale = targetHeight / (maxDim || 1)
          obj.scale.setScalar(scale)

          // Center the geometry so its center of mass is at (0, 0, 0)
          obj.position.x = -center.x * scale
          obj.position.y = -center.y * scale
          obj.position.z = -center.z * scale

          mascotGroup.add(obj)
          setLoading(false)
        },
        undefined,
        (err) => {
          console.error('Error loading Peely.obj:', err)
          setLoadError('Failed to load 3D model')
          setLoading(false)
        }
      )
    }

    // Attempt MTL first, fallback to direct OBJ load
    mtlLoader.load(
      '/Peely.mtl',
      (materials) => {
        loadModel(materials)
      },
      undefined,
      () => {
        // MTL not present, load OBJ directly with custom fintech banana material
        loadModel(null)
      }
    )

    // Clock for smooth animations
    const clock = new THREE.Clock()
    let currentRotationX = 0
    let currentRotationY = 0.25

    // Animation Loop
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      if (!isVisible) return

      const elapsedTime = clock.getElapsedTime()

      // 1. Subtle natural floating / bobbing
      const floatOffsetY = Math.sin(elapsedTime * 1.6) * 0.08
      mascotGroup.position.y = floatOffsetY

      // Synchronized shadow breathing
      const shadowScale = 1 - floatOffsetY * 0.6
      shadowMesh.scale.set(shadowScale, shadowScale, 1)
      shadowMat.opacity = 0.65 - floatOffsetY * 0.4

      // 2. Subtle idle breathing sway
      const idleSwayZ = Math.sin(elapsedTime * 1.2) * 0.02
      const idleSwayY = Math.sin(elapsedTime * 0.7) * 0.03
      mascotGroup.rotation.z = idleSwayZ

      // 3. Smooth mouse parallax tracking (lerp)
      const targetY = targetRotation.current.y + idleSwayY
      const targetX = targetRotation.current.x
      currentRotationY += (targetY - currentRotationY) * 0.05
      currentRotationX += (targetX - currentRotationX) * 0.05

      mascotGroup.rotation.y = currentRotationY
      mascotGroup.rotation.x = currentRotationX

      renderer.render(scene, camera)
    }

    animate()

    // Mouse parallax tracking over hero area
    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect()
      // Mouse X from -1 to 1 relative to container
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      
      mousePos.current.x = x
      mousePos.current.y = y

      // Rotate slightly toward cursor (max ±0.35 rad = ~20 degrees)
      targetRotation.current.y = 0.25 + Math.max(Math.min(x * 0.4, 0.4), -0.4)
      targetRotation.current.x = Math.max(Math.min(-y * 0.18, 0.18), -0.18)
    }

    const handlePointerLeave = () => {
      // Return gracefully to base orientation
      targetRotation.current.y = 0.25
      targetRotation.current.x = 0
    }

    // Attach to hero or window for broad smooth parallax
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    container.addEventListener('pointerleave', handlePointerLeave)

    // Handle responsive resize via ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width
        const newHeight = entry.contentRect.height
        if (newWidth > 0 && newHeight > 0) {
          camera.aspect = newWidth / newHeight
          // Adjust distance if aspect is narrow
          if (camera.aspect < 1) {
            camera.position.z = 5.2 / Math.max(camera.aspect, 0.65)
          } else {
            camera.position.z = 5.2
          }
          camera.updateProjectionMatrix()
          renderer.setSize(newWidth, newHeight)
        }
      }
    })
    resizeObserver.observe(container)

    // Performance optimization: Pause render when off-screen
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisible = entry.isIntersecting
        }
      },
      { threshold: 0.1 }
    )
    intersectionObserver.observe(container)

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('pointermove', handlePointerMove)
      container.removeEventListener('pointerleave', handlePointerLeave)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()

      // Dispose Three.js objects
      scene.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose()
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose())
          } else if (child.material) {
            child.material.dispose()
          }
        }
      })
      shadowTexture.dispose()
      shadowGeo.dispose()
      shadowMat.dispose()
      renderer.dispose()

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[460px] lg:min-h-[540px] flex items-center justify-center select-none">
      {/* Ambient background glow for 3D Mascot */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-64 h-64 sm:w-80 sm:h-80 bg-banana-400/15 rounded-full blur-3xl" />
        <div className="absolute w-44 h-44 bg-amber-500/10 rounded-full blur-2xl -bottom-4" />
      </div>

      {/* Mascot 3D Canvas Mount Point */}
      <div 
        ref={containerRef} 
        className="w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing flex items-center justify-center"
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-sm rounded-3xl transition-opacity duration-300 z-10">
          <div className="w-12 h-12 border-3 border-banana-400/20 border-t-banana-400 rounded-full animate-spin mb-3" />
          <div className="text-xs font-bold text-banana-400 tracking-wider uppercase flex items-center space-x-1.5">
            <span>Loading 3D Mascot</span>
            <span className="text-base">🍌</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Peely Kerala Edition</div>
        </div>
      )}

      {/* Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-16 h-16 rounded-2xl bg-banana-500/10 border border-banana-500/30 flex items-center justify-center text-3xl mb-3">
            🍌
          </div>
          <div className="text-sm font-bold text-slate-200">Official Market Mascot</div>
          <div className="text-xs text-slate-400 mt-1">Peely Kerala Edition</div>
        </div>
      )}

    </div>
  )
}

export default BananaMascot3D
