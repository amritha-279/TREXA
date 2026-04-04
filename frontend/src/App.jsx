import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"

import Landing from "./pages/Landing"
import Register from "./pages/Register"
import Dashboard from "./pages/Dashboard"
import RiskProfile from "./pages/RiskProfile"
import Plans from "./pages/Plans"
import Monitoring from "./pages/Monitoring"
import Payout from "./pages/Payout"
import Fraud from "./pages/Fraud"
import FinalPayout from "./pages/FinalPayout"
import Claim from "./pages/Claim";
import Navbar from "./components/Navbar"
import AdminDashboard from "./pages/AdminDashboard";

function PrivateRoute({ children }) {
  return localStorage.getItem("worker") ? children : <Navigate to="/register" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dashboard"   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/risk"        element={<PrivateRoute><RiskProfile /></PrivateRoute>} />
        <Route path="/plans"       element={<PrivateRoute><Plans /></PrivateRoute>} />
        <Route path="/monitoring"  element={<PrivateRoute><Monitoring /></PrivateRoute>} />
        <Route path="/claim"       element={<PrivateRoute><Claim /></PrivateRoute>} />
        <Route path="/payout"      element={<PrivateRoute><Payout /></PrivateRoute>} />
        <Route path="/fraud"       element={<PrivateRoute><Fraud /></PrivateRoute>} />
        <Route path="/final-payout" element={<PrivateRoute><FinalPayout /></PrivateRoute>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App