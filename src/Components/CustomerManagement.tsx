import {
  CheckCircleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  ShieldExclamationIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useCallback, useEffect, useState } from 'react'
import { FaSpinner } from 'react-icons/fa'
import { authService } from '../Api/auth.api'
import { blockApiService, type BlockActionType } from '../Api/block.api'
import { userManagementApiService } from '../Api/user.api'

interface Customer {
  customerId: string
  customerName: string | null
  customerPhoneNo: string
  balance: number
  sellerId: string
  sellerCode: string
  sellerName: string
  sellerPhone: string
  createdAt: string
}

const CustomerManagement = () => {
  // State management
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [activeModal, setActiveModal] = useState<'detail' | 'block' | 'message' | null>(null)
  const [messageContent, setMessageContent] = useState('')
  const [userBlockActions, setUserBlockActions] = useState<BlockActionType[]>([])
  const [availableBlockActions, setAvailableBlockActions] = useState<BlockActionType[]>([])
  const [selectedActions, setSelectedActions] = useState<BlockActionType[]>([])

  // Infinite scroll state
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 10

  // Fetch customers
  const fetchCustomers = useCallback(
    async (pageNum = 1, isLoadMore = false) => {
      try {
        if (isLoadMore) {
          setIsLoadingMore(true)
        } else {
          setIsLoading(true)
          setPage(1)
        }

        const response = await userManagementApiService.getAllCustomers({
          page: pageNum,
          limit: pageSize,
          phoneNo: searchTerm,
        })

        if (response.success && response.data) {
          if (isLoadMore) {
            setCustomers(prev => [...prev, ...response.data.customers])
            setFilteredCustomers(prev => [...prev, ...response.data.customers])
          } else {
            setCustomers(response.data.customers)
            setFilteredCustomers(response.data.customers)
          }

          // Check if there are more pages
          setHasMore(pageNum < Math.ceil(response.data.totalCount / pageSize))
          setPage(pageNum)
        } else {
          setError(response.message || 'Failed to fetch customers')
        }
      } catch (err) {
        setError('Failed to fetch customers')
      } finally {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [searchTerm, pageSize]
  )

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
    setCustomers([])
    setFilteredCustomers([])
    setPage(1)
    setHasMore(true)
  }

  // Apply filters
  useEffect(() => {
    if (searchTerm) {
      const filtered = customers.filter(
        customer =>
          (customer.customerName &&
            customer.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
          customer.customerPhoneNo.includes(searchTerm) ||
          customer.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.sellerPhone.includes(searchTerm)
      )
      setFilteredCustomers(filtered)
    } else {
      setFilteredCustomers(customers)
    }
  }, [searchTerm, customers])

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && !isLoading) {
      fetchCustomers(page + 1, true)
    }
  }, [page, hasMore, isLoadingMore, isLoading, fetchCustomers])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    const sentinel = document.getElementById('scroll-sentinel')
    if (sentinel) {
      observer.observe(sentinel)
    }

    return () => {
      if (sentinel) {
        observer.unobserve(sentinel)
      }
    }
  }, [hasMore, isLoadingMore, loadMore])

  // Initialize
  useEffect(() => {
    setCustomers([])
    setFilteredCustomers([])
    setPage(1)
    setHasMore(true)
    fetchCustomers(1, false)
    fetchAvailableBlockActions()
  }, [searchTerm, fetchCustomers])

  // Handle block/unblock actions
  const handleBlockActions = async () => {
    if (!selectedCustomer) return

    try {
      // Prepare actions to update - set active status based on selectedActions
      const actionsToUpdate = availableBlockActions.map(action => ({
        actionType: action,
        active: selectedActions.includes(action),
      }))

      const response = await blockApiService.updateBlockActions(
        selectedCustomer.customerPhoneNo,
        actionsToUpdate,
        'Updated by admin',
        null
      )

      if (response.success) {
        setSuccess('Block actions updated successfully')
        closeModal()
        fetchUserBlockActions(selectedCustomer.customerPhoneNo)
      } else {
        setError(response.message || 'Failed to update block actions')
      }
    } catch (err) {
      setError('Failed to update block actions')
    }
  }

  // Handle sending message
  const handleSendMessage = async () => {
    if (!selectedCustomer || !messageContent.trim()) return

    try {
      const { success, message } = await authService.sendDirectMessage({
        userId: selectedCustomer.customerId,
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
  const openDetailsModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setActiveModal('detail')
  }

  const openBlockModal = async (customer: Customer) => {
    setSelectedCustomer(customer)
    await fetchUserBlockActions(customer.customerPhoneNo)
    setActiveModal('block')
  }

  const openMessageModal = (customer: Customer) => {
    setSelectedCustomer(customer)
    setActiveModal('message')
  }

  const closeModal = () => {
    setActiveModal(null)
    setSelectedCustomer(null)
  }

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
        <h1 className='text-2xl font-bold text-gray-900'>Customer Management</h1>
        <p className='text-gray-600'>Manage all registered customers in the platform</p>
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
            placeholder='Search customers by name, phone, or seller info...'
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Mobile View - Card List */}
      <div className='sm:hidden space-y-3'>
        {isLoading && !isLoadingMore ? (
          <div className='flex justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
          </div>
        ) : filteredCustomers.length === 0 && !isLoading ? (
          <div className='rounded-lg bg-white p-4 shadow text-center'>
            {searchTerm ? 'No customers found' : 'No customers available'}
          </div>
        ) : (
          <>
            {filteredCustomers.map(customer => (
              <div key={customer.customerId} className='rounded-lg bg-white p-4 shadow'>
                <div className='flex items-start space-x-3'>
                  <div className='flex-shrink-0'>
                    <UserCircleIcon className='h-10 w-10 text-gray-400' aria-hidden='true' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex justify-between'>
                      <h3 className='text-sm font-medium text-gray-900 truncate'>
                        {customer.customerName || 'Unnamed Customer'}
                      </h3>
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                        {customer.balance} Tk.
                      </span>
                    </div>
                    <div className='mt-1 text-sm text-gray-500 truncate'>
                      <div className='flex items-center'>
                        <PhoneIcon className='mr-1 h-3.5 w-3.5' />
                        {customer.customerPhoneNo}
                      </div>
                      <div className='mt-1 truncate'>
                        Referred by: {customer.sellerName} ({customer.sellerPhone})
                      </div>
                      <div className='mt-1 text-xs text-gray-400'>
                        Joined: {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
                <div className='mt-3 flex justify-end space-x-1'>
                  <button
                    type='button'
                    onClick={() => openBlockModal(customer)}
                    className='inline-flex items-center rounded-md border border-gray-300 bg-white p-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  >
                    <ShieldExclamationIcon className='h-3.5 w-3.5' />
                  </button>
                  <button
                    type='button'
                    onClick={() => openMessageModal(customer)}
                    className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 p-1 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  >
                    <PaperAirplaneIcon className='h-3.5 w-3.5' />
                  </button>
                  <button
                    type='button'
                    onClick={() => openDetailsModal(customer)}
                    className='inline-flex items-center rounded-md border border-gray-300 bg-white p-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                  >
                    <EyeIcon className='h-3.5 w-3.5' />
                  </button>
                </div>
              </div>
            ))}

            {/* Loading indicator for infinite scroll */}
            {isLoadingMore && (
              <div className='flex justify-center py-4'>
                <FaSpinner className='animate-spin text-indigo-500 text-xl' />
              </div>
            )}

            {/* Scroll sentinel for infinite scroll */}
            {hasMore && !isLoadingMore && <div id='scroll-sentinel' className='h-10' />}
          </>
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
                Customer
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
                Referred By
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Balance
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Joined On
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
            {isLoading && !isLoadingMore ? (
              <tr>
                <td colSpan={6} className='px-6 py-4 text-center'>
                  <div className='flex justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
                  </div>
                </td>
              </tr>
            ) : filteredCustomers.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={6} className='px-6 py-4 text-center text-gray-500'>
                  {searchTerm ? 'No customers found' : 'No customers available'}
                </td>
              </tr>
            ) : (
              <>
                {filteredCustomers.map(customer => (
                  <tr key={customer.customerId} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='flex items-center'>
                        <div className='flex-shrink-0 h-10 w-10'>
                          <UserCircleIcon className='h-10 w-10 text-gray-400' aria-hidden='true' />
                        </div>
                        <div className='ml-4'>
                          <div className='text-sm font-medium text-gray-900'>
                            {customer.customerName || 'Unnamed Customer'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>
                        <div className='flex items-center'>
                          <PhoneIcon className='mr-1 h-4 w-4 text-gray-500' />
                          {customer.customerPhoneNo}
                        </div>
                      </div>
                    </td>
                    <td className='px-6 py-4'>
                      <div className='text-sm text-gray-900'>{customer.sellerName}</div>
                      <div className='text-sm text-gray-500'>{customer.sellerPhone}</div>
                      <div className='text-xs text-gray-400'>Code: {customer.sellerCode}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800'>
                        {customer.balance} Tk.
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {new Date(customer.createdAt).toLocaleDateString()}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex justify-end space-x-2'>
                        <button
                          onClick={() => openBlockModal(customer)}
                          className='text-indigo-600 hover:text-indigo-900'
                          title='Block Actions'
                        >
                          <ShieldExclamationIcon className='h-5 w-5' />
                        </button>
                        <button
                          onClick={() => openMessageModal(customer)}
                          className='text-green-600 hover:text-green-900'
                          title='Send Message'
                        >
                          <PaperAirplaneIcon className='h-5 w-5' />
                        </button>
                        <button
                          onClick={() => openDetailsModal(customer)}
                          className='text-blue-600 hover:text-blue-900'
                          title='View Details'
                        >
                          <EyeIcon className='h-5 w-5' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Loading row for infinite scroll */}
                {isLoadingMore && (
                  <tr>
                    <td colSpan={6} className='px-6 py-4 text-center'>
                      <div className='flex justify-center'>
                        <FaSpinner className='animate-spin text-indigo-500 text-xl' />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>

        {/* Scroll sentinel for infinite scroll */}
        {hasMore && !isLoadingMore && <div id='scroll-sentinel' className='h-10' />}
      </div>

      {/* Customer Details Modal */}
      {activeModal === 'detail' && selectedCustomer && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
            <div
              className='fixed inset-0 transition-opacity bg-black bg-opacity-50'
              aria-hidden='true'
              onClick={closeModal}
            ></div>

            <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-2xl mx-4 sm:my-8 sm:align-middle sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='flex justify-between items-start'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900'>Customer Details</h3>
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
                      <p className='mt-1 text-sm text-gray-900'>
                        {selectedCustomer.customerName || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-gray-500'>Phone</h4>
                      <p className='mt-1 text-sm text-gray-900'>
                        {selectedCustomer.customerPhoneNo}
                      </p>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-gray-500'>Balance</h4>
                      <p className='mt-1 text-sm text-gray-900'>{selectedCustomer.balance} Tk.</p>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-gray-500'>Customer ID</h4>
                      <p className='mt-1 text-sm text-gray-900'>{selectedCustomer.customerId}</p>
                    </div>
                    <div className='sm:col-span-2'>
                      <h4 className='text-sm font-medium text-gray-500'>Referred By</h4>
                      <div className='mt-1 p-3 bg-gray-50 rounded-md'>
                        <p className='text-sm text-gray-900 font-medium'>
                          {selectedCustomer.sellerName}
                        </p>
                        <p className='text-sm text-gray-500'>
                          Phone: {selectedCustomer.sellerPhone} | Code:{' '}
                          {selectedCustomer.sellerCode}
                        </p>
                        <p className='text-xs text-gray-400 mt-1'>
                          Seller ID: {selectedCustomer.sellerId}
                        </p>
                      </div>
                    </div>
                    <div>
                      <h4 className='text-sm font-medium text-gray-500'>Joined On</h4>
                      <p className='mt-1 text-sm text-gray-900'>
                        {new Date(selectedCustomer.createdAt).toLocaleDateString()}
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
      {activeModal === 'block' && selectedCustomer && (
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
                    Manage Block Actions for{' '}
                    {selectedCustomer.customerName || selectedCustomer.customerPhoneNo}
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
                    Select which actions to block for this customer:
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
      {activeModal === 'message' && selectedCustomer && (
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
                    Send Message to{' '}
                    {selectedCustomer.customerName || selectedCustomer.customerPhoneNo}
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
    </div>
  )
}

export default CustomerManagement
