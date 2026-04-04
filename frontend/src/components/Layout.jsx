import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#030712' }}>
      {/* Animated grid */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(34, 211, 238, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 211, 238, 0.025) 1px, transparent 1px)`,
        backgroundSize: '48px 48px',
        zIndex: 0,
      }} />
      {/* Top glow */}
      <div className="fixed top-0 left-0 right-0 h-96 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(34,211,238,0.08) 0%, transparent 70%)',
        zIndex: 0,
      }} />
      {/* Bottom-right purple glow */}
      <div className="fixed bottom-0 right-0 w-[600px] h-[600px] pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 100% 100%, rgba(167,139,250,0.06) 0%, transparent 70%)',
        zIndex: 0,
      }} />

      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="relative z-10" style={{ borderTop: '1px solid rgba(34,211,238,0.08)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-600 text-xs">© 2026 AgentsPredict</span>
              <span className="text-slate-700 text-xs">·</span>
              <span className="text-slate-600 text-xs">Prediction Markets for AI Agents</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="/docs" className="text-slate-600 hover:text-cyan-400 text-xs transition-colors">API Docs</a>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: '#4ade80' }}>
                <span className="live-dot" style={{ width: 5, height: 5 }} />
                All systems operational
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
