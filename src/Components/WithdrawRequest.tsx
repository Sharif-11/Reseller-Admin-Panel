import { useEffect, useState } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { walletApiService, type Wallet } from '../Api/wallet.api'
import withdrawApi from '../Api/withdraw.api'

interface WithdrawRequest {
  withdrawId: string
  userId: string
  userPhoneNo: string
  userName: string
  amount: number
  transactionFee: number
  walletName: 'bKash' | 'Nagad'
  walletPhoneNo: string
  transactionId: string | null
  systemWalletPhoneNo: string | null
  remarks: string | null
  requestedAt: string
  processedAt: string | null
  withdrawStatus: 'PENDING' | 'COMPLETED' | 'REJECTED'
}

interface PaginationState {
  currentPage: number
  totalPages: number
  totalRequests: number
  pageSize: number
}

const AdminWithdrawRequests = () => {
  const [requests, setRequests] = useState<WithdrawRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalRequests: 0,
    pageSize: 10,
  })
  const [selectedRequest, setSelectedRequest] = useState<WithdrawRequest | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null)
  const [formData, setFormData] = useState({
    transactionId: '',
    systemWalletPhoneNo: '',
    remarks: '',
  })
  const [systemWallets, setSystemWallets] = useState<Wallet[]>([])
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'COMPLETED' | 'REJECTED'>('PENDING')
  const [copied, setCopied] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCustomWalletInput, setShowCustomWalletInput] = useState(false)

  const calculateActualAmount = (amount: number, fee: number) => {
    return (amount - fee).toFixed(2)
  }

  const fetchRequests = async (page = 1, pageSize = pagination.pageSize) => {
    try {
      setLoading(true)
      setError(null)
      const response = await withdrawApi.getAllWithdraws({
        status: statusFilter,
        page,
        limit: pageSize,
        search: searchTerm,
      })

      if (response.success && response.data) {
        setRequests(response.data.withdraws)
        setPagination({
          currentPage: response.data.currentPage,
          totalPages: response.data.totalPages,
          totalRequests: response.data.totalWithdraws,
          pageSize: response.data.pageSize,
        })
      } else {
        setError(response.message || 'Failed to load withdraw requests')
      }
    } catch (err) {
      setError('Error fetching withdraw requests')
      console.error('Error fetching withdraw requests:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSystemWallets = async () => {
    try {
      // Assuming you have an API endpoint to fetch system wallets
      const response = await walletApiService.getSystemWallets()
      if (response.success && response.data) {
        setSystemWallets(response.data)
      }
    } catch (err) {
      console.error('Error fetching system wallets:', err)
    }
  }

  const handleReload = () => {
    fetchRequests(pagination.currentPage)
  }

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value)
    setPagination(prev => ({
      ...prev,
      pageSize: newPageSize,
    }))
    fetchRequests(1, newPageSize)
  }

  useEffect(() => {
    fetchRequests()
    fetchSystemWallets()
  }, [statusFilter, searchTerm])

  const handleActionClick = (request: WithdrawRequest, type: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setActionType(type)
    setFormData({
      transactionId: '',
      systemWalletPhoneNo: '',
      remarks: '',
    })
    setShowCustomWalletInput(false)
  }

  const closeModal = () => {
    setSelectedRequest(null)
    setActionType(null)
    setError(null)
  }

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleApprove = async () => {
    if (!selectedRequest) return

    try {
      setProcessing(true)
      setError(null)

      if (!formData.transactionId) {
        setError('Transaction ID is required')
        return
      }

      if (!formData.systemWalletPhoneNo) {
        setError('System wallet phone number is required')
        return
      }

      const response = await withdrawApi.approveWithdraw({
        withdrawId: selectedRequest.withdrawId,
        systemWalletPhoneNo: formData.systemWalletPhoneNo,
        transactionId: formData.transactionId,
      })

      if (response.success) {
        closeModal()
        await fetchRequests(pagination.currentPage)
      } else {
        setError(response.message || 'Failed to approve request')
      }
    } catch (err) {
      setError('Error approving withdraw request')
      console.error('Error approving withdraw request:', err)
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest) return

    try {
      setProcessing(true)
      setError(null)

      const response = await withdrawApi.rejectWithdraw({
        withdrawId: selectedRequest.withdrawId,
        remarks: formData.remarks || undefined,
      })

      if (response.success) {
        closeModal()
        await fetchRequests(pagination.currentPage)
      } else {
        setError(response.message || 'Failed to reject request')
      }
    } catch (err) {
      setError('Error rejecting withdraw request')
      console.error('Error rejecting withdraw request:', err)
    } finally {
      setProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'

    switch (status) {
      case 'COMPLETED':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Completed</span>
      case 'REJECTED':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rejected</span>
      default:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Pending</span>
    }
  }

  const handleCopy = (_text: string, field: string) => {
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }
    return new Date(dateString).toLocaleString('en-US', options)
  }

  return (
    <div className='px-4 py-6 max-w-6xl mx-auto'>
      {/* Header and Reload Button */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4'>
        <h1 className='text-xl font-bold md:text-2xl'>Withdraw Requests</h1>
        <div className='flex items-center justify-center gap-3'>
          <button
            onClick={handleReload}
            className='flex items-center text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded hover:bg-blue-100'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-4 w-4 mr-1'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
              />
            </svg>
            Reload
          </button>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className='mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <div className='flex border-b'>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              statusFilter === 'PENDING'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setStatusFilter('PENDING')}
          >
            Pending
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              statusFilter === 'COMPLETED'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setStatusFilter('COMPLETED')}
          >
            Completed
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              statusFilter === 'REJECTED'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => setStatusFilter('REJECTED')}
          >
            Rejected
          </button>
        </div>

        <div className='flex items-center gap-2'>
          <div className='relative'>
            <input
              type='text'
              placeholder='Search by phone or transaction ID'
              className='pl-8 pr-4 py-2 border rounded-md text-sm w-full md:w-64'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <svg
              className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
              />
            </svg>
          </div>

          <select
            value={pagination.pageSize}
            onChange={handlePageSizeChange}
            className='border rounded-md px-2 py-2 text-sm'
          >
            <option value='5'>5 per page</option>
            <option value='10'>10 per page</option>
            <option value='20'>20 per page</option>
            <option value='50'>50 per page</option>
          </select>
        </div>
      </div>

      {error && <div className='mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm'>{error}</div>}

      {loading ? (
        <div className='flex justify-center items-center h-64'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
        </div>
      ) : requests.length === 0 ? (
        <div className='bg-white rounded-lg shadow p-6 text-center'>
          <p className='text-gray-500'>No {statusFilter.toLowerCase()} withdraw requests found</p>
        </div>
      ) : (
        <>
          {/* Mobile View - Cards */}
          <div className='md:hidden space-y-3'>
            {requests.map(request => (
              <div key={request.withdrawId} className='border rounded-lg p-3 bg-white'>
                <div className='flex justify-between items-start'>
                  <div>
                    <p className='text-xs text-gray-500'>{formatDate(request.requestedAt)}</p>
                    <h3 className='text-sm font-medium'>{request.userName}</h3>
                    <p className='text-xs text-gray-500'>{request.userPhoneNo}</p>
                  </div>
                  <div>{getStatusBadge(request.withdrawStatus)}</div>
                </div>

                <div className='mt-2'>
                  <div className='flex items-center'>
                    <p className='text-xs text-gray-500 mr-1'>Wallet:</p>
                    <p className='text-xs font-medium'>{request.walletName}</p>
                  </div>
                  <CopyToClipboard
                    text={request.walletPhoneNo}
                    onCopy={() => handleCopy(request.walletPhoneNo, 'wallet')}
                  >
                    <div className='flex items-center mt-1'>
                      <p className='text-xs text-gray-500 mr-1'>Phone:</p>
                      <p className='text-xs font-medium'>{request.walletPhoneNo}</p>
                      <span className='ml-1 text-xs text-blue-500 cursor-pointer'>
                        {copied === 'wallet' ? 'Copied!' : 'Copy'}
                      </span>
                    </div>
                  </CopyToClipboard>
                </div>

                <div className='mt-2 space-y-1'>
                  <div className='flex justify-between'>
                    <p className='text-xs text-gray-500'>Amount:</p>
                    <p className='text-xs font-medium'>{request.amount}৳</p>
                  </div>
                  <div className='flex justify-between'>
                    <p className='text-xs text-gray-500'>Fee:</p>
                    <p className='text-xs font-medium'>{request.transactionFee}৳</p>
                  </div>
                  <div className='flex justify-between'>
                    <p className='text-xs text-gray-500'>Actual Amount:</p>
                    <CopyToClipboard
                      text={calculateActualAmount(request.amount, request.transactionFee)}
                      onCopy={() =>
                        handleCopy(
                          calculateActualAmount(request.amount, request.transactionFee),
                          'actual'
                        )
                      }
                    >
                      <div className='flex items-center'>
                        <p className='text-xs font-medium'>
                          {calculateActualAmount(request.amount, request.transactionFee)}৳
                        </p>
                        <span className='ml-1 text-xs text-blue-500 cursor-pointer'>
                          {copied === 'actual' ? 'Copied!' : 'Copy'}
                        </span>
                      </div>
                    </CopyToClipboard>
                  </div>
                </div>

                {request.withdrawStatus === 'PENDING' ? (
                  <div className='mt-3 grid grid-cols-2 gap-2'>
                    <button
                      onClick={() => handleActionClick(request, 'approve')}
                      className='w-full py-1 px-2 bg-green-50 text-green-600 rounded text-xs font-medium'
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleActionClick(request, 'reject')}
                      className='w-full py-1 px-2 bg-red-50 text-red-600 rounded text-xs font-medium'
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <div className='mt-2'>
                    <div className='text-xs text-gray-500'>
                      Processed: {request.processedAt ? formatDate(request.processedAt) : 'N/A'}
                    </div>
                    {request.transactionId && (
                      <div className='mt-1 flex items-center'>
                        <p className='text-xs text-gray-500 mr-1'>Transaction ID:</p>
                        <p className='text-xs font-medium'>{request.transactionId}</p>
                      </div>
                    )}
                    {request.systemWalletPhoneNo && (
                      <div className='mt-1 flex items-center'>
                        <p className='text-xs text-gray-500 mr-1'>System Wallet:</p>
                        <p className='text-xs font-medium'>{request.systemWalletPhoneNo}</p>
                      </div>
                    )}
                    {request.remarks && (
                      <div className='mt-1'>
                        <p className='text-xs text-gray-500'>Remarks:</p>
                        <p className='text-xs font-medium'>{request.remarks}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className='hidden md:block bg-white rounded-lg shadow overflow-hidden'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    User
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Wallet
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Fee
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Actual Amount
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Processed
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {requests.map(request => (
                  <tr key={request.withdrawId}>
                    <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {formatDate(request.requestedAt)}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>{request.userName}</div>
                      <div className='text-sm text-gray-500'>{request.userPhoneNo}</div>
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>{request.walletName}</div>
                      <CopyToClipboard
                        text={request.walletPhoneNo}
                        onCopy={() => handleCopy(request.walletPhoneNo, 'wallet')}
                      >
                        <div className='flex items-center'>
                          <div className='text-sm text-gray-500'>{request.walletPhoneNo}</div>
                          <span className='ml-1 text-xs text-blue-500 cursor-pointer'>
                            {copied === 'wallet' ? 'Copied!' : 'Copy'}
                          </span>
                        </div>
                      </CopyToClipboard>
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-900'>
                      {request.amount}৳
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {request.transactionFee}৳
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-medium'>
                      <CopyToClipboard
                        text={calculateActualAmount(request.amount, request.transactionFee)}
                        onCopy={() =>
                          handleCopy(
                            calculateActualAmount(request.amount, request.transactionFee),
                            'actual'
                          )
                        }
                      >
                        <div className='flex items-center'>
                          {calculateActualAmount(request.amount, request.transactionFee)}৳
                          <span className='ml-1 text-xs text-blue-500 cursor-pointer'>
                            {copied === 'actual' ? 'Copied!' : 'Copy'}
                          </span>
                        </div>
                      </CopyToClipboard>
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap'>
                      {getStatusBadge(request.withdrawStatus)}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {request.processedAt ? formatDate(request.processedAt) : 'N/A'}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap text-sm font-medium'>
                      {request.withdrawStatus === 'PENDING' ? (
                        <div className='flex space-x-2'>
                          <button
                            onClick={() => handleActionClick(request, 'approve')}
                            className='text-green-600 hover:text-green-900'
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleActionClick(request, 'reject')}
                            className='text-red-600 hover:text-red-900'
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <div className='space-y-1'>
                          {request.transactionId && (
                            <div className='text-xs'>
                              <span className='text-gray-500'>Transaction ID: </span>
                              {request.transactionId}
                            </div>
                          )}
                          {request.systemWalletPhoneNo && (
                            <div className='text-xs'>
                              <span className='text-gray-500'>System Wallet: </span>
                              {request.systemWalletPhoneNo}
                            </div>
                          )}
                          {request.remarks && (
                            <div className='text-xs'>
                              <span className='text-gray-500'>Remarks: </span>
                              {request.remarks}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className='mt-4 flex flex-col sm:flex-row justify-between items-center gap-3'>
              <div className='text-sm text-gray-500'>
                Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRequests)}{' '}
                of {pagination.totalRequests} requests
              </div>

              <div className='flex items-center gap-2'>
                <button
                  onClick={() => fetchRequests(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className='px-3 py-1 border rounded text-sm disabled:opacity-50'
                >
                  Previous
                </button>
                <span className='text-sm'>
                  Page {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => fetchRequests(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className='px-3 py-1 border rounded text-sm disabled:opacity-50'
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Action Modal */}
      {actionType && selectedRequest && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-lg w-full max-w-md'>
            <div className='p-4 border-b'>
              <h2 className='text-lg font-medium'>
                {actionType === 'approve' ? 'Approve Withdraw' : 'Reject Withdraw'}
              </h2>
            </div>

            <div className='p-4 space-y-4'>
              {error && (
                <div className='p-2 bg-red-100 text-red-700 rounded-md text-sm'>{error}</div>
              )}

              {actionType === 'approve' && (
                <>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Transaction ID *
                    </label>
                    <input
                      type='text'
                      name='transactionId'
                      value={formData.transactionId}
                      onChange={handleFormChange}
                      className='w-full px-3 py-2 border rounded-md text-sm'
                      required
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      System Wallet Phone Number *
                    </label>
                    <select
                      name='systemWalletPhoneNo'
                      value={formData.systemWalletPhoneNo}
                      onChange={e => {
                        if (e.target.value === 'custom') {
                          setShowCustomWalletInput(true)
                          setFormData(prev => ({ ...prev, systemWalletPhoneNo: '' }))
                        } else {
                          setShowCustomWalletInput(false)
                          setFormData(prev => ({ ...prev, systemWalletPhoneNo: e.target.value }))
                        }
                      }}
                      className='w-full px-3 py-2 border rounded-md text-sm'
                      required
                    >
                      <option value='default'>Select a wallet</option>
                      {systemWallets.map(wallet => (
                        <option key={wallet.walletId} value={wallet.walletPhoneNo}>
                          {wallet.walletPhoneNo} ({wallet.walletName})
                        </option>
                      ))}
                      <option value='custom'>Enter custom number</option>
                    </select>

                    {showCustomWalletInput && (
                      <div className='mt-2'>
                        <input
                          type='text'
                          name='systemWalletPhoneNo'
                          value={formData.systemWalletPhoneNo}
                          onChange={handleFormChange}
                          placeholder='Enter wallet phone number'
                          className='w-full px-3 py-2 border rounded-md text-sm'
                          required
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-1'>
                  Remarks {actionType === 'approve' ? '(Optional)' : ''}
                </label>
                <textarea
                  name='remarks'
                  value={formData.remarks}
                  onChange={handleFormChange}
                  className='w-full px-3 py-2 border rounded-md text-sm'
                  rows={3}
                />
              </div>
            </div>

            <div className='p-4 border-t flex justify-end space-x-2'>
              <button
                onClick={closeModal}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={actionType === 'approve' ? handleApprove : handleReject}
                className='px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50'
                disabled={processing}
              >
                {processing ? 'Processing...' : actionType === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminWithdrawRequests
