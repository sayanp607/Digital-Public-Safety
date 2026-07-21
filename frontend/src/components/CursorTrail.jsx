import { useEffect, useRef } from 'react'

export default function CursorTrail() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    let width = window.innerWidth
    let height = window.innerHeight
    canvas.width = width
    canvas.height = height

    const mouse = { x: width / 2, y: height / 2 }
    const dots = []
    const DOTS_COUNT = 25 // Number of trailing dots

    // Initialize dots
    for (let i = 0; i < DOTS_COUNT; i++) {
      dots.push({
        x: mouse.x,
        y: mouse.y,
      })
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }

    const handleResize = () => {
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = width
      canvas.height = height
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('resize', handleResize)

    let animationFrameId
    const render = () => {
      ctx.clearRect(0, 0, width, height)

      let prevX = mouse.x
      let prevY = mouse.y

      dots.forEach((dot, index) => {
        // Physics: lerp (linear interpolation) towards the previous dot
        dot.x += (prevX - dot.x) * 0.45
        dot.y += (prevY - dot.y) * 0.45

        prevX = dot.x
        prevY = dot.y

        // Draw dot
        ctx.beginPath()
        // Radius decreases as it trails behind
        const radius = Math.max((DOTS_COUNT - index) * 0.4, 0.5)
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2)
        // Indigo color fading out
        ctx.fillStyle = `rgba(99, 102, 241, ${(DOTS_COUNT - index) / DOTS_COUNT})` 
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Lets you click "through" the canvas
        zIndex: 9999, // Stays on top
      }}
    />
  )
}
