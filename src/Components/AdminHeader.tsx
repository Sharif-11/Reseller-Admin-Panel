import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { authService } from '../Api/auth.api'
import { useAuth } from '../Hooks/useAuth'
import { loadingText } from '../utils/utils'

const AdminHeader = ({
  isSidebarOpen,
  setIsSidebarOpen,
}: {
  isSidebarOpen: boolean
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  // const [notificationOpen, setNotificationOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, setUser } = useAuth()

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  // const toggleNotifications = () => {
  //   setNotificationOpen(!notificationOpen)
  // }

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
  useEffect(() => {
    if (isDropdownOpen) {
      setIsSidebarOpen(false)
    }
  }, [isDropdownOpen])
  useEffect(() => {
    if (isSidebarOpen) {
      setIsDropdownOpen(false)
    }
  }, [isSidebarOpen])

  return (
    <header className='bg-gradient-to-r from-indigo-700 to-indigo-800 sticky top-0 z-50 shadow-lg'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo and Mobile Menu Button */}
          <div className='flex items-center text-white gap-3'>
            <button
              onClick={() => setIsSidebarOpen(prev => !prev)}
              className='p-1 rounded-md hover:bg-indigo-600 transition'
              aria-label='Toggle sidebar'
            >
              <svg
                className='h-6 w-6'
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

            <div className='text-white font-bold text-xl'>Admin Panel</div>
          </div>

          {/* Admin Navigation */}
          <div className='flex items-center space-x-4'>
            {/* Notifications */}
            {/* <div className='relative'>
              <button
                onClick={toggleNotifications}
                className='p-1 text-white hover:bg-indigo-600 rounded-full transition relative'
              >
                <svg
                  className='h-6 w-6'
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
                <span className='absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500'></span>
              </button>

              {notificationOpen && (
                <div className='absolute right-0 mt-2 w-72 bg-white rounded-md shadow-lg z-10 overflow-hidden'>
                  <div className='px-4 py-2 border-b border-gray-100 bg-gray-50'>
                    <p className='text-sm font-medium text-gray-700'>Notifications</p>
                  </div>
                  <div className='max-h-60 overflow-y-auto'>
                    <div className='px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer'>
                      <p className='text-sm text-gray-800'>New order received</p>
                      <p className='text-xs text-gray-500 mt-1'>2 minutes ago</p>
                    </div>
                    <div className='px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer'>
                      <p className='text-sm text-gray-800'>New user registered</p>
                      <p className='text-xs text-gray-500 mt-1'>15 minutes ago</p>
                    </div>
                    <div className='px-4 py-3 hover:bg-gray-50 transition cursor-pointer'>
                      <p className='text-sm text-gray-800'>System update available</p>
                      <p className='text-xs text-gray-500 mt-1'>1 hour ago</p>
                    </div>
                  </div>
                  <div className='px-4 py-2 border-t border-gray-100 bg-gray-50 text-center'>
                    <a
                      href='#'
                      className='text-xs text-indigo-600 hover:text-indigo-800 font-medium'
                    >
                      View All Notifications
                    </a>
                  </div>
                </div>
              )}
            </div> */}

            {/* User Dropdown */}
            <div className='relative'>
              <button
                onClick={toggleDropdown}
                className='flex items-center space-x-2 text-white hover:bg-indigo-600 px-3 py-2 rounded-md transition'
              >
                <div className='h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center'>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className='font-medium hidden md:inline'>{user?.name || 'Admin'}</span>
                <svg
                  className={`h-4 w-4 transition-transform hidden md:inline ${
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
                <div className='absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 overflow-hidden'>
                  <div className='px-4 py-3 border-b border-gray-100'>
                    <p className='text-sm font-medium text-gray-900'>{user?.name || 'Admin'}</p>
                    <p className='text-xs text-gray-500'>{user?.role}</p>
                  </div>
                  <Link
                    to={'/dashboard/profile'}
                    className='block px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition'
                  >
                    প্রোফাইল
                  </Link>
                  <Link
                    to={'/dashboard/change-password'}
                    className='block px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition'
                  >
                    পাসওয়ার্ড পরিবর্তন
                  </Link>

                  <button
                    onClick={handleLogout}
                    className='block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 transition'
                  >
                    {loading ? loadingText : 'লগ আউট'}
                  </button>
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
