// API Configuration
// In production, these will be set via environment variables

const getApiUrl = () => {
  // Check for environment variable first (for production)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  
  // Development fallback
  return 'http://localhost:3000'
}

const getSocketUrl = () => {
  // Check for environment variable first (for production)
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL
  }
  
  // Development fallback
  return 'http://localhost:3000'
}

export const API_URL = getApiUrl()
export const SOCKET_URL = getSocketUrl()

// For API calls, use relative path if on same domain, or full URL if different
export const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

console.log('API Configuration:', {
  API_URL,
  SOCKET_URL,
  API_BASE_URL,
  isProduction: import.meta.env.PROD
})

