import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { transactionApi } from '../Api/transaction.api'

interface Transaction {
  id: string
  createdAt: string
  userId: string
  userName: string
  userPhoneNo: string
  amount: string
  reason: string
  reference: any | null
}

interface TransactionResponse {
  transactions: Transaction[]
  totalCount: number
  currentPage: number
  pageSize: number
  totalRevenue: number
  totalCredit: number
  totalDebit: number
}

const AdminBalanceStatement = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [, setSummary] = useState({
    totalRevenue: 0,
    totalCredit: 0,
    totalDebit: 0,
  })
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)

  const fetchTransactions = async (page: number = 1, isLoadMore: boolean = false) => {
    if (isLoadMore) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }

    try {
      const response = await transactionApi.getTransactions({
        page,
        limit: 10, // Fixed page size for infinite scroll
        search: searchTerm,
      })

      if (response.success && response.data) {
        const data = response.data as TransactionResponse

        if (isLoadMore) {
          setTransactions(prev => [...prev, ...data.transactions])
        } else {
          setTransactions(data.transactions)
        }

        setCurrentPage(data.currentPage)
        setTotalCount(data.totalCount)
        setHasMore(
          data.transactions.length > 0 && data.currentPage * data.pageSize < data.totalCount
        )
        setSummary({
          totalRevenue: data.totalRevenue,
          totalCredit: data.totalCredit,
          totalDebit: data.totalDebit,
        })
      } else {
        toast.error(response.message || 'Failed to load transactions')
      }
    } catch (error) {
      toast.error('Error fetching transactions')
      console.error('Transactions fetch error:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTransactions([])
      setCurrentPage(1)
      setHasMore(true)
      fetchTransactions(1, false)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Initial load
  useEffect(() => {
    fetchTransactions(1, false)
  }, [])

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (loading || loadingMore || !hasMore) return

    const { scrollTop, scrollHeight, clientHeight } = document.documentElement

    // Load more when user is 100px from bottom
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      fetchTransactions(currentPage + 1, true)
    }
  }, [loading, loadingMore, hasMore, currentPage])

  // Add scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const showTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
  }

  const closeModal = () => {
    setSelectedTransaction(null)
  }

  const renderReferenceInfo = (reference: any) => {
    if (!reference) return 'N/A'

    if (typeof reference === 'object') {
      return (
        <div className='space-y-1'>
          {reference.seller && <p className='text-gray-900'>সেলার: {reference.seller}</p>}
          {reference.level && <p className='text-gray-900'>রেফারেল লেভেল: {reference.level}</p>}
        </div>
      )
    }

    return <p className='text-gray-900'>{reference}</p>
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className='px-4 py-6 max-w-7xl mx-auto'>
      <h1 className='text-xl font-bold mb-4 md:text-2xl md:mb-6'>ব্যালেন্স স্টেটমেন্ট</h1>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <div className='bg-white rounded-lg shadow p-4'>
          <h2 className='text-sm font-medium text-gray-700'>মোট লেনদেন</h2>
          <p className='text-xl font-bold'>{totalCount}</p>
        </div>
      </div>

      {/* Transaction History */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        {/* Search Section */}
        <div className='p-3 md:p-4 border-b'>
          <div className='relative'>
            <input
              type='text'
              placeholder='ব্যবহারকারীর নাম, ফোন বা কারণ দিয়ে খুঁজুন'
              className='pl-8 pr-3 py-2 border rounded-md text-xs md:text-sm w-full'
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
        </div>

        {loading && transactions.length === 0 ? (
          <div className='flex justify-center items-center h-64'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500'></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className='p-6 text-center'>
            <p className='text-gray-500 text-xs md:text-sm'>
              {searchTerm
                ? 'আপনার সার্চের সাথে মিলে এমন কোনো লেনদেন পাওয়া যায়নি'
                : 'কোনো লেনদেন পাওয়া যায়নি'}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile View - Card */}
            <div className='md:hidden space-y-2 p-2'>
              {transactions.map(tx => (
                <div
                  key={tx.id}
                  className='border rounded-lg p-2 text-xs cursor-pointer hover:bg-gray-50'
                  onClick={() => showTransactionDetails(tx)}
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <p className='text-gray-500 text-xxs'>{formatDate(tx.createdAt)}</p>
                      <h3 className='font-medium text-xs'>{tx.reason}</h3>
                    </div>
                  </div>

                  <div className='mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xxs'>
                    <div>
                      <p className='text-gray-500'>পরিমাণ:</p>
                      <p
                        className={`font-medium ${
                          parseFloat(tx.amount) < 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {parseFloat(tx.amount) > 0 ? '+' : ''}
                        {parseFloat(tx.amount).toFixed(2)}৳
                      </p>
                    </div>
                    <div>
                      <p className='text-gray-500'>ইউজার</p>
                      <p className='font-medium'>
                        {tx.userName}({tx.userPhoneNo})
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View - Table */}
            <div className='hidden md:block overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200 text-sm'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                      তারিখ
                    </th>
                    <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                      পরিমাণ
                    </th>
                    <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                      কারণ
                    </th>
                    <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                      ব্যবহারকারী
                    </th>
                    <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                      ফোন
                    </th>
                    <th className='px-4 py-3 text-left font-medium text-gray-500 uppercase tracking-wider'>
                      বিস্তারিত
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {transactions.map(tx => (
                    <tr key={tx.id}>
                      <td className='px-4 py-4 whitespace-nowrap text-gray-500'>
                        {formatDate(tx.createdAt)}
                      </td>
                      <td
                        className={`px-4 py-4 whitespace-nowrap font-medium ${
                          parseFloat(tx.amount) < 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {parseFloat(tx.amount) > 0 ? '+' : ''}
                        {parseFloat(tx.amount).toFixed(2)}৳
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-gray-900 truncate'>
                        {tx.reason}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap text-gray-500'>{tx.userName}</td>
                      <td className='px-4 py-4 whitespace-nowrap text-gray-500'>
                        {tx.userPhoneNo}
                      </td>
                      <td className='px-4 py-4 whitespace-nowrap'>
                        <button
                          onClick={() => showTransactionDetails(tx)}
                          className='text-blue-600 hover:text-blue-800 text-sm font-medium'
                        >
                          দেখুন
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className='flex justify-center items-center py-4'>
                <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500'></div>
                <span className='ml-2 text-sm text-gray-600'>আরো লোড হচ্ছে...</span>
              </div>
            )}

            {/* No More Data Indicator */}
            {!hasMore && transactions.length > 0 && (
              <div className='text-center py-4 border-t'>
                <p className='text-sm text-gray-500'></p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-lg w-full max-w-md'>
            <div className='p-3 md:p-4 border-b'>
              <h2 className='text-base md:text-lg font-medium'>লেনদেনের বিস্তারিত</h2>
            </div>

            <div className='p-3 md:p-4 space-y-3 text-xs md:text-sm'>
              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <p className='font-medium text-gray-700'>তারিখ:</p>
                  <p className='mt-1 text-gray-900'>{formatDate(selectedTransaction.createdAt)}</p>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <p className='font-medium text-gray-700'>পরিমাণ:</p>
                  <p
                    className={`mt-1 font-medium ${
                      parseFloat(selectedTransaction.amount) < 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {parseFloat(selectedTransaction.amount) > 0 ? '+' : ''}
                    {parseFloat(selectedTransaction.amount).toFixed(2)}৳
                  </p>
                </div>
                <div>
                  <p className='font-medium text-gray-700'>কারণ:</p>
                  <p className='mt-1 text-gray-900'>{selectedTransaction.reason}</p>
                </div>
              </div>

              <div>
                <p className='font-medium text-gray-700'>ইউজার:</p>
                <p className='mt-1 text-gray-900'>{`${selectedTransaction.userName}(${selectedTransaction.userPhoneNo})`}</p>
              </div>

              {selectedTransaction.reference && (
                <div>
                  <p className='font-medium text-gray-700'>রেফারেন্স তথ্য:</p>
                  <div className='mt-1 p-2 bg-gray-50 rounded-md'>
                    {renderReferenceInfo(selectedTransaction.reference)}
                  </div>
                </div>
              )}
            </div>

            <div className='p-3 md:p-4 border-t flex justify-end'>
              <button
                onClick={closeModal}
                className='px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200'
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBalanceStatement
