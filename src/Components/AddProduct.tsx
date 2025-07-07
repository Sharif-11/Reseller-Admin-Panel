import { ChevronDownIcon, ChevronRightIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import * as Yup from 'yup'
import { productService } from '../Api/product.api'
import { shopApiService } from '../Api/shop.api'

interface Shop {
  shopId: number
  shopName: string
}

interface Category {
  categoryId: number
  name: string
  parentId: number | null
  children?: Category[]
}

const AddProductBasic = () => {
  const [shops, setShops] = useState<Shop[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedCategories, setExpandedCategories] = useState<number[]>([])
  const [isLoadingShops, setIsLoadingShops] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form validation schema
  const validationSchema = Yup.object().shape({
    shopId: Yup.number()
      .required('Shop selection is required')
      .min(1, 'Please select a valid shop'),
    categoryId: Yup.number()
      .required('Category selection is required')
      .min(1, 'Please select a valid category'),
    name: Yup.string()
      .required('Product name is required')
      .min(3, 'Product name must be at least 3 characters'),
    description: Yup.string()
      .required('Product description is required')
      .min(10, 'Product description must be at least 10 characters'),
    videoUrl: Yup.string().optional().url('Invalid video URL format'),

    basePrice: Yup.number().required('Price is required').min(0, 'Price must be zero or greater'),
    suggestedMaxPrice: Yup.number()
      .required('Suggested max price is required')
      .min(Yup.ref('basePrice'), 'Suggested max price must be greater than or equal to base price'),
  })

  // Formik form handler
  const formik = useFormik({
    initialValues: {
      shopId: 0,
      categoryId: 0,
      name: '',
      description: '',
      basePrice: 0,
      suggestedMaxPrice: 0,
      videoUrl: '',
    },
    validationSchema,
    onSubmit: async values => {
      try {
        setError(null)
        console.log(values)
        // console.log()
        const response = await productService.createProduct({
          shopId: values.shopId,
          categoryId: values.categoryId,
          name: values.name,
          description: values.description,
          basePrice: values.basePrice,
          suggestedMaxPrice: values.suggestedMaxPrice,
          videoUrl: values.videoUrl,
        })

        if (response.success) {
          setSuccess('Product created successfully!')
          formik.resetForm()
        } else {
          setError(response.message || 'Failed to create product')
        }
      } catch (err) {
        setError('Failed to create product')
      }
    },
  })

  // Fetch shops on component mount
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await shopApiService.getAllShopsForAdmin(1, 100)
        if (response.success) {
          setShops(response.data?.shops || [])
        } else {
          setError(response.message || 'Failed to load shops')
        }
      } catch (err) {
        setError('Failed to load shops')
      } finally {
        setIsLoadingShops(false)
      }
    }

    fetchShops()
  }, [])

  // Fetch categories when shop is selected
  useEffect(() => {
    if (formik.values.shopId > 0) {
      const fetchCategories = async () => {
        setIsLoadingCategories(true)
        try {
          const response = await shopApiService.getAllCategories({
            subCategories: true,
          })
          if (response.success) {
            setCategories((response?.data?.categories as Category[]) || [])
          } else {
            setError(response.message || 'Failed to load categories')
          }
        } catch (err) {
          setError('Failed to load categories')
        } finally {
          setIsLoadingCategories(false)
        }
      }

      fetchCategories()
    }
  }, [formik.values.shopId])

  // Toggle category expansion
  const toggleExpand = (categoryId: number) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    )
  }

  // Render category tree recursively
  const renderCategoryTree = (
    categories: Category[],
    parentId: number | null = null,
    level = 0
  ) => {
    return categories
      .filter(category => category.parentId === parentId)
      .map(category => {
        const hasChildren = categories.some(c => c.parentId === category.categoryId)
        const isExpanded = expandedCategories.includes(category.categoryId)

        return (
          <div key={category.categoryId} className={`${level > 0 ? 'mr-4' : ''}`}>
            <div
              className={`flex items-center p-2 rounded-md cursor-pointer ${
                formik.values.categoryId === category.categoryId
                  ? 'bg-indigo-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => formik.setFieldValue('categoryId', category.categoryId)}
            >
              {hasChildren && (
                <button
                  type='button'
                  onClick={e => {
                    e.stopPropagation()
                    toggleExpand(category.categoryId)
                  }}
                  className='text-gray-500 hover:text-gray-700 mr-2'
                >
                  {isExpanded ? (
                    <ChevronDownIcon className='h-4 w-4' />
                  ) : (
                    <ChevronRightIcon className='h-4 w-4' />
                  )}
                </button>
              )}
              {!hasChildren && <div className='w-6'></div>}
              <span
                className={`${
                  formik.values.categoryId === category.categoryId
                    ? 'font-semibold text-indigo-700'
                    : ''
                }`}
              >
                {category.name}
              </span>
            </div>
            {hasChildren && isExpanded && (
              <div className='border-r-2 border-gray-200 pr-2'>
                {renderCategoryTree(categories, category.categoryId, level + 1)}
              </div>
            )}
          </div>
        )
      })
  }

  return (
    <div className='max-w-4xl mx-auto p-4'>
      {/* Success and Error Messages */}

      <h1 className='text-2xl font-bold text-gray-800 mb-6'>নতুন প্রোডাক্ট যোগ করুন </h1>

      <form onSubmit={formik.handleSubmit} className='space-y-6'>
        {/* Shop Selection */}
        <div>
          <label htmlFor='shopId' className='block text-sm font-medium text-gray-700 mb-1'>
            শপ সিলেক্ট করুন *
          </label>
          {isLoadingShops ? (
            <div className='animate-pulse h-10 bg-gray-200 rounded-md'></div>
          ) : (
            <select
              id='shopId'
              name='shopId'
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.shopId}
              className={`block w-full border rounded-md py-2 px-3 focus:outline-none ${
                formik.touched.shopId && formik.errors.shopId
                  ? 'border-red-500'
                  : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            >
              <option value=''>Select a shop</option>
              {shops.map(shop => (
                <option key={shop.shopId} value={shop.shopId}>
                  {shop.shopName}
                </option>
              ))}
            </select>
          )}
          {formik.touched.shopId && formik.errors.shopId && (
            <p className='mt-1 text-sm text-red-600'>{formik.errors.shopId}</p>
          )}
        </div>

        {/* Category Selection */}
        {formik.values.shopId > 0 && (
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              {' '}
              ক্যাটাগরি সিলেক্ট করুন *
            </label>
            {isLoadingCategories ? (
              <div className='animate-pulse h-40 bg-gray-200 rounded-md'></div>
            ) : (
              <div className='border border-gray-300 rounded-md p-2 max-h-60 overflow-y-auto'>
                {categories.length > 0 ? (
                  renderCategoryTree(categories)
                ) : (
                  <p className='text-gray-500 text-center py-4'>No categories found</p>
                )}
              </div>
            )}
            {formik.touched.categoryId && formik.errors.categoryId && (
              <p className='mt-1 text-sm text-red-600'>{formik.errors.categoryId}</p>
            )}
          </div>
        )}

        {/* Product Name */}
        <div>
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
            placeholder='Enter product name'
          />
          {formik.touched.name && formik.errors.name && (
            <p className='mt-1 text-sm text-red-600'>{formik.errors.name}</p>
          )}
        </div>

        {/* Product Description */}
        <div>
          <label htmlFor='description' className='block text-sm font-medium text-gray-700 mb-1'>
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
            placeholder='Enter product description'
          />
          {formik.touched.description && formik.errors.description && (
            <p className='mt-1 text-sm text-red-600'>{formik.errors.description}</p>
          )}
        </div>
        {/* Video URL */}
        <div>
          <label htmlFor='videoUrl' className='block text-sm font-medium text-gray-700 mb-1'>
            ভিডিও লিঙ্ক (অপশনাল)
          </label>
          <input
            type='text'
            id='videoUrl'
            name='videoUrl'
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.videoUrl}
            className={`block w-full border rounded-md py-2 px-3 focus:outline-none ${
              formik.touched.videoUrl && formik.errors.videoUrl
                ? 'border-red-500'
                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
            }`}
            placeholder='Enter video URL'
          />
          {formik.touched.videoUrl && formik.errors.videoUrl && (
            <p className='mt-1 text-sm text-red-600'>{formik.errors.videoUrl}</p>
          )}
        </div>

        {/* Price Fields */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label htmlFor='basePrice' className='block text-sm font-medium text-gray-700 mb-1'>
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

          <div>
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
        </div>
        {success && (
          <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4 flex justify-between items-center'>
            <span>{success}</span>
            <button onClick={() => setSuccess(null)} className='text-green-700'>
              <XMarkIcon className='h-5 w-5' />
            </button>
          </div>
        )}
        {error && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 flex justify-between items-center'>
            <span>{error}</span>
            <button onClick={() => setError(null)} className='text-red-700'>
              <XMarkIcon className='h-5 w-5' />
            </button>
          </div>
        )}

        {/* Submit Button */}
        <div className='pt-4'>
          <button
            type='submit'
            disabled={formik.isSubmitting}
            className='w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {formik.isSubmitting ? (
              <>
                <svg
                  className='animate-spin -ml-1 mr-2 h-4 w-4 text-white'
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
                প্রোডাক্ট তৈরি হচ্ছে ....
              </>
            ) : (
              <>
                <PlusIcon className='-ml-1 mr-2 h-4 w-4' />
                প্রোডাক্ট তৈরি করুন
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddProductBasic
