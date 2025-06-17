import type { ReactNode } from 'react'
import { createContext, useEffect, useState } from 'react'
import { authService } from '../Api/auth.api'
import Loading from '../Components/Loading'

export interface User {
  userId: string
  phoneNo: string
  name: string
  email?: string
  role: 'SuperAdmin' | 'Admin'
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  loading: boolean
  error: Error | null
  reloadUser: () => Promise<void> // Add reload function to context type
}

// Create the context
export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  error: null,
  reloadUser: async () => {}, // Add default reload function
})

// Provider Component
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const checkLogin = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const result = await authService.verifyLogin()

      if (result?.success) {
        setUser(result.data?.user || null)
        localStorage.setItem('token', result.data?.token || '')
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Login verification failed:', error)
      setError(error instanceof Error ? error : new Error('Login verification failed'))
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // This function can be called to manually reload user data
  const reloadUser = async () => {
    try {
      const result = await authService.verifyLogin()
      if (result?.success) {
        setUser(result.data?.user || null)
      }
    } catch (error) {
      console.error('Error reloading user data:', error)
    }
  }

  useEffect(() => {
    checkLogin()
  }, [])

  if (loading) return <Loading />

  return (
    <UserContext.Provider value={{ user, setUser, loading, error, reloadUser }}>
      {children}
    </UserContext.Provider>
  )
}
