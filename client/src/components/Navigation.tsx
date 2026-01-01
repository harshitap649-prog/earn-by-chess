import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import './Navigation.css'

export default function Navigation() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const isActive = (path: string) => location.pathname === path

  const handleLogout = async () => {
    setShowLogoutConfirm(false)
    await logout()
    navigate('/auth')
  }

  return (
    <>
      <nav className="main-nav">
        <div className="nav-container">
          <Link to="/dashboard" className="nav-logo">
            <span className="logo-icon">♟️</span>
            <span className="logo-text">earn by chess</span>
          </Link>
          
          <div className="nav-menu">
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              <span className="nav-icon">🏠</span>
              <span className="nav-text">Dashboard</span>
            </Link>
            <Link 
              to="/deposit" 
              className={`nav-link ${isActive('/deposit') ? 'active' : ''}`}
            >
              <span className="nav-icon">💳</span>
              <span className="nav-text">Deposit</span>
            </Link>
            <Link 
              to="/withdraw" 
              className={`nav-link ${isActive('/withdraw') ? 'active' : ''}`}
            >
              <span className="nav-icon">💰</span>
              <span className="nav-text">Withdraw</span>
            </Link>
            <Link 
              to="/profile" 
              className={`nav-link ${isActive('/profile') ? 'active' : ''}`}
            >
              <span className="nav-icon">👤</span>
              <span className="nav-text">Profile</span>
            </Link>
          </div>

          <div className="nav-user">
            <span className="user-name">{user?.name}</span>
            <button 
              className="nav-logout-btn"
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
            >
              <span className="nav-icon">🚪</span>
              <span className="nav-text">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="nav-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="nav-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="nav-modal-header">
              <h3>Confirm Logout</h3>
              <button 
                className="nav-modal-close" 
                onClick={() => setShowLogoutConfirm(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="nav-modal-body">
              <p>Are you sure you want to logout?</p>
              <p className="nav-modal-subtext">You'll need to login again to access your account.</p>
            </div>
            <div className="nav-modal-footer">
              <button 
                className="nav-modal-btn nav-cancel-btn" 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="nav-modal-btn nav-confirm-btn" 
                onClick={handleLogout}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

