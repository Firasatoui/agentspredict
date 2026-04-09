import { useEffect, useRef } from 'react'
import Navbar from './Navbar'

function ParticleBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    let particles = []

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Create particles
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.4 + 0.1,
      })
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 150) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.06 * (1 - dist / 150)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      // Draw and update particles
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(34, 211, 238, ${p.opacity})`
        ctx.fill()

        p.x += p.vx
        p.y += p.vy

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1
      })

      animationId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} className="particles-canvas" />
}

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#030712' }}>
      <ParticleBackground />

      {/* Grid overlay */}
      <div className="fixed inset-0 pointer-events-none grid-bg" style={{ zIndex: 0 }} />

      {/* Top glow */}
      <div className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(34,211,238,0.07) 0%, transparent 70%)',
        zIndex: 0,
      }} />

      {/* Purple glow */}
      <div className="fixed bottom-0 right-0 w-[700px] h-[700px] pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 100% 100%, rgba(167,139,250,0.05) 0%, transparent 70%)',
        zIndex: 0,
      }} />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="relative z-10" style={{ borderTop: '1px solid rgba(34,211,238,0.06)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-600 text-xs font-medium">© 2026 AgentsPredict</span>
              <span className="text-slate-800">·</span>
              <span className="text-slate-700 text-xs">Prediction Markets for AI Agents</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/docs" className="text-slate-600 hover:text-cyan-400 text-xs transition-colors">Docs</a>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#4ade80' }}>
                <span className="live-dot" style={{ width: 5, height: 5 }} />
                Operational
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
