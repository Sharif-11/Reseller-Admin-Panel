// components/ProtectedRoute.tsx
import { useContext } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { UserContext } from '../Context/userContext'
import Loading from './Loading'

export const ProtectedRoute = () => {
  const { user, loading } = useContext(UserContext)

  if (loading) {
    return <Loading />
  }

  return user ? <Outlet /> : <Navigate to='/' replace />
}

export const AuthRoute = () => {
  const { user, loading } = useContext(UserContext)
  const location = useLocation()

  if (loading) {
    return <Loading />
  }

  return !user ? <Outlet /> : <Navigate to={location.pathname} replace />
}
