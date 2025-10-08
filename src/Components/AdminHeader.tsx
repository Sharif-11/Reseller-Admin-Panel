import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../Api/auth.api'
import { useAuth } from '../Hooks/useAuth'
import { loadingText } from '../utils/utils'
import './AdminHeader.css'
import NotificationDropdown from './Notification/Notification'
import { notificationService } from './Notification/notification.services'

const AdminHeader = ({
  isSidebarOpen,
  setIsSidebarOpen,
}: {
  isSidebarOpen: boolean
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  // Fetch unread count on component mount and when user changes
  useEffect(() => {
    if (user?.userId) {
      fetchUnreadCount()

      // Set up interval to periodically check for new notifications
      const interval = setInterval(fetchUnreadCount, 30000) // Check every 30 seconds

      return () => clearInterval(interval)
    }
  }, [user?.userId])

  const fetchUnreadCount = async () => {
    if (!user?.userId) return
    try {
      const count = await notificationService.getUnreadCount(user.userId)
      setUnreadCount(30)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const toggleNotifications = () => {
    setNotificationOpen(!notificationOpen)
    if (!notificationOpen) {
      // Refresh notifications when opening
      fetchUnreadCount()
    }
  }

  const handleMarkAllAsRead = () => {
    setUnreadCount(0)
  }

  const handleLogout = async () => {
    setLoading(true)
    const { success } = await authService.logout()
    if (success) {
      localStorage.removeItem('token')
      if (setUser) setUser(null)
      navigate('/')
    }
    setLoading(false)
  }

  // Close dropdowns when sidebar state changes
  useEffect(() => {
    if (isDropdownOpen) {
      setIsSidebarOpen(false)
    }
  }, [isDropdownOpen, setIsSidebarOpen])

  useEffect(() => {
    if (isSidebarOpen) {
      setIsDropdownOpen(false)
      setNotificationOpen(false)
    }
  }, [isSidebarOpen])

  // Close dropdowns when clicking outside (for user dropdown)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (isDropdownOpen && !target.closest('.user-dropdown-container')) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  return (
    <header className='admin-header bg-gradient-to-r from-indigo-700 to-indigo-800 sticky top-0 z-50 shadow-lg'>
      <div className='w-full px-3 sm:px-4 md:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-14 sm:h-16'>
          {/* Logo and Mobile Menu Button */}
          <div className='flex items-center text-white gap-2 sm:gap-3'>
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className='p-2 rounded-md hover:bg-indigo-600 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation'
              aria-label='Toggle sidebar'
            >
              <svg
                className='h-5 w-5 sm:h-6 sm:w-6'
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M4 6h16M4 12h16M4 18h16'
                />
              </svg>
            </button>

            <div className='flex items-center space-x-2'>
              <div className='text-white font-bold text-lg sm:text-xl md:text-2xl transition-all truncate max-w-[120px] sm:max-w-none'>
                Admin Panel
              </div>
            </div>
          </div>

          {/* Admin Navigation */}
          <div className='flex items-center space-x-2 sm:space-x-3'>
            {/* Notifications */}
            <div className='relative notification-container'>
              <button
                onClick={toggleNotifications}
                className='p-2 sm:p-2.5 text-white hover:bg-indigo-600 rounded-full transition-all duration-300 relative group hover:scale-105 active:scale-95 touch-manipulation'
                aria-label='Notifications'
              >
                <svg
                  className='w-5 h-5 sm:w-6 sm:h-6 transform group-hover:scale-110 transition-transform'
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9'
                  />
                </svg>

                {/* Enhanced notification badge */}
                {unreadCount > 0 && (
                  <span
                    className={`
      absolute -top-1 -right-1 
      min-w-[18px] h-[18px] 
      sm:min-w-[20px] sm:h-[20px]
      rounded-full 
      bg-gradient-to-r from-red-500 to-pink-500 
      text-[10px] sm:text-xs 
      flex items-center justify-center 
      text-white font-bold 
      shadow-lg 
      animate-pulse
      border-2 border-white
      px-1
      ${unreadCount > 9 ? 'text-[9px] sm:text-[10px]' : ''}
    `}
                  >
                    {unreadCount > 99 ? '99+' : unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              <NotificationDropdown
                isOpen={notificationOpen}
                onClose={() => setNotificationOpen(false)}
                onMarkAllAsRead={handleMarkAllAsRead}
              />
            </div>

            {/* User Dropdown */}
            <div className='relative user-dropdown-container'>
              <button
                onClick={toggleDropdown}
                className='flex items-center space-x-2 text-white hover:bg-indigo-600 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition-all duration-200 group active:scale-95 touch-manipulation min-h-[44px]'
              >
                <div className='h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center font-semibold group-hover:bg-opacity-30 transition-all text-sm sm:text-base'>
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className='hidden sm:flex flex-col items-start'>
                  <span className='font-medium text-sm leading-tight'>{user?.name || 'Admin'}</span>
                  <span className='text-xs text-indigo-200 opacity-80 leading-tight'>
                    {user?.role || 'Administrator'}
                  </span>
                </div>
                <svg
                  className={`h-4 w-4 transition-transform hidden sm:inline ${
                    isDropdownOpen ? 'transform rotate-180' : ''
                  }`}
                  xmlns='http://www.w3.org/2000/svg'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>

              {isDropdownOpen && (
                <div className='fixed inset-x-3 top-16 sm:absolute sm:right-0 sm:left-auto sm:top-full sm:mt-2 sm:w-64 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-scale-in'>
                  {/* User Info */}
                  <div className='px-4 py-3 sm:px-5 sm:py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100'>
                    <p className='text-sm font-semibold text-gray-900 truncate'>
                      {user?.name || 'Admin'}
                    </p>
                    <p className='text-xs text-gray-600 mt-1'>{user?.role || 'Administrator'}</p>
                    <p className='text-xs text-gray-500 mt-1 truncate'>
                      {user?.email || user?.phoneNo}
                    </p>
                  </div>

                  {/* Dropdown Menu Items */}
                  <div className='py-2'>
                    <Link
                      to={'/dashboard/profile'}
                      className='flex items-center space-x-3 px-4 py-3 sm:px-5 sm:py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 group active:bg-gray-100'
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <svg
                        className='h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                        />
                      </svg>
                      <span className='truncate'>প্রোফাইল</span>
                    </Link>

                    <Link
                      to={'/dashboard/change-password'}
                      className='flex items-center space-x-3 px-4 py-3 sm:px-5 sm:py-3 text-sm text-gray-700 hover:bg-gray-50 transition-all duration-200 group active:bg-gray-100'
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <svg
                        className='h-4 w-4 text-gray-400 group-hover:text-indigo-500 transition-colors flex-shrink-0'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                        />
                      </svg>
                      <span className='truncate'>পাসওয়ার্ড পরিবর্তন</span>
                    </Link>

                    <div className='border-t border-gray-100 my-2'></div>

                    <button
                      onClick={handleLogout}
                      disabled={loading}
                      className='flex items-center space-x-3 w-full px-4 py-3 sm:px-5 sm:py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-200 group disabled:opacity-50 active:bg-red-100 touch-manipulation'
                    >
                      <svg
                        className='h-4 w-4 text-red-400 group-hover:text-red-600 transition-colors flex-shrink-0'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                        />
                      </svg>
                      <span className='truncate'>{loading ? loadingText : 'লগ আউট'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
