import {
  ChevronDownIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import * as Yup from 'yup'
import { ftpService } from '../Api/ftp.api'
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

interface VariantGroup {
  name: string
  values: string[]
}

interface ImageUpload {
  file: File
  preview: string
  hidden: boolean
}

interface DraftData {
  formValues: any
  variants: VariantGroup[]
  imageUploads: ImageUpload[]
}

const AddProductComplete = () => {
  const [shops, setShops] = useState<Shop[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedCategories, setExpandedCategories] = useState<number[]>([])
  const [isLoadingShops, setIsLoadingShops] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Variant state
  const [variants, setVariants] = useState<VariantGroup[]>([])
  const [newVariantName, setNewVariantName] = useState('')
  const [newVariantValue, setNewVariantValue] = useState('')
  const [selectedVariantForValue, setSelectedVariantForValue] = useState('')

  // Image state
  const [imageUploads, setImageUploads] = useState<ImageUpload[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [imageError, setImageError] = useState('')
  const [categorySearch, setCategorySearch] = useState('')

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
    published: Yup.boolean().required('Publish status is required'),
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
      published: false,
    },
    validationSchema,
    onSubmit: async values => {
      try {
        setIsSubmitting(true)
        setError(null)
        setSuccess(null)

        // Step 1: Create the basic product
        const productResponse = await productService.createProduct({
          shopId: values.shopId,
          categoryId: values.categoryId,
          name: values.name,
          description: values.description,
          basePrice: values.basePrice,
          suggestedMaxPrice: values.suggestedMaxPrice,
          videoUrl: values.videoUrl,
        })

        if (!productResponse.success || !productResponse.data?.productId) {
          throw new Error(productResponse.message || 'Failed to create product')
        }

        const productId = productResponse.data.productId

        // Step 2: Upload images if any
        if (imageUploads.length > 0) {
          const uploadedImages = await uploadImages(productId)
          if (!uploadedImages) {
            throw new Error('Failed to upload some images')
          }
        }

        // Step 3: Add variants if any
        if (variants.length > 0) {
          const variantData = variants.flatMap(variant =>
            variant.values.map(value => ({
              name: variant.name,
              value,
            }))
          )

          const variantResponse = await productService.replaceVariants(productId, variantData)
          if (!variantResponse.success) {
            throw new Error(variantResponse.message || 'Failed to save variants')
          }
        }

        // Step 4: Update publish status if needed
        if (values.published) {
          const publishResponse = await productService.togglePublishStatus(productId, true)
          if (!publishResponse.success) {
            throw new Error(publishResponse.message || 'Failed to publish product')
          }
        }

        setSuccess('Product created successfully with all information!')
        clearDraft()
        resetForm()
        setHasUnsavedChanges(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create product')
      } finally {
        setIsSubmitting(false)
      }
    },
  })

  // Track form changes
  useEffect(() => {
    if (Object.keys(formik.touched).length > 0) {
      setHasUnsavedChanges(true)
      saveDraft()
    }
  }, [formik.values, formik.touched])

  // Warn before leaving if there are unsaved changes

  // Save draft to localStorage
  const saveDraft = () => {
    const draftData: DraftData = {
      formValues: formik.values,
      variants,
      imageUploads,
    }
    localStorage.setItem('productDraft', JSON.stringify(draftData))
    setSuccess('Draft saved successfully!')
    setHasUnsavedChanges(false)
  }

  // Clear draft from localStorage
  const clearDraft = () => {
    localStorage.removeItem('productDraft')
  }

  // Load draft from localStorage
  const loadDraft = () => {
    const draft = localStorage.getItem('productDraft')
    if (draft) {
      const draftData: DraftData = JSON.parse(draft)
      formik.setValues(draftData.formValues)
      setVariants(draftData.variants)
      setImageUploads(draftData.imageUploads)
      setSuccess('Draft loaded successfully!')
      setHasUnsavedChanges(true)
    }
  }
  const filterCategoriesBySearch = (categories: Category[], searchTerm: string): Category[] => {
    if (!searchTerm.trim()) return categories

    const filtered: Category[] = []
    const searchLower = searchTerm.toLowerCase()

    const hasMatchingName = (category: Category): boolean => {
      return category.name.toLowerCase().includes(searchLower)
    }

    const addCategoryWithParents = (category: Category, allCats: Category[]) => {
      // Add current category if not already added
      if (!filtered.some(c => c.categoryId === category.categoryId)) {
        filtered.push(category)
      }

      // Recursively add all parents
      if (category.parentId) {
        const parent = allCats.find(c => c.categoryId === category.parentId)
        if (parent) {
          addCategoryWithParents(parent, allCats)
        }
      }
    }

    categories.forEach(category => {
      if (hasMatchingName(category)) {
        addCategoryWithParents(category, categories)
      }
    })

    return filtered
  }
  // Check for draft on component mount
  useEffect(() => {
    loadDraft()
  }, [])

  const resetForm = () => {
    formik.resetForm()
    setVariants([])
    setImageUploads([])
    setNewVariantName('')
    setNewVariantValue('')
    setSelectedVariantForValue('')
  }

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
    const filteredCategories = categorySearch.trim()
      ? filterCategoriesBySearch(categories, categorySearch)
      : categories

    return filteredCategories
      .filter(category => category.parentId === parentId)
      .map(category => {
        const hasChildren = filteredCategories.some(c => c.parentId === category.categoryId)
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
                {renderCategoryTree(filteredCategories, category.categoryId, level + 1)}
              </div>
            )}
          </div>
        )
      })
  }

  // Variant management functions
  const addVariant = () => {
    if (newVariantName.trim() && !variants.some(v => v.name === newVariantName)) {
      setVariants([...variants, { name: newVariantName, values: [] }])
      setNewVariantName('')
      setHasUnsavedChanges(true)
    }
  }

  const removeVariant = (variantName: string) => {
    setVariants(variants.filter(v => v.name !== variantName))
    setHasUnsavedChanges(true)
  }

  const addVariantValue = () => {
    const newVariant = newVariantValue.trim()
    // here user may add multiple values for the same variant seperated by comma
    if (newVariant && selectedVariantForValue) {
      const valuesToAdd = newVariant
        .split(',')
        .map(value => value.trim())
        .filter(value => value)
      setVariants(
        variants.map(v =>
          v.name === selectedVariantForValue
            ? { ...v, values: [...new Set([...v.values, ...valuesToAdd])] }
            : v
        )
      )
      setNewVariantValue('')
      setHasUnsavedChanges(true)
      return
    }
    // if (selectedVariantForValue && newVariantValue.trim()) {
    //   setVariants(
    //     variants.map(v =>
    //       v.name === selectedVariantForValue ? { ...v, values: [...v.values, newVariantValue] } : v
    //     )
    //   )
    //   setNewVariantValue('')
    //   setHasUnsavedChanges(true)
    // }
  }

  const removeVariantValue = (variantName: string, value: string) => {
    setVariants(
      variants.map(v =>
        v.name === variantName ? { ...v, values: v.values.filter(val => val !== value) } : v
      )
    )
    setHasUnsavedChanges(true)
  }

  // Image management functions
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)

      // Validate each file
      const validFiles = files.filter(file => {
        if (!file.type.match('image.*')) {
          setImageError('Only image files are allowed')
          return false
        }
        if (file.size > 2 * 1024 * 1024) {
          // 2MB limit
          setImageError('Image size must be less than 2MB')
          return false
        }
        return true
      })

      if (validFiles.length === 0) return

      // Create previews for valid files
      const newUploads = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file),
        hidden: false,
      }))
      setImageUploads([...imageUploads, ...newUploads])
      setHasUnsavedChanges(true)
    }
  }

  const removeUploadedImage = (index: number) => {
    const newUploads = [...imageUploads]
    URL.revokeObjectURL(newUploads[index].preview)
    newUploads.splice(index, 1)
    setImageUploads(newUploads)
    setHasUnsavedChanges(true)
  }

  const toggleUploadVisibility = (index: number) => {
    setImageUploads(prevUploads =>
      prevUploads.map((upload, i) => (i === index ? { ...upload, hidden: !upload.hidden } : upload))
    )
    setHasUnsavedChanges(true)
  }

  const uploadImages = async (productId: number) => {
    if (imageUploads.length === 0) return null

    setUploadProgress(0)
    setImageError('')

    try {
      const uploadedImages = imageUploads.map(upload => ({
        url: '', // Will be set after FTP upload
        hidden: upload.hidden,
      }))

      for (let i = 0; i < imageUploads.length; i++) {
        const upload = imageUploads[i]
        const response = await ftpService.uploadFile(upload.file)

        if (response.success && response.data?.publicUrl) {
          uploadedImages[i].url = response.data.publicUrl
        } else {
          throw new Error(response.message || 'Failed to upload image')
        }

        setUploadProgress(((i + 1) / imageUploads.length) * 100)
      }

      // Save to product
      const response = await productService.addImages(productId, uploadedImages)
      return response
    } catch (error) {
      console.error('Failed to upload images', error)
      throw error
    } finally {
      setUploadProgress(0)
    }
  }

  return (
    <div className='max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4'>
      <h1 className='text-2xl font-bold text-gray-800 mb-6'>নতুন প্রোডাক্ট তৈরি করুন</h1>

      {/* Draft Save Button */}
      <div className='mb-4 flex justify-end'>
        <button
          type='button'
          onClick={saveDraft}
          disabled={!hasUnsavedChanges}
          className='px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
        >
          Save Draft
        </button>
      </div>

      <form onSubmit={formik.handleSubmit} className='space-y-6'>
        {/* Basic Information Section */}
        <div className='bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-800 mb-4'>Basic Information</h2>

          {/* Shop Selection */}
          <div className='mb-4'>
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
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Category *</label>
              {isLoadingCategories ? (
                <div className='animate-pulse h-40 bg-gray-200 rounded-md'></div>
              ) : (
                <div className='space-y-2'>
                  {/* Search input for categories */}
                  <div className='mb-2'>
                    <input
                      type='text'
                      placeholder='Search categories...'
                      value={categorySearch}
                      onChange={e => setCategorySearch(e.target.value)}
                      className='block w-full border rounded-md py-2 px-3 focus:outline-none border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                    />
                  </div>

                  <div className='border border-gray-300 rounded-md p-2 max-h-60 overflow-y-auto'>
                    {categories.length > 0 ? (
                      renderCategoryTree(categories)
                    ) : (
                      <p className='text-gray-500 text-center py-4'>No categories found</p>
                    )}

                    {categorySearch.trim() &&
                      filterCategoriesBySearch(categories, categorySearch).length === 0 && (
                        <p className='text-gray-500 text-center py-4'>
                          No categories found matching "{categorySearch}"
                        </p>
                      )}
                  </div>
                </div>
              )}
              {formik.touched.categoryId && formik.errors.categoryId && (
                <p className='mt-1 text-sm text-red-600'>{formik.errors.categoryId}</p>
              )}
            </div>
          )}

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
              placeholder='Enter product name'
            />
            {formik.touched.name && formik.errors.name && (
              <p className='mt-1 text-sm text-red-600'>{formik.errors.name}</p>
            )}
          </div>

          {/* Product Description */}
          <div className='mb-4'>
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
          <div className='mb-4'>
            <label htmlFor='videoUrl' className='block text-sm font-medium text-gray-700 mb-1'>
              ভিডিও লিঙ্ক (যদি থাকে)
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
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-4'>
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
                সর্বোচ্চ বিক্রয় মূল্য *
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

          {/* Publish Checkbox */}
          <div className='flex items-center'>
            <input
              type='checkbox'
              id='published'
              name='published'
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              checked={formik.values.published}
              className='h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded'
            />
            <label htmlFor='published' className='ml-2 block text-sm text-gray-700'>
              প্রোডাক্ট পাবলিশ করুন
            </label>
          </div>
          {formik.touched.published && formik.errors.published && (
            <p className='mt-1 text-sm text-red-600'>{formik.errors.published}</p>
          )}
        </div>

        {/* Variants Section */}
        <div className='bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-800 mb-4'>Product Variants</h2>

          {/* Add New Variant */}
          <div className='mb-6'>
            <div className='flex flex-col md:flex-row gap-3'>
              <div className='flex-grow'>
                <label className='block text-sm font-medium text-gray-700 mb-1'>Variant Name</label>
                <div className='flex gap-2'>
                  <select
                    value={newVariantName}
                    onChange={e => setNewVariantName(e.target.value)}
                    className='block w-full border rounded-md py-2 px-3 focus:outline-none border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
                  >
                    <option value=''>Select or type</option>
                    <option value='Color'>Color</option>
                    <option value='Size'>Size</option>
                    <option value='Material'>Material</option>
                    <option value='Style'>Style</option>
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
                  type='button'
                  onClick={addVariant}
                  className='px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                >
                  Add Variant
                </button>
              </div>
            </div>
          </div>

          {/* Existing Variants */}
          <div className='mb-6'>
            {variants.length === 0 ? (
              <p className='text-gray-500'>No variants added yet</p>
            ) : (
              <div className='space-y-4'>
                {variants.map(variant => (
                  <div key={variant.name} className='border rounded-lg p-4'>
                    <div className='flex justify-between items-center mb-3'>
                      <h4 className='font-medium text-gray-800'>{variant.name}</h4>
                      <button
                        type='button'
                        onClick={() => removeVariant(variant.name)}
                        className='text-red-500 hover:text-red-700'
                      >
                        <XMarkIcon className='h-5 w-5' />
                      </button>
                    </div>

                    {/* Add new value to variant */}
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
                        type='button'
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
                            type='button'
                            onClick={() => removeVariantValue(variant.name, value)}
                            className='ml-1 text-gray-500 hover:text-red-500'
                          >
                            <XMarkIcon className='h-4 w-4' />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Images Section */}
        <div className='bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200'>
          <h2 className='text-xl font-semibold text-gray-800 mb-4'>Product Images</h2>

          {/* Upload New Images */}
          <div className='mb-6'>
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col sm:flex-row gap-4'>
                <label className='flex-1 cursor-pointer'>
                  <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-full'>
                    <PlusIcon className='text-gray-400 h-8 w-8 mb-2' />
                    <span className='text-gray-600'>Click to select images</span>
                    <input
                      type='file'
                      className='hidden'
                      multiple
                      accept='image/*'
                      onChange={handleImageUpload}
                    />
                  </div>
                </label>
              </div>

              {/* Upload Progress */}
              {isSubmitting && uploadProgress > 0 && (
                <div className='w-full bg-gray-200 rounded-full h-2.5'>
                  <div
                    className='bg-indigo-600 h-2.5 rounded-full'
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              {/* Uploaded Image Previews */}
              {imageUploads.length > 0 && (
                <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
                  {imageUploads.map((upload, index) => (
                    <div
                      key={index}
                      className={`relative border rounded-lg overflow-hidden ${
                        upload.hidden ? 'opacity-60' : ''
                      }`}
                    >
                      <img
                        src={upload.preview}
                        alt={`Upload ${index + 1}`}
                        className='w-full h-32 object-cover'
                      />
                      <div className='absolute top-2 right-2 flex gap-1'>
                        <button
                          type='button'
                          onClick={() => toggleUploadVisibility(index)}
                          className={`p-1 rounded-full ${
                            upload.hidden ? 'bg-gray-500 text-white' : 'bg-white text-gray-700'
                          }`}
                        >
                          {upload.hidden ? (
                            <EyeSlashIcon className='h-4 w-4' />
                          ) : (
                            <EyeIcon className='h-4 w-4' />
                          )}
                        </button>
                        <button
                          type='button'
                          onClick={() => removeUploadedImage(index)}
                          className='p-1 rounded-full bg-red-500 text-white'
                        >
                          <XMarkIcon className='h-4 w-4' />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {imageError && <p className='mt-2 text-sm text-red-600'>{imageError}</p>}
          </div>
        </div>

        {/* Success and Error Messages */}
        {success && (
          <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-4 flex justify-between items-center'>
            <span>{success}</span>
            <button type='button' onClick={() => setSuccess(null)} className='text-green-700'>
              <XMarkIcon className='h-5 w-5' />
            </button>
          </div>
        )}
        {error && (
          <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-4 flex justify-between items-center'>
            <span>{error}</span>
            <button type='button' onClick={() => setError(null)} className='text-red-700'>
              <XMarkIcon className='h-5 w-5' />
            </button>
          </div>
        )}

        {/* Submit Button */}
        <div className='pt-4 flex flex-col sm:flex-row gap-3'>
          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full sm:w-auto flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isSubmitting ? (
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
                Creating Product...
              </>
            ) : (
              <>
                <PlusIcon className='-ml-1 mr-2 h-4 w-4' />
                Create Product
              </>
            )}
          </button>
          <button
            type='button'
            onClick={resetForm}
            className='w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          >
            Reset Form
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddProductComplete
