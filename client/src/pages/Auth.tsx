import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { auth } from '../config/firebase'
import './Auth.css'

export default function Auth() {
  const [isSignIn, setIsSignIn] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignIn) {
        await login(email, password)
        navigate('/dashboard')
      } else {
        try {
          await signup(name, email, password)
          navigate('/dashboard')
        } catch (signupErr: any) {
          // If email already exists, suggest logging in instead
          if (signupErr.code === 'auth/email-already-in-use') {
            setError('This email is already registered. Please sign in instead.')
            // Auto-switch to sign in tab after 2 seconds
            setTimeout(() => {
              setIsSignIn(true)
              setError('')
            }, 2000)
          } else {
            throw signupErr
          }
        }
      }
    } catch (err: any) {
      let errorMessage = ''
      
      if (err.code) {
        // Firebase error
        switch (err.code) {
          case 'auth/user-not-found':
            errorMessage = 'No account found with this email. Please sign up first.'
            break
          case 'auth/wrong-password':
            errorMessage = 'Incorrect password. Please try again.'
            break
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address. Please check and try again.'
            break
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters.'
            break
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered. Please sign in instead.'
            setTimeout(() => {
              setIsSignIn(true)
              setError('')
            }, 2000)
            break
          default:
            errorMessage = err.message || (isSignIn ? 'Login failed' : 'Signup failed')
        }
      } else {
        // Backend or other error
        errorMessage = err.response?.data?.error || err.message || (isSignIn ? 'Login failed' : 'Signup failed')
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      // User will be automatically synced via AuthContext
      navigate('/dashboard')
    } catch (err: any) {
      const errorMessage = err.code 
        ? err.message || 'Google sign-in failed'
        : 'Google sign-in failed'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <h1 className="auth-heading">Master Chess, Master Earnings — Start Winning Today</h1>
        <p className="auth-subheading">Turn Your Chess Skills into Real Money</p>
      </div>

      <div className="auth-card">
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isSignIn ? 'active' : ''}`}
            onClick={() => {
              setIsSignIn(true)
              setError('')
            }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab ${!isSignIn ? 'active' : ''}`}
            onClick={() => {
              setIsSignIn(false)
              setError('')
            }}
          >
            Create account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isSignIn && (
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>
          )}

          <div className="form-group">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group password-group">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              )}
            </button>
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? (isSignIn ? 'Signing in...' : 'Creating account...') : (isSignIn ? 'Sign In' : 'Create account')}
          </button>
        </form>

        <div className="auth-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="google-signin-btn"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

      </div>
    </div>
  )
}

