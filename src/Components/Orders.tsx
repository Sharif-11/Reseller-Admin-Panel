import { useEffect, useState } from 'react'
import { FaCopy, FaSearch, FaSpinner } from 'react-icons/fa'
import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  orderApi,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
  type PaymentType,
} from '../Api/order.api'
import ProductImagePreviewModal from './ProductImagePreview'

interface Order {
  orderId: number
  orderType: 'SELLER_ORDER' | 'CUSTOMER_ORDER'
  orderStatus: OrderStatus
  createdAt: string
  updatedAt: string
  cancelled: boolean
  cancelledAt: string | null
  cancelledBy: 'SELLER' | 'CUSTOMER' | 'SYSTEM' | null
  cancelledReason: string | null

  customerName: string
  customerPhoneNo: string
  customerAddress: string
  customerZilla: string
  customerUpazilla: string
  customerComments: string | null

  // Seller info (only for SELLER_ORDER)
  sellerId?: string
  sellerName?: string
  sellerPhoneNo?: string
  sellerVerified?: boolean
  sellerShopName?: string
  sellerBalance?: string

  shopId?: number
  shopName?: string
  shopLocation?: string
  deliveryCharge: string
  isDeliveryChargePaid: boolean
  deliveryChargePaidAt: string | null
  paymentType?: PaymentMethod
  paymentVerified: boolean

  courierName: string | null
  trackingUrl: string | null

  totalProductQuantity: number
  totalProductSellingPrice: string
  totalProductBasePrice: string
  totalCommission: string
  actualCommission: string | null
  amountPaidByCustomer: string | null
  cashOnAmount: string | null

  OrderProduct?: OrderProduct[]
  Payment?: {
    paymentId: string
    paymentType: PaymentType
    paymentStatus: PaymentStatus
    amount: string
    transactionId: string | null
    userWalletName: string
    userWalletPhoneNo: string
  }
}

interface OrderProduct {
  orderProductId: number
  productId: number
  productName: string
  productImage: string | null
  productBasePrice: string
  productSellingPrice: string
  productQuantity: number
  productVariant: string
  totalProductBasePrice: string
  totalProductSellingPrice: string
}

interface PaginationState {
  currentPage: number
  totalPages: number
  totalOrders: number
  pageSize: number
}

type OrderStatusTab = 'pending' | 'confirmed' | 'delivered' | 'completed' | 'others'

