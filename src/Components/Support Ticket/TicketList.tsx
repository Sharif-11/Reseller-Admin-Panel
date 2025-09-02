import { useState } from 'react'
import { useQuery } from 'react-query'
import { NavLink } from 'react-router-dom'
import supportTicketApi, { type SupportTicket } from '../../Api/support-ticket.api'
import type { TicketStatus } from './types'

const AdminSupportTickets = () => {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<TicketStatus | ''>('')
  const [priority, setPriority] = useState('')
  const [category, setCategory] = useState('')

  const {
    data: ticketsData,
    isLoading,
    isError,
  } = useQuery(
    ['support-tickets', { page, limit, search, status, priority, category }],
    () =>
      supportTicketApi.getAllTickets({
        status: status || undefined,
        page,
        limit,
        search,
        priority: priority || undefined,
        category: category || undefined,
      }),
    { keepPreviousData: true }
  )

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'OPEN', label: 'Open' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'WAITING_RESPONSE', label: 'Waiting Response' },
    { value: 'RESOLVED', label: 'Resolved' },
    { value: 'CLOSED', label: 'Closed' },
  ]

  const priorityOptions = [
    { value: '', label: 'All Priority' },
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'CRITICAL', label: 'Critical' },
  ]

  const categoryOptions = [
    { value: '', label: 'All Category' },
    { value: 'ACCOUNT', label: 'Account' },
    { value: 'PAYMENT', label: 'Payment' },
    { value: 'ORDER', label: 'Order' },
    { value: 'PRODUCT', label: 'Product' },
    { value: 'WITHDRAWAL', label: 'Withdrawal' },
    { value: 'TECHNICAL', label: 'Technical' },
    { value: 'OTHER', label: 'Other' },
  ]

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'WAITING_RESPONSE':
        return 'bg-purple-100 text-purple-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800'
      case 'HIGH':
        return 'bg-yellow-100 text-yellow-800'
      case 'CRITICAL':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleResetFilters = () => {
    setSearch('')
    setStatus('')
    setPriority('')
    setCategory('')
    setPage(1)
  }
  const handleDeleteOldTickets = async () => {
    const days = prompt('পুরনো টিকেট মুছে ফেলার জন্য দিনের সংখ্যা লিখুন (ডিফল্ট ৭ দিন):', '7')
    if (days) {
      try {
        const { success, message } = await supportTicketApi.deleteOldTickets(parseInt(days))
        if (success) {
          alert(`Old tickets deleted successfully: ${message}`)
          // Optionally, refetch tickets to reflect changes
          setPage(1)
        }
      } catch (error) {
        console.error('Error deleting old tickets:', error)
        alert('Failed to delete old tickets. Please try again later.')
      }
    }
  }
  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }
    return new Date(date).toLocaleDateString('bn-BD', options)
  }

  return (
    <div className='space-y-4 p-4'>
      {/* Header */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <h2 className='text-xl md:text-2xl font-bold text-gray-800'>সাপোর্ট টিকেট</h2>
      </div>

      {/* Filters */}
      <div className='bg-white p-4 rounded-lg shadow'>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Search */}
          <div>
            <label htmlFor='search' className='block text-sm font-medium text-gray-700 mb-1'>
              সার্চ
            </label>
            <input
              id='search'
              type='text'
              placeholder='টিকেট বা শপ নাম'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-sm'
            />
          </div>

          {/* Status */}
          <div>
            <label htmlFor='status' className='block text-sm font-medium text-gray-700 mb-1'>
              স্ট্যাটাস
            </label>
            <select
              id='status'
              value={status}
              onChange={e => setStatus(e.target.value as TicketStatus)}
              className='block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-sm'
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor='priority' className='block text-sm font-medium text-gray-700 mb-1'>
              প্রায়োরিটি
            </label>
            <select
              id='priority'
              value={priority}
              onChange={e => setPriority(e.target.value)}
              className='block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-sm'
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label htmlFor='category' className='block text-sm font-medium text-gray-700 mb-1'>
              ক্যাটাগরি
            </label>
            <select
              id='category'
              value={category}
              onChange={e => setCategory(e.target.value)}
              className='block w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 text-sm'
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Actions */}
        <div className='flex flex-col sm:flex-row justify-end gap-2 mt-4'>
          <button
            onClick={handleDeleteOldTickets}
            className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            পুরানো টিকিট ডিলিট করুন
          </button>
          <button
            onClick={handleResetFilters}
            className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            রিসেট ফিল্টার
          </button>
          <button
            onClick={() => setPage(1)}
            className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            ফিল্টার প্রয়োগ করুন
          </button>
        </div>
      </div>

      {/* Tickets List */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        {isLoading ? (
          // Loading Skeleton
          <div className='p-4 space-y-4'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-20 w-full bg-gray-200 animate-pulse rounded'></div>
            ))}
          </div>
        ) : isError ? (
          // Error State
          <div className='p-4 text-center text-red-500'>
            টিকেট লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।
          </div>
        ) : ticketsData?.data?.tickets.length === 0 ? (
          // Empty State
          <div className='p-8 text-center'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={1}
                d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
              />
            </svg>
            <h3 className='mt-2 text-sm md:text-lg font-medium text-gray-900'>
              কোন টিকেট পাওয়া যায়নি
            </h3>
            <p className='mt-1 text-xs md:text-sm text-gray-500'>
              আপনার সার্চ বা ফিল্টার ক্রাইটেরিয়া মেলে এমন কোন টিকেট পাওয়া যায়নি।
            </p>
          </div>
        ) : (
          <>
            {/* Table - Desktop */}
            <div className='hidden md:block overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      টিকেট আইডি
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      বিষয়
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      স্ট্যাটাস
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      প্রায়োরিটি
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      শপ
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      তারিখ
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      একশন
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {ticketsData?.data?.tickets.map((ticket: SupportTicket) => (
                    <tr key={ticket.ticketId} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                        #{ticket.ticketId.slice(0, 8)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>{ticket.subject}</div>
                        <div className='text-xs text-gray-500'>{ticket.category}</div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            ticket.status
                          )}`}
                        >
                          {statusOptions.find(s => s.value === ticket.status)?.label}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                            ticket.priority
                          )}`}
                        >
                          {priorityOptions.find(p => p.value === ticket.priority)?.label}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {ticket.shopName || '-'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                        <NavLink
                          to={`/dashboard/support-tickets/${ticket.ticketId}`}
                          className='text-indigo-600 hover:text-indigo-900'
                        >
                          বিস্তারিত
                        </NavLink>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards - Mobile */}
            <div className='md:hidden space-y-4 p-4'>
              {ticketsData?.data?.tickets.map((ticket: SupportTicket) => (
                <div
                  key={ticket.ticketId}
                  className='bg-white p-4 rounded-lg shadow border border-gray-200'
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <h3 className='text-sm font-medium text-gray-900'>{ticket.subject}</h3>
                      <p className='text-xs text-gray-500'>#{ticket.ticketId.slice(0, 8)}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                        ticket.status
                      )}`}
                    >
                      {statusOptions.find(s => s.value === ticket.status)?.label}
                    </span>
                  </div>

                  <div className='mt-2 flex flex-wrap gap-2'>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
                        ticket.priority
                      )}`}
                    >
                      {priorityOptions.find(p => p.value === ticket.priority)?.label}
                    </span>
                    <span className='px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800'>
                      {ticket.category}
                    </span>
                  </div>

                  <div className='mt-2 flex justify-between items-center'>
                    <div>
                      <p className='text-xs text-gray-500'>শপ: {ticket.shopName || '-'}</p>
                      <p className='text-xs text-gray-500'>তারিখ: {formatDate(ticket.createdAt)}</p>
                    </div>
                    <NavLink
                      to={`/dashboard/support-tickets/${ticket.ticketId}`}
                      className='text-xs text-indigo-600 hover:text-indigo-900 font-medium'
                    >
                      বিস্তারিত
                    </NavLink>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {ticketsData?.data && (
              <div className='px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4'>
                <div className='text-xs sm:text-sm text-gray-500'>
                  Showing <span className='font-medium'>{(page - 1) * limit + 1}</span> to{' '}
                  <span className='font-medium'>
                    {Math.min(page * limit, ticketsData.data.total)}
                  </span>{' '}
                  of <span className='font-medium'>{ticketsData.data.total}</span> tickets
                </div>

                <div className='flex items-center space-x-2'>
                  {/* Previous Button */}
                  <button
                    onClick={() => page > 1 && setPage(page - 1)}
                    disabled={page === 1}
                    className={`px-3 py-1 rounded-md border ${
                      page > 1
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {Array.from(
                    { length: Math.min(5, Math.ceil(ticketsData.data.total / limit)) },
                    (_, i) => {
                      let pageNum
                      if (Math.ceil((ticketsData?.data?.total ?? 0) / limit) <= 5) {
                        pageNum = i + 1
                      } else if (page <= 3) {
                        pageNum = i + 1
                      } else if (page >= Math.ceil((ticketsData?.data?.total ?? 0) / limit) - 2) {
                        pageNum = Math.ceil((ticketsData?.data?.total ?? 0) / limit) - 4 + i
                      } else {
                        pageNum = page - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-1 rounded-md border ${
                            page === pageNum
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    }
                  )}

                  {/* Next Button */}
                  <button
                    onClick={() =>
                      page < Math.ceil((ticketsData?.data?.total ?? 0) / limit) && setPage(page + 1)
                    }
                    disabled={page === Math.ceil((ticketsData?.data?.total ?? 0) / limit)}
                    className={`px-3 py-1 rounded-md border ${
                      page < Math.ceil(ticketsData.data.total / limit)
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default AdminSupportTickets
