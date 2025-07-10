import { useContext, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { UserContext } from '../Context/userContext'
import AdminHeader from './AdminHeader'

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [openAccordions, setOpenAccordions] = useState({
    products: false,
    users: false,
    shops: false,
    wallets: false,
    payments: false,
    settings: false,
  })
  const { user } = useContext(UserContext)

  type AccordionKey = keyof typeof openAccordions

  const toggleAccordion = (key: string) => {
    if (Object.keys(openAccordions).includes(key)) {
      setOpenAccordions(prev => ({
        ...prev,
        [key]: !prev[key as AccordionKey],
      }))
    }
  }

  const handleNavClick = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <AdminHeader setIsSidebarOpen={setIsSidebarOpen} isSidebarOpen={isSidebarOpen} />

      <div className='flex h-full'>
        {/* Sidebar */}
        <aside
          className={`fixed md:relative w-64 bg-gradient-to-b from-indigo-700 to-indigo-800 text-white shadow-xl transform transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          } z-40 flex flex-col h-[calc(100vh-64px)] md:h-auto`}
        >
          {/* User Profile Section */}
          <div className='p-3 border-b border-indigo-600'>
            <div className='flex items-center space-x-2'>
              <div className='h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold'>
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className='font-medium text-sm'>{user?.name}</p>
                <p className='text-xs text-indigo-200'>{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className='flex-1 overflow-y-auto p-2 space-y-0.5'>
            {/* Dashboard */}
            <NavLink
              to='/dashboard'
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg transition-all text-sm ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-indigo-100 hover:bg-indigo-600/50'
                }`
              }
            >
              <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
                />
              </svg>
              ড্যাশবোর্ড
            </NavLink>

            {/* Profile */}
            <NavLink
              to='/dashboard/profile'
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg transition-all text-sm ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-indigo-100 hover:bg-indigo-600/50'
                }`
              }
            >
              <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                />
              </svg>
              প্রোফাইল
            </NavLink>

            {/* Order Management */}
            <NavLink
              to='/dashboard/order-management'
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg transition-all text-sm ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-indigo-100 hover:bg-indigo-600/50'
                }`
              }
            >
              <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
                />
              </svg>
              অর্ডার ম্যানেজমেন্ট
            </NavLink>
            {/* Payment Management */}
            <div className='border-b border-indigo-600/30 pb-0.5'>
              <button
                onClick={() => toggleAccordion('payments')}
                className='w-full flex items-center justify-between px-3 py-2 text-indigo-100 hover:bg-indigo-600/30 rounded-lg transition-all text-sm'
              >
                <div className='flex items-center'>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z'
                    />
                  </svg>
                  পেমেন্ট ম্যানেজমেন্ট
                </div>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${
                    openAccordions.payments ? 'transform rotate-180' : ''
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>

              {openAccordions.payments && (
                <div className='ml-6 mt-0.5 space-y-0.5'>
                  <NavLink
                    to='/dashboard/payment-verification'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    পেমেন্ট ভেরিফিকেশন
                  </NavLink>
                  <NavLink
                    to='/dashboard/withdraw-requests'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    উইথড্র রিকোয়েস্ট
                  </NavLink>
                </div>
              )}
            </div>

            {/* Product Management */}
            <div className='border-b border-indigo-600/30 pb-0.5'>
              <button
                onClick={() => toggleAccordion('products')}
                className='w-full flex items-center justify-between px-3 py-2 text-indigo-100 hover:bg-indigo-600/30 rounded-lg transition-all text-sm'
              >
                <div className='flex items-center'>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                    />
                  </svg>
                  প্রোডাক্ট ম্যানেজমেন্ট
                </div>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${
                    openAccordions.products ? 'transform rotate-180' : ''
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>

              {openAccordions.products && (
                <div className='ml-6 mt-0.5 space-y-0.5'>
                  <NavLink
                    to='/dashboard/products'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    সকল পণ্য
                  </NavLink>
                  <NavLink
                    to='/dashboard/add-product'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    নতুন পণ্য যোগ করুন
                  </NavLink>
                  <NavLink
                    to='/dashboard/categories'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    ক্যাটাগরি ম্যানেজমেন্ট
                  </NavLink>
                </div>
              )}
            </div>

            {/* User Management */}
            <div className='border-b border-indigo-600/30 pb-0.5'>
              <button
                onClick={() => toggleAccordion('users')}
                className='w-full flex items-center justify-between px-3 py-2 text-indigo-100 hover:bg-indigo-600/30 rounded-lg transition-all text-sm'
              >
                <div className='flex items-center'>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
                    />
                  </svg>
                  ইউজার ম্যানেজমেন্ট
                </div>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${
                    openAccordions.users ? 'transform rotate-180' : ''
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>

              {openAccordions.users && (
                <div className='ml-6 mt-0.5 space-y-0.5'>
                  <NavLink
                    to='/dashboard/seller-management'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    সেলার ম্যানেজমেন্ট
                  </NavLink>
                  <NavLink
                    to='/dashboard/customer-management'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    গ্রাহক ম্যানেজমেন্ট
                  </NavLink>
                  <NavLink
                    to='/dashboard/admin-management'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    অ্যাডমিন ম্যানেজমেন্ট
                  </NavLink>
                  <NavLink
                    to='/dashboard/role-permission'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    রোল ও পারমিশন ম্যানেজমেন্ট
                  </NavLink>
                </div>
              )}
            </div>

            {/* Shop Management */}
            <div className='border-b border-indigo-600/30 pb-0.5'>
              <button
                onClick={() => toggleAccordion('shops')}
                className='w-full flex items-center justify-between px-3 py-2 text-indigo-100 hover:bg-indigo-600/30 rounded-lg transition-all text-sm'
              >
                <div className='flex items-center'>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                    />
                  </svg>
                  শপ ম্যানেজমেন্ট
                </div>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${
                    openAccordions.shops ? 'transform rotate-180' : ''
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>

              {openAccordions.shops && (
                <div className='ml-6 mt-0.5 space-y-0.5'>
                  <NavLink
                    to='/dashboard/shops'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    শপ লিস্ট
                  </NavLink>
                </div>
              )}
            </div>

            {/* Wallet Management */}
            <div className='border-b border-indigo-600/30 pb-0.5'>
              <button
                onClick={() => toggleAccordion('wallets')}
                className='w-full flex items-center justify-between px-3 py-2 text-indigo-100 hover:bg-indigo-600/30 rounded-lg transition-all text-sm'
              >
                <div className='flex items-center'>
                  <svg
                    className='w-4 h-4 mr-2'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
                    />
                  </svg>
                  ওয়ালেট ম্যানেজমেন্ট
                </div>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${
                    openAccordions.wallets ? 'transform rotate-180' : ''
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>

              {openAccordions.wallets && (
                <div className='ml-6 mt-0.5 space-y-0.5'>
                  <NavLink
                    to='/dashboard/system-wallet'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    সিস্টেম ওয়ালেট
                  </NavLink>
                  <NavLink
                    to='/dashboard/seller-wallet'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    সেলার ওয়ালেট
                  </NavLink>
                </div>
              )}
            </div>

            {/* Balance Statement */}
            <NavLink
              to='/dashboard/balance-statement'
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg transition-all text-sm ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-indigo-100 hover:bg-indigo-600/50'
                }`
              }
            >
              <svg
                className='w-4 h-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z'
                />
              </svg>
              ব্যালেন্স স্টেটমেন্ট
            </NavLink>
            <NavLink
              to='/dashboard/support-tickets'
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg transition-all text-sm ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-indigo-100 hover:bg-indigo-600/50'
                }`
              }
            >
              <svg
                className='w-4 h-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z'
                />
              </svg>
              সাপোর্ট টিকেট
            </NavLink>

            {/* Settings Section */}
            <div className='border-b border-indigo-600/30 pb-0.5'>
              <button
                onClick={() => toggleAccordion('settings')}
                className='w-full flex items-center justify-between px-3 py-2 text-indigo-100 hover:bg-indigo-600/30 rounded-lg transition-all text-sm'
              >
                <div className='flex items-center'>
                  <svg
                    className='w-4 h-4 mr-2'
                    xmlns='http://www.w3.org/2000/svg'
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  >
                    <circle cx='12' cy='12' r='3'></circle>
                    <path d='M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z'></path>
                  </svg>
                  সেটিংস
                </div>
                <svg
                  className={`w-3 h-3 transition-transform duration-200 ${
                    openAccordions.settings ? 'transform rotate-180' : ''
                  }`}
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              </button>

              {openAccordions.settings && (
                <div className='ml-6 mt-0.5 space-y-0.5'>
                  <NavLink
                    to='/dashboard/commission-management'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    কমিশন ম্যানেজমেন্ট
                  </NavLink>
                  <NavLink
                    to='/dashboard/announcement-management'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    ঘোষণা ম্যানেজমেন্ট
                  </NavLink>

                  <NavLink
                    to='/dashboard/configuration-settings'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    কনফিগারেশন সেটিংস
                  </NavLink>
                  <NavLink
                    to='/dashboard/change-password'
                    onClick={handleNavClick}
                    className={({ isActive }) =>
                      `flex items-center px-2 py-1.5 rounded-lg text-xs transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'text-indigo-100 hover:bg-indigo-600/30'
                      }`
                    }
                  >
                    পাসওয়ার্ড পরিবর্তন
                  </NavLink>
                </div>
              )}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className='flex-1 w-full p-0 bg-white md:bg-transparent md:rounded-tl-lg overflow-hidden'>
          <div className='bg-white min-h-[calc(100vh-4rem)] p-4 md:p-6'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
