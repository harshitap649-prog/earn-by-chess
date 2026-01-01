import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import PaymentModal from '../components/PaymentModal'
import Navigation from '../components/Navigation'
import './Deposit.css'

interface Wallet {
  balance: number
  lockedBalance: number
}

export default function Deposit() {
  const { user } = useAuth()
  const [wallet, setWallet] = useState<Wallet | null>(null)
  const [amount, setAmount] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWallet()
  }, [])

  const loadWallet = async () => {
    try {
      const response = await api.get('/wallet')
      if (response.data) {
        setWallet({
          balance: response.data.balance ?? 0,
          lockedBalance: response.data.lockedBalance ?? 0,
        })
      } else {
        setWallet({ balance: 0, lockedBalance: 0 })
      }
    } catch (err: any) {
      console.error('Failed to load wallet:', err)
      // Set default wallet to prevent blank screen
      setWallet({ balance: 0, lockedBalance: 0 })
    } finally {
      setLoading(false)
    }
  }

  const quickAmounts = [100, 500, 1000, 2000, 5000, 10000]

  const handleQuickDeposit = (amt: number) => {
    setAmount(amt.toString())
    setShowPaymentModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const depositAmount = parseFloat(amount)
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return
    }
    setShowPaymentModal(true)
  }

  return (
    <div className="deposit-page">
      <Navigation />
      <div className="deposit-container">
        <div className="deposit-header">
          <h1>💳 Add Money to Wallet</h1>
          <p>Deposit funds securely using Razorpay</p>
        </div>

        <div className="deposit-content">
          <div className="wallet-card">
            <h2>Your Wallet</h2>
            <div className="wallet-balance">
              <div className="balance-item">
                <span className="balance-label">Available Balance</span>
                <span className="balance-value">₹{wallet?.balance.toFixed(2) || '0.00'}</span>
              </div>
              <div className="balance-item">
                <span className="balance-label">Locked Balance</span>
                <span className="balance-value locked">₹{wallet?.lockedBalance.toFixed(2) || '0.00'}</span>
              </div>
              <div className="balance-item total">
                <span className="balance-label">Total Balance</span>
                <span className="balance-value">
                  ₹{((wallet?.balance || 0) + (wallet?.lockedBalance || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="deposit-card">
            <h2>Deposit Amount</h2>
            <form onSubmit={handleSubmit} className="deposit-form">
              <div className="form-group">
                <label htmlFor="deposit-amount">Enter Amount (₹)</label>
                <div className="amount-input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input
                    id="deposit-amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="quick-deposit-section">
                <p className="quick-label">Quick Deposit:</p>
                <div className="quick-amounts-grid">
                  {quickAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className="quick-deposit-btn"
                      onClick={() => handleQuickDeposit(amt)}
                    >
                      ₹{amt.toLocaleString('en-IN')}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="deposit-submit-btn"
                disabled={!amount || parseFloat(amount) <= 0}
              >
                💳 Proceed to Payment
              </button>
            </form>

            <div className="deposit-features">
              <div className="feature-item">
                <span className="feature-icon">🔒</span>
                <div className="feature-text">
                  <strong>Secure Payment</strong>
                  <span>256-bit SSL encryption</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">⚡</span>
                <div className="feature-text">
                  <strong>Instant Credit</strong>
                  <span>Money added immediately</span>
                </div>
              </div>
              <div className="feature-item">
                <span className="feature-icon">💳</span>
                <div className="feature-text">
                  <strong>Multiple Options</strong>
                  <span>UPI, Cards, Net Banking</span>
                </div>
              </div>
            </div>
          </div>

          <div className="payment-methods-card">
            <h2>Payment Methods</h2>
            <div className="payment-methods-list">
              <div className="payment-method-item">
                <span className="method-icon">📱</span>
                <div className="method-info">
                  <strong>UPI</strong>
                  <span>Google Pay, PhonePe, Paytm, BHIM</span>
                </div>
              </div>
              <div className="payment-method-item">
                <span className="method-icon">💳</span>
                <div className="method-info">
                  <strong>Credit/Debit Cards</strong>
                  <span>Visa, Mastercard, RuPay</span>
                </div>
              </div>
              <div className="payment-method-item">
                <span className="method-icon">🏦</span>
                <div className="method-info">
                  <strong>Net Banking</strong>
                  <span>All major banks supported</span>
                </div>
              </div>
              <div className="payment-method-item">
                <span className="method-icon">👛</span>
                <div className="method-info">
                  <strong>Wallets</strong>
                  <span>Paytm, Freecharge, Mobikwik</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setAmount('')
          }}
          amount={parseFloat(amount) || 0}
          onSuccess={async () => {
            setAmount('')
            await loadWallet()
          }}
        />
      )}
    </div>
  )
}









