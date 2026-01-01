import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import Navigation from '../components/Navigation'
import './Dashboard.css'

interface Wallet {
  balance: number
  lockedBalance: number
}

interface Match {
  id: string
  creatorId: string
  entryFee: number
  status: string
  createdAt: string
  creator?: {
    name: string
    email: string
  }
}

interface MatchType {
  entryFee: number
  winnerPrize: number
  platformProfit: number
  totalPool: number
  label: string
}

const MATCH_TYPES: MatchType[] = [
  {
    entryFee: 0,
    winnerPrize: 0,
    platformProfit: 0,
    totalPool: 0,
    label: 'Free Play'
  },
  {
    entryFee: 2,
    winnerPrize: 3,
    platformProfit: 1,
    totalPool: 4,
    label: 'Quick Match'
  },
  {
    entryFee: 4,
    winnerPrize: 7,
    platformProfit: 1,
    totalPool: 8,
    label: 'Standard Match'
  },
  {
    entryFee: 10,
    winnerPrize: 18,
    platformProfit: 2,
    totalPool: 20,
    label: 'Premium Match'
  }
]

export default function Dashboard() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [creatingMatchType, setCreatingMatchType] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const [walletRes, matchesRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/matches'),
      ])
      setWallet(walletRes.data)
      setMatches(matchesRes.data)
    } catch (err: any) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const createMatch = async (entryFee: number) => {
    setCreating(true)
    setCreatingMatchType(entryFee)
    setError('')
    try {
      console.log('Creating match with entryFee:', entryFee)
      const response = await api.post('/match/create', { entryFee })
      console.log('Match created successfully:', response.data)
      
      if (response.data && response.data.id) {
        // Small delay to ensure state updates
        setTimeout(() => {
          navigate(`/game/${response.data.id}`)
        }, 100)
      } else {
        throw new Error('Invalid response from server: Missing match ID')
      }
    } catch (err: any) {
      console.error('Error creating match:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      })
      
      const errorMessage = err.response?.data?.error || err.message || 'Failed to create match'
      setError(errorMessage)
      setCreating(false)
      setCreatingMatchType(null)
    }
  }

  const joinMatch = async (matchId: string) => {
    try {
      await api.post(`/match/join/${matchId}`)
      navigate(`/game/${matchId}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join match')
    }
  }


  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="dashboard">
      <Navigation />
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Logout</h3>
              <button 
                className="modal-close" 
                onClick={() => setShowLogoutConfirm(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to logout?</p>
              <p className="modal-subtext">You'll need to login again to access your account.</p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn cancel-btn" 
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn confirm-btn" 
                onClick={async () => {
                  setShowLogoutConfirm(false)
                  await logout()
                  navigate('/auth')
                }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <div className="wallet-card">
          <h2>Your Wallet</h2>
          <div className="wallet-info">
            <div className="wallet-item">
              <span className="label">Available Balance:</span>
              <span className="value">₹{wallet?.balance.toFixed(2) || '0.00'}</span>
            </div>
            <div className="wallet-item">
              <span className="label">Locked Balance:</span>
              <span className="value locked">₹{wallet?.lockedBalance.toFixed(2) || '0.00'}</span>
            </div>
            <div className="wallet-item total">
              <span className="label">Total:</span>
              <span className="value">
                ₹{((wallet?.balance || 0) + (wallet?.lockedBalance || 0)).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="wallet-actions">
            <a href="/deposit" className="wallet-action-btn deposit-btn">
              💳 Add Money
            </a>
            <a href="/withdraw" className="wallet-action-btn withdraw-btn">
              💰 Withdraw
            </a>
          </div>
        </div>

        {/* Play Free Section */}
        <div className="play-free-section">
          <div className="section-header">
            <h2>🎮 Play Free</h2>
            <p className="section-subtitle">Choose your match and start playing!</p>
          </div>

          <div className="play-free-grid">
            {MATCH_TYPES.map((matchType) => {
              const canAfford = matchType.entryFee === 0 || (wallet?.balance || 0) >= matchType.entryFee
              const isCreating = creating && creatingMatchType === matchType.entryFee
              const isFreePlay = matchType.entryFee === 0
              
              return (
                <div key={`free-${matchType.entryFee}`} className={`play-free-card ${isFreePlay ? 'free-play-card' : ''}`}>
                  <div className="play-free-header">
                    <span className="play-free-label">{matchType.label}</span>
                    {isFreePlay ? (
                      <span className="play-free-entry free-badge">FREE</span>
                    ) : (
                      <span className="play-free-entry">₹{matchType.entryFee}</span>
                    )}
                  </div>
                  
                  {isFreePlay ? (
                    <div className="play-free-prize free-prize">
                      <div className="play-free-amount">🎮</div>
                      <div className="play-free-prize-label">Practice Mode</div>
                      <div className="free-play-desc">Play for fun, no money required!</div>
                    </div>
                  ) : (
                    <div className="play-free-prize">
                      <div className="play-free-amount">₹{matchType.winnerPrize}</div>
                      <div className="play-free-prize-label">Win Prize</div>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (!isCreating && canAfford) {
                        console.log('Button clicked for match type:', matchType.label, 'entryFee:', matchType.entryFee)
                        createMatch(matchType.entryFee)
                      } else {
                        console.log('Button disabled or creating:', { isCreating, canAfford })
                      }
                    }}
                    disabled={!canAfford || isCreating}
                    className={`play-free-btn ${!canAfford ? 'disabled' : ''} ${isFreePlay ? 'free-play-btn' : ''}`}
                  >
                    {isCreating ? 'Creating...' : canAfford ? '🎮 Play Now' : '💳 Add Money First'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Available Matches to Join */}
        {error && <div className="error">{error}</div>}
        
        <div className="match-section">
          <div className="available-matches-section">
            <h3>Available Matches to Join</h3>
            {matches.length === 0 ? (
              <div className="no-matches">
                <p>No available matches. Create one above to start playing!</p>
              </div>
            ) : (
              <div className="matches-list">
                {matches.map((match) => {
                  const matchType = MATCH_TYPES.find(mt => mt.entryFee === Number(match.entryFee))
                  const canAfford = (wallet?.balance || 0) >= Number(match.entryFee)
                  
                  return (
                    <div key={match.id} className="match-card">
                      <div className="match-details">
                        <div className="match-creator">
                          <strong>Created by:</strong> {match.creator?.name || 'Unknown'}
                        </div>
                        <div className="match-prize-info">
                          <div>
                            <strong>Entry Fee:</strong> ₹{Number(match.entryFee).toFixed(2)}
                          </div>
                          {matchType && (
                            <div>
                              <strong>Winner Gets:</strong> ₹{matchType.winnerPrize}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => joinMatch(match.id)}
                        disabled={!canAfford}
                        className="join-btn play-action-btn"
                      >
                        🎮 Join & Play
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

