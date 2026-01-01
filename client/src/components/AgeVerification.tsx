import { useState, useEffect } from 'react'
import './AgeVerification.css'

export default function AgeVerification({ onVerified }: { onVerified: () => void }) {
  const [showModal, setShowModal] = useState(false)
  const [rejected, setRejected] = useState(false)

  useEffect(() => {
    // Check if user has already verified their age
    const ageVerified = localStorage.getItem('ageVerified')
    
    if (ageVerified === 'true') {
      onVerified()
    } else {
      setShowModal(true)
    }
  }, [onVerified])

  const handleConfirm = () => {
    localStorage.setItem('ageVerified', 'true')
    setShowModal(false)
    onVerified()
  }

  const handleReject = () => {
    setRejected(true)
    localStorage.setItem('ageVerified', 'false')
  }

  if (!showModal && !rejected) {
    return null
  }

  if (rejected) {
    return (
      <div className="age-verification-overlay">
        <div className="age-verification-content age-rejected">
          <div className="age-verification-icon">🚫</div>
          <h1>Access Restricted</h1>
          <p>This website is restricted to users who are 18 years of age or older.</p>
          <p className="age-subtext">You must be at least 18 years old to access this site.</p>
          <div className="age-verification-footer">
            <p className="age-footer-text">If you believe this is an error, please contact support.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="age-verification-overlay">
      <div className="age-verification-content">
        <div className="age-verification-header">
          <div className="age-verification-icon">🔞</div>
          <h1>Age Verification Required</h1>
        </div>
        
        <div className="age-verification-body">
          <p className="age-main-text">
            This website contains content and features that are restricted to users who are <strong>18 years of age or older</strong>.
          </p>
          <p className="age-subtext">
            By clicking "Yes, I am 18+" below, you confirm that you are at least 18 years old and agree to access this content.
          </p>
          <div className="age-warning">
            <p>⚠️ If you are under 18, please exit this website immediately.</p>
          </div>
        </div>

        <div className="age-verification-footer">
          <button 
            className="age-btn age-btn-reject" 
            onClick={handleReject}
          >
            No, I am under 18
          </button>
          <button 
            className="age-btn age-btn-confirm" 
            onClick={handleConfirm}
          >
            Yes, I am 18+
          </button>
        </div>
      </div>
    </div>
  )
}

