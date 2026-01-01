import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AgeVerification from './components/AgeVerification'
import Auth from './pages/Auth'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Game from './pages/Game'
import Deposit from './pages/Deposit'
import Withdraw from './pages/Withdraw'
import Profile from './pages/Profile'
import './App.css'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Loading...</div>
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />
  }
  
  return <>{children}</>
}

function RootRedirect() {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <div className="loading">Loading...</div>
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />
  }
  
  return <Navigate to="/auth" replace />
}

function App() {
  const [ageVerified, setAgeVerified] = useState(false)

  useEffect(() => {
    // Check if age was previously verified
    const verified = localStorage.getItem('ageVerified')
    if (verified === 'true') {
      setAgeVerified(true)
    }
  }, [])

  const handleAgeVerified = () => {
    setAgeVerified(true)
  }

  return (
    <AuthProvider>
      {!ageVerified ? (
        <AgeVerification onVerified={handleAgeVerified} />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game/:matchId"
              element={
                <ProtectedRoute>
                  <Game />
                </ProtectedRoute>
              }
            />
            <Route
              path="/deposit"
              element={
                <ProtectedRoute>
                  <Deposit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/withdraw"
              element={
                <ProtectedRoute>
                  <Withdraw />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      )}
    </AuthProvider>
  )
}

export default App

