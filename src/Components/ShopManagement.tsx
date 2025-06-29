import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useFormik } from 'formik'
import { useEffect, useRef, useState } from 'react'
import * as Yup from 'yup'
import { ftpService } from '../Api/ftp.api'
import { shopApiService } from '../Api/shop.api'

// District (Zilla) data only
const districts = [
  'Barguna',
  'Barishal',
  'Bhola',
  'Jhalokati',
  'Patuakhali',
  'Pirojpur',
  'Bandarban',
  'Brahmanbaria',
  'Chandpur',
  'Chattogram',
  "Cox's Bazar",
  'Cumilla',
  'Feni',
  'Khagrachari',
  'Lakshmipur',
  'Noakhali',
  'Rangamati',
  'Dhaka',
  'Faridpur',
  'Gazipur',
  'Gopalganj',
  'Kishoreganj',
  'Madaripur',
  'Manikganj',
  'Munshiganj',
  'Narayanganj',
  'Narsingdi',
  'Rajbari',
  'Shariatpur',
  'Tangail',
  'Bagerhat',
  'Chuadanga',
  'Jashore',
  'Jhenaidah',
  'Khulna',
  'Kushtia',
  'Magura',
  'Meherpur',
  'Narail',
  'Satkhira',
  'Jamalpur',
  'Mymensingh',
  'Netrokona',
  'Sherpur',
  'Bogura',
  'Joypurhat',
  'Naogaon',
  'Natore',
  'Chapai Nawabganj',
  'Pabna',
  'Rajshahi',
  'Sirajganj',
  'Dinajpur',
  'Gaibandha',
  'Kurigram',
  'Lalmonirhat',
  'Nilphamari',
  'Panchagarh',
  'Rangpur',
  'Thakurgaon',
  'Habiganj',
  'Moulvibazar',
  'Sunamganj',
  'Sylhet',
]

const ShopManagement = () => {
  const [shops, setShops] = useState<any[]>([])
  const [filteredShops, setFilteredShops] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingShop, setEditingShop] = useState<any | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [shopToDelete, setShopToDelete] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [modalError, setModalError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const itemsPerPage = 10

  // Validation Schema
  const shopValidationSchema = Yup.object().shape({
    shopName: Yup.string()
      .required('শপের নাম আবশ্যক')
      .min(3, 'শপের নাম অবশ্যই ৩ অক্ষরের বেশি হতে হবে'),
    shopLocation: Yup.string().required('শপের লোকেশন আবশ্যক'),
    deliveryChargeInside: Yup.number()
      .required('ডেলিভারি চার্জ (ভিতরে) আবশ্যক')
      .min(0, 'ডেলিভারি চার্জ শূন্য বা তার বেশি হতে হবে'),
    deliveryChargeOutside: Yup.number()
      .required('ডেলিভারি চার্জ (বাইরে) আবশ্যক')
      .min(0, 'ডেলিভারি চার্জ শূন্য বা তার বেশি হতে হবে'),
    shopDescription: Yup.string(),
    shopIcon: Yup.string().url('বৈধ URL দিন'),
    isActive: Yup.boolean(),
  })

  const formik = useFormik({
    initialValues: {
      shopName: '',
      shopLocation: '',
      deliveryChargeInside: 0,
      deliveryChargeOutside: 0,
      shopDescription: '',
      shopIcon: '',
      isActive: true,
    },
    validationSchema: shopValidationSchema,
    onSubmit: async values => {
      setModalError(null)
      try {
        let response
        if (editingShop) {
          const { success, message } = await shopApiService.updateShop(editingShop.shopId, {
            ...values,
            shopIcon: values.shopIcon || null,
          })
          response = { success, message }
          if (success) {
            setSuccess(response.message || 'শপ সফলভাবে আপডেট হয়েছে')
          } else {
            setModalError(response.message || 'শপ আপডেট করতে ব্যর্থ হয়েছে')
          }
        } else {
          const { success, message } = await shopApiService.createShop({
            ...values,
            shopIcon: values.shopIcon || undefined,
          })
          response = { success, message }

          if (success) {
            setSuccess(response.message || 'শপ সফলভাবে তৈরি হয়েছে')
          } else {
            setModalError(response.message || 'শপ তৈরি করতে ব্যর্থ হয়েছে')
          }
        }

        if (response.success) {
          fetchShops()
          setIsModalOpen(false)
          setPreviewImage(null)
        } else {
          setModalError(response.message || 'অপারেশন ব্যর্থ হয়েছে')
        }
      } catch (error) {
        setModalError('অপারেশন ব্যর্থ হয়েছে')
      }
    },
  })

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file type and size
      if (!file.type.match('image.*')) {
        setModalError('শুধুমাত্র ইমেজ ফাইল আপলোড করা যাবে')
        return
      }

      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
        setModalError('ইমেজ সাইজ 2MB এর বেশি হতে পারবে না')
        return
      }

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
          formik.setFieldValue('shopIcon', data?.publicUrl)
          setPreviewImage(data?.publicUrl || null)
        } else {
          setModalError(message || 'ইমেজ আপলোড করতে ব্যর্থ হয়েছে')
        }
      } catch (error) {
        setModalError('ইমেজ আপলোড করতে ব্যর্থ হয়েছে')
      } finally {
        setIsUploading(false)
      }
    }
  }

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Remove image
  const removeImage = () => {
    setPreviewImage(null)
    formik.setFieldValue('shopIcon', undefined)
  }

  // Fetch shops
  const fetchShops = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { success, message, data } = await shopApiService.getAllShopsForAdmin(
        currentPage,
        itemsPerPage,
        searchTerm
      )

      if (success) {
        setShops(data?.shops || [])
        setFilteredShops(data?.shops || [])
        setTotalPages(data?.totalPages || 1)
      } else {
        setError(message || 'শপ লোড করতে ব্যর্থ হয়েছে')
      }
    } catch (error) {
      setError('শপ লোড করতে ব্যর্থ হয়েছে')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShops()
  }, [currentPage, searchTerm])

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  // Open create modal
  const openCreateModal = () => {
    formik.resetForm()
    setEditingShop(null)
    setModalError(null)
    setPreviewImage(null)
    setIsModalOpen(true)
  }

  // Open edit modal
  const openEditModal = (shop: any) => {
    setEditingShop(shop)
    formik.setValues({
      shopName: shop.shopName,
      shopLocation: shop.shopLocation,
      deliveryChargeInside: Number(shop.deliveryChargeInside),
      deliveryChargeOutside: Number(shop.deliveryChargeOutside),
      shopDescription: shop.shopDescription || '',
      shopIcon: shop.shopIcon || '',
      isActive: shop.isActive,
    })
    setPreviewImage(shop.shopIcon || null)
    setModalError(null)
    setIsModalOpen(true)
  }

  // Handle delete
  const handleDelete = async () => {
    if (!shopToDelete) return
    setModalError(null)

    try {
      const response = await shopApiService.openOrCloseShop(
        shopToDelete,
        !shops.find(s => s.shopId === shopToDelete)?.isActive
      )

      if (response.success) {
        setSuccess(response.message || 'শপ সফলভাবে আপডেট হয়েছে')
        fetchShops()
        setIsDeleteModalOpen(false)
        setShopToDelete(null)
      } else {
        setModalError(response.message || 'শপ আপডেট করতে ব্যর্থ হয়েছে')
      }
    } catch (error) {
      setModalError('শপ আপডেট করতে ব্যর্থ হয়েছে')
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
          <button
            onClick={() => setSuccess(null)}
            className='absolute top-0 right-0 px-3 py-1 text-green-700 hover:text-green-900'
          >
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>
      )}
      {error && (
        <div className='bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative'>
          <span className='block sm:inline'>{error}</span>
          <button
            onClick={() => setError(null)}
            className='absolute top-0 right-0 px-3 py-1 text-red-700 hover:text-red-900'
          >
            <XMarkIcon className='h-5 w-5' />
          </button>
        </div>
      )}

      {/* Header and Search */}
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
        <h1 className='text-2xl font-bold'>শপ ম্যানেজমেন্ট</h1>
        <div className='flex flex-col sm:flex-row gap-3'>
          <div className='relative flex-grow'>
            <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
              <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' />
            </div>
            <input
              type='text'
              placeholder='শপ খুঁজুন...'
              className='pl-10 w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          <button
            onClick={openCreateModal}
            className='flex items-center justify-center gap-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 whitespace-nowrap'
          >
            <PlusIcon className='h-5 w-5' />
            <span className='hidden sm:inline'>নতুন শপ</span>
          </button>
        </div>
      </div>

      {/* Mobile View - Card List */}
      <div className='md:hidden space-y-3'>
        {isLoading ? (
          <div className='flex justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className='p-4 bg-white rounded-lg shadow text-center'>
            {searchTerm ? 'কোন শপ পাওয়া যায়নি' : 'কোন শপ নেই, নতুন শপ তৈরি করুন'}
          </div>
        ) : (
          filteredShops.map(shop => (
            <div key={shop.shopId} className='p-4 bg-white rounded-lg shadow'>
              <div className='flex gap-3'>
                {shop.shopIcon && (
                  <img
                    src={shop.shopIcon}
                    alt={shop.shopName}
                    className='w-16 h-16 rounded-md object-cover'
                  />
                )}
                <div className='flex-1'>
                  <div className='flex justify-between items-start'>
                    <div>
                      <h3 className='font-medium'>{shop.shopName}</h3>
                      <p className='text-sm text-gray-600'>{shop.shopLocation}</p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <label className='inline-flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={shop.isActive}
                          onChange={() => {
                            setShopToDelete(shop.shopId)
                            setIsDeleteModalOpen(true)
                          }}
                          className='sr-only peer'
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                  <div className='mt-2 flex flex-wrap gap-1'>
                    <span className='text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded'>
                      ভিতরে: {shop.deliveryChargeInside} টাকা
                    </span>
                    <span className='text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded'>
                      বাইরে: {shop.deliveryChargeOutside} টাকা
                    </span>
                  </div>
                  <div className='mt-2 flex justify-end gap-2'>
                    <button
                      onClick={() => openEditModal(shop)}
                      className='text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-50'
                      title='Edit'
                    >
                      <PencilSquareIcon className='h-5 w-5' />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View - Table */}
      <div className='hidden md:block overflow-x-auto rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                শপ
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                লোকেশন
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                ডেলিভারি চার্জ
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                স্ট্যাটাস
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                অ্যাকশন
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {isLoading ? (
              <tr>
                <td colSpan={5} className='px-6 py-4 text-center'>
                  <div className='flex justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
                  </div>
                </td>
              </tr>
            ) : filteredShops.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-6 py-4 text-center text-gray-500'>
                  {searchTerm ? 'কোন শপ পাওয়া যায়নি' : 'কোন শপ নেই, নতুন শপ তৈরি করুন'}
                </td>
              </tr>
            ) : (
              filteredShops.map(shop => (
                <tr key={shop.shopId} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex items-center'>
                      {shop.shopIcon && (
                        <div className='flex-shrink-0 h-10 w-10 mr-3'>
                          <img
                            className='h-10 w-10 rounded-md object-cover'
                            src={shop.shopIcon}
                            alt={shop.shopName}
                          />
                        </div>
                      )}
                      <div>
                        <div className='text-sm font-medium text-gray-900'>{shop.shopName}</div>
                        {shop.shopDescription && (
                          <div className='text-sm text-gray-500 truncate max-w-xs'>
                            {shop.shopDescription}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>{shop.shopLocation}</div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='flex gap-2'>
                      <span className='px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded'>
                        ভিতরে: {shop.deliveryChargeInside} টাকা
                      </span>
                      <span className='px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded'>
                        বাইরে: {shop.deliveryChargeOutside} টাকা
                      </span>
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <span
                      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        shop.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {shop.isActive ? 'চালু' : 'বন্ধ'}
                    </span>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='flex justify-end items-center gap-2'>
                      <button
                        onClick={() => {
                          setShopToDelete(shop.shopId)
                          setIsDeleteModalOpen(true)
                        }}
                        className={`px-3 py-1 rounded-md text-sm ${
                          shop.isActive
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {shop.isActive ? 'বন্ধ করুন' : 'চালু করুন'}
                      </button>
                      <button
                        onClick={() => openEditModal(shop)}
                        className='px-3 py-1 rounded-md text-sm bg-blue-50 text-blue-600 hover:bg-blue-100'
                      >
                        শপ এডিট করুন
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
            <span className='px-3 py-1 text-sm'>
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
            <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 w-full max-w-2xl mx-4 sm:mx-auto'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='flex justify-between items-start'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900'>
                    {editingShop ? 'শপ এডিট করুন' : 'নতুন শপ তৈরি'}
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
                  <div className='mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative'>
                    <span className='block sm:inline'>{modalError}</span>
                    <button
                      onClick={() => setModalError(null)}
                      className='absolute top-0 right-0 px-3 py-1 text-red-700 hover:text-red-900'
                    >
                      <XMarkIcon className='h-5 w-5' />
                    </button>
                  </div>
                )}

                <form onSubmit={formik.handleSubmit} className='mt-4 space-y-4'>
                  <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                    <div>
                      <label htmlFor='shopName' className='block text-sm font-medium text-gray-700'>
                        শপের নাম *
                      </label>
                      <input
                        id='shopName'
                        name='shopName'
                        type='text'
                        className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                        value={formik.values.shopName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      />
                      {formik.touched.shopName && formik.errors.shopName ? (
                        <p className='mt-1 text-sm text-red-600'>{formik.errors.shopName}</p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor='shopLocation'
                        className='block text-sm font-medium text-gray-700'
                      >
                        শপের লোকেশন (জেলা) *
                      </label>
                      <select
                        id='shopLocation'
                        name='shopLocation'
                        className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                        value={formik.values.shopLocation}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                      >
                        <option value=''>জেলা নির্বাচন করুন</option>
                        {districts.map(district => (
                          <option key={district} value={district}>
                            {district}
                          </option>
                        ))}
                      </select>
                      {formik.touched.shopLocation && formik.errors.shopLocation ? (
                        <p className='mt-1 text-sm text-red-600'>{formik.errors.shopLocation}</p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor='deliveryChargeInside'
                        className='block text-sm font-medium text-gray-700'
                      >
                        ডেলিভারি চার্জ (ভিতরে) *
                      </label>
                      <div className='mt-1 relative rounded-md shadow-sm'>
                        <input
                          id='deliveryChargeInside'
                          name='deliveryChargeInside'
                          type='number'
                          step='0.01'
                          min='0'
                          className='block w-full pr-12 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                          value={formik.values.deliveryChargeInside}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        />
                        <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                          <span className='text-gray-500 sm:text-sm'>টাকা</span>
                        </div>
                      </div>
                      {formik.touched.deliveryChargeInside && formik.errors.deliveryChargeInside ? (
                        <p className='mt-1 text-sm text-red-600'>
                          {formik.errors.deliveryChargeInside}
                        </p>
                      ) : null}
                    </div>

                    <div>
                      <label
                        htmlFor='deliveryChargeOutside'
                        className='block text-sm font-medium text-gray-700'
                      >
                        ডেলিভারি চার্জ (বাইরে) *
                      </label>
                      <div className='mt-1 relative rounded-md shadow-sm'>
                        <input
                          id='deliveryChargeOutside'
                          name='deliveryChargeOutside'
                          type='number'
                          step='0.01'
                          min='0'
                          className='block w-full pr-12 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                          value={formik.values.deliveryChargeOutside}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                        />
                        <div className='absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none'>
                          <span className='text-gray-500 sm:text-sm'>টাকা</span>
                        </div>
                      </div>
                      {formik.touched.deliveryChargeOutside &&
                      formik.errors.deliveryChargeOutside ? (
                        <p className='mt-1 text-sm text-red-600'>
                          {formik.errors.deliveryChargeOutside}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-1'>শপ আইকন</label>
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
                            className='w-32 h-32 rounded-md object-cover mb-2'
                          />
                          <button
                            type='button'
                            onClick={removeImage}
                            className='absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 -mt-2 -mr-2 hover:bg-red-600'
                          >
                            <XMarkIcon className='h-4 w-4' />
                          </button>
                          <button
                            type='button'
                            onClick={triggerFileInput}
                            className='text-sm text-indigo-600 hover:text-indigo-500 mt-1'
                          >
                            ইমেজ পরিবর্তন করুন
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={triggerFileInput}
                          className='flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500'
                        >
                          <PhotoIcon className='h-10 w-10 text-gray-400' />
                          <p className='mt-2 text-sm text-gray-600'>ইমেজ আপলোড করতে ক্লিক করুন</p>
                          <p className='text-xs text-gray-500'>সর্বোচ্চ সাইজ: 2MB</p>
                        </div>
                      )}
                      {isUploading && (
                        <p className='mt-2 text-sm text-gray-500'>ইমেজ আপলোড হচ্ছে...</p>
                      )}
                      {formik.touched.shopIcon && formik.errors.shopIcon ? (
                        <p className='mt-1 text-sm text-red-600'>{formik.errors.shopIcon}</p>
                      ) : null}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor='shopDescription'
                      className='block text-sm font-medium text-gray-700'
                    >
                      বিবরণ
                    </label>
                    <textarea
                      id='shopDescription'
                      name='shopDescription'
                      rows={3}
                      className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500'
                      value={formik.values.shopDescription}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    />
                  </div>

                  {editingShop && (
                    <div className='flex items-center'>
                      <label className='mr-2 text-sm font-medium text-gray-700'>চালু:</label>
                      <label className='inline-flex items-center cursor-pointer'>
                        <input
                          type='checkbox'
                          name='isActive'
                          checked={formik.values.isActive}
                          onChange={formik.handleChange}
                          className='sr-only peer'
                        />
                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  )}

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
                      disabled={isUploading}
                      className='inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isUploading ? (
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
                          {editingShop ? 'আপডেট হচ্ছে...' : 'তৈরি হচ্ছে...'}
                        </>
                      ) : editingShop ? (
                        'আপডেট শপ'
                      ) : (
                        'শপ তৈরি করুন'
                      )}
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
                      অ্যাকশন নিশ্চিত করুন
                    </h3>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        আপনি কি নিশ্চিত যে আপনি এই শপটি{' '}
                        {shops.find(s => s.shopId === shopToDelete)?.isActive ? 'বন্ধ' : 'চালু'}{' '}
                        করতে চান?
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
                  নিশ্চিত করুন
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

export default ShopManagement
