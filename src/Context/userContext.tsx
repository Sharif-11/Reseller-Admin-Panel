import type { ReactNode } from 'react'
import { createContext, useState } from 'react'
import { authService } from '../Api/auth.api'

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

  // const checkLogin = async () => {
  //   const token = localStorage.getItem('token')
  //   if (!token) {
  //     setLoading(false)
  //     return
  //   }

  //   try {
  //     setLoading(true)
  //     // alert('inside user provider checkLogin')
  //     const result = await authService.verifyLogin()

  //     if (result?.success) {
  //       setUser(result.data?.user || null)

  //       if (result.data?.token) {
  //         localStorage.setItem('token', result.data?.token)
  //       }
  //     } else {
  //       setUser(null)
  //     }
  //   } catch (error) {
  //     console.error('Login verification failed:', error)
  //     setError(error instanceof Error ? error : new Error('Login verification failed'))
  //     setUser(null)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const reloadUser = async (): Promise<User | null> => {
    try {
      const result = await authService.verifyLogin()
      if (result?.success) {
        setUser(result.data?.user || null)
        return result.data?.user || null
      }
    } catch (error) {
      console.error('Error reloading user data:', error)
      return null
    }
    return null
  }

  // useEffect(() => {
  //   checkLogin()
  // }, [])

  return (
    <UserContext.Provider value={{ user, setUser, loading, error, reloadUser }}>
      {children}
    </UserContext.Provider>
  )
}
