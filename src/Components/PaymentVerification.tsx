import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { paymentAPI } from '../Api/payment.api'

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface Payment {
  paymentId: string
  paymentDate: string
  processedAt: string | null
  paymentStatus: 'PENDING' | 'COMPLETED' | 'REJECTED'
  paymentType: 'DUE_PAYMENT' | 'ORDER_PAYMENT' | 'WITHDRAWAL_PAYMENT'
  sender: 'SELLER' | 'SYSTEM' | 'CUSTOMER'
  systemWalletName: string | null
  systemWalletPhoneNo: string
  userWalletName: string
  userWalletPhoneNo: string
  userName: string
  userPhoneNo: string
  transactionId: string | null
  amount: number
  transactionFee: number | null
  actualAmount: number | null
  remarks: string | null
  orderId: number | null
}

type PaymentStatus = 'all' | 'PENDING' | 'COMPLETED' | 'REJECTED'

const AdminPaymentVerification = () => {
  const [allPayments, setAllPayments] = useState<Payment[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [actionType, setActionType] = useState<'verify' | 'reject' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verificationData, setVerificationData] = useState({
    transactionId: '',
    remarks: '',
  })
  const [processing, setProcessing] = useState(false)
  const [activeTab, setActiveTab] = useState<PaymentStatus>('PENDING')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [filters, setFilters] = useState({
    transactionId: '',
    phoneNo: '',
    search: '',
  })

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const response = await paymentAPI.getAllPaymentsForAdmin({
        paymentStatus: activeTab === 'all' ? undefined : activeTab,
        page: pagination.page,
        limit: pagination.limit,
        transactionId: filters.transactionId,
        search: filters.search,
      })

      if (response.success && response.data) {
        setAllPayments(response.data.payments)
        setPagination(prev => ({
          ...prev,
          total: response.data.totalCount,
          totalPages: response.data.totalPages,
        }))
      } else {
        toast.error(response.message || 'Failed to load payments')
      }
    } catch (error) {
      toast.error('An error occurred while fetching payments')
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [activeTab, pagination.page, filters])

  const handleVerifyClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setError(null)
    setActionType('verify')
    setVerificationData({
      transactionId: payment.transactionId || '',
      remarks: '',
    })
  }

  const handleRejectClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setError(null)
    setActionType('reject')
    setVerificationData({
      transactionId: '',
      remarks: '',
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setVerificationData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async () => {
    if (!selectedPayment) return

    try {
      setProcessing(true)
      setError(null)

      if (actionType === 'verify') {
        if (!verificationData.transactionId) {
          setError('Transaction ID is required')
          return
        }

        const response = await paymentAPI.verifyPayment({
          paymentId: selectedPayment.paymentId,
          transactionId: verificationData.transactionId,
        })

        if (response?.success) {
          toast.success('Payment verified successfully')
          fetchPayments()
          closeModal()
        } else {
          throw new Error(response?.message || 'Failed to verify payment')
        }
      } else if (actionType === 'reject') {
        const response = await paymentAPI.rejectPayment({
          paymentId: selectedPayment.paymentId,
          remarks: verificationData.remarks,
        })

        if (response.success) {
          toast.success('Payment rejected successfully')
          fetchPayments()
          closeModal()
        } else {
          throw new Error(response.message || 'Failed to reject payment')
        }
      }
    } catch (error) {
      setError((error as Error).message || 'An error occurred')
    } finally {
      setProcessing(false)
    }
  }

  const closeModal = () => {
    setSelectedPayment(null)
    setActionType(null)
    setVerificationData({
      transactionId: '',
      remarks: '',
    })
  }

  const getPaymentTypeText = (type: string) => {
    switch (type) {
      case 'DUE_PAYMENT':
        return 'Due Payment'
      case 'ORDER_PAYMENT':
        return 'Order Payment'
      case 'WITHDRAWAL_PAYMENT':
        return 'Withdrawal Payment'
      default:
        return type
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className='px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'>
            Pending
          </span>
        )
      case 'COMPLETED':
        return (
          <span className='px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
            Completed
          </span>
        )
      case 'REJECTED':
        return (
          <span className='px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800'>
            Rejected
          </span>
        )
      default:
        return (
          <span className='px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
            {status}
          </span>
        )
    }
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const renderWalletFlow = (payment: Payment) => {
    const senderWallet =
      payment.sender === 'SELLER'
        ? `${payment.userWalletName} (${payment.userWalletPhoneNo})`
        : `${payment.userWalletName} (${payment.systemWalletPhoneNo})`

    const receiverWallet =
      payment.sender === 'SELLER'
        ? `${payment.userWalletName} (${payment.systemWalletPhoneNo})`
        : `${payment.userWalletName} (${payment.userWalletPhoneNo})`

    return (
      <div className='flex items-center text-xs'>
        <div className='text-[10px] font-medium text-gray-700'>{senderWallet}</div>
        <div className='mx-1 flex items-center text-xs'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-4 w-4 text-gray-500 text-[10px]'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M13 5l7 7-7 7M5 5l7 7-7 7'
            />
          </svg>
        </div>
        <div className='text-[10px] font-medium text-gray-700'>{receiverWallet}</div>
      </div>
    )
  }

  const copyToClipboard = (text: string | null) => {
    if (!text) return
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const resetFilters = () => {
    setFilters({
      transactionId: '',
      phoneNo: '',
      search: '',
    })
  }

  return (
    <div className='px-4 py-6 max-w-6xl mx-auto'>
      <h1 className='text-xl font-bold mb-4 md:text-2xl md:mb-6'>Payment Management</h1>

      {/* Tabs and Filters */}
      <div className='mb-6 text-xs'>
        <div className='border-b border-gray-200 mb-4'>
          <nav className='-mb-px flex space-x-4'>
            <button
              onClick={() => {
                setActiveTab('all')
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setActiveTab('PENDING')
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs ${
                activeTab === 'PENDING'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => {
                setActiveTab('COMPLETED')
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs ${
                activeTab === 'COMPLETED'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => {
                setActiveTab('REJECTED')
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-xs ${
                activeTab === 'REJECTED'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Rejected
            </button>
          </nav>
        </div>

        <div className='flex justify-end mb-2'>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className='px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200'
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className='bg-white p-4 rounded-lg shadow mb-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Transaction ID
                </label>
                <input
                  type='text'
                  name='transactionId'
                  value={filters.transactionId}
                  onChange={handleFilterChange}
                  placeholder='Search by transaction ID'
                  className='w-full px-3 py-1.5 border rounded-md text-sm'
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Search</label>
                <input
                  type='text'
                  name='search'
                  value={filters.search}
                  onChange={handleFilterChange}
                  placeholder='Search by name or phone number'
                  className='w-full px-3 py-1.5 border rounded-md text-sm'
                />
              </div>
              <div className='flex items-end'>
                <button
                  onClick={resetFilters}
                  className='px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200'
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>
        )}

        <div className='flex justify-between items-center'>
          <div className='text-sm text-gray-500'>Total Payments: {pagination.total}</div>
          <div className='flex items-center space-x-2'>
            <label htmlFor='limit' className='text-sm text-gray-500'>
              Per page:
            </label>
            <select
              id='limit'
              value={pagination.limit}
              onChange={e => {
                setPagination(prev => ({
                  ...prev,
                  limit: Number(e.target.value),
                  page: 1,
                }))
              }}
              className='border rounded-md px-2 py-1 text-sm'
            >
              <option value='10'>10</option>
              <option value='25'>25</option>
              <option value='50'>50</option>
              <option value='100'>100</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className='flex justify-center items-center h-64'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
        </div>
      ) : allPayments.length === 0 ? (
        <div className='bg-white rounded-lg shadow p-6 text-center'>
          <p className='text-gray-500'>No payments found</p>
        </div>
      ) : (
        <div className='bg-white rounded-lg shadow overflow-hidden'>
          {/* Desktop View - Table */}
          <div className='hidden md:block overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200 text-sm'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                    Type
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                    Wallet Transaction
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                    Transaction ID
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  {activeTab === 'PENDING' && (
                    <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {allPayments.map(payment => (
                  <tr key={payment.paymentId}>
                    <td className='px-4 py-4 whitespace-nowrap text-gray-500'>
                      {formatDate(payment.paymentDate)}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap'>
                      <div className='font-medium text-gray-900'>
                        {getPaymentTypeText(payment.paymentType)}
                      </div>
                      <div className='text-gray-500 text-xs mt-1'>
                        {payment.sender === 'SELLER' ? 'Seller to Admin' : 'Admin to Seller'}
                      </div>
                    </td>
                    <td className='px-4 py-4'>{renderWalletFlow(payment)}</td>
                    <td className='px-4 py-4 whitespace-nowrap text-gray-900'>
                      <div className='font-medium'>{payment.amount}৳</div>
                      {payment.transactionFee && (
                        <div className='text-xs text-gray-500'>Fee: {payment.transactionFee}৳</div>
                      )}
                      {payment.actualAmount && (
                        <div className='text-xs text-gray-500'>Net: {payment.actualAmount}৳</div>
                      )}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap'>
                      {payment.transactionId ? (
                        <div className='flex items-center'>
                          <span className='font-mono text-sm'>{payment.transactionId}</span>
                          <button
                            onClick={() => copyToClipboard(payment.transactionId)}
                            className='ml-2 text-blue-500 hover:text-blue-700'
                            title='Copy'
                          >
                            <svg
                              xmlns='http://www.w3.org/2000/svg'
                              className='h-4 w-4'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3'
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <span className='text-gray-400'>N/A</span>
                      )}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap'>
                      {getStatusBadge(payment.paymentStatus)}
                      {payment.processedAt && (
                        <div className='text-xs text-gray-500 mt-1'>
                          {formatDate(payment.processedAt)}
                        </div>
                      )}
                    </td>
                    {payment.paymentStatus === 'PENDING' && (
                      <td className='px-4 py-4 whitespace-nowrap font-medium'>
                        <div className='flex gap-2'>
                          <button
                            onClick={() => handleVerifyClick(payment)}
                            className='text-green-600 hover:text-green-800 text-xs'
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleRejectClick(payment)}
                            className='text-red-600 hover:text-red-800 text-xs'
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View - Cards */}
          <div className='md:hidden space-y-3 p-3'>
            {allPayments.map(payment => (
              <div key={payment.paymentId} className='border rounded-lg p-3 text-xs'>
                <div className='flex justify-between items-start'>
                  <div>
                    <p className='text-gray-500'>{formatDate(payment.paymentDate)}</p>
                    <h3 className='font-medium'>{getPaymentTypeText(payment.paymentType)}</h3>
                    <p className='text-gray-500 text-xs mt-1'>
                      {payment.sender === 'SELLER' ? 'Seller to Admin' : 'Admin to Seller'}
                    </p>
                  </div>
                  {getStatusBadge(payment.paymentStatus)}
                </div>

                <div className='mt-3'>{renderWalletFlow(payment)}</div>

                <div className='mt-2 grid grid-cols-2 gap-2'>
                  <div>
                    <p className='text-gray-500'>Amount:</p>
                    <p className='font-medium'>{payment.amount}৳</p>
                    {payment.transactionFee && (
                      <p className='text-gray-500 text-xs'>Fee: {payment.transactionFee}৳</p>
                    )}
                    {payment.actualAmount && (
                      <p className='text-gray-500 text-xs'>Net: {payment.actualAmount}৳</p>
                    )}
                  </div>
                  <div>
                    <p className='text-gray-500'>Transaction ID:</p>
                    {payment.transactionId ? (
                      <div className='flex items-center'>
                        <span className='font-mono'>{payment.transactionId}</span>
                        <button
                          onClick={() => copyToClipboard(payment.transactionId)}
                          className='ml-1 text-blue-500'
                          title='Copy'
                        >
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            className='h-3 w-3'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3'
                            />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <p className='text-gray-400'>N/A</p>
                    )}
                  </div>
                </div>

                <div className='mt-2'>
                  <p className='text-gray-500'>Processed:</p>
                  <p className='text-gray-500'>
                    {payment.processedAt ? formatDate(payment.processedAt) : 'Pending'}
                  </p>
                </div>

                {payment.paymentStatus === 'PENDING' && (
                  <div className='mt-3 grid grid-cols-2 gap-2'>
                    <button
                      onClick={() => handleVerifyClick(payment)}
                      className='py-1 px-2 bg-green-50 text-green-600 rounded font-medium'
                    >
                      Verify
                    </button>
                    <button
                      onClick={() => handleRejectClick(payment)}
                      className='py-1 px-2 bg-red-50 text-red-600 rounded font-medium'
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className='px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6'>
              <div className='flex-1 flex justify-between sm:hidden'>
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Next
                </button>
              </div>
              <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
                <div>
                  <p className='text-sm text-gray-700'>
                    Showing{' '}
                    <span className='font-medium'>
                      {(pagination.page - 1) * pagination.limit + 1}
                    </span>{' '}
                    to{' '}
                    <span className='font-medium'>
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>{' '}
                    of <span className='font-medium'>{pagination.total}</span> results
                  </p>
                </div>
                <div>
                  <nav
                    className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'
                    aria-label='Pagination'
                  >
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <span className='sr-only'>Previous</span>
                      <svg
                        className='h-5 w-5'
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                        aria-hidden='true'
                      >
                        <path
                          fillRule='evenodd'
                          d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </button>
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i
                      } else {
                        pageNum = pagination.page - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <span className='sr-only'>Next</span>
                      <svg
                        className='h-5 w-5'
                        xmlns='http://www.w3.org/2000/svg'
                        viewBox='0 0 20 20'
                        fill='currentColor'
                        aria-hidden='true'
                      >
                        <path
                          fillRule='evenodd'
                          d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Verification Modal */}
      {selectedPayment && actionType === 'verify' && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-lg w-full max-w-md'>
            <div className='p-4 border-b'>
              <h2 className='text-lg font-medium'>Verify Payment</h2>
            </div>

            <div className='p-4 space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium text-gray-700'>User:</p>
                  <p className='mt-1 text-gray-900'>
                    {selectedPayment.userName} ({selectedPayment.userPhoneNo})
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-700'>Type:</p>
                  <p className='mt-1 text-gray-900'>
                    {getPaymentTypeText(selectedPayment.paymentType)}
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm font-medium text-gray-700'>Wallet Transaction:</p>
                  <div className='mt-1'>{renderWalletFlow(selectedPayment)}</div>
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-700'>Amount:</p>
                  <p className='mt-1 text-gray-900'>{selectedPayment.amount}৳</p>
                </div>
              </div>
              {error && (
                <div className='bg-red-50 p-3 rounded-md text-red-800 text-sm font-medium'>
                  {error}
                </div>
              )}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Transaction ID *
                </label>
                <input
                  type='text'
                  name='transactionId'
                  onChange={handleInputChange}
                  placeholder='Enter transaction ID'
                  className='w-full px-3 py-1.5 border rounded-md text-sm'
                  required
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Remarks (Optional)
                </label>
                <textarea
                  name='remarks'
                  value={verificationData.remarks}
                  onChange={handleInputChange}
                  placeholder='Enter remarks'
                  rows={3}
                  className='w-full px-3 py-1.5 border rounded-md text-sm'
                />
              </div>
            </div>

            <div className='p-4 border-t flex justify-end gap-3'>
              <button
                onClick={closeModal}
                disabled={processing}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={processing || !verificationData.transactionId}
                className='px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50'
              >
                {processing ? 'Processing...' : 'Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedPayment && actionType === 'reject' && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-lg w-full max-w-md'>
            <div className='p-4 border-b'>
              <h2 className='text-lg font-medium text-red-600'>Reject Payment</h2>
            </div>

            <div className='p-4 space-y-4'>
              <div className='bg-red-50 p-3 rounded-md'>
                <div className='flex items-start'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='h-5 w-5 text-red-400'
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <h3 className='text-sm font-medium text-red-800'>
                      You are about to reject this payment
                    </h3>
                    <div className='mt-2 text-sm text-red-700'>
                      <p>
                        User: {selectedPayment.userName} ({selectedPayment.userPhoneNo})
                      </p>
                      <p className='mt-1'>Amount: {selectedPayment.amount}৳</p>
                      <p className='mt-1'>
                        Type: {getPaymentTypeText(selectedPayment.paymentType)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {error && (
                <div className='bg-red-50 p-3 rounded-md text-red-800 text-sm font-medium'>
                  {error}
                </div>
              )}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Reason (Optional)
                </label>
                <textarea
                  name='remarks'
                  value={verificationData.remarks}
                  onChange={handleInputChange}
                  placeholder='Enter rejection reason'
                  rows={3}
                  className='w-full px-3 py-1.5 border rounded-md text-sm'
                />
              </div>
            </div>

            <div className='p-4 border-t flex justify-end gap-3'>
              <button
                onClick={closeModal}
                disabled={processing}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={processing}
                className='px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50'
              >
                {processing ? 'Processing...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPaymentVerification
