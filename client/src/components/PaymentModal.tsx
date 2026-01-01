import { useState, useEffect } from 'react'
import api from '../services/api'
import './PaymentModal.css'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  onSuccess: () => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

export default function PaymentModal({ isOpen, onClose, amount, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'test'>('razorpay')

  useEffect(() => {
    if (isOpen && paymentMethod === 'razorpay') {
      // Load Razorpay script
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.async = true
      document.body.appendChild(script)

      return () => {
        document.body.removeChild(script)
      }
    }
  }, [isOpen, paymentMethod])

  const handleRazorpayPayment = async () => {
    if (!window.Razorpay) {
      setError('Payment gateway not loaded. Please refresh the page.')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Create order
      const orderResponse = await api.post('/payment/create-order', { amount })
      const { orderId, keyId } = orderResponse.data

      // Initialize Razorpay checkout
      const options = {
        key: keyId,
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        name: 'Chess Earning Site',
        description: `Add ₹${amount} to wallet`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await api.post('/payment/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount,
            })

            if (verifyResponse.data.success) {
              onSuccess()
              onClose()
            }
          } catch (err: any) {
            setError(err.response?.data?.error || 'Payment verification failed')
            setLoading(false)
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#667eea',
        },
        modal: {
          ondismiss: function () {
            setLoading(false)
          },
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.on('payment.failed', function (response: any) {
        setError(response.error.description || 'Payment failed')
        setLoading(false)
      })
      razorpay.open()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate payment')
      setLoading(false)
    }
  }

  const handleTestPayment = async () => {
    setLoading(true)
    setError('')

    try {
      // Ensure amount is a number
      const depositAmount = typeof amount === 'string' ? parseFloat(amount) : amount
      
      if (isNaN(depositAmount) || depositAmount <= 0) {
        setError('Please enter a valid amount')
        setLoading(false)
        return
      }

      console.log('Test payment initiated:', { amount: depositAmount })
      const response = await api.post('/wallet/deposit', { amount: depositAmount })
      console.log('Deposit response:', response.data)
      
      if (response.data.success || response.data.balance !== undefined) {
        onSuccess()
        onClose()
      } else {
        setError('Deposit completed but no balance returned')
      }
    } catch (err: any) {
      console.error('Deposit error:', err)
      const errorMessage = err.response?.data?.error || err.message || 'Deposit failed'
      setError(errorMessage)
      console.error('Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        url: err.config?.url
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = () => {
    if (paymentMethod === 'razorpay') {
      handleRazorpayPayment()
    } else {
      handleTestPayment()
    }
  }

  if (!isOpen) return null

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2>Add Money to Wallet</h2>
          <button className="payment-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="payment-modal-body">
          <div className="payment-amount-display">
            <span className="amount-label">Amount</span>
            <span className="amount-value">₹{amount.toFixed(2)}</span>
          </div>

          <div className="payment-methods">
            <h3>Choose Payment Method</h3>
            
            <div className="payment-method-options">
              <label className={`payment-method-option ${paymentMethod === 'razorpay' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'razorpay')}
                />
                <div className="payment-method-info">
                  <div className="payment-method-name">Razorpay</div>
                  <div className="payment-method-desc">UPI, Cards, Net Banking, Wallets</div>
                  <div className="payment-method-icons">
                    <span>💳</span>
                    <span>📱</span>
                    <span>🏦</span>
                  </div>
                </div>
              </label>

              <label className={`payment-method-option ${paymentMethod === 'test' ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="paymentMethod"
                  value="test"
                  checked={paymentMethod === 'test'}
                  onChange={(e) => setPaymentMethod(e.target.value as 'test')}
                />
                <div className="payment-method-info">
                  <div className="payment-method-name">Test Mode</div>
                  <div className="payment-method-desc">Instant deposit (for testing only)</div>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="payment-error">
              <strong>Error:</strong> {error}
              <br />
              <small style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
                Check browser console (F12) for more details
              </small>
            </div>
          )}

          <div className="payment-features">
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Secure Payment</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Instant Credit</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>100% Safe</span>
            </div>
          </div>
        </div>

        <div className="payment-modal-footer">
          <button className="payment-cancel-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="payment-proceed-btn" 
            onClick={handlePayment}
            disabled={loading || amount <= 0}
          >
            {loading ? 'Processing...' : `Pay ₹${amount.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

