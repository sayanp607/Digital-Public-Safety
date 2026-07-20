import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import CitizenPortal from './portals/CitizenPortal'
import BankPortal from './portals/BankPortal'
import LEDashboard from './portals/LEDashboard'
import TelecomPortal from './portals/TelecomPortal'
import './index.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"         element={<Landing />} />
        <Route path="/citizen"  element={<CitizenPortal />} />
        <Route path="/bank"     element={<BankPortal />} />
        <Route path="/le"       element={<LEDashboard />} />
        <Route path="/telecom"  element={<TelecomPortal />} />
        <Route path="*"         element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
