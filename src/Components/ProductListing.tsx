import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import {
  FiChevronDown,
  FiChevronRight,
  FiEdit,
  FiEye,
  FiEyeOff,
  FiImage,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import { productService } from '../Api/product.api'
import { shopApiService } from '../Api/shop.api'

interface Shop {
  shopId: number
  shopName: string
  shopLocation: string
}

interface Product {
  productId: number
  name: string
  description: string
  basePrice: number
  suggestedMaxPrice: number
  published: boolean
  ProductImage: {
    imageUrl: string
  }[]
  shop: Shop
}

interface ProductUpdateData {
  name?: string
  description?: string
  basePrice?: number
  suggestedMaxPrice?: number
}

interface FilterOptions {
  search?: string
  shopId?: number
  published?: boolean
}

interface Variant {
  name: string
  value: string
}

interface VariantGroup {
  name: string
  values: string[]
}

const ProductListing = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [shops, setShops] = useState<Shop[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>({})
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)
  const [productToToggle, setProductToToggle] = useState<{
    productId: number
    currentStatus: boolean
  } | null>(null)
  const [showFeatureModal, setShowFeatureModal] = useState(false)
  const [variants, setVariants] = useState<VariantGroup[]>([])
  const [newVariantName, setNewVariantName] = useState('')
  const [newVariantValue, setNewVariantValue] = useState('')
  const [selectedVariantForValue, setSelectedVariantForValue] = useState('')

  // Form validation schema
  const validationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Product name is required')
      .min(3, 'Product name must be at least 3 characters'),
    description: Yup.string()
      .required('Product description is required')
      .min(10, 'Product description must be at least 10 characters'),
    basePrice: Yup.number().required('Price is required').min(0, 'Price must be zero or greater'),
    suggestedMaxPrice: Yup.number()
      .required('Suggested max price is required')
      .min(Yup.ref('basePrice'), 'Suggested max price must be greater than or equal to base price'),
  })

  // Formik form handler
  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      basePrice: 0,
      suggestedMaxPrice: 0,
    },
    validationSchema,
    onSubmit: async values => {
      try {
        if (!selectedProduct) return

        const updateData: ProductUpdateData = {
          name: values.name,
          description: values.description,
          basePrice: values.basePrice,
          suggestedMaxPrice: values.suggestedMaxPrice,
        }

        const response = await productService.updateProduct(selectedProduct.productId, updateData)
        if (response.success) {
          setProducts(
            products.map(p =>
              p.productId === selectedProduct.productId ? { ...p, ...updateData } : p
            )
          )
          setIsEditModalOpen(false)
        }
      } catch (error) {
        console.error('Failed to update product', error)
      }
    },
  })

  // Fetch all shops for filter dropdown
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await shopApiService.getAllShopsForAdmin()
        if (response.success) {
          setShops(response.data?.shops || [])
        }
      } catch (error) {
        console.error('Failed to fetch shops', error)
      }
    }
    fetchShops()
  }, [])

  // Fetch products with filters and pagination
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const response = await productService.getAllProductsForAdmin(
          {
            search: filters.search,
            shopId: filters.shopId,
            published: filters.published,
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
      } catch (error) {
        console.error('Failed to fetch products', error)
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [filters, pagination.page])

  // Fetch variants when feature modal is opened
  useEffect(() => {
    const fetchVariants = async () => {
      if (showFeatureModal && selectedProduct) {
        try {
          const response = await productService.getProductVariants(selectedProduct.productId)
          if (response.success) {
            const variantGroups = Object.entries(response.data ?? {}).map(([name, values]) => ({
              name,
              values,
            }))
            setVariants(variantGroups)
          }
        } catch (error) {
          console.error('Failed to fetch variants', error)
        }
      }
    }
    fetchVariants()
  }, [showFeatureModal, selectedProduct])

  const togglePublishStatus = async (productId: number, currentStatus: boolean) => {
    try {
      await productService.togglePublishStatus(productId, !currentStatus)
      setProducts(
        products.map(p => (p.productId === productId ? { ...p, published: !currentStatus } : p))
      )
      setShowPublishConfirm(false)
    } catch (error) {
      console.error('Failed to toggle publish status', error)
    }
  }

  const confirmTogglePublish = (productId: number, currentStatus: boolean) => {
    setProductToToggle({ productId, currentStatus })
    setShowPublishConfirm(true)
  }

  const openEditModal = (product: Product) => {
    setSelectedProduct(product)
    formik.setValues({
      name: product.name,
      description: product.description,
      basePrice: product.basePrice,
      suggestedMaxPrice: product.suggestedMaxPrice,
    })
    setIsEditModalOpen(true)
  }

  const openFeatureModal = (product: Product) => {
    setSelectedProduct(product)
    setShowFeatureModal(true)
  }

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({})
  }

  const addVariant = () => {
    if (newVariantName.trim() && !variants.some(v => v.name === newVariantName)) {
      setVariants([...variants, { name: newVariantName, values: [] }])
      setNewVariantName('')
    }
  }

  const removeVariant = (variantName: string) => {
    setVariants(variants.filter(v => v.name !== variantName))
  }

  const addVariantValue = () => {
    if (selectedVariantForValue && newVariantValue.trim()) {
      setVariants(
        variants.map(v =>
          v.name === selectedVariantForValue ? { ...v, values: [...v.values, newVariantValue] } : v
        )
      )
      setNewVariantValue('')
    }
  }

  const removeVariantValue = (variantName: string, value: string) => {
    setVariants(
      variants.map(v =>
        v.name === variantName ? { ...v, values: v.values.filter(val => val !== value) } : v
      )
    )
  }

  const saveVariants = async () => {
    if (!selectedProduct) return

    const variantData: Variant[] = variants.flatMap(variant =>
      variant.values.map(value => ({
        name: variant.name,
        value,
      }))
    )

    try {
      const response = await productService.replaceVariants(selectedProduct.productId, variantData)
      if (response.success) {
        setShowFeatureModal(false)
      }
    } catch (error) {
      console.error('Failed to save variants', error)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4 md:p-6'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>All Products</h1>
      </div>

      {/* Search and Filter Bar */}
      <div className='mb-6'>
        <div className='flex flex-col md:flex-row gap-4'>
          <div className='relative flex-grow'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <FiSearch className='text-gray-400' />
            </div>
            <input
              type='text'
              placeholder='Search products...'
              className='block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
              value={filters.search || ''}
              onChange={e => handleFilterChange('search', e.target.value)}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className='flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50'
          >
            Filters {showFilters ? <FiChevronDown /> : <FiChevronRight />}
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className='mt-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {/* Shop Filter */}
              <div>
                <label
                  htmlFor='shopFilter'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Shop
                </label>
                <select
                  id='shopFilter'
                  className='block w-full border rounded-md py-2 px-3 focus:outline-none border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  value={filters.shopId || ''}
                  onChange={e =>
                    handleFilterChange(
                      'shopId',
                      e.target.value ? Number(e.target.value) : undefined
                    )
                  }
                >
                  <option value=''>All Shops</option>
                  {shops.map(shop => (
                    <option key={shop.shopId} value={shop.shopId}>
                      {shop.shopName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Published Status Filter */}
              <div>
                <label
                  htmlFor='statusFilter'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Status
                </label>
                <select
                  id='statusFilter'
                  className='block w-full border rounded-md py-2 px-3 focus:outline-none border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  value={
                    filters.published === undefined
                      ? ''
                      : filters.published
                      ? 'published'
                      : 'unpublished'
                  }
                  onChange={e =>
                    handleFilterChange(
                      'published',
                      e.target.value === '' ? undefined : e.target.value === 'published'
                    )
                  }
                >
                  <option value=''>All Statuses</option>
                  <option value='published'>Published</option>
                  <option value='unpublished'>Unpublished</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              <div className='flex items-end'>
                <button
                  onClick={clearFilters}
                  className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500'
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500'></div>
        </div>
      )}

      {/* Products list */}
      {!loading && (
        <>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'>
            {products.map(product => (
              <div
                key={product.productId}
                className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden transition-opacity ${
                  !product.published ? 'opacity-70' : 'opacity-100'
                }`}
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
                  <div className='mt-3 flex justify-between space-x-2'>
                    <button
                      onClick={() => confirmTogglePublish(product.productId, product.published)}
                      className={`p-2 rounded-full ${
                        product.published
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      } hover:opacity-80`}
                    >
                      {product.published ? <FiEye /> : <FiEyeOff />}
                    </button>
                    <button
                      onClick={() => openEditModal(product)}
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
                      onClick={() => openFeatureModal(product)}
                      className='p-2 rounded-full bg-yellow-100 text-yellow-700 hover:opacity-80'
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {!loading && products.length === 0 && (
            <div className='text-center py-12'>
              <p className='text-gray-500'>No products found matching your criteria</p>
            </div>
          )}

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

      {/* Publish/Unpublish Confirmation Modal */}
      {showPublishConfirm && productToToggle && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-md'>
            <div className='p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>
                {productToToggle.currentStatus
                  ? 'আপনি কি এই পণ্যটি আনপাবলিশ করতে চান?'
                  : 'আপনি কি এই পণ্যটি পাবলিশ করতে চান?'}
              </h3>
              <p className='text-gray-600 mb-6'>
                {productToToggle.currentStatus
                  ? 'এই পণ্যটি গ্রাহকদের কাছে দেখা যাবে না।'
                  : 'এই পণ্যটি গ্রাহকদের কাছে দেখা যাবে।'}
              </p>
              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => setShowPublishConfirm(false)}
                  className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
                >
                  বাতিল
                </button>
                <button
                  onClick={() =>
                    togglePublishStatus(productToToggle.productId, productToToggle.currentStatus)
                  }
                  className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                >
                  নিশ্চিত করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && selectedProduct && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto'>
            {/* Modal Header */}
            <div className='flex justify-between items-center border-b p-4'>
              <h2 className='text-xl font-semibold text-gray-800'>Edit Product</h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className='text-gray-500 hover:text-gray-700'
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className='p-4'>
              <form onSubmit={formik.handleSubmit}>
                {/* Product Name */}
                <div className='mb-4'>
                  <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-1'>
                    প্রোডাক্টের নাম *
                  </label>
                  <input
                    type='text'
                    id='name'
                    name='name'
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.name}
                    className={`block w-full border rounded-md py-2 px-3 focus:outline-none ${
                      formik.touched.name && formik.errors.name
                        ? 'border-red-500'
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                  {formik.touched.name && formik.errors.name && (
                    <p className='mt-1 text-sm text-red-600'>{formik.errors.name}</p>
                  )}
                </div>

                {/* Product Description */}
                <div className='mb-4'>
                  <label
                    htmlFor='description'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    প্রোডাক্টের বিবরণ *
                  </label>
                  <textarea
                    id='description'
                    name='description'
                    rows={4}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.description}
                    className={`block w-full border rounded-md py-2 px-3 focus:outline-none ${
                      formik.touched.description && formik.errors.description
                        ? 'border-red-500'
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                  {formik.touched.description && formik.errors.description && (
                    <p className='mt-1 text-sm text-red-600'>{formik.errors.description}</p>
                  )}
                </div>

                {/* Base Price */}
                <div className='mb-4'>
                  <label
                    htmlFor='basePrice'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    পাইকারি মূল্য *
                  </label>
                  <input
                    type='number'
                    id='basePrice'
                    name='basePrice'
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.basePrice}
                    min='0'
                    step='0.01'
                    className={`block w-full border rounded-md py-2 px-3 focus:outline-none ${
                      formik.touched.basePrice && formik.errors.basePrice
                        ? 'border-red-500'
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                  {formik.touched.basePrice && formik.errors.basePrice && (
                    <p className='mt-1 text-sm text-red-600'>{formik.errors.basePrice}</p>
                  )}
                </div>

                {/* Suggested Max Price */}
                <div className='mb-6'>
                  <label
                    htmlFor='suggestedMaxPrice'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    সর্বোচ্চ পাইকারি মূল্য *
                  </label>
                  <input
                    type='number'
                    id='suggestedMaxPrice'
                    name='suggestedMaxPrice'
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.suggestedMaxPrice}
                    min={formik.values.basePrice}
                    step='0.01'
                    className={`block w-full border rounded-md py-2 px-3 focus:outline-none ${
                      formik.touched.suggestedMaxPrice && formik.errors.suggestedMaxPrice
                        ? 'border-red-500'
                        : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    }`}
                  />
                  {formik.touched.suggestedMaxPrice && formik.errors.suggestedMaxPrice && (
                    <p className='mt-1 text-sm text-red-600'>{formik.errors.suggestedMaxPrice}</p>
                  )}
                </div>

                {/* Modal Footer */}
                <div className='flex justify-end space-x-3 border-t pt-4'>
                  <button
                    type='button'
                    onClick={() => setIsEditModalOpen(false)}
                    className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50'
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={formik.isSubmitting}
                    className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
                  >
                    {formik.isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Feature Management Modal */}
      {showFeatureModal && selectedProduct && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
            <div className='flex justify-between items-center border-b p-4'>
              <h2 className='text-xl font-semibold text-gray-800'>
                Manage Features for {selectedProduct.name}
              </h2>
              <button
                onClick={() => setShowFeatureModal(false)}
                className='text-gray-500 hover:text-gray-700'
              >
                <FiX size={24} />
              </button>
            </div>

            <div className='p-4'>
              {/* Add New Feature Section */}
              <div className='mb-6 border-b pb-4'>
                <h3 className='text-lg font-medium text-gray-800 mb-3'>Add New Feature</h3>
                <div className='flex flex-col md:flex-row gap-3'>
                  <div className='flex-grow'>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Feature Name
                    </label>
                    <div className='flex gap-2'>
                      <select
                        value={newVariantName}
                        onChange={e => setNewVariantName(e.target.value)}
                        className='block w-full border rounded-md py-2 px-3 focus:outline-none border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                      >
                        <option value=''>Select or type</option>
                        <option value='Color'>Color</option>
                        <option value='Size'>Size</option>
                      </select>
                      <input
                        type='text'
                        placeholder='Or enter custom name'
                        value={newVariantName}
                        onChange={e => setNewVariantName(e.target.value)}
                        className='block w-full border rounded-md py-2 px-3 focus:outline-none border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                      />
                    </div>
                  </div>
                  <div className='mt-auto'>
                    <button
                      onClick={addVariant}
                      className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    >
                      Add Feature
                    </button>
                  </div>
                </div>
              </div>

              {/* Existing Features */}
              <div className='mb-6'>
                <h3 className='text-lg font-medium text-gray-800 mb-3'>Existing Features</h3>
                {variants.length === 0 ? (
                  <p className='text-gray-500'>No features added yet</p>
                ) : (
                  <div className='space-y-4'>
                    {variants.map(variant => (
                      <div key={variant.name} className='border rounded-lg p-4'>
                        <div className='flex justify-between items-center mb-3'>
                          <h4 className='font-medium text-gray-800'>{variant.name}</h4>
                          <button
                            onClick={() => removeVariant(variant.name)}
                            className='text-red-500 hover:text-red-700'
                          >
                            <FiTrash2 />
                          </button>
                        </div>

                        {/* Add new value to feature */}
                        <div className='flex gap-2 mb-3'>
                          <input
                            type='text'
                            placeholder='Add new value'
                            value={selectedVariantForValue === variant.name ? newVariantValue : ''}
                            onChange={e => {
                              setSelectedVariantForValue(variant.name)
                              setNewVariantValue(e.target.value)
                            }}
                            className='block w-full border rounded-md py-2 px-3 focus:outline-none border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                          />
                          <button
                            onClick={() => {
                              setSelectedVariantForValue(variant.name)
                              addVariantValue()
                            }}
                            className='px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                          >
                            Add
                          </button>
                        </div>

                        {/* Existing values */}
                        <div className='flex flex-wrap gap-2'>
                          {variant.values.map(value => (
                            <div
                              key={`${variant.name}-${value}`}
                              className='flex items-center bg-gray-100 rounded-full px-3 py-1'
                            >
                              <span className='text-sm'>{value}</span>
                              <button
                                onClick={() => removeVariantValue(variant.name, value)}
                                className='ml-1 text-gray-500 hover:text-red-500'
                              >
                                <FiX size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className='flex justify-end border-t pt-4'>
                <button
                  onClick={saveVariants}
                  disabled={variants.length === 0}
                  className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
                >
                  Save Features
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductListing
