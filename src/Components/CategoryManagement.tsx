import {
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useFormik } from 'formik'
import { useEffect, useRef, useState } from 'react'
import * as Yup from 'yup'
import { ftpService } from '../Api/ftp.api'
import { shopApiService, type Category } from '../Api/shop.api'

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [expandedCategories, setExpandedCategories] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [parentCategory, setParentCategory] = useState<number | null>(null)

  const itemsPerPage = 10

  // Validation Schema
  const categoryValidationSchema = Yup.object().shape({
    name: Yup.string()
      .required('Category name is required')
      .min(3, 'Category name must be at least 3 characters'),
    description: Yup.string(),
    categoryIcon: Yup.string().url('Please enter a valid URL'),
    priority: Yup.number().default(100),
  })

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      categoryIcon: '',
      parentId: null as number | null,
      priority: null as number | null,
    },
    validationSchema: categoryValidationSchema,
    onSubmit: async values => {
      setModalError(null)
      try {
        let response
        if (editingCategory) {
          const { success, message } = await shopApiService.updateCategory(
            editingCategory.categoryId,
            {
              name: values.name,
              description: values.description,
              categoryIcon: values.categoryIcon,
              parentId: values.parentId || undefined,
              priority: values.priority ? values.priority : null,
            }
          )
          response = { success, message }
          if (success) {
            setSuccess('Category updated successfully')
          } else {
            setModalError(message || 'Update failed')
          }
        } else {
          const { success, message } = await shopApiService.createCategory({
            name: values.name,
            description: values.description,
            categoryIcon: values.categoryIcon,
            parentId: parentCategory || values.parentId || undefined,
            priority: values.priority,
          })
          response = { success, message }
          if (success) {
            setSuccess('Category created successfully')
          } else {
            setModalError(message || 'Creation failed')
          }
        }

        if (response.success) {
          fetchCategories()
          setIsModalOpen(false)
          setParentCategory(null)
        } else {
          setModalError(response.message || 'Operation failed')
        }
      } catch (error) {
        setModalError('Operation failed')
      }
    },
  })

  // Toggle category expansion
  const toggleExpand = (categoryId: number) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
    )
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Set preview image
      const reader = new FileReader()
      reader.onload = event => {
        if (event.target?.result) {
          setPreviewImage(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)

      // Upload to FTP
      setIsUploading(true)
      try {
        const { success, data, message } = await ftpService.uploadFile(file)
        if (success) {
          formik.setFieldValue('categoryIcon', data?.publicUrl)
          setPreviewImage(data?.publicUrl || null)
        } else {
          setModalError(message || 'Image upload failed')
        }
      } catch (error) {
        setModalError('Image upload failed')
      } finally {
        setIsUploading(false)
      }
    }
  }
  // Add this function inside the component, after the handleImageUpload function
  const handleDeleteImage = () => {
    setPreviewImage(null)
    formik.setFieldValue('categoryIcon', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Fetch categories with hierarchy
  const fetchCategories = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await shopApiService.getAllCategories({
        page: currentPage,
        limit: itemsPerPage,
        searchTerm: searchTerm,
        subCategories: true,
      })

      if (response.success) {
        setCategories(response.data?.categories || [])
        setTotalPages(response.data?.totalPages || 1)
      } else {
        setError(response.message || 'Failed to load categories')
      }
    } catch (error) {
      setError('Failed to load categories')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [currentPage, searchTerm])

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  // Open create modal
  // Open create modal
  const openCreateModal = (parentId: number | null = null) => {
    formik.resetForm()
    setEditingCategory(null)
    setModalError(null)
    setPreviewImage(null)
    setParentCategory(parentId)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsModalOpen(true)
  }

  // Open edit modal
  const openEditModal = (category: Category) => {
    setEditingCategory(category)
    formik.setValues({
      name: category.name,
      description: category.description || '',
      categoryIcon: category.categoryIcon || '',
      parentId: category.parentId || null,
      priority: category.priority || null,
    })
    setPreviewImage(category.categoryIcon || null)
    setModalError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsModalOpen(true)
  }
  // Handle delete
  const handleDelete = async () => {
    if (!categoryToDelete) return
    setModalError(null)

    try {
      const response = await shopApiService.deleteCategory(categoryToDelete)

      if (response.success) {
        setSuccess('Category deleted successfully')
        fetchCategories()
        setIsDeleteModalOpen(false)
        setCategoryToDelete(null)
      } else {
        setModalError(response.message || 'Failed to delete category')
      }
    } catch (error) {
      setModalError('Failed to delete category')
    }
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
          <div key={category.categoryId} className={`${level > 0 ? 'ml-6' : ''}`}>
            <div className='flex items-center justify-between p-2 hover:bg-gray-50 rounded'>
              <div className='flex items-center'>
                {hasChildren && (
                  <button
                    onClick={() => toggleExpand(category.categoryId)}
                    className='mr-2 text-gray-500 hover:text-gray-700'
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className='h-4 w-4' />
                    ) : (
                      <ChevronRightIcon className='h-4 w-4' />
                    )}
                  </button>
                )}
                {!hasChildren && <div className='w-6'></div>}
                <span className='font-medium'>{category.name}</span>
              </div>
              <div className='flex items-center gap-2'>
                <button
                  onClick={() => openCreateModal(category.categoryId)}
                  className='text-green-600 hover:text-green-800'
                  title='Add Subcategory'
                >
                  <PlusIcon className='h-4 w-4' />
                </button>
                <button
                  onClick={() => openEditModal(category)}
                  className='text-blue-600 hover:text-blue-800'
                  title='Edit'
                >
                  <PencilSquareIcon className='h-4 w-4' />
                </button>
                <button
                  onClick={() => {
                    setCategoryToDelete(category.categoryId)
                    setIsDeleteModalOpen(true)
                  }}
                  className='text-red-600 hover:text-red-800'
                  title='Delete'
                >
                  <TrashIcon className='h-4 w-4' />
                </button>
              </div>
            </div>
            {hasChildren && isExpanded && (
              <div className='border-l-2 border-gray-200 ml-3'>
                {renderCategoryTree(categories, category.categoryId, level + 1)}
              </div>
            )}
          </div>
        )
      })
  }

  return (
    <div className='space-y-6 relative'>
      {/* Success and Error Messages */}
      {success && (
        <div className='bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative'>
          <span className='block sm:inline'>{success}</span>
        </div>
      )}
      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative'>
          <span className='block sm:inline'>{error}</span>
        </div>
      )}

      {/* Header and Search */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <h1 className='text-2xl font-bold'>Category Management</h1>
        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' />
            </div>
            <input
              type='text'
              placeholder='Search categories...'
              className='pl-10 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full'
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <button
            onClick={() => openCreateModal()}
            className='flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          >
            <PlusIcon className='h-5 w-5' />
            <span className='whitespace-nowrap'>New Category</span>
          </button>
        </div>
      </div>

      {/* Category Tree View */}
      <div className='bg-white rounded-lg shadow overflow-hidden'>
        {isLoading ? (
          <div className='flex justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
          </div>
        ) : categories.length === 0 ? (
          <div className='p-4 text-center'>No categories found</div>
        ) : (
          <div className='divide-y divide-gray-200'>{renderCategoryTree(categories)}</div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='flex justify-center'>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className='px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50'
            >
              Previous
            </button>
            <span className='px-3 py-1'>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className='px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50'
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
            {/* Background overlay */}
            <div
              className='fixed inset-0 transition-opacity bg-black bg-opacity-50'
              aria-hidden='true'
              onClick={() => setIsModalOpen(false)}
            ></div>

            {/* Modal container */}
            <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 w-full max-w-md mx-4 sm:mx-auto'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='flex justify-between items-start'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900'>
                    {editingCategory
                      ? 'Edit Category'
                      : parentCategory
                      ? 'Add Subcategory'
                      : 'New Category'}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className='text-gray-400 hover:text-gray-500 focus:outline-none'
                  >
                    <XMarkIcon className='h-6 w-6' />
                  </button>
                </div>

                {/* Error message inside modal */}
                {modalError && (
                  <div className='mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
                    {modalError}
                  </div>
                )}

                <form onSubmit={formik.handleSubmit} className='mt-4 space-y-4'>
                  {/* Parent Category Info */}
                  {parentCategory && !editingCategory && (
                    <div className='bg-gray-50 p-3 rounded-md'>
                      <p className='text-sm text-gray-600'>
                        Creating subcategory under:{' '}
                        <strong>
                          {categories.find(c => c.categoryId === parentCategory)?.name}
                        </strong>
                      </p>
                    </div>
                  )}

                  {/* Parent Category Selector (only when editing) */}
                  {editingCategory && (
                    <div>
                      <label htmlFor='parentId' className='block text-sm font-medium text-gray-700'>
                        Parent Category
                      </label>
                      <select
                        id='parentId'
                        name='parentId'
                        className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                        value={formik.values.parentId || ''}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      >
                        <option value=''>-- Top Level --</option>
                        {categories
                          .filter(c => c.categoryId !== editingCategory.categoryId)
                          .map(category => (
                            <option key={category.categoryId} value={category.categoryId}>
                              {category.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {/* Image Upload */}
                  {/* Image Upload */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>
                      Category Icon
                    </label>
                    <input
                      type='file'
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept='image/*'
                      className='hidden'
                    />
                    <div className='flex flex-col items-center'>
                      {previewImage ? (
                        <div className='relative'>
                          <img
                            src={previewImage}
                            alt='Preview'
                            className='w-32 h-32 rounded-full object-cover mb-2'
                          />
                          <button
                            type='button'
                            onClick={handleDeleteImage}
                            className='absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 hover:bg-red-700'
                            title='Delete image'
                          >
                            <XMarkIcon className='h-4 w-4' />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={triggerFileInput}
                          className='flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500'
                        >
                          <PlusIcon className='h-10 w-10 text-gray-400' />
                          <p className='mt-2 text-sm text-gray-600'>Click to upload image</p>
                        </div>
                      )}
                      {previewImage && (
                        <button
                          type='button'
                          onClick={triggerFileInput}
                          className='text-sm text-indigo-600 hover:text-indigo-500 mt-2'
                        >
                          Change Image
                        </button>
                      )}
                      {isUploading && (
                        <p className='mt-2 text-sm text-gray-500'>Uploading image...</p>
                      )}
                      {formik.touched.categoryIcon && formik.errors.categoryIcon ? (
                        <p className='mt-1 text-sm text-red-600'>{formik.errors.categoryIcon}</p>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                      Name *
                    </label>
                    <input
                      id='name'
                      name='name'
                      type='text'
                      className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                      value={formik.values.name}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                    {formik.touched.name && formik.errors.name ? (
                      <p className='mt-1 text-sm text-red-600'>{formik.errors.name}</p>
                    ) : null}
                  </div>

                  <div>
                    <label
                      htmlFor='description'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Description
                    </label>
                    <textarea
                      id='description'
                      name='description'
                      rows={3}
                      className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </div>
                  <div>
                    <label htmlFor='priority' className='block text-sm font-medium text-gray-700'>
                      Serial Number
                    </label>
                    <input
                      id='priority'
                      name='priority'
                      type='number'
                      min='0'
                      className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                      value={formik.values.priority || ''}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </div>

                  <div className='flex justify-end space-x-3 pt-4'>
                    <button
                      type='button'
                      onClick={() => setIsModalOpen(false)}
                      className='inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      disabled={isUploading}
                      className='inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isUploading
                        ? 'Saving...'
                        : editingCategory
                        ? 'Update Category'
                        : parentCategory
                        ? 'Create Subcategory'
                        : 'Create Category'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
            {/* Background overlay */}
            <div
              className='fixed inset-0 transition-opacity bg-black bg-opacity-50'
              aria-hidden='true'
              onClick={() => setIsDeleteModalOpen(false)}
            ></div>

            {/* Modal container */}
            <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 w-full max-w-md mx-4 sm:mx-auto'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='sm:flex sm:items-start'>
                  <div className='mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'>
                    <TrashIcon className='h-6 w-6 text-red-600' />
                  </div>
                  <div className='mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left'>
                    <h3 className='text-lg leading-6 font-medium text-gray-900'>Delete Category</h3>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        Are you sure you want to delete this category? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error message inside modal */}
                {modalError && (
                  <div className='mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded'>
                    {modalError}
                  </div>
                )}
              </div>
              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  type='button'
                  onClick={handleDelete}
                  className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Delete
                </button>
                <button
                  type='button'
                  onClick={() => setIsDeleteModalOpen(false)}
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

export default CategoryManagement
