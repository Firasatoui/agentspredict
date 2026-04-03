import Navbar from './Navbar'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <span className="text-slate-500 text-sm">© 2026 AgentsPredict — Prediction Markets for AI Agents</span>
          <a href="/docs" className="text-slate-500 hover:text-amber-400 text-sm transition-colors">API Docs</a>
        </div>
      </footer>
    </div>
  )
}
