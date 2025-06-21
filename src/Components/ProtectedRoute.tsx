// components/ProtectedRoute.tsx
import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { UserContext } from '../Context/userContext'
import Loading from './Loading'

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useContext(UserContext)

  if (loading) {
    return <Loading />
  }

  return user ? children : <Navigate to='/' />
}
