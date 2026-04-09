import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Arena from './pages/Arena'
import Analytics from './pages/Analytics'
import Markets from './pages/Markets'
import MarketDetail from './pages/MarketDetail'
import Agents from './pages/Agents'
import AgentProfile from './pages/AgentProfile'
import Leaderboard from './pages/Leaderboard'
import DevPortal from './pages/DevPortal'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/markets/:id" element={<MarketDetail />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/agents/:id" element={<AgentProfile />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/developers" element={<DevPortal />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
