'use client'

import { useRef, useEffect } from 'react'

interface Star {
  x: number
  y: number
  r: number
  a: number
  speed: number
  phase: number
}

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function initStars() {
      const w = window.innerWidth
      const h = window.innerHeight
      const dpr = window.devicePixelRatio || 1
      canvas!.width = w * dpr
      canvas!.height = h * dpr
      canvas!.style.width = `${w}px`
      canvas!.style.height = `${h}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.floor((w * h) / 3000)
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.2 + Math.random() * 1.0,
        a: 0.05 + Math.random() * 0.35,
        speed: 0.001 + Math.random() * 0.003,
        phase: Math.random() * Math.PI * 2,
      }))
    }

    function draw(time: number) {
      const w = window.innerWidth
      const h = window.innerHeight

      // Background gradient
      const grad = ctx!.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, '#070B14')
      grad.addColorStop(0.5, '#0a1020')
      grad.addColorStop(1, '#050810')
      ctx!.fillStyle = grad
      ctx!.fillRect(0, 0, w, h)

      // Warm radial glow near Fiji position
      const radial = ctx!.createRadialGradient(
        w * 0.48, h * 0.52, 0,
        w * 0.48, h * 0.52, w * 0.4,
      )
      radial.addColorStop(0, 'rgba(25, 22, 35, 0.12)')
      radial.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx!.fillStyle = radial
      ctx!.fillRect(0, 0, w, h)

      // Stars
      for (const star of starsRef.current) {
        const flicker = Math.sin(time * star.speed + star.phase) * 0.3 + 0.7
        const opacity = star.a * flicker
        ctx!.beginPath()
        ctx!.arc(star.x, star.y, star.r, 0, Math.PI * 2)
        ctx!.fillStyle = `rgba(220, 218, 210, ${opacity})`
        ctx!.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    initStars()
    rafRef.current = requestAnimationFrame(draw)

    const handleResize = () => initStars()
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  )
}
