import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth'
import { auth } from '../config/firebase'
import api from '../services/api'

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Sync Firebase user with backend
  const syncUserWithBackend = async (firebaseUser: FirebaseUser, name?: string) => {
    try {
      const idToken = await firebaseUser.getIdToken()
      
      // Check if user exists in backend, if not create them
      try {
        const response = await api.post('/auth/firebase', {
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          name: name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          idToken
        })
        
        const { token: backendToken, user: backendUser } = response.data
        setUser(backendUser)
        setToken(backendToken)
        localStorage.setItem('token', backendToken)
        localStorage.setItem('user', JSON.stringify(backendUser))
        api.defaults.headers.common['Authorization'] = `Bearer ${backendToken}`
      } catch (err: any) {
        // If backend endpoint doesn't exist, use Firebase token directly
        if (err.response?.status === 404) {
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
          })
          setToken(idToken)
          localStorage.setItem('token', idToken)
          localStorage.setItem('user', JSON.stringify({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
          }))
          api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`
        } else {
          // Log the error but don't fail completely - use Firebase token as fallback
          console.error('Backend sync error:', err)
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
          })
          setToken(idToken)
          localStorage.setItem('token', idToken)
          localStorage.setItem('user', JSON.stringify({
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
          }))
          api.defaults.headers.common['Authorization'] = `Bearer ${idToken}`
        }
      }
    } catch (error) {
      console.error('Error syncing user with backend:', error)
      // Don't throw - allow user to continue with Firebase auth
      // They can still use the app, backend sync can happen later
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserWithBackend(firebaseUser)
      } else {
        setUser(null)
        setToken(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    await syncUserWithBackend(userCredential.user)
  }

  const signup = async (name: string, email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    await syncUserWithBackend(userCredential.user, name)
  }

  const logout = async () => {
    await signOut(auth)
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

