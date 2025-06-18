import { useEffect, useState } from 'react'
import {
  FiChevronRight,
  FiEdit,
  FiEye,
  FiEyeOff,
  FiImage,
  FiMapPin,
  FiPlus,
  FiSearch,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { productService } from '../Api/product.api'
import { shopApiService } from '../Api/shop.api'

interface Shop {
  shopId: number
  shopName: string
  isActive: boolean
  shopLocation: string
}

interface Product {
  productId: number
  name: string
  basePrice: number
  published: boolean
  ProductImage: {
    imageUrl: string
  }[]
}

const ProductListing = () => {
  const navigate = useNavigate()
  const [shops, setShops] = useState<Shop[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })

  // Fetch all shops
  useEffect(() => {
    const fetchShops = async () => {
      setLoading(true)
      try {
        const response = await shopApiService.getAllShopsForAdmin()
        if (response.success) {
          setShops(response.data?.shops || [])
        }
      } finally {
        setLoading(false)
      }
    }
    fetchShops()
  }, [])

  // Fetch products when shop is selected
  useEffect(() => {
    if (selectedShop) {
      const fetchProducts = async () => {
        setLoading(true)
        try {
          const response = await productService.getAllProductsForAdmin(
            {
              search: searchTerm,
              shopId: selectedShop.shopId,
            },
            {
              page: pagination.page,
              limit: pagination.limit,
            }
          )
          if (response.success) {
            setProducts(response.data?.products || [])
            setPagination(prev => ({
              ...prev,
              total: response.data.pagination.total || 0,
              totalPages: response.data.pagination.totalPages || 1,
            }))
          }
        } finally {
          setLoading(false)
        }
      }
      fetchProducts()
    }
  }, [selectedShop, searchTerm, pagination.page])

  const handleBack = () => {
    setSelectedShop(null)
  }

  const togglePublishStatus = async (productId: number, currentStatus: boolean) => {
    try {
      await productService.togglePublishStatus(productId, !currentStatus)
      setProducts(
        products.map(p => (p.productId === productId ? { ...p, published: !currentStatus } : p))
      )
    } catch (error) {
      console.error('Failed to toggle publish status', error)
    }
  }

  const getShopLocation = (shop: Shop) => {
    return shop.shopLocation
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4 md:p-6'>
      {/* Header with back button and title */}
      <div className='mb-6 flex items-center'>
        {selectedShop && (
          <button onClick={handleBack} className='mr-4 p-2 rounded-full hover:bg-gray-200'>
            <FiChevronRight className='transform rotate-180 text-gray-600' />
          </button>
        )}
        <h1 className='text-2xl font-bold text-gray-800'>
          {selectedShop ? `${selectedShop.shopName} Products` : 'All Shops'}
        </h1>
      </div>

      {/* Search bar (only when shop is selected) */}
      {selectedShop && (
        <div className='mb-6 relative'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <FiSearch className='text-gray-400' />
          </div>
          <input
            type='text'
            placeholder='Search products...'
            className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500'></div>
        </div>
      )}

      {/* Shops list */}
      {!loading && !selectedShop && (
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {shops.map(shop => (
            <div
              key={shop.shopId}
              onClick={() => setSelectedShop(shop)}
              className={`p-4 rounded-lg shadow-sm border cursor-pointer transition-all hover:shadow-md ${
                shop.isActive ? 'bg-white border-green-100' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className='flex justify-between items-start'>
                <h3 className='text-lg font-medium text-gray-800'>{shop.shopName}</h3>
                <span
                  className={`px-2 py-1 text-xs rounded-full ${
                    shop.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {shop.isActive ? 'Open' : 'Closed'}
                </span>
              </div>
              {shop.shopLocation && (
                <div className='mt-2 flex items-start text-gray-500 text-sm'>
                  <FiMapPin className='mt-0.5 mr-1 flex-shrink-0' />
                  <span className='line-clamp-2'>{getShopLocation(shop)}</span>
                </div>
              )}
              <div className='mt-3 flex items-center text-gray-500'>
                <span className='text-sm'>View products</span>
                <FiChevronRight className='ml-1' />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Products list */}
      {!loading && selectedShop && (
        <>
          <div className='mb-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
            <h3 className='font-medium text-gray-800 mb-2'>Shop Location</h3>
            <div className='flex items-start text-gray-600'>
              <FiMapPin className='mt-0.5 mr-2 flex-shrink-0' />
              <span>{getShopLocation(selectedShop) || 'No address provided'}</span>
            </div>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {products.map(product => (
              <div
                key={product.productId}
                className='bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden'
              >
                <div className='aspect-square bg-gray-100 relative'>
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
                  <h3 className='font-medium text-gray-800 truncate'>{product.name}</h3>
                  <p className='text-lg font-semibold text-indigo-600 mt-1'>
                    {product.basePrice} Tk
                  </p>
                  <div className='mt-3 flex justify-between space-x-2'>
                    <button
                      onClick={() => togglePublishStatus(product.productId, product.published)}
                      className={`p-2 rounded-full ${
                        product.published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      } hover:opacity-80`}
                    >
                      {product.published ? <FiEye /> : <FiEyeOff />}
                    </button>
                    <button
                      onClick={() => navigate(`/products/edit/${product.productId}`)}
                      className='p-2 rounded-full bg-blue-100 text-blue-700 hover:opacity-80'
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => navigate(`/products/${product.productId}/images`)}
                      className='p-2 rounded-full bg-purple-100 text-purple-700 hover:opacity-80'
                    >
                      <FiImage />
                    </button>
                    <button
                      onClick={() => navigate(`/products/${product.productId}/features`)}
                      className='p-2 rounded-full bg-yellow-100 text-yellow-700 hover:opacity-80'
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className='mt-8 flex justify-center'>
              <nav className='flex items-center space-x-2'>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setPagination(prev => ({ ...prev, page }))}
                    className={`px-4 py-2 rounded-md ${
                      pagination.page === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </nav>
            </div>
          )}
        </>
      )}

      {/* Empty states */}
      {!loading && !selectedShop && shops.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-gray-500'>No shops found</p>
        </div>
      )}
      {!loading && selectedShop && products.length === 0 && (
        <div className='text-center py-12'>
          <p className='text-gray-500'>No products found in this shop</p>
        </div>
      )}
    </div>
  )
}

export default ProductListing
