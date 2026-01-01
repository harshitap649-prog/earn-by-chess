import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import Navigation from '../components/Navigation'
import './Profile.css'

interface ProfileData {
  user: {
    id: string
    name: string
    email: string
    kycVerified: boolean
    createdAt: string
  }
  wallet: {
    balance: number
    lockedBalance: number
  }
  stats: {
    totalMatches: number
    wins: number
    losses: number
    draws: number
    totalEarnings: number
    totalSpent: number
    netEarnings: number
  }
  recentTransactions: Array<{
    id: string
    amount: number
    type: string
    description: string | null
    createdAt: string
  }>
}

export default function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setError('')
      const response = await api.get('/data/profile')
      
      if (response.data) {
        setProfile(response.data)
      } else {
        throw new Error('No data received from server')
      }
    } catch (err: any) {
      console.error('Failed to load profile:', err)
      const errorMessage = err.response?.data?.error 
        ? (typeof err.response.data.error === 'string' ? err.response.data.error : 'Failed to load profile')
        : err.message || 'Failed to load profile'
      setError(errorMessage)
      
      // Set default profile to prevent blank screen
      setProfile({
        user: {
          id: user?.id || 'unknown',
          name: user?.name || 'User',
          email: user?.email || 'user@example.com',
          kycVerified: false,
          createdAt: new Date().toISOString(),
        },
        wallet: {
          balance: 0,
          lockedBalance: 0,
        },
        stats: {
          totalMatches: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          totalEarnings: 0,
          totalSpent: 0,
          netEarnings: 0,
        },
        recentTransactions: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return '💳'
      case 'withdraw':
        return '💰'
      case 'match_win':
        return '🏆'
      case 'match_loss':
        return '❌'
      default:
        return '📝'
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'match_win':
        return '#10b981'
      case 'withdraw':
      case 'match_loss':
        return '#ef4444'
      default:
        return '#666'
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <Navigation />
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="profile-page">
        <Navigation />
        <div className="profile-error">
          <p>{error}</p>
          <button onClick={loadProfile}>Retry</button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <Navigation />
        <div className="profile-error">
          <p>Profile data not available</p>
          <button onClick={loadProfile}>Retry</button>
        </div>
      </div>
    )
  }

  const winRate = profile.stats.totalMatches > 0
    ? ((profile.stats.wins / profile.stats.totalMatches) * 100).toFixed(1)
    : '0'

  return (
    <div className="profile-page">
      <Navigation />
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <span className="avatar-icon">👤</span>
          </div>
          <div className="profile-info">
            <h1>{profile.user.name}</h1>
            <p className="profile-email">{profile.user.email}</p>
            <div className="profile-badges">
              {profile.user.kycVerified ? (
                <span className="badge verified">✓ Verified</span>
              ) : (
                <span className="badge unverified">⚠ Not Verified</span>
              )}
              <span className="badge member">
                Member since {new Date(profile.user.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        <div className="profile-content">
          <div className="wallet-section">
            <h2>Wallet Balance</h2>
            <div className="wallet-grid">
              <div className="wallet-card">
                <span className="wallet-label">Available</span>
                <span className="wallet-amount">₹{profile.wallet.balance.toFixed(2)}</span>
              </div>
              <div className="wallet-card">
                <span className="wallet-label">Locked</span>
                <span className="wallet-amount locked">₹{profile.wallet.lockedBalance.toFixed(2)}</span>
              </div>
              <div className="wallet-card total">
                <span className="wallet-label">Total</span>
                <span className="wallet-amount">
                  ₹{(profile.wallet.balance + profile.wallet.lockedBalance).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="stats-section">
            <h2>Game Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🎮</div>
                <div className="stat-value">{profile.stats.totalMatches}</div>
                <div className="stat-label">Total Matches</div>
              </div>
              <div className="stat-card win">
                <div className="stat-icon">🏆</div>
                <div className="stat-value">{profile.stats.wins}</div>
                <div className="stat-label">Wins</div>
              </div>
              <div className="stat-card loss">
                <div className="stat-icon">❌</div>
                <div className="stat-value">{profile.stats.losses}</div>
                <div className="stat-label">Losses</div>
              </div>
              <div className="stat-card draw">
                <div className="stat-icon">🤝</div>
                <div className="stat-value">{profile.stats.draws}</div>
                <div className="stat-label">Draws</div>
              </div>
              <div className="stat-card win-rate">
                <div className="stat-icon">📊</div>
                <div className="stat-value">{winRate}%</div>
                <div className="stat-label">Win Rate</div>
              </div>
            </div>
          </div>

          <div className="earnings-section">
            <h2>Earnings Overview</h2>
            <div className="earnings-grid">
              <div className="earning-card positive">
                <span className="earning-label">Total Earnings</span>
                <span className="earning-amount">+₹{profile.stats.totalEarnings.toFixed(2)}</span>
              </div>
              <div className="earning-card negative">
                <span className="earning-label">Total Spent</span>
                <span className="earning-amount">-₹{profile.stats.totalSpent.toFixed(2)}</span>
              </div>
              <div className="earning-card net">
                <span className="earning-label">Net Earnings</span>
                <span className="earning-amount">
                  {profile.stats.netEarnings >= 0 ? '+' : ''}₹{profile.stats.netEarnings.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="transactions-section">
            <h2>Recent Transactions</h2>
            {profile.recentTransactions.length === 0 ? (
              <div className="no-transactions">
                <p>No transactions yet</p>
              </div>
            ) : (
              <div className="transactions-list">
                {profile.recentTransactions.map((transaction) => (
                  <div key={transaction.id} className="transaction-item">
                    <div className="transaction-icon">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-type">
                        {transaction.type.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="transaction-description">
                        {transaction.description || 'Transaction'}
                      </div>
                      <div className="transaction-date">
                        {new Date(transaction.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div
                      className="transaction-amount"
                      style={{ color: getTransactionColor(transaction.type) }}
                    >
                      {transaction.type === 'deposit' || transaction.type === 'match_win' ? '+' : '-'}
                      ₹{Number(transaction.amount).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



