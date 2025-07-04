import React from 'react'
import { useQuery } from 'react-query'
import { dashboardApiService } from '../Api/dashboard.api'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: string
    positive: boolean
  }
  description?: string
  isLoading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  description,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className='bg-white rounded-lg shadow p-6 h-full animate-pulse'>
        <div className='flex justify-between items-start'>
          <div className='space-y-2 w-full'>
            <div className='h-4 bg-gray-200 rounded w-3/4'></div>
            <div className='h-6 bg-gray-200 rounded w-1/2'></div>
            {description && <div className='h-3 bg-gray-200 rounded w-full'></div>}
            {trend && <div className='h-3 bg-gray-200 rounded w-1/2'></div>}
          </div>
          <div className='bg-gray-200 rounded-full p-3 text-gray-200'>
            <div className='w-6 h-6'></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='bg-white rounded-lg shadow p-6 h-full'>
      <div className='flex justify-between items-start'>
        <div>
          <p className='text-sm font-medium text-gray-500'>{title}</p>
          <p className='text-2xl font-semibold text-gray-900 mt-1'>{value}</p>
          {description && <p className='text-xs text-gray-500 mt-1'>{description}</p>}
          {trend && (
            <span
              className={`inline-flex items-center text-xs mt-2 ${
                trend.positive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.positive ? (
                <svg className='w-3 h-3 mr-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 15l7-7 7 7'
                  />
                </svg>
              ) : (
                <svg className='w-3 h-3 mr-1' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 9l-7 7-7-7'
                  />
                </svg>
              )}
              {trend.value}
            </span>
          )}
        </div>
        <div className='bg-blue-50 rounded-full p-3 text-blue-600'>{icon}</div>
      </div>
    </div>
  )
}

interface DashboardStatsData {
  totalUsers: number
  totalSellers: number
  totalCustomers: number
  totalAdmins: number
  totalSuperAdmins: number
  totalVerifiedSellers: number
  totalUnverifiedSellers: number
  totalUsersLast30Days: number
  totalUsersLast7Days: number
  totalOrders: number
  totalSales: number
  totalCommission: number
  totalProductsSold: number
  totalOrdersCompleted: number
  totalOrdersCompletedLast30Days: number
  totalOrdersCompletedLast7Days: number
  totalSalesLast30Days: number
  totalSalesLast7Days: number
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const calculateTrend = (
  current: number,
  previous: number
): { value: string; positive: boolean } => {
  if (previous === 0) {
    return {
      value: current > 0 ? '100% increase' : 'No change',
      positive: current > 0,
    }
  }

  const percentage = ((current - previous) / previous) * 100
  const absolutePercentage = Math.abs(percentage)

  return {
    value: `${absolutePercentage.toFixed(1)}% ${percentage > 0 ? 'increase' : 'decrease'}`,
    positive: percentage > 0,
  }
}

const DashboardStats = () => {
  const {
    data: stats,
    isLoading,
    error,
  } = useQuery<DashboardStatsData>(
    'dashboardStats',
    async () => {
      const { success, message, data } = await dashboardApiService.getDashboardData()
      if (!success) {
        throw new Error(message || 'Failed to load dashboard data')
      }
      return data
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes cache
      retry: 2,
      refetchOnWindowFocus: false,
    }
  )

  if (error) {
    return (
      <div className='flex justify-center items-center min-h-[200px]'>
        <p className='text-red-500'>{(error as Error).message}</p>
      </div>
    )
  }

  // Calculate trends
  const userTrend7Days = calculateTrend(
    stats?.totalUsersLast7Days || 0,
    (stats?.totalUsers || 0) - (stats?.totalUsersLast7Days || 0)
  )

  const orderTrend7Days = calculateTrend(
    stats?.totalOrdersCompletedLast7Days || 0,
    (stats?.totalOrdersCompleted || 0) - (stats?.totalOrdersCompletedLast7Days || 0)
  )

  const salesTrend7Days = calculateTrend(
    stats?.totalSalesLast7Days || 0,
    (stats?.totalSales || 0) - (stats?.totalSalesLast7Days || 0)
  )

  return (
    <div className='p-4 md:p-6'>
      <h2 className='text-xl font-bold text-gray-800 mb-6'>Dashboard Overview</h2>

      {/* Order Statistics Section */}
      <div className='mb-8'>
        <h3 className='text-lg font-semibold text-gray-700 mb-4 flex items-center'>
          <svg
            className='w-5 h-5 mr-2 text-gray-500'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
            />
          </svg>
          Order Statistics
        </h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <StatCard
            title='Total Orders'
            value={stats?.totalOrders || 0}
            icon={
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
                />
              </svg>
            }
            isLoading={isLoading}
          />
          <StatCard
            title='Completed Orders'
            value={stats?.totalOrdersCompleted || 0}
            icon={
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            }
            description={`${stats?.totalOrdersCompletedLast7Days || 0} in last 7 days, ${
              stats?.totalOrdersCompletedLast30Days || 0
            } in last 30 days`}
            trend={orderTrend7Days}
            isLoading={isLoading}
          />
          <StatCard
            title='Total Sales'
            value={formatCurrency(stats?.totalSales || 0)}
            icon={
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            }
            description={`${formatCurrency(
              stats?.totalSalesLast7Days || 0
            )} in last 7 days, ${formatCurrency(stats?.totalSalesLast30Days || 0)} in last 30 days`}
            trend={salesTrend7Days}
            isLoading={isLoading}
          />
          <StatCard
            title='Products Sold'
            value={stats?.totalProductsSold || 0}
            icon={
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z'
                />
              </svg>
            }
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* User Statistics Section */}
      <div>
        <h3 className='text-lg font-semibold text-gray-700 mb-4 flex items-center'>
          <svg
            className='w-5 h-5 mr-2 text-gray-500'
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
          User Statistics
        </h3>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          <StatCard
            title='Total Users'
            value={stats?.totalUsers || 0}
            icon={
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
                />
              </svg>
            }
            description={`${stats?.totalUsersLast7Days || 0} in last 7 days, ${
              stats?.totalUsersLast30Days || 0
            } in last 30 days`}
            trend={userTrend7Days}
            isLoading={isLoading}
          />
          <StatCard
            title='Customers'
            value={stats?.totalCustomers || 0}
            icon={
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                />
              </svg>
            }
            isLoading={isLoading}
          />
          <StatCard
            title='Sellers'
            value={stats?.totalSellers || 0}
            icon={
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                />
              </svg>
            }
            description={`${stats?.totalVerifiedSellers || 0} verified, ${
              stats?.totalUnverifiedSellers || 0
            } unverified`}
            trend={{
              value: `${
                stats && stats.totalSellers > 0
                  ? Math.round((stats.totalVerifiedSellers / stats.totalSellers) * 100)
                  : 0
              }% verified`,
              positive: (stats?.totalVerifiedSellers || 0) > 0,
            }}
            isLoading={isLoading}
          />
          <StatCard
            title='Admins'
            value={(stats?.totalAdmins || 0) + (stats?.totalSuperAdmins || 0)}
            icon={
              <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                />
              </svg>
            }
            description={`${stats?.totalSuperAdmins || 0} super admins`}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}

export default DashboardStats
