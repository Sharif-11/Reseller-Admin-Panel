import { useEffect, useState } from 'react'
import { FiArchive, FiImage, FiMapPin, FiRefreshCw, FiSearch, FiX } from 'react-icons/fi'
import { productService } from '../Api/product.api'

interface Product {
  productId: number
  name: string
  description: string
  basePrice: number
  suggestedMaxPrice: number
  videoUrl: string | null
  published: boolean
  archived: boolean
  ProductImage: {
    imageUrl: string
  }[]
  shop: {
    shopId: number
    shopName: string
    shopLocation: string
  }
  category?: {
    categoryId: number
    name: string
  }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ArchivedProducts = () => {
  const [archivedProducts, setArchivedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [restoringProduct, setRestoringProduct] = useState<number | null>(null)
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [productToRestore, setProductToRestore] = useState<number | null>(null)

  // Fetch archived products
  const fetchArchivedProducts = async () => {
    setLoading(true)
    try {
      const { response } = await productService.getArchivedProducts({
        search: searchTerm || undefined,
        page: pagination.page,
        limit: pagination.limit,
      })
      console.log(response)
      const { success, data, pagination: paginationResponse } = response

      if (success) {
        console.log({ data, paginationResponse })
        setArchivedProducts(data || [])
        setPagination(prev => ({
          ...prev,
          total: paginationResponse!.total || 0,
          totalPages: paginationResponse!.totalPages || 1,
        }))
      }

      if (success) {
        console.log({ data, paginationResponse })
        setArchivedProducts(data || [])
        setPagination(prev => ({
          ...prev,
          total: paginationResponse!.total || 0,
          totalPages: paginationResponse!.totalPages || 1,
        }))
      }
    } catch (error) {
      console.error('Failed to fetch archived products', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArchivedProducts()
  }, [searchTerm, pagination.page])

  // Restore product function
  const restoreProduct = async (productId: number) => {
    try {
      setRestoringProduct(productId)
      const response = await productService.restoreProduct(productId)
      if (response.success) {
        // Remove the restored product from the list
        setArchivedProducts(prev => prev.filter(p => p.productId !== productId))
        setShowRestoreConfirm(false)
        setProductToRestore(null)

        // Update pagination total
        setPagination(prev => ({
          ...prev,
          total: prev.total - 1,
        }))
      }
    } catch (error) {
      console.error('Failed to restore product', error)
    } finally {
      setRestoringProduct(null)
    }
  }

  const confirmRestore = (productId: number) => {
    setProductToRestore(productId)
    setShowRestoreConfirm(true)
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when searching
  }

  const clearSearch = () => {
    setSearchTerm('')
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4 md:p-6'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>Archived Products</h1>
        <p className='text-gray-600 mt-1'>Manage and restore archived products</p>
      </div>

      {/* Search Bar */}
      <div className='mb-6'>
        <div className='relative max-w-md'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <FiSearch className='text-gray-400' />
          </div>
          <input
            type='text'
            placeholder='Search archived products...'
            className='block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
            value={searchTerm}
            onChange={handleSearch}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className='absolute inset-y-0 right-0 pr-3 flex items-center'
            >
              <FiX className='text-gray-400 hover:text-gray-600' />
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500'></div>
        </div>
      )}

      {/* Archived products list */}
      {!loading && (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {archivedProducts.map(product => (
              <div
                key={product.productId}
                className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden opacity-70'
              >
                <div className='aspect-square bg-gray-100 relative overflow-hidden'>
                  {product.ProductImage.length > 0 ? (
                    <img
                      src={product.ProductImage[0].imageUrl}
                      alt={product.name}
                      className='w-full h-full object-cover'
                    />
                  ) : (
                    <div className='w-full h-full flex items-center justify-center text-gray-400'>
                      <FiImage size={48} />
                    </div>
                  )}
                </div>
                <div className='p-4'>
                  {/* Shop Info */}
                  <div className='mb-3'>
                    <h4 className='font-medium text-gray-800'>{product.shop.shopName}</h4>
                    <div className='flex items-start text-gray-500 text-sm mt-1'>
                      <FiMapPin className='mt-0.5 mr-1 flex-shrink-0' />
                      <span className='line-clamp-1'>{product.shop.shopLocation}</span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <h3 className='font-medium text-gray-800 truncate'>{product.name}</h3>
                  <p className='text-lg font-semibold text-indigo-600 mt-1'>
                    {product.basePrice} Tk
                  </p>

                  {/* Restore Button */}
                  <div className='mt-3 flex justify-center'>
                    <button
                      onClick={() => confirmRestore(product.productId)}
                      disabled={restoringProduct === product.productId}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md ${
                        restoringProduct === product.productId
                          ? 'bg-gray-300 text-gray-600'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {restoringProduct === product.productId ? (
                        <>
                          <div className='animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-600'></div>
                          Restoring...
                        </>
                      ) : (
                        <>
                          <FiRefreshCw size={16} />
                          Restore
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {!loading && archivedProducts.length === 0 && (
            <div className='text-center py-12'>
              <div className='text-gray-400 mb-4'>
                <FiArchive size={64} className='mx-auto' />
              </div>
              <p className='text-gray-500 text-lg mb-2'>No archived products found</p>
              <p className='text-gray-400 text-sm'>
                {searchTerm ? 'Try a different search term' : 'All products are currently active'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className='mt-8 flex justify-center'>
              <nav className='flex items-center space-x-2'>
                <button
                  onClick={() =>
                    setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                  }
                  disabled={pagination.page === 1}
                  className='px-3 py-2 rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
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
                      onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                      className={`px-4 py-2 rounded-md ${
                        pagination.page === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <button
                  onClick={() =>
                    setPagination(prev => ({
                      ...prev,
                      page: Math.min(pagination.totalPages, prev.page + 1),
                    }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className='px-3 py-2 rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && productToRestore && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-md'>
            <div className='p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>রিস্টোর প্রোডাক্ট</h3>
              <p className='text-gray-600 mb-6'>
                আপনি কি নিশ্চিত যে আপনি এই পণ্যটি রিস্টোর করতে চান? এটি আবার তালিকায় দৃশ্যমান হবে।
              </p>
              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => setShowRestoreConfirm(false)}
                  className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
                >
                  ক্যানসেল
                </button>
                <button
                  onClick={() => restoreProduct(productToRestore)}
                  disabled={restoringProduct === productToRestore}
                  className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50'
                >
                  {restoringProduct === productToRestore ? 'রিস্টোর করা হচ্ছে...' : 'রিস্টোর করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ArchivedProducts