const AdminOrders = () => {
  const [allOrders, setAllOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [previewProductImage, setPreviewProductImage] = useState<string | null>(null)
  const [previewProductName, setPreviewProductName] = useState<string>('')
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<Record<string, PaginationState>>({
    pending: { currentPage: 1, totalPages: 1, totalOrders: 0, pageSize: 10 },
    confirmed: { currentPage: 1, totalPages: 1, totalOrders: 0, pageSize: 10 },
    delivered: { currentPage: 1, totalPages: 1, totalOrders: 0, pageSize: 10 },
    completed: { currentPage: 1, totalPages: 1, totalOrders: 0, pageSize: 10 },
    others: { currentPage: 1, totalPages: 1, totalOrders: 0, pageSize: 10 },
  })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [processingOrder, setProcessingOrder] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<OrderStatusTab>('pending')
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [currentAction, setCurrentAction] = useState<
    'confirm' | 'deliver' | 'complete' | 'cancel' | 'reorder' | 'refund' | 'fail' | 'return' | null
  >(null)
  const [actionData, setActionData] = useState({
    trackingUrl: '',
    remarks: '',
    amountPaidByCustomer: '',
    refundAmount: '',
    systemWalletPhoneNo: '',
    transactionId: '',
  })
  const [actionError, setActionError] = useState('')

  const fetchOrders = async (page = 1, pageSize = pagination[activeTab].pageSize) => {
    try {
      setFetching(true)
      let statusParam: OrderStatus[] = []

      if (activeTab === 'pending') {
        statusParam = ['UNPAID', 'PAID']
      } else if (activeTab === 'confirmed') {
        statusParam = ['CONFIRMED']
      } else if (activeTab === 'delivered') {
        statusParam = ['DELIVERED']
      } else if (activeTab === 'completed') {
        statusParam = ['COMPLETED']
      } else if (activeTab === 'others') {
        statusParam = ['CANCELLED', 'REJECTED', 'REFUNDED', 'RETURNED', 'FAILED']
      }

      const response = await orderApi.getOrdersByAdmin({
        page,
        limit: pageSize,
        orderStatus: statusParam,
        search: searchQuery,
      })

      if (response.success && response.data) {
        setAllOrders(response.data.orders)
        setPagination(prev => ({
          ...prev,
          [activeTab]: {
            currentPage: response.data.currentPage,
            totalPages: response.data.totalPages,
            totalOrders: response.data.totalOrders,
            pageSize: response.data.pageSize,
          },
        }))
      } else {
        toast.error(response.message || 'Failed to load orders')
      }
    } catch (error) {
      toast.error('Failed to load orders')
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchOrders(1, pagination[activeTab].pageSize)
  }

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = parseInt(e.target.value)
    setPagination(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        pageSize: newPageSize,
      },
    }))
    fetchOrders(1, newPageSize)
  }

  useEffect(() => {
    fetchOrders()
  }, [activeTab, pagination[activeTab].pageSize, searchQuery])

  const getStatusBadge = (status: OrderStatus) => {
    const baseClasses = 'px-2 py-1 rounded-full text-xs font-medium'

    switch (status) {
      case 'COMPLETED':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Completed</span>
      case 'CONFIRMED':
        return <span className={`${baseClasses} bg-purple-100 text-purple-800`}>Confirmed</span>
      case 'DELIVERED':
        return <span className={`${baseClasses} bg-indigo-100 text-indigo-800`}>Delivered</span>
      case 'REJECTED':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rejected</span>
      case 'REFUNDED':
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Refunded</span>
      case 'CANCELLED':
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Cancelled</span>
      case 'RETURNED':
        return <span className={`${baseClasses} bg-orange-100 text-orange-800`}>Returned</span>
      case 'FAILED':
        return <span className={`${baseClasses} bg-pink-100 text-pink-800`}>Failed</span>
      case 'PAID':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Paid</span>
      default:
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Unpaid</span>
    }
  }

  const openDetailsModal = (order: Order) => {
    setSelectedOrder(order)
    setShowDetailsModal(true)
  }

  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedOrder(null)
  }

  const openActionModal = (action: typeof currentAction, order: Order) => {
    setCurrentAction(action)
    setSelectedOrder(order)
    setShowActionModal(true)
    setActionError('')
    setActionData({
      trackingUrl: order.trackingUrl || '',
      remarks: '',
      amountPaidByCustomer: order.amountPaidByCustomer || '',
      refundAmount: order.deliveryCharge || '',
      systemWalletPhoneNo: '', // Assuming sellerPhoneNo is used for refund
      transactionId: '',
    })
  }

  const closeActionModal = () => {
    setShowActionModal(false)
    setCurrentAction(null)
    setSelectedOrder(null)
    setActionError('')
  }

  const handleActionSubmit = async () => {
    if (!selectedOrder) return

    // Validation
    if (currentAction === 'deliver' && !actionData.trackingUrl.trim()) {
      setActionError('Tracking URL is required')
      return
    }

    if (currentAction === 'cancel' && !actionData.remarks.trim()) {
      setActionError('Reason is required')
      return
    }

    if (currentAction === 'complete' && !actionData.amountPaidByCustomer.trim()) {
      setActionError('Amount paid by customer is required')
      return
    }

    setProcessingOrder(true)
    setActionError('')

    try {
      let response
      let nextTab = activeTab

      switch (currentAction) {
        case 'confirm':
          response = await orderApi.confirmOrderByAdmin(selectedOrder.orderId)
          nextTab = 'confirmed'
          break
        case 'deliver':
          response = await orderApi.deliverOrderByAdmin({
            orderId: selectedOrder.orderId,
            trackingUrl: actionData.trackingUrl,
          })
          nextTab = 'delivered'
          break
        case 'complete':
          response = await orderApi.completeOrderByAdmin(
            selectedOrder.orderId,
            actionData.amountPaidByCustomer ? parseFloat(actionData.amountPaidByCustomer) : 0
          )
          nextTab = 'completed'
          break
        case 'cancel':
          response = await orderApi.cancelOrderByAdmin(selectedOrder.orderId, actionData.remarks)
          nextTab = 'others'
          break
        // case 'reorder':
        //   response = await orderApi.mardOrderAsFailedByAdmin(selectedOrder.orderId)
        //   nextTab = 'pending'
        //   break
        case 'refund':
          response = await orderApi.cancelOrderByAdmin(
            selectedOrder.orderId,
            actionData.remarks,
            actionData.transactionId,
            actionData.systemWalletPhoneNo
          )
          nextTab = 'others'
          break
        case 'return':
          response = await orderApi.returnOrderByAdmin(selectedOrder.orderId)
          nextTab = 'others'
          break
        case 'fail':
          response = await orderApi.mardOrderAsFailedByAdmin(selectedOrder.orderId)
          nextTab = 'others'
          break
        default:
          return
      }

      if (response?.success) {
        toast.success(`Order ${getActionName(currentAction)} successfully`)
        setActiveTab(nextTab)
        fetchOrders(1, pagination[nextTab].pageSize)
        closeActionModal()
      } else {
        setActionError(response?.message || `Failed to ${getActionName(currentAction)} order`)
      }
    } catch (error) {
      setActionError(`Failed to ${getActionName(currentAction)} order`)
      console.error(`Error ${currentAction} order:`, error)
    } finally {
      setProcessingOrder(false)
    }
  }

  const getActionName = (action: string | null) => {
    switch (action) {
      case 'confirm':
        return 'confirmed'
      case 'deliver':
        return 'delivered'
      case 'complete':
        return 'completed'
      case 'cancel':
        return 'cancelled'
      case 'reorder':
        return 'reordered'
      case 'refund':
        return 'refunded'
      case 'return':
        return 'returned'
      case 'fail':
        return 'marked as failed'
      default:
        return ''
    }
  }

  const currentPagination = pagination[activeTab]
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-BD', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }
  const getSellerStatusBadge = (verified: boolean) => {
    return (
      <span
        className={`px-2 py-1 rounded-full text-[10px] font-medium ${
          verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}
      >
        {verified ? 'Verified' : 'Unverified'}
      </span>
    )
  }

  return (
    <div className='px-4 py-6 max-w-6xl mx-auto'>
      <h1 className='text-xl font-bold mb-4 md:text-2xl md:mb-6'>Order Management</h1>

      {/* Search and filter section */}
      <div className='mb-4 flex flex-col gap-4'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
          <div className='flex border-b overflow-x-auto'>
            <button
              className={`px-3 py-2 text-[10px] md:text-sm ${
                activeTab === 'pending'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('pending')}
            >
              Pending
            </button>
            <button
              className={`px-3 py-2 text-[10px] md:text-sm ${
                activeTab === 'confirmed'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('confirmed')}
            >
              Confirmed
            </button>
            <button
              className={`px-3 py-2 text-[10px] md:text-sm ${
                activeTab === 'delivered'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('delivered')}
            >
              Delivered
            </button>
            <button
              className={`px-3 py-2 text-[10px] md:text-sm ${
                activeTab === 'completed'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('completed')}
            >
              Completed
            </button>
            <button
              className={`px-3 py-2 text-[10px] md:text-sm ${
                activeTab === 'others'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500'
              }`}
              onClick={() => setActiveTab('others')}
            >
              Others
            </button>
          </div>

          <div className='flex items-center gap-2'>
            <form onSubmit={handleSearch} className='relative'>
              <input
                type='text'
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder='Search orders...'
                className='pl-8 pr-4 py-1.5 border rounded-md text-sm w-full md:w-64'
              />
              <FaSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
            </form>

            <select
              value={currentPagination.pageSize}
              onChange={handlePageSizeChange}
              className='border rounded-md px-2 py-1.5 text-xs md:text-sm'
              disabled={fetching}
            >
              <option value='5'>5 per page</option>
              <option value='10'>10 per page</option>
              <option value='20'>20 per page</option>
              <option value='50'>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {fetching ? (
        <div className='flex justify-center items-center h-64'>
          <FaSpinner className='animate-spin text-blue-500 text-2xl' />
        </div>
      ) : loading ? (
        <div className='flex justify-center items-center h-64'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
        </div>
      ) : allOrders.length === 0 ? (
        <div className='bg-white rounded-lg shadow p-6 text-center'>
          <p className='text-gray-500'>No orders found</p>
        </div>
      ) : (
        <div className='bg-white rounded-lg shadow overflow-hidden'>
          {/* Mobile view - Cards */}
          <div className='md:hidden space-y-3 p-3'>
            {allOrders.map(order => (
              <div key={order.orderId} className='border rounded-lg p-3 text-xs'>
                <div className='flex justify-between items-start'>
                  <div>
                    <p className='text-gray-500'>{formatDate(order.createdAt)}</p>
                    <h3 className='font-medium'>Order # {order.orderId}</h3>
                    {order.orderType === 'SELLER_ORDER' && (
                      <p className='text-gray-500'>
                        Seller: {order.sellerName} - {order.sellerPhoneNo}
                      </p>
                    )}
                    <p className='text-gray-500'>
                      Customer: {order.customerName} - {order.customerPhoneNo}
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(order.orderStatus)}
                    {order.cancelled && (
                      <span className='mt-1 block text-xs text-red-500'>
                        Cancelled by {order.cancelledBy}
                      </span>
                    )}
                  </div>
                </div>

                <div className='mt-2 space-y-1'>
                  <div>
                    <p className='text-gray-500'>Total Amount:</p>
                    <p className='font-medium'>
                      {parseFloat(order.totalProductSellingPrice).toFixed(2)}৳
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-500'>Cash On:</p>
                    <p className='font-medium'>
                      {parseFloat(order.cashOnAmount || '0').toFixed(2)}৳
                    </p>
                  </div>
                  <div>
                    <p className='text-gray-500'>Products:</p>
                    <p className='font-medium'>{order.totalProductQuantity} items</p>
                  </div>
                  <div>
                    <p className='text-gray-500'>Delivery Charge:</p>
                    <p className='font-medium'>{parseFloat(order.deliveryCharge).toFixed(2)}৳</p>
                  </div>

                  {order.isDeliveryChargePaid && (
                    <div>
                      <p className='text-gray-500'>Delivery Paid:</p>
                      <p className='font-medium'>Yes</p>
                    </div>
                  )}

                  {order.Payment?.transactionId && (
                    <div>
                      <p className='text-gray-500'>Transaction ID:</p>
                      <div className='flex items-center gap-1 mt-1'>
                        <input
                          type='text'
                          value={order.Payment.transactionId}
                          readOnly
                          className='text-xs p-1 border rounded flex-1 w-24 truncate'
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(order.Payment?.transactionId || '')
                            toast.success('Transaction ID copied')
                          }}
                          className='p-1 bg-gray-100 rounded hover:bg-gray-200'
                          aria-label='Copy transaction ID'
                        >
                          <FaCopy size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {order.trackingUrl && (
                    <div>
                      <p className='text-gray-500'>Tracking Link:</p>
                      <div className='flex items-center gap-1 mt-1'>
                        <input
                          type='text'
                          value={order.trackingUrl}
                          readOnly
                          onClick={() => {
                            navigator.clipboard.writeText(order.trackingUrl || '')
                            navigate(`/tracking/${order.trackingUrl}`)
                          }}
                          className='text-xs p-1 border rounded flex-1 w-24 truncate'
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(order.trackingUrl || '')
                            toast.success('Tracking link copied')
                          }}
                          className='p-1 bg-gray-100 rounded hover:bg-gray-200'
                          aria-label='Copy tracking link'
                        >
                          <FaCopy size={12} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className='mt-3 flex justify-between items-center'>
                  <button
                    onClick={() => openDetailsModal(order)}
                    className='text-blue-600 hover:text-blue-800 text-xs'
                  >
                    View Details
                  </button>

                  <div className='flex gap-2'>
                    {/* PAID - Show only Verify Payment */}
                    {order.orderStatus === 'PAID' && (
                      <NavLink to='/dashboard/payment-verification'>
                        <button className='py-1 px-2 bg-blue-50 text-blue-600 rounded font-medium text-xs'>
                          Verify Payment
                        </button>
                      </NavLink>
                    )}

                    {/* CONFIRMED - Show Deliver/Cancel if not cancelled */}
                    {order.orderStatus === 'CONFIRMED' && !order.cancelled && (
                      <>
                        <button
                          onClick={() => openActionModal('deliver', order)}
                          className='py-1 px-2 bg-purple-50 text-purple-600 rounded font-medium text-xs'
                        >
                          Deliver Order
                        </button>
                        <button
                          onClick={() =>
                            openActionModal(
                              order.orderType === 'SELLER_ORDER' ? 'cancel' : 'refund',
                              order
                            )
                          }
                          className='py-1 px-2 bg-red-50 text-red-600 rounded font-medium text-xs'
                        >
                          Cancel Order
                        </button>
                      </>
                    )}

                    {/* CANCELLED CONFIRMED - Show Refund if cancelled by seller with completed payment */}
                    {order.orderStatus === 'CONFIRMED' &&
                      order.cancelled &&
                      (order.cancelledBy === 'SELLER' || order.cancelledBy === 'CUSTOMER') &&
                      order.Payment?.paymentStatus === 'COMPLETED' && (
                        <button
                          onClick={() => openActionModal('refund', order)}
                          className='py-1 px-2 bg-pink-50 text-pink-600 rounded font-medium text-xs'
                        >
                          Refund Order
                        </button>
                      )}

                    {/* DELIVERED - Show Complete/Return/Fail options */}
                    {order.orderStatus === 'DELIVERED' && (
                      <>
                        <button
                          onClick={() => openActionModal('complete', order)}
                          className='py-1 px-2 bg-green-50 text-green-600 rounded font-medium text-xs'
                        >
                          Complete Order
                        </button>
                        <button
                          onClick={() => openActionModal('return', order)}
                          className='py-1 px-2 bg-orange-50 text-orange-600 rounded font-medium text-xs'
                        >
                          Return Order
                        </button>
                        <button
                          onClick={() => openActionModal('fail', order)}
                          className='py-1 px-2 bg-red-50 text-red-600 rounded font-medium text-xs'
                        >
                          Mark as Failed
                        </button>
                      </>
                    )}

                    {/* FAILED - Show Reorder option */}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop view - Table */}
          <div className='hidden md:block overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200 text-sm'>
              <thead className='bg-gray-50'>
                <tr>
                  <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                    Date
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                    Order ID
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                    Type
                  </th>
                  {activeTab !== 'others' && (
                    <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                      Customer
                    </th>
                  )}
                  <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                    Amount
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {allOrders.map(order => (
                  <tr key={order.orderId}>
                    <td className='px-4 py-4 whitespace-nowrap text-gray-500'>
                      {formatDate(order.createdAt)}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap font-medium text-gray-900'>
                      #{order.orderId}
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap'>
                      {order.orderType === 'SELLER_ORDER' ? 'Seller Order' : 'Customer Order'}
                    </td>
                    {activeTab !== 'others' && (
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <div className='font-medium'>{order.customerName}</div>
                        <div className='text-gray-500'>{order.customerPhoneNo}</div>
                      </td>
                    )}
                    <td className='px-4 py-4 whitespace-nowrap text-gray-900'>
                      {parseFloat(order.totalProductSellingPrice).toFixed(2)}৳
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap'>
                      <div className='flex items-center space-x-2'>
                        {getStatusBadge(order.orderStatus)}
                        {order.cancelled && (
                          <span className='text-xs text-red-500'>
                            Cancelled by {order.cancelledBy}
                          </span>
                        )}
                        <button
                          onClick={() => openDetailsModal(order)}
                          className='text-blue-600 hover:text-blue-800'
                        >
                          Details
                        </button>
                      </div>
                    </td>
                    <td className='px-4 py-4 whitespace-nowrap font-medium space-x-2'>
                      {/* UNPAID - No action buttons (hidden) */}

                      {/* PAID - Verify payment */}
                      {order.orderStatus === 'PAID' && (
                        <NavLink to='/dashboard/payment-verification'>
                          <button className='text-blue-600 hover:text-blue-800'>
                            Verify Payment
                          </button>
                        </NavLink>
                      )}

                      {/* CONFIRMED - Deliver or Cancel (regardless of payment) */}
                      {order.orderStatus === 'CONFIRMED' && !order.cancelled && (
                        <>
                          <button
                            onClick={() => openActionModal('deliver', order)}
                            className='text-purple-600 hover:text-purple-800'
                          >
                            Deliver Order
                          </button>
                          <button
                            onClick={() =>
                              openActionModal(
                                order.orderType === 'SELLER_ORDER' ? 'cancel' : 'refund',
                                order
                              )
                            }
                            className='text-red-600 hover:text-red-800'
                          >
                            Cancel Order
                          </button>
                        </>
                      )}

                      {/* If order was cancelled by seller and payment was completed - Show Refund */}
                      {order.orderStatus === 'CONFIRMED' &&
                        order.cancelled &&
                        (order.cancelledBy === 'SELLER' || order.cancelledBy === 'CUSTOMER') &&
                        order.Payment?.paymentStatus === 'COMPLETED' && (
                          <button
                            onClick={() => openActionModal('refund', order)}
                            className='text-pink-600 hover:text-pink-800'
                          >
                            Refund Order
                          </button>
                        )}

                      {/* DELIVERED - Complete, Return, or Fail */}
                      {order.orderStatus === 'DELIVERED' && (
                        <>
                          <button
                            onClick={() => openActionModal('complete', order)}
                            className='text-green-600 hover:text-green-800'
                          >
                            Complete Order
                          </button>
                          <button
                            onClick={() => openActionModal('return', order)}
                            className='text-orange-600 hover:text-orange-800'
                          >
                            Return Order
                          </button>
                          <button
                            onClick={() => openActionModal('fail', order)}
                            className='text-red-600 hover:text-red-800'
                          >
                            Mark as Failed
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {currentPagination.totalPages > 1 && (
            <div className='bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200'>
              <div className='flex-1 flex justify-between sm:hidden'>
                <button
                  onClick={() => fetchOrders(currentPagination.currentPage - 1)}
                  disabled={currentPagination.currentPage === 1 || fetching}
                  className='relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchOrders(currentPagination.currentPage + 1)}
                  disabled={
                    currentPagination.currentPage === currentPagination.totalPages || fetching
                  }
                  className='ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
                >
                  Next
                </button>
              </div>

              <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
                <div>
                  <p className='text-sm text-gray-700'>
                    Showing{' '}
                    <span className='font-medium'>
                      {(currentPagination.currentPage - 1) * currentPagination.pageSize + 1}
                    </span>{' '}
                    to{' '}
                    <span className='font-medium'>
                      {Math.min(
                        currentPagination.currentPage * currentPagination.pageSize,
                        currentPagination.totalOrders
                      )}
                    </span>{' '}
                    of <span className='font-medium'>{currentPagination.totalOrders}</span> orders
                  </p>
                </div>
                <div>
                  <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'>
                    <button
                      onClick={() => fetchOrders(currentPagination.currentPage - 1)}
                      disabled={currentPagination.currentPage === 1 || fetching}
                      className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
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
                    {Array.from({ length: Math.min(5, currentPagination.totalPages) }, (_, i) => {
                      let pageNum
                      if (currentPagination.totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPagination.currentPage <= 3) {
                        pageNum = i + 1
                      } else if (
                        currentPagination.currentPage >=
                        currentPagination.totalPages - 2
                      ) {
                        pageNum = currentPagination.totalPages - 4 + i
                      } else {
                        pageNum = currentPagination.currentPage - 2 + i
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchOrders(pageNum)}
                          disabled={fetching}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === currentPagination.currentPage
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => fetchOrders(currentPagination.currentPage + 1)}
                      disabled={
                        currentPagination.currentPage === currentPagination.totalPages || fetching
                      }
                      className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50'
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

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-start pt-12 sm:pt-16 justify-center p-2 sm:p-4 z-50 overflow-y-auto'>
          <div className='bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
            <div className='p-4 border-b flex justify-between items-center'>
              <h2 className='text-lg font-medium'>
                Order Details (#{selectedOrder.orderId}) -{' '}
                {selectedOrder.orderType === 'SELLER_ORDER' ? 'Seller Order' : 'Customer Order'}
              </h2>
              <button onClick={closeDetailsModal} className='text-gray-500 hover:text-gray-700'>
                <svg className='h-6 w-6' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <div className='p-4 space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {selectedOrder.shopName && (
                  <div className='mt-4'>
                    <h3 className='text-sm font-medium text-gray-700 mb-2'>Shop Information</h3>
                    <div className='space-y-2'>
                      {/* Shop Name */}
                      <div className='flex items-start gap-2'>
                        <svg
                          className='w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0'
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
                        <p className='text-sm font-medium'>{selectedOrder.shopName}</p>
                      </div>

                      {/* Shop Location */}
                      {selectedOrder.shopLocation && (
                        <div className='flex items-start gap-2'>
                          <svg
                            className='w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                            />
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                            />
                          </svg>
                          <p className='text-sm text-gray-700'>{selectedOrder.shopLocation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className='text-sm font-medium text-gray-700 mb-2'>Customer Information</h3>
                  <div className='space-y-2'>
                    <div className='flex items-start gap-2'>
                      <svg
                        className='w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                        />
                      </svg>
                      <div>
                        <p className='text-sm font-medium'>{selectedOrder.customerName}</p>
                        <p className='text-sm text-gray-500'>{selectedOrder.customerPhoneNo}</p>
                      </div>
                    </div>

                    <div className='flex items-start gap-2'>
                      <svg
                        className='w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                        />
                      </svg>
                      <div>
                        <p className='text-sm'>
                          {selectedOrder.customerZilla}, {selectedOrder.customerUpazilla}
                        </p>
                        <p className='text-sm text-gray-500'>{selectedOrder.customerAddress}</p>
                        {selectedOrder.customerComments && (
                          <div className='flex gap-1 mt-1'>
                            <svg
                              className='w-4 h-4 text-gray-400 flex-shrink-0'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z'
                              />
                            </svg>
                            <p className='text-xs text-gray-500'>
                              {selectedOrder.customerComments}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {selectedOrder.orderType === 'SELLER_ORDER' && (
                  <div>
                    <h3 className='text-sm font-medium text-gray-700 mb-2'>Seller Information</h3>
                    <div className='space-y-2'>
                      <div className='flex items-start gap-2'>
                        <svg
                          className='w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                          />
                        </svg>
                        <div>
                          <p className='text-sm font-medium'>
                            {selectedOrder.sellerName}{' '}
                            {getSellerStatusBadge(selectedOrder.sellerVerified || false)}
                          </p>
                          <p className='text-sm text-gray-500'>{selectedOrder.sellerPhoneNo}</p>
                        </div>
                      </div>

                      <div className='flex items-start gap-2'>
                        <svg
                          className='w-4 h-4 mt-0.5 text-gray-500 flex-shrink-0'
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
                        <div>
                          <p className='text-sm'>{selectedOrder.sellerShopName}</p>
                          <p className='text-sm text-gray-500'>
                            Balance: {parseFloat(selectedOrder.sellerBalance || '0').toFixed(2)}৳
                          </p>
                          {selectedOrder.cancelled && (
                            <p className='text-xs text-red-500 mt-1'>
                              Cancelled by {selectedOrder.cancelledBy}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <h3 className='text-sm font-medium text-gray-700 mb-2'>Order Information</h3>
                  <div className='space-y-1'>
                    <p className='text-sm'>
                      <span className='font-medium'>Status:</span>{' '}
                      {getStatusBadge(selectedOrder.orderStatus)}
                    </p>
                    <p className='text-sm'>
                      <span className='font-medium'>Created:</span>{' '}
                      {formatDate(selectedOrder.createdAt)}
                    </p>
                    <p className='text-sm'>
                      <span className='font-medium'>Updated:</span>{' '}
                      {formatDate(selectedOrder.updatedAt)}
                    </p>
                    {selectedOrder.paymentType && (
                      <p className='text-sm'>
                        <span className='font-medium'>Payment Method:</span>{' '}
                        {selectedOrder.paymentType?.toLowerCase() + ' Payment' || 'N/A'}
                      </p>
                    )}
                    {selectedOrder.courierName && (
                      <p className='text-sm'>
                        <span className='font-medium'>Courier:</span> {selectedOrder.courierName}
                      </p>
                    )}
                    {selectedOrder.trackingUrl && (
                      <div className='mt-1'>
                        <p className='text-sm font-medium'>Tracking Link:</p>
                        <div className='flex items-center mt-1'>
                          <a
                            href={selectedOrder.trackingUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='hover:underline break-all'
                          >
                            {selectedOrder.trackingUrl}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedOrder.trackingUrl || '')
                              toast.success('Tracking URL copied')
                            }}
                            className='px-2 py-1 bg-gray-100 border-t border-r border-b rounded-r hover:bg-gray-200'
                          >
                            <FaCopy size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {selectedOrder.Payment && (
                  <div>
                    <h3 className='text-sm font-medium text-gray-700 mb-2'>Payment Information</h3>
                    <div className='space-y-1'>
                      <p className='text-sm'>
                        <span className='font-medium'>Delivery Paid:</span>{' '}
                        {selectedOrder.isDeliveryChargePaid ? 'Yes' : 'No'}
                      </p>
                      {selectedOrder.Payment?.transactionId && (
                        <div className='mt-1'>
                          <p className='text-sm font-medium'>Transaction ID:</p>
                          <div className='flex items-center mt-1'>
                            <input
                              type='text'
                              value={selectedOrder.Payment.transactionId}
                              readOnly
                              className='flex-1 px-2 py-1 border rounded-l text-sm'
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  selectedOrder.Payment?.transactionId || ''
                                )
                                toast.success('Transaction ID copied')
                              }}
                              className='px-2 py-1 bg-gray-100 border-t border-r border-b rounded-r hover:bg-gray-200'
                            >
                              <FaCopy size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                      <p className='text-sm mt-3'>
                        <span className='font-medium'>Payment Status:</span>{' '}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            selectedOrder.Payment?.paymentStatus === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : selectedOrder.Payment?.paymentStatus === 'FAILED'
                              ? 'bg-red-100 text-red-800'
                              : selectedOrder.Payment?.paymentStatus === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : selectedOrder.Payment?.paymentStatus === 'CANCELLED'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {selectedOrder.Payment?.paymentStatus}
                        </span>
                      </p>

                      {selectedOrder.amountPaidByCustomer && (
                        <p className='text-sm'>
                          <span className='font-medium'>Paid by Customer:</span>{' '}
                          {parseFloat(selectedOrder.amountPaidByCustomer).toFixed(2)}৳
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className='text-sm font-medium text-gray-700 mb-2'>Products</h3>
                <div className='border rounded-md divide-y'>
                  {selectedOrder.OrderProduct?.map(product => (
                    <div key={product.orderProductId} className='p-3 flex'>
                      {product.productImage && (
                        <img
                          src={product.productImage}
                          alt={product.productName}
                          className='w-16 h-16 object-cover rounded-md cursor-pointer'
                          onClick={() => {
                            setPreviewProductImage(product.productImage)
                            setPreviewProductName(product.productName)
                          }}
                        />
                      )}
                      <div className='ml-3 flex-1'>
                        <h4 className='text-sm font-medium'>
                          {product.productName} (#{product.productId})
                        </h4>
                        {product.productVariant &&
                          Object.entries(product.productVariant).length > 0 && (
                            <div className='mt-1'>
                              {Object.entries(product.productVariant).map(([key, value]) => (
                                <p key={key} className='text-xs text-gray-500'>
                                  {key}: {value}
                                </p>
                              ))}
                            </div>
                          )}
                        <div className='flex justify-between mt-1'>
                          <p className='text-sm'>
                            {parseFloat(product.productSellingPrice).toFixed(2)}৳ ×{' '}
                            {product.productQuantity}
                          </p>
                          <p className='text-sm font-medium'>
                            {parseFloat(product.totalProductSellingPrice).toFixed(2)}৳
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <h3 className='text-sm font-medium text-gray-700 mb-2'>Pricing Summary</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <p className='text-sm'>Total Product Price:</p>
                      <p className='text-sm'>
                        {parseFloat(selectedOrder.totalProductSellingPrice).toFixed(2)}৳
                      </p>
                    </div>
                    <div className='flex justify-between'>
                      <p className='text-sm'>Delivery Charge:</p>
                      <p className='text-sm'>
                        {parseFloat(selectedOrder.deliveryCharge).toFixed(2)}৳
                      </p>
                    </div>
                    <div className='flex justify-between border-t pt-2'>
                      <p className='text-sm font-medium'>Cash On Delivery Charge:</p>
                      <p className='text-sm font-medium'>
                        {parseFloat(selectedOrder.cashOnAmount || '0').toFixed(2)}৳
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className='text-sm font-medium text-gray-700 mb-2'>Commission</h3>
                  <div className='space-y-1'>
                    <p className='text-sm'>
                      <span className='font-medium'>Total Commission:</span>{' '}
                      {parseFloat(selectedOrder.totalCommission).toFixed(2)}৳
                    </p>
                    {selectedOrder.actualCommission && (
                      <p className='text-sm'>
                        <span className='font-medium'>Actual Commission:</span>{' '}
                        {parseFloat(selectedOrder.actualCommission).toFixed(2)}৳
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {selectedOrder.customerComments && (
                <div>
                  <h3 className='text-sm font-medium text-gray-700 mb-1'>Customer Comments</h3>
                  <p className='text-sm text-gray-900'>{selectedOrder.customerComments}</p>
                </div>
              )}

              {selectedOrder.cancelledReason && (
                <div>
                  <h3 className='text-sm font-medium text-gray-700 mb-1'>Cancellation Reason</h3>
                  <p className='text-sm text-gray-900'>{selectedOrder.cancelledReason}</p>
                </div>
              )}
            </div>

            <div className='p-4 border-t flex justify-end'>
              <button
                onClick={closeDetailsModal}
                className='px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedOrder && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50'>
          <div className='bg-white rounded-lg shadow-lg w-full max-w-full sm:max-w-md mx-2 sm:mx-0'>
            <div className='p-3 sm:p-4 border-b'>
              <h2 className='text-base sm:text-lg font-medium'>
                {currentAction === 'confirm' &&
                  (processingOrder ? 'Confirming Order...' : 'Confirm Order')}
                {currentAction === 'deliver' &&
                  (processingOrder ? 'Delivering Order...' : 'Deliver Order')}
                {currentAction === 'complete' &&
                  (processingOrder ? 'Completing Order...' : 'Complete Order')}
                {currentAction === 'cancel' &&
                  (processingOrder ? 'Cancelling Order...' : 'Cancel Order')}
                {currentAction === 'reorder' &&
                  (processingOrder ? 'Requesting Reorder...' : 'Request Reorder')}
                {currentAction === 'refund' &&
                  (processingOrder ? 'Processing Refund...' : 'Confirm Refund')}
                {currentAction === 'return' &&
                  (processingOrder ? 'Processing Return...' : 'Return Order')}
                {currentAction === 'fail' &&
                  (processingOrder ? 'Marking as Failed...' : 'Mark Order as Failed')}
              </h2>
            </div>

            <div className='p-3 sm:p-4 space-y-3 sm:space-y-4'>
              <div className='bg-gray-50 p-2 sm:p-3 rounded-md'>
                <div className='flex items-start'>
                  <div className='flex-shrink-0 mt-0.5'>
                    <svg
                      className='h-5 w-5 text-blue-400'
                      xmlns='http://www.w3.org/2000/svg'
                      viewBox='0 0 20 20'
                      fill='currentColor'
                    >
                      <path
                        fillRule='evenodd'
                        d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z'
                        clipRule='evenodd'
                      />
                    </svg>
                  </div>
                  <div className='ml-2 sm:ml-3'>
                    <h3 className='text-xs sm:text-sm font-medium text-gray-800'>
                      Order # {selectedOrder.orderId}
                    </h3>
                    <div className='mt-1 sm:mt-2 text-xs sm:text-sm text-gray-700'>
                      <p>
                        Customer: {selectedOrder.customerName} - {selectedOrder.customerPhoneNo}
                      </p>
                      <p className='mt-1'>
                        Total Amount:{' '}
                        {parseFloat(selectedOrder.totalProductSellingPrice).toFixed(2)}৳
                      </p>
                      <p className='mt-1'>
                        Minimum Amount:{' '}
                        {(
                          parseFloat(selectedOrder.totalProductBasePrice) +
                          parseFloat(selectedOrder.cashOnAmount || '0') -
                          parseFloat(selectedOrder.totalProductSellingPrice)
                        ).toFixed(2)}
                        ৳
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {actionError && (
                <div className='bg-red-50 p-2 sm:p-3 rounded-md'>
                  <div className='flex'>
                    <div className='ml-3'>
                      <div className='mt-1 text-xs sm:text-sm text-red-700'>
                        <p>{actionError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentAction === 'deliver' && (
                <div>
                  <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                    Tracking URL *
                  </label>
                  <input
                    type='text'
                    value={actionData.trackingUrl}
                    onChange={e => setActionData({ ...actionData, trackingUrl: e.target.value })}
                    placeholder='Enter tracking URL'
                    className='w-full px-2 sm:px-3 py-1 sm:py-2 border rounded-md text-xs sm:text-sm'
                    required
                  />
                </div>
              )}

              {currentAction === 'cancel' && (
                <div>
                  <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                    Reason *
                  </label>
                  <textarea
                    value={actionData.remarks}
                    onChange={e => setActionData({ ...actionData, remarks: e.target.value })}
                    placeholder='Enter reason for cancellation...'
                    rows={3}
                    className='w-full px-2 sm:px-3 py-1 sm:py-2 border rounded-md text-xs sm:text-sm'
                    required
                  />
                </div>
              )}

              {currentAction === 'complete' && (
                <div>
                  <label className='block text-xs sm:text-sm font-medium text-gray-700 mb-1'>
                    Amount Paid by Customer *
                  </label>
                  <input
                    type='number'
                    value={actionData.amountPaidByCustomer}
                    onChange={e =>
                      setActionData({ ...actionData, amountPaidByCustomer: e.target.value })
                    }
                    placeholder='Enter amount'
                    className='w-full px-2 sm:px-3 py-1 sm:py-2 border rounded-md text-xs sm:text-sm'
                    required
                  />
                </div>
              )}

              {(currentAction === 'return' ||
                currentAction === 'fail' ||
                currentAction === 'refund') && (
                <div
                  className={`p-2 sm:p-3 rounded-md border ${
                    currentAction === 'refund'
                      ? 'bg-yellow-50 border-yellow-200'
                      : currentAction === 'return'
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className='flex items-start'>
                    <div className='flex-shrink-0 pt-0.5'>
                      <svg
                        className={`h-4 sm:h-5 w-4 sm:w-5 ${
                          currentAction === 'refund'
                            ? 'text-yellow-400'
                            : currentAction === 'return'
                            ? 'text-orange-400'
                            : 'text-red-400'
                        }`}
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
                    <div className='ml-2 sm:ml-3'>
                      <h3
                        className={`text-xs sm:text-sm font-medium ${
                          currentAction === 'refund'
                            ? 'text-yellow-800'
                            : currentAction === 'return'
                            ? 'text-orange-800'
                            : 'text-red-800'
                        }`}
                      >
                        {currentAction === 'refund' && 'Refund Confirmation'}
                        {currentAction === 'return' && 'Return Confirmation'}
                        {currentAction === 'fail' && 'Mark as Failed'}
                      </h3>
                      <div
                        className={`mt-1 text-xs sm:text-sm ${
                          currentAction === 'refund'
                            ? 'text-yellow-700'
                            : currentAction === 'return'
                            ? 'text-orange-700'
                            : 'text-red-700'
                        }`}
                      >
                        <p>
                          {currentAction === 'refund' &&
                            'আপনি কি নিশ্চিত যে আপনি এই অর্ডারটি রিফান্ড করতে চান?'}
                          {currentAction === 'return' &&
                            'আপনি কি নিশ্চিত যে আপনি এই অর্ডারটি রিটার্ন হিসেবে চিহ্নিত করতে চান?'}
                          {currentAction === 'fail' &&
                            'আপনি কি নিশ্চিত যে এই অর্ডারটি ত্রুটিপূর্ণ?'}
                        </p>
                        {currentAction === 'refund' &&
                          selectedOrder.Payment?.paymentStatus === 'COMPLETED' && (
                            <p className='mt-1'>
                              {selectedOrder.orderType === 'SELLER_ORDER'
                                ? 'সেলারকে'
                                : 'কাস্টমারকে'}{' '}
                              {parseFloat(selectedOrder.deliveryCharge).toFixed(2)}৳ রিফান্ড করা
                              হবে।
                            </p>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className='p-3 sm:p-4 border-t flex justify-end gap-2 sm:gap-3'>
              <button
                onClick={closeActionModal}
                disabled={processingOrder}
                className='px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50'
              >
                Cancel
              </button>
              <button
                onClick={handleActionSubmit}
                disabled={processingOrder}
                className={`px-3 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-white rounded-md hover:opacity-90 disabled:opacity-50 flex items-center justify-center min-w-20 sm:min-w-24 ${
                  currentAction === 'refund' ||
                  currentAction === 'fail' ||
                  currentAction === 'cancel' ||
                  currentAction === 'return'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {processingOrder ? (
                  <FaSpinner className='animate-spin' />
                ) : (
                  <>
                    {currentAction === 'confirm' && 'Confirm'}
                    {currentAction === 'deliver' && 'Deliver'}
                    {currentAction === 'complete' && 'Complete'}
                    {currentAction === 'cancel' && 'Cancel Order'}
                    {currentAction === 'reorder' && 'Reorder'}
                    {currentAction === 'refund' && 'Confirm Refund'}
                    {currentAction === 'return' && 'Confirm Return'}
                    {currentAction === 'fail' && 'Mark as Failed'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {previewProductImage && (
        <ProductImagePreviewModal
          imageUrl={previewProductImage}
          productName={previewProductName}
          onClose={() => {
            setPreviewProductImage(null)
            setPreviewProductName('')
          }}
        />
      )}
    </div>
  )
}

export default AdminOrders
