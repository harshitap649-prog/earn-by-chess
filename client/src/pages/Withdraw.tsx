import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import Navigation from '../components/Navigation'
import './Withdraw.css'

interface Wallet {
  balance: number
  lockedBalance: number
}

interface WithdrawRequest {
  id: string
  amount: number
  status: string
  requestedAt: string
  processedAt?: string
}

export default function Withdraw() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [requests, setRequests] = useState<WithdrawRequest[]>([])
  const [loadingRequests, setLoadingRequests] = useState(true)
  const MIN_WITHDRAW = 100

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [walletRes, requestsRes] = await Promise.all([
        api.get('/wallet'),
        api.get('/withdraw/requests'),
      ])
      
      if (walletRes.data) {
        setWallet({
          balance: walletRes.data.balance ?? 0,
          lockedBalance: walletRes.data.lockedBalance ?? 0,
        })
      } else {
        setWallet({ balance: 0, lockedBalance: 0 })
      }
      
      setRequests(requestsRes.data || [])
    } catch (err: any) {
      console.error('Failed to load data:', err)
      // Set defaults to prevent blank screen
      setWallet({ balance: 0, lockedBalance: 0 })
      setRequests([])
    } finally {
      setLoadingRequests(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const withdrawAmount = parseFloat(amount)
    
    if (isNaN(withdrawAmount) || withdrawAmount < MIN_WITHDRAW) {
      setError(`Minimum withdrawal amount is ₹${MIN_WITHDRAW}`)
      setLoading(false)
      return
    }

    if (!wallet || wallet.balance < withdrawAmount) {
      setError('Insufficient balance')
      setLoading(false)
      return
    }

    try {
      await api.post('/withdraw', { amount: withdrawAmount })
      setSuccess(`Withdrawal request of ₹${withdrawAmount} submitted successfully!`)
      setAmount('')
      await loadData()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Withdrawal failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [100, 500, 1000, 2000, 5000]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="status-badge pending">Pending</span>
      case 'approved':
        return <span className="status-badge approved">Approved</span>
      case 'rejected':
        return <span className="status-badge rejected">Rejected</span>
      default:
        return <span className="status-badge">{status}</span>
    }
  }

  return (
    <div className="withdraw-page">
      <Navigation />
      <div className="withdraw-container">
        <div className="withdraw-header">
          <h1>💰 Withdraw Money</h1>
          <p>Withdraw your winnings to your bank account</p>
        </div>

        <div className="withdraw-content">
          <div className="withdraw-card">
            <div className="wallet-summary">
              <div className="wallet-item">
                <span className="wallet-label">Available Balance</span>
                <span className="wallet-value">₹{wallet?.balance.toFixed(2) || '0.00'}</span>
              </div>
              <div className="wallet-item">
                <span className="wallet-label">Locked Balance</span>
                <span className="wallet-value locked">₹{wallet?.lockedBalance.toFixed(2) || '0.00'}</span>
              </div>
            </div>

            <div className="withdraw-form-section">
              <h2>Request Withdrawal</h2>
              <p className="min-withdraw-info">
                Minimum withdrawal: <strong>₹{MIN_WITHDRAW}</strong>
              </p>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <form onSubmit={handleWithdraw} className="withdraw-form">
                <div className="form-group">
                  <label htmlFor="amount">Enter Amount (₹)</label>
                  <input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={`Minimum ₹${MIN_WITHDRAW}`}
                    min={MIN_WITHDRAW}
                    step="0.01"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="quick-amounts">
                  <p className="quick-label">Quick Select:</p>
                  <div className="quick-buttons">
                    {quickAmounts.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className="quick-amount-btn"
                        onClick={() => setAmount(amt.toString())}
                        disabled={loading || !wallet || wallet.balance < amt}
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="withdraw-submit-btn"
                  disabled={loading || !wallet || wallet.balance < MIN_WITHDRAW}
                >
                  {loading ? 'Processing...' : `Request Withdrawal`}
                </button>

                <div className="withdraw-info">
                  <p>ℹ️ <strong>Note:</strong></p>
                  <ul>
                    <li>Minimum withdrawal amount is ₹{MIN_WITHDRAW}</li>
                    <li>Only one withdrawal request per day is allowed</li>
                    <li>Withdrawal requests are processed within 24-48 hours</li>
                    <li>Amount will be locked until request is processed</li>
                  </ul>
                </div>
              </form>
            </div>
          </div>

          <div className="withdraw-history-card">
            <h2>Withdrawal History</h2>
            {loadingRequests ? (
              <div className="loading-text">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="no-requests">
                <p>No withdrawal requests yet</p>
              </div>
            ) : (
              <div className="requests-list">
                {requests.map((request) => (
                  <div key={request.id} className="request-item">
                    <div className="request-info">
                      <div className="request-amount">₹{Number(request.amount).toFixed(2)}</div>
                      <div className="request-date">
                        {new Date(request.requestedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    <div className="request-status">
                      {getStatusBadge(request.status)}
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









