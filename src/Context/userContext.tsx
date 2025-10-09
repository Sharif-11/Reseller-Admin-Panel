import type { ReactNode } from 'react'
import { createContext, useEffect, useState } from 'react'
import { authService } from '../Api/auth.api'

export interface User {
  userId: string
  phoneNo: string
  name: string
  email?: string
  role: 'SuperAdmin' | 'Admin' | 'Seller' | 'Customer'
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  loading: boolean
  error: Error | null
  reloadUser: () => Promise<User | null>
}

export const UserContext = createContext<UserContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  error: null,
  reloadUser: async () => null,
})

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  const [loading] = useState(false) // Start with true to prevent flash of unauthorized content
  const [error] = useState<Error | null>(null)

  const reloadUser = async (): Promise<User | null> => {
    try {
      const result = await authService.verifyLogin()
      if (result?.success) {
        // alert(JSON.stringify(result.data, null, 2))
        // alert(JSON.stringify(result.data, null, 2))
        console.log('User data reloaded:', result.data)
        setUser(result.data || null)
        return result.data || null
      }
    } catch (error) {
      console.error('Error reloading user data:', error)
      return null
    }
    return null
  }

  useEffect(() => {
    reloadUser()
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser, loading, error, reloadUser }}>
      {children}
    </UserContext.Provider>
  )
}
