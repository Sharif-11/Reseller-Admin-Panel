import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
export const DASHBOARD_KEY = 'dashboardPath'

const DashboardTracker = () => {
  const location = useLocation()
  const path = location.pathname
  useEffect(() => {
    console.log({ location })
    if (path.startsWith('/dashboard')) {
      console.log(`Navigated to Dashboard: ${location.pathname}`)
      localStorage.setItem(DASHBOARD_KEY, location.pathname)
      // You can add more logic here, like sending this info to an analytics service
    }
  }, [path])
  return null
}
export default DashboardTracker
