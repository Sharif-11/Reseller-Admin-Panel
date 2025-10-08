import {
  CheckCircleIcon,
  CreditCardIcon,
  EnvelopeIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  ShieldExclamationIcon,
  UserCircleIcon,
  WalletIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { FaMinus, FaMoneyBillWave, FaPlus } from 'react-icons/fa'
import { authService } from '../Api/auth.api'
import { blockApiService, type BlockActionType } from '../Api/block.api'
import { transactionApi } from '../Api/transaction.api'
import { userManagementApiService, type User } from '../Api/user.api'

const SellerManagement = () => {
  // State management
  const [sellers, setSellers] = useState<User[]>([])
  const [filteredSellers, setFilteredSellers] = useState<User[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedSeller, setSelectedSeller] = useState<User | null>(null)
  const [activeModal, setActiveModal] = useState<'detail' | 'block' | 'message' | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const [userBlockActions, setUserBlockActions] = useState<BlockActionType[]>([])
  const [availableBlockActions, setAvailableBlockActions] = useState<BlockActionType[]>([])
  const [selectedActions, setSelectedActions] = useState<BlockActionType[]>([])
  const [pageSize, setPageSize] = useState(10)
  const [balanceModalOpen, setBalanceModalOpen] = useState(false)
  const [amountToAdd, setAmountToAdd] = useState('')
  const [amountToDeduct, setAmountToDeduct] = useState('')
  const [balanceNote, setBalanceNote] = useState('')
  const [processingBalance, setProcessingBalance] = useState(false)
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)

  // Fetch sellers
  const fetchSellers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await userManagementApiService.getAllUsers({
        page: currentPage,
        limit: pageSize,
        role: 'Seller',
        searchTerm,
      })

      if (response.success && response.data) {
        setSellers(response.data.users)
        setFilteredSellers(response.data.users)
        setTotalPages(Math.ceil(response.data.totalCount / pageSize))
      } else {
        setError(response.message || 'Failed to fetch sellers')
      }
    } catch (err) {
      setError('Failed to fetch sellers')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch all available block action types
  const fetchAvailableBlockActions = async () => {
    try {
      const response = await blockApiService.getAvailableBlockActionTypes()
      if (response.success && response.data) {
        setAvailableBlockActions(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch block action types:', err)
    }
  }

  // Fetch block actions for a specific user and set selected actions
  const fetchUserBlockActions = async (phoneNo: string) => {
    try {
      const response = await blockApiService.getUserBlockActions(phoneNo)
      if (response.success && response.data) {
        setUserBlockActions(response.data.actions)
        setSelectedActions(response.data.actions) // Set as default selected actions
      }
    } catch (err) {
      console.error('Failed to fetch user block actions:', err)
    }
  }

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }
  const openBalanceModal = (seller: User) => {
    setSelectedSeller(seller)
    setBalanceModalOpen(true)
  }

  const closeBalanceModal = () => {
    setBalanceModalOpen(false)
    setAmountToAdd('')
    setAmountToDeduct('')
    setBalanceNote('')
  }
  const openVerifyModal = (seller: User) => {
    setSelectedSeller(seller)
    setVerifyModalOpen(true)
  }

  const closeVerifyModal = () => {
    setVerifyModalOpen(false)
    setSelectedSeller(null)
  }
  const handleVerifySeller = async () => {
    if (!selectedSeller) return

    try {
      const response = await authService.verifySellerByAdmin(selectedSeller.phoneNo)

      if (response.success) {
        setSuccess(`Seller ${selectedSeller.name} has been verified successfully`)
        fetchSellers() // Refresh the list
        closeVerifyModal()
      } else {
        setError(response.message || 'Failed to verify seller')
      }
    } catch (err) {
      setError('Failed to verify seller')
    }
  }

  const handleAddBalance = async () => {
    if (!selectedSeller || !amountToAdd) return
    if (balanceNote.trim() === '') {
      setError('টাকা যোগ করার কারণ উল্লেখ করুন')
      return
    }
    setProcessingBalance(true)
    try {
      const response = await transactionApi.updateUserBalance({
        sellerId: selectedSeller.userId,
        amount: Number(amountToAdd),
        transactionType: 'add',
        reason: balanceNote,
      })

      if (response.success) {
        setSuccess(`Successfully added ${amountToAdd} TK to ${selectedSeller.name}'s balance`)
        fetchSellers() // Refresh the seller list
        closeBalanceModal()
      } else {
        setError(response.message || 'Failed to add balance')
      }
    } catch (err) {
      setError('Failed to add balance')
    } finally {
      setProcessingBalance(false)
    }
  }

  const handleDeductBalance = async () => {
    if (!selectedSeller || !amountToDeduct) return
    if (balanceNote.trim() === '') {
      setError('টাকা কাটার কারণ উল্লেখ করুন')
      return
    }
    setProcessingBalance(true)
    try {
      const response = await transactionApi.updateUserBalance({
        sellerId: selectedSeller.userId,
        amount: Number(amountToDeduct),
        transactionType: 'deduct',
        reason: balanceNote,
      })

      if (response.success) {
        setSuccess(
          `Successfully deducted ${amountToDeduct} TK from ${selectedSeller.name}'s balance`
        )
        fetchSellers() // Refresh the seller list
        closeBalanceModal()
      } else {
        setError(response.message || 'Failed to deduct balance')
      }
    } catch (err) {
      setError('Failed to deduct balance')
    } finally {
      setProcessingBalance(false)
    }
  }

  // Apply filters
  useEffect(() => {
    if (searchTerm) {
      const filtered = sellers.filter(
        seller =>
          seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          seller.phoneNo.includes(searchTerm) ||
          (seller.shopName && seller.shopName.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredSellers(filtered)
    } else {
      setFilteredSellers(sellers)
    }
  }, [searchTerm, sellers])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Handle block/unblock actions
  const handleBlockActions = async () => {
    if (!selectedSeller) return

    try {
      // Prepare actions to update - set active status based on selectedActions
      const actionsToUpdate = availableBlockActions.map(action => ({
        actionType: action,
        active: selectedActions.includes(action),
      }))

      const response = await blockApiService.updateBlockActions(
        selectedSeller.phoneNo,
        actionsToUpdate,
        'Updated by admin',
        null
      )

      if (response.success) {
        setSuccess('Block actions updated successfully')
        closeModal()
        fetchUserBlockActions(selectedSeller.phoneNo)
      } else {
        setError(response.message || 'Failed to update block actions')
      }
    } catch (err) {
      setError('Failed to update block actions')
    }
  }

  // Handle sending message
  const handleSendMessage = async () => {
    if (!selectedSeller || !messageContent.trim()) return

    try {
      // Here you would call your API to send the message
      // setSuccess(`Message sent to ${selectedSeller.name}`)
      const { success, message } = await authService.sendDirectMessage({
        userId: selectedSeller.userId,
        content: messageContent,
      })
      if (success) {
        setSuccess('Message sent successfully')
        closeModal()
        setMessageContent('')
      } else {
        setError(message || 'Failed to send message')
      }
    } catch (err) {
      setError('Failed to send message')
    }
  }

  // Toggle action selection
  const toggleAction = (action: BlockActionType) => {
    setSelectedActions(prev =>
      prev.includes(action) ? prev.filter(a => a !== action) : [...prev, action]
    )
  }

  // Modal handlers
  const openDetailsModal = (seller: User) => {
    setSelectedSeller(seller)
    setActiveModal('detail')
  }

  const openBlockModal = async (seller: User) => {
    setSelectedSeller(seller)
    await fetchUserBlockActions(seller.phoneNo)
    setActiveModal('block')
  }

  const openMessageModal = (seller: User) => {
    setSelectedSeller(seller)
    setActiveModal('message')
  }

  const closeModal = () => {
    setActiveModal(null)
    setSelectedSeller(null)
  }

  // Initialize
  useEffect(() => {
    fetchSellers()
    fetchAvailableBlockActions()
  }, [currentPage, pageSize, searchTerm])

  // Close messages after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccess(null)
      setError(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [success, error])

  return (
    <div className='min-h-screen bg-gray-50 p-4 md:p-6'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Seller Management</h1>
        <p className='text-gray-600'>Manage all registered sellers in the platform</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className='mb-4 rounded-md bg-green-50 p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <CheckCircleIcon className='h-5 w-5 text-green-400' aria-hidden='true' />
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-green-800'>{success}</p>
            </div>
            <div className='ml-auto pl-3'>
              <button
                type='button'
                className='inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50'
                onClick={() => setSuccess(null)}
              >
                <XMarkIcon className='h-5 w-5' aria-hidden='true' />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className='mb-4 rounded-md bg-red-50 p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <ShieldExclamationIcon className='h-5 w-5 text-red-400' aria-hidden='true' />
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-red-800'>{error}</p>
            </div>
            <div className='ml-auto pl-3'>
              <button
                type='button'
                className='inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50'
                onClick={() => setError(null)}
              >
                <XMarkIcon className='h-5 w-5' aria-hidden='true' />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className='mb-4 flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
        <div className='relative flex-1'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
            <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
          </div>
          <input
            type='text'
            className='block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500'
            placeholder='Search sellers by name or phone number...'
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className='flex items-center space-x-2'>
          <select
            className='rounded-md border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500'
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>
      </div>

      {/* Mobile View - Card List */}
      <div className='sm:hidden space-y-3'>
        {isLoading ? (
          <div className='flex justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
          </div>
        ) : filteredSellers.length === 0 ? (
          <div className='rounded-lg bg-white p-4 shadow text-center'>
            {searchTerm ? 'No sellers found' : 'No sellers available'}
          </div>
        ) : (
          filteredSellers.map(seller => (
            <div key={seller.userId} className='rounded-lg bg-white p-4 shadow'>
              <div className='flex items-start space-x-3'>
                <div className='flex-shrink-0'>
                  {seller.profileImage ? (
                    <img
                      src={seller.profileImage}
                      alt={`${seller.name}'s profile`}
                      className='h-10 w-10 rounded-full object-cover'
                    />
                  ) : (
                    <UserCircleIcon className='h-10 w-10 text-gray-400' aria-hidden='true' />
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex justify-between'>
                    <h3 className='text-sm font-medium text-gray-900 truncate'>{seller.name}</h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        seller.isVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {seller.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                  <div className='mt-1 text-sm text-gray-500 truncate'>
                    <div className='flex items-center'>
                      <PhoneIcon className='mr-1 h-3.5 w-3.5' />
                      {seller.phoneNo}
                    </div>
                    <div className='mt-1 truncate'>{seller.shopName}</div>
                    <div className='mt-1 text-xs text-gray-400'>
                      {seller.upazilla}, {seller.zilla}
                    </div>
                  </div>
                </div>
              </div>
              <div className='mt-3 flex justify-end space-x-1'>
                <button
                  type='button'
                  onClick={() => openBlockModal(seller)}
                  className='inline-flex items-center rounded-md border border-gray-300 bg-white p-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                >
                  <ShieldExclamationIcon className='h-3.5 w-3.5' />
                </button>
                <button
                  type='button'
                  onClick={() => openMessageModal(seller)}
                  className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 p-1 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                >
                  <PaperAirplaneIcon className='h-3.5 w-3.5' />
                </button>
                <button
                  type='button'
                  onClick={() => openDetailsModal(seller)}
                  className='inline-flex items-center rounded-md border border-gray-300 bg-white p-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                >
                  <EyeIcon className='h-3.5 w-3.5' />
                </button>
                <button
                  onClick={() => openBalanceModal(seller)}
                  className='inline-flex items-center rounded-md border border-gray-300 bg-white p-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                >
                  <FaMoneyBillWave className='h-3.5 w-3.5' />
                </button>
                {!seller.isVerified && (
                  <button
                    type='button'
                    onClick={() => openVerifyModal(seller)}
                    className='inline-flex items-center rounded-md border border-transparent bg-green-600 p-1 text-xs font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                    title='Verify Seller'
                  >
                    <CheckCircleIcon className='h-3.5 w-3.5' />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View - Table */}
      <div className='hidden sm:block overflow-scroll rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Seller
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Contact
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Address
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Status
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {isLoading ? (
              <tr>
                <td colSpan={5} className='px-6 py-4 text-center'>
                  <div className='flex justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
                  </div>
                </td>
              </tr>
            ) : filteredSellers.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-6 py-4 text-center text-gray-500'>
                  {searchTerm ? 'No sellers found' : 'No sellers available'}
                </td>
              </tr>
            ) : (
              filteredSellers.map(seller => (
                <tr key={seller.userId} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0 h-10 w-10'>
                        {seller.profileImage ? (
                          <img
                            src={seller.profileImage}
                            alt={`${seller.name}'s profile`}
                            className='h-10 w-10 rounded-full object-cover'
                          />
                        ) : (
                          <UserCircleIcon className='h-10 w-10 text-gray-400' aria-hidden='true' />
                        )}
                      </div>
                      <div className='ml-4'>
                        <div className='text-sm font-medium text-gray-900'>{seller.name}</div>
                        <div className='text-sm text-gray-500'>{seller.shopName}</div>
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>
                      <div className='flex items-center'>
                        <PhoneIcon className='mr-1 h-4 w-4 text-gray-500' />
                        {seller.phoneNo}
                      </div>
                    </div>
                    {seller.email && (
                      <div className='text-sm text-gray-500'>
                        <div className='flex items-center'>
                          <EnvelopeIcon className='mr-1 h-4 w-4 text-gray-500' />
                          {seller.email}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className='px-6 py-4'>
                    <div className='text-sm text-gray-900'>{seller.address}</div>
                    <div className='text-sm text-gray-500'>
                      {seller.upazilla}, {seller.zilla}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        seller.isVerified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {seller.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='flex justify-end space-x-2'>
                      <button
                        onClick={() => openBlockModal(seller)}
                        className='text-indigo-600 hover:text-indigo-900'
                        title='Block Actions'
                      >
                        <ShieldExclamationIcon className='h-5 w-5' />
                      </button>
                      <button
                        onClick={() => openMessageModal(seller)}
                        className='text-green-600 hover:text-green-900'
                        title='Send Message'
                      >
                        <PaperAirplaneIcon className='h-5 w-5' />
                      </button>
                      <button
                        onClick={() => openDetailsModal(seller)}
                        className='text-blue-600 hover:text-blue-900'
                        title='View Details'
                      >
                        <EyeIcon className='h-5 w-5' />
                      </button>
                      <button
                        onClick={() => openBalanceModal(seller)}
                        className='text-yellow-600 hover:text-yellow-900'
                        title='Update Balance'
                      >
                        <FaMoneyBillWave className='h-5 w-5' />
                      </button>
                      {!seller.isVerified && (
                        <button
                          onClick={() => openVerifyModal(seller)}
                          className='text-green-600 hover:text-green-900'
                          title='Verify Seller'
                        >
                          <CheckCircleIcon className='h-5 w-5' />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className='mt-4 flex items-center justify-between'>
          {/* Mobile pagination */}
          <div className='flex flex-1 items-center justify-between sm:hidden'>
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className='relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Previous
            </button>
            <div className='text-sm text-gray-700'>
              Page <span className='font-medium'>{currentPage}</span> of{' '}
              <span className='font-medium'>{totalPages}</span>
            </div>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className='relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Next
            </button>
          </div>

          {/* Desktop pagination */}
          <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
            <div>
              <p className='text-sm text-gray-700'>
                Showing <span className='font-medium'>{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className='font-medium'>
                  {Math.min(currentPage * pageSize, filteredSellers.length)}
                </span>{' '}
                of <span className='font-medium'>{filteredSellers.length}</span> sellers
              </p>
            </div>
            <div>
              <nav
                className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'
                aria-label='Pagination'
              >
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
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
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
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

      {/* Seller Details Modal */}
      {activeModal === 'detail' && selectedSeller && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
            <div
              className='fixed inset-0 transition-opacity bg-black bg-opacity-50'
              aria-hidden='true'
              onClick={closeModal}
            ></div>

            <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-4xl mx-4 sm:my-8 sm:align-middle sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='flex justify-between items-start'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900'>Seller Details</h3>
                  <button
                    onClick={closeModal}
                    className='text-gray-400 hover:text-gray-500 focus:outline-none'
                  >
                    <XMarkIcon className='h-6 w-6' />
                  </button>
                </div>

                <div className='mt-4'>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <div>
                      <h4 className='text-sm font-medium text-gray-500'>Name</h4>
                      <p className='mt-1 text-sm text-gray-900'>{selectedSeller.name}</p>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-gray-500'>Phone</h4>
                      <p className='mt-1 text-sm text-gray-900'>{selectedSeller.phoneNo}</p>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-gray-500'>Balance</h4>
                      <p className='mt-1 text-sm text-gray-900'>{selectedSeller.balance} Tk.</p>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-gray-500'>Email</h4>
                      <p className='mt-1 text-sm text-gray-900'>{selectedSeller.email || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-gray-500'>Shop Name</h4>
                      <p className='mt-1 text-sm text-gray-900'>{selectedSeller.shopName}</p>
                    </div>
                    <div className='sm:col-span-2'>
                      <h4 className='text-sm font-medium text-gray-500'>Address</h4>
                      <p className='mt-1 text-sm text-gray-900'>{selectedSeller.address}</p>
                      <p className='mt-1 text-sm text-gray-900'>
                        {selectedSeller.upazilla}, {selectedSeller.zilla}
                      </p>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-gray-500'>Nominee Phone</h4>
                      <p className='mt-1 text-sm text-gray-900'>
                        {selectedSeller.nomineePhone || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-gray-500'>Referral Code</h4>
                      <p className='mt-1 text-sm text-gray-900'>
                        {selectedSeller.referralCode || 'N/A'}
                      </p>
                    </div>
                    <div className='sm:col-span-2'>
                      <h4 className='text-sm font-medium text-gray-500'>Facebook Profile</h4>
                      <p className='mt-1 text-sm text-gray-900'>
                        {selectedSeller.facebookProfileLink ? (
                          <a
                            href={selectedSeller.facebookProfileLink}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='text-indigo-600 hover:text-indigo-500'
                          >
                            {selectedSeller.facebookProfileLink}
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </p>
                    </div>
                    {/* we need to display the referrer information in another section (Name-Phone) within one line */}
                    {selectedSeller.referredBy && (
                      <div>
                        <h4 className='text-sm font-medium text-gray-500'>Referred By</h4>
                        <p className='mt-1 text-sm text-gray-900'>
                          {selectedSeller.referredBy ? selectedSeller.referredBy.name : 'N/A'}
                          {selectedSeller.referredBy
                            ? ` (${selectedSeller.referredBy.phoneNo})`
                            : ''}
                        </p>
                      </div>
                    )}
                    <div>
                      <h4 className='text-sm font-medium text-gray-500'>Status</h4>
                      <p className='mt-1 text-sm text-gray-900'>
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            selectedSeller.isVerified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {selectedSeller.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </p>
                    </div>
                    {selectedSeller.Wallet && selectedSeller.Wallet.length > 0 && (
                      <div className='sm:col-span-2'>
                        <div className='flex items-center gap-2 mb-3'>
                          <CreditCardIcon className='w-4 h-4 text-gray-400' />
                          <h4 className='text-sm font-semibold text-gray-700'>Payment Methods</h4>
                        </div>
                        <div className='space-y-2'>
                          {selectedSeller.Wallet.map(wallet => (
                            <div
                              key={wallet.walletId}
                              className='group flex justify-between items-center rounded-lg border border-gray-200 bg-white px-4 py-3 transition-all duration-200 hover:border-blue-200 hover:shadow-sm'
                            >
                              <div className='flex items-center gap-3'>
                                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-50'>
                                  <WalletIcon className='w-4 h-4 text-blue-600' />
                                </div>
                                <span className='font-medium text-gray-900'>
                                  {wallet.walletName}
                                </span>
                              </div>
                              <span className='text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded'>
                                {wallet.walletPhoneNo}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}{' '}
                    {selectedSeller._count?.referrals !== undefined && (
                      <div>
                        <h4 className='text-sm font-medium text-gray-500'>Total Referrals</h4>
                        <p className='mt-1 text-sm text-gray-900'>
                          {selectedSeller._count.referrals}{' '}
                          {selectedSeller._count.referrals === 1 ? 'User' : 'Users'}
                        </p>
                      </div>
                    )}
                    <div>
                      <h4 className='text-sm font-medium text-gray-500'>Joined On</h4>
                      <p className='mt-1 text-sm text-gray-900'>
                        {new Date(selectedSeller.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  type='button'
                  onClick={closeModal}
                  className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Actions Modal */}
      {activeModal === 'block' && selectedSeller && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt- px-4 pb-20 text-center sm:block sm:p-0'>
            <div
              className='fixed inset-0 transition-opacity bg-black bg-opacity-50'
              aria-hidden='true'
              onClick={closeModal}
            ></div>

            <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg mx-4 sm:my-8 sm:align-middle sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='flex justify-between items-start'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900'>
                    Manage Block Actions for {selectedSeller.name}
                  </h3>
                  <button
                    onClick={closeModal}
                    className='text-gray-400 hover:text-gray-500 focus:outline-none'
                  >
                    <XMarkIcon className='h-6 w-6' />
                  </button>
                </div>

                <div className='mt-4'>
                  <p className='text-sm text-gray-500'>
                    Select which actions to block for this seller:
                  </p>

                  <div className='mt-4 space-y-2'>
                    {availableBlockActions.map(action => (
                      <div key={action} className='flex items-center'>
                        <input
                          id={`action-${action}`}
                          name={`action-${action}`}
                          type='checkbox'
                          checked={selectedActions.includes(action)}
                          onChange={() => toggleAction(action)}
                          className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
                        />
                        <label
                          htmlFor={`action-${action}`}
                          className='ml-2 block text-sm text-gray-900'
                        >
                          <span className='font-medium capitalize'>{action.toLowerCase()}</span>
                          {userBlockActions.includes(action) && (
                            <span className='ml-2 text-xs text-red-500'>(Currently blocked)</span>
                          )}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  type='button'
                  onClick={handleBlockActions}
                  className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Save Changes
                </button>
                <button
                  type='button'
                  onClick={closeModal}
                  className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {activeModal === 'message' && selectedSeller && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
            <div
              className='fixed inset-0 transition-opacity bg-black bg-opacity-50'
              aria-hidden='true'
              onClick={closeModal}
            ></div>

            <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg mx-4 sm:my-8 sm:align-middle sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='flex justify-between items-start'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900'>
                    Send Message to {selectedSeller.name}
                  </h3>
                  <button
                    onClick={closeModal}
                    className='text-gray-400 hover:text-gray-500 focus:outline-none'
                  >
                    <XMarkIcon className='h-6 w-6' />
                  </button>
                </div>

                <div className='mt-4'>
                  <label htmlFor='message' className='block text-sm font-medium text-gray-700'>
                    Message
                  </label>
                  <textarea
                    id='message'
                    name='message'
                    rows={4}
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
                    placeholder='Type your message here...'
                    value={messageContent}
                    onChange={e => setMessageContent(e.target.value)}
                  />
                </div>
              </div>
              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  type='button'
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim()}
                  className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm'
                >
                  <PaperAirplaneIcon className='h-5 w-5 mr-2' />
                  Send Message
                </button>
                <button
                  type='button'
                  onClick={closeModal}
                  className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {balanceModalOpen && selectedSeller && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
            <div
              className='fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75'
              aria-hidden='true'
              onClick={closeBalanceModal}
            ></div>

            <div className='inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full'>
              <div className='bg-white px-6 py-5 sm:p-6'>
                <div className='flex justify-between items-center'>
                  <h3 className='text-2xl font-bold text-gray-900'>ব্যালেন্স আপডেট</h3>
                  <button
                    onClick={closeBalanceModal}
                    className='text-gray-400 hover:text-gray-500 focus:outline-none'
                  >
                    <XMarkIcon className='h-6 w-6' />
                  </button>
                </div>

                <div className='mt-6'>
                  <div className='bg-indigo-50 rounded-xl p-4 mb-6'>
                    <div className='flex items-center justify-between'>
                      <p className='text-sm font-medium text-indigo-800'>বর্তমান ব্যালেন্স</p>
                      <p className='text-sm font-semibold text-indigo-900'>
                        {selectedSeller.balance} টাকা
                      </p>
                    </div>
                  </div>

                  <div className='space-y-5'>
                    {/* Add Balance Section */}
                    <div className='border border-green-100 rounded-xl p-4 bg-green-50'>
                      <div className='flex items-center mb-3'>
                        <div className='bg-green-100 p-2 rounded-full mr-3'>
                          <FaPlus className='text-green-600 h-4 w-4' />
                        </div>
                        <h4 className='text-base font-medium text-green-800'>ব্যালেন্স যোগ করুন</h4>
                      </div>
                      <div className='flex items-center'>
                        <div className='relative flex-1'>
                          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                            <span className='text-gray-500'>+</span>
                          </div>
                          <input
                            type='number'
                            min='0'
                            value={amountToAdd}
                            onChange={e => {
                              setAmountToAdd(e.target.value)
                              setError('') // Clear error when user types
                            }}
                            className='block w-full pl-8 pr-12 py-3 border border-green-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500'
                            placeholder='0.00'
                          />
                          <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                            <span className='text-gray-500'>টাকা</span>
                          </div>
                        </div>
                      </div>
                      {error && amountToAdd && parseFloat(amountToAdd) <= 0 && (
                        <p className='mt-1 text-sm text-red-600'>
                          অনুগ্রহ করে ০ এর চেয়ে বড় সংখ্যা দিন
                        </p>
                      )}
                    </div>

                    {/* Deduct Balance Section */}
                    <div className='border border-red-100 rounded-xl p-4 bg-red-50'>
                      <div className='flex items-center mb-3'>
                        <div className='bg-red-100 p-2 rounded-full mr-3'>
                          <FaMinus className='text-red-600 h-4 w-4' />
                        </div>
                        <h4 className='text-base font-medium text-red-800'>ব্যালেন্স কাটুন</h4>
                      </div>
                      <div className='flex items-center'>
                        <div className='relative flex-1'>
                          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                            <span className='text-gray-500'>-</span>
                          </div>
                          <input
                            type='number'
                            min='0'
                            value={amountToDeduct}
                            onChange={e => {
                              setAmountToDeduct(e.target.value)
                              setError('') // Clear error when user types
                            }}
                            className='block w-full pl-8 pr-12 py-3 border border-red-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500'
                            placeholder='0.00'
                          />
                          <div className='absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none'>
                            <span className='text-gray-500'>টাকা</span>
                          </div>
                        </div>
                      </div>
                      {error && amountToDeduct && parseFloat(amountToDeduct) <= 0 && (
                        <p className='mt-1 text-sm text-red-600'>
                          অনুগ্রহ করে ০ এর চেয়ে বড় সংখ্যা দিন
                        </p>
                      )}
                    </div>

                    {/* Note Section */}
                    <div>
                      <label
                        htmlFor='balance-note'
                        className='block text-sm font-medium text-gray-700 mb-1'
                      >
                        লেনদেনের নোট *
                      </label>
                      <textarea
                        id='balance-note'
                        name='balance-note'
                        rows={3}
                        className='block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        placeholder='এই লেনদেনের কারণ লিখুন...'
                        value={balanceNote}
                        onChange={e => setBalanceNote(e.target.value)}
                      />
                    </div>
                    {/* Show backend error here */}
                    {error && <p className='text-red-500 text-sm mt-2'>{error}</p>}
                  </div>
                </div>
              </div>

              <div className='bg-gray-50 px-6 py-4 flex flex-col sm:flex-row-reverse sm:justify-start space-y-3 sm:space-y-0 sm:space-x-3 sm:space-x-reverse'>
                {amountToAdd && parseFloat(amountToAdd) > 0 && (
                  <button
                    onClick={() => {
                      if (parseFloat(amountToAdd) <= 0) {
                        setError('অনুগ্রহ করে ০ এর চেয়ে বড় সংখ্যা দিন')
                      } else {
                        handleAddBalance()
                      }
                    }}
                    disabled={processingBalance}
                    className='w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-75'
                  >
                    {processingBalance ? (
                      <>
                        <svg
                          className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                        >
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                          ></circle>
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                          ></path>
                        </svg>
                        প্রসেসিং...
                      </>
                    ) : (
                      <>
                        <FaPlus className='-ml-1 mr-2 h-5 w-5' />
                        {amountToAdd} টাকা যোগ করুন
                      </>
                    )}
                  </button>
                )}
                {amountToDeduct && parseFloat(amountToDeduct) > 0 && (
                  <button
                    onClick={() => {
                      if (parseFloat(amountToDeduct) <= 0) {
                        setError('অনুগ্রহ করে ০ এর চেয়ে বড় সংখ্যা দিন')
                      } else {
                        handleDeductBalance()
                      }
                    }}
                    disabled={processingBalance}
                    className='w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent shadow-sm text-base font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-75'
                  >
                    {processingBalance ? (
                      <>
                        <svg
                          className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                          xmlns='http://www.w3.org/2000/svg'
                          fill='none'
                          viewBox='0 0 24 24'
                        >
                          <circle
                            className='opacity-25'
                            cx='12'
                            cy='12'
                            r='10'
                            stroke='currentColor'
                            strokeWidth='4'
                          ></circle>
                          <path
                            className='opacity-75'
                            fill='currentColor'
                            d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                          ></path>
                        </svg>
                        প্রসেসিং...
                      </>
                    ) : (
                      <>
                        <FaMinus className='-ml-1 mr-2 h-5 w-5' />
                        {amountToDeduct} টাকা কাটুন
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={closeBalanceModal}
                  className='w-full sm:w-auto inline-flex justify-center px-6 py-3 border border-gray-300 shadow-sm text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                >
                  <XMarkIcon className='-ml-1 mr-2 h-5 w-5' />
                  বাতিল
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {verifyModalOpen && selectedSeller && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
            <div
              className='fixed inset-0 transition-opacity bg-black bg-opacity-50'
              aria-hidden='true'
              onClick={closeVerifyModal}
            ></div>

            <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-md mx-4 sm:my-8 sm:align-middle sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='flex justify-between items-start'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900'>
                    সেলার ভেরিফাই করুন
                  </h3>
                  <button
                    onClick={closeVerifyModal}
                    className='text-gray-400 hover:text-gray-500 focus:outline-none'
                  >
                    <XMarkIcon className='h-6 w-6' />
                  </button>
                </div>

                <div className='mt-4'>
                  <p className='text-sm text-gray-500'>
                    আপনি কি নিশ্চিত যে আপনি <strong>{selectedSeller.name}</strong> কে ভেরিফাই করতে
                    চান?
                  </p>
                  {/* <div className='mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3'>
                    <div className='flex'>
                      <div className='flex-shrink-0'>
                        <ShieldExclamationIcon className='h-5 w-5 text-yellow-400' />
                      </div>
                      <div className='ml-3'>
                        <p className='text-sm text-yellow-700'>
                          This action will grant the seller full access to all platform features.
                        </p>
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  type='button'
                  onClick={handleVerifySeller}
                  className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  <CheckCircleIcon className='h-5 w-5 mr-2' />
                  ভেরিফাই করুন
                </button>
                <button
                  type='button'
                  onClick={closeVerifyModal}
                  className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  বাতিল করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerManagement
