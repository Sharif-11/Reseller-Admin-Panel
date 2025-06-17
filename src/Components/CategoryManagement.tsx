import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import * as Yup from 'yup'
import { shopApiService, type Category } from '../Api/shop.api'

const CategoryManagement = () => {
  const setCategories = useState<Category[]>([])[1]
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = useState(1)[0]
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)

  const itemsPerPage = 10

  // Validation Schema
  const categoryValidationSchema = Yup.object().shape({
    name: Yup.string()
      .required('ক্যাটাগরির নাম আবশ্যক')
      .min(3, 'ক্যাটাগরির নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
    description: Yup.string(),
    categoryIcon: Yup.string().url('বৈধ URL দিন'),
  })

  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      categoryIcon: '',
    },
    validationSchema: categoryValidationSchema,
    onSubmit: async values => {
      setModalError(null)
      try {
        let response
        if (editingCategory) {
          response = await shopApiService.updateCategory(editingCategory.categoryId, values)
          setSuccess('ক্যাটাগরি সফলভাবে আপডেট হয়েছে')
        } else {
          response = await shopApiService.createCategory({
            categoryName: values.name,
            categoryDescription: values.description,
            categoryIcon: values.categoryIcon,
          })
          setSuccess('নতুন ক্যাটাগরি সফলভাবে তৈরি হয়েছে')
        }

        if (response.success) {
          fetchCategories()
          setIsModalOpen(false)
        } else {
          setModalError(response.message || 'অপারেশন ব্যর্থ হয়েছে')
        }
      } catch (error) {
        setModalError('অপারেশন ব্যর্থ হয়েছে')
      }
    },
  })

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await shopApiService.getAllCategories({
        page: currentPage,
        limit: itemsPerPage,
        searchTerm: searchTerm,
      })

      if (response.success) {
        setCategories(response.data?.categories || [])
        setFilteredCategories(response.data?.categories || [])
        // setTotalPages(response.data?.totalPages || 1)
      } else {
        setError(response.message || 'ক্যাটাগরি লোড করতে ব্যর্থ হয়েছে')
      }
    } catch (error) {
      setError('ক্যাটাগরি লোড করতে ব্যর্থ হয়েছে')
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
  const openCreateModal = () => {
    formik.resetForm()
    setEditingCategory(null)
    setModalError(null)
    setIsModalOpen(true)
  }

  // Open edit modal
  const openEditModal = (category: any) => {
    setEditingCategory(category)
    formik.setValues({
      name: category.name,
      description: category.description || '',
      categoryIcon: category.categoryIcon || '',
    })
    setModalError(null)
    setIsModalOpen(true)
  }

  // Handle delete
  const handleDelete = async () => {
    if (!categoryToDelete) return
    setModalError(null)

    try {
      const response = await shopApiService.deleteCategory(categoryToDelete)

      if (response.success) {
        setSuccess('ক্যাটাগরি সফলভাবে ডিলিট করা হয়েছে')
        fetchCategories()
        setIsDeleteModalOpen(false)
        setCategoryToDelete(null)
      } else {
        setModalError(response.message || 'ক্যাটাগরি ডিলিট করতে ব্যর্থ হয়েছে')
      }
    } catch (error) {
      setModalError('ক্যাটাগরি ডিলিট করতে ব্যর্থ হয়েছে')
    }
  }

  // Close success/error messages after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccess(null)
      setError(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [success, error])

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
        <h1 className='text-2xl font-bold'>ক্যাটাগরি ব্যবস্থাপনা</h1>
        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='relative'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' />
            </div>
            <input
              type='text'
              placeholder='ক্যাটাগরি খুঁজুন...'
              className='pl-10 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <button
            onClick={openCreateModal}
            className='flex items-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          >
            <PlusIcon className='h-5 w-5' />
            <span>নতুন ক্যাটাগরি</span>
          </button>
        </div>
      </div>

      {/* Mobile View - Card List */}
      <div className='md:hidden space-y-3'>
        {isLoading ? (
          <div className='flex justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className='p-4 bg-white rounded-lg shadow text-center'>
            কোন ক্যাটাগরি পাওয়া যায়নি
          </div>
        ) : (
          filteredCategories.map(category => (
            <div key={category.categoryId} className='p-4 bg-white rounded-lg shadow'>
              <div className='flex justify-between items-start'>
                <div>
                  <h3 className='font-medium'>{category.name}</h3>
                  {category.description && (
                    <p className='text-sm text-gray-600 mt-1'>{category.description}</p>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <button
                    onClick={() => openEditModal(category)}
                    className='text-indigo-600 hover:text-indigo-900 mr-2'
                  >
                    <PencilSquareIcon className='h-5 w-5' />
                  </button>
                  <button
                    onClick={() => {
                      setCategoryToDelete(category.categoryId)
                      setIsDeleteModalOpen(true)
                    }}
                    className='text-red-600 hover:text-red-900'
                  >
                    <TrashIcon className='h-5 w-5' />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View - Table */}
      <div className='hidden md:block overflow-x-auto'>
        <div className='bg-white rounded-lg shadow'>
          <div className='overflow-hidden'>
            {isLoading ? (
              <div className='flex justify-center py-8'>
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className='p-4 text-center'>কোন ক্যাটাগরি পাওয়া যায়নি</div>
            ) : (
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      নাম
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      বিবরণ
                    </th>
                    <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                      কর্ম
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {filteredCategories.map(category => (
                    <tr key={category.categoryId}>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <div className='text-sm font-medium text-gray-900'>{category.name}</div>
                        </div>
                      </td>
                      <td className='px-6 py-4'>
                        <div className='text-sm text-gray-900'>
                          {category.description || 'কোন বিবরণ নেই'}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                        <button
                          onClick={() => openEditModal(category)}
                          className='text-indigo-600 hover:text-indigo-900 mr-3'
                        >
                          সম্পাদনা
                        </button>
                        <button
                          onClick={() => {
                            setCategoryToDelete(category.categoryId)
                            setIsDeleteModalOpen(true)
                          }}
                          className='text-red-600 hover:text-red-900'
                        >
                          ডিলিট
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
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
              পূর্ববর্তী
            </button>
            <span className='px-3 py-1'>
              পৃষ্ঠা {currentPage} এর {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className='px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50'
            >
              পরবর্তী
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
                    {editingCategory ? 'ক্যাটাগরি সম্পাদনা' : 'নতুন ক্যাটাগরি তৈরি'}
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
                  <div>
                    <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                      নাম *
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
                      বিবরণ
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
                    <label
                      htmlFor='categoryIcon'
                      className='block text-sm font-medium text-gray-700'
                    >
                      আইকন URL
                    </label>
                    <input
                      id='categoryIcon'
                      name='categoryIcon'
                      type='url'
                      className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                      value={formik.values.categoryIcon}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      placeholder='https://example.com/icon.png'
                    />
                    {formik.touched.categoryIcon && formik.errors.categoryIcon ? (
                      <p className='mt-1 text-sm text-red-600'>{formik.errors.categoryIcon}</p>
                    ) : null}
                  </div>

                  <div className='flex justify-end space-x-3 pt-4'>
                    <button
                      type='button'
                      onClick={() => setIsModalOpen(false)}
                      className='inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    >
                      বাতিল
                    </button>
                    <button
                      type='submit'
                      className='inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                    >
                      {editingCategory ? 'আপডেট ক্যাটাগরি' : 'ক্যাটাগরি তৈরি করুন'}
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
                    <h3 className='text-lg leading-6 font-medium text-gray-900'>
                      ক্যাটাগরি ডিলিট করুন
                    </h3>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        আপনি কি নিশ্চিত যে আপনি এই ক্যাটাগরি ডিলিট করতে চান? এই কাজটি পূর্বাবস্থায়
                        ফেরানো যাবে না।
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
                  ডিলিট করুন
                </button>
                <button
                  type='button'
                  onClick={() => setIsDeleteModalOpen(false)}
                  className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  বাতিল
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
