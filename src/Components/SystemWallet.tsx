import { ErrorMessage, Field, Form, Formik } from 'formik'
import { useEffect, useState } from 'react'
import { FaExclamationCircle, FaPhoneAlt, FaPlus, FaWallet } from 'react-icons/fa'
import * as Yup from 'yup'
import { walletApiService, type Wallet } from '../Api/wallet.api'

// Validation schema
const walletValidationSchema = Yup.object({
  walletName: Yup.string()
    .required('ওয়ালেটের নাম প্রয়োজন')
    .oneOf(['Bkash', 'Nagad'], 'শুধুমাত্র বিকাশ অথবা নগদ হতে পারে'),
  walletPhoneNo: Yup.string()
    .required('ফোন নম্বর প্রয়োজন')
    .matches(/^01[3-9]\d{8}$/, 'সঠিক ফোন নম্বর দিন'),
})

const SystemWalletPage = () => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [updatingWalletId, setUpdatingWalletId] = useState<number | null>(null)
  const [backendError, setBackendError] = useState<string>('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)

  const initialValues = {
    walletName: '',
    walletPhoneNo: '',
  }

  useEffect(() => {
    fetchWallets()
  }, [])

  const fetchWallets = async () => {
    setLoading(true)
    try {
      const response = await walletApiService.getSystemWallets()
      if (response.success && response.data) {
        setWallets(response.data)
      }
    } catch (error) {
      console.error('ওয়ালেট লোড করতে সমস্যা হয়েছে:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWallet = async (
    values: { walletName: string; walletPhoneNo: string },
    {
      setSubmitting,
      resetForm,
    }: {
      setSubmitting: (isSubmitting: boolean) => void
      resetForm: () => void
      setFieldError: (field: string, message: string) => void
    }
  ) => {
    try {
      setBackendError('')

      const response = await walletApiService.createWallet({
        walletName: values.walletName,
        walletPhoneNo: values.walletPhoneNo,
        walletType: 'SYSTEM',
      })

      if (response.success) {
        resetForm()
        setShowCreateModal(false)
        fetchWallets()
      } else {
        setBackendError(response.message || 'ওয়ালেট তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
      }
    } catch (error) {
      console.error('ওয়ালেট তৈরি করতে ব্যর্থ হয়েছে')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleClick = (wallet: Wallet) => {
    setSelectedWallet(wallet)
    setShowConfirmModal(true)
  }

  const handleConfirmToggle = async () => {
    if (!selectedWallet) return

    try {
      setUpdatingWalletId(selectedWallet.walletId)
      const response = await walletApiService.updateWallet(selectedWallet.walletId, {
        isActive: !selectedWallet.isActive,
      })
      if (response.success) {
        fetchWallets()
      }
    } catch (error) {
      console.error('স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে:', error)
    } finally {
      setUpdatingWalletId(null)
      setShowConfirmModal(false)
      setSelectedWallet(null)
    }
  }

  const handleModalClose = () => {
    setShowCreateModal(false)
    setBackendError('')
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4 md:p-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4'>
          <div className='flex items-center'>
            <FaWallet className='text-indigo-600 text-2xl mr-3' />
            <h1 className='text-2xl font-bold text-gray-800'>সিস্টেম ওয়ালেট</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className='flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors'
          >
            <FaPlus className='mr-2' />
            নতুন ওয়ালেট যোগ করুন
          </button>
        </div>

        {/* Wallet List */}
        <div className='space-y-4'>
          {loading && wallets.length === 0 ? (
            <div className='flex justify-center items-center p-12'>
              <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600'></div>
            </div>
          ) : wallets.length === 0 ? (
            <div className='bg-white rounded-xl shadow-sm p-8 text-center'>
              <p className='text-gray-500'>কোন ওয়ালেট পাওয়া যায়নি</p>
            </div>
          ) : (
            wallets.map(wallet => (
              <div
                key={wallet.walletId}
                className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
                  !wallet.isActive ? 'opacity-70' : ''
                }`}
              >
                <div className='flex flex-col sm:flex-row sm:items-center p-4 gap-4'>
                  <div className='flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center'>
                    <FaWallet className='text-indigo-600 text-xl' />
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h3 className='text-lg font-medium text-gray-900 truncate'>
                        {wallet.walletName}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          wallet.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {wallet.isActive ? 'active' : 'inactive'}
                      </span>
                    </div>
                    <div className='flex items-center mt-1 text-gray-600'>
                      <FaPhoneAlt className='mr-2 text-sm' />
                      <span className='text-sm'>{wallet.walletPhoneNo}</span>
                    </div>
                  </div>

                  <div className='flex-shrink-0'>
                    <label className='relative inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        className='sr-only peer'
                        checked={wallet.isActive}
                        onChange={() => handleToggleClick(wallet)}
                        disabled={updatingWalletId === wallet.walletId}
                      />
                      <div
                        className={`w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${
                          wallet.isActive ? 'peer-checked:bg-green-500' : 'peer-checked:bg-red-500'
                        }`}
                      ></div>
                      {updatingWalletId === wallet.walletId && (
                        <div className='ml-2 h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin'></div>
                      )}
                    </label>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Wallet Modal */}
        {showCreateModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-xl shadow-xl w-full max-w-md'>
              <div className='p-6'>
                <h2 className='text-xl font-bold text-gray-800 mb-4'>নতুন ওয়ালেট যোগ করুন</h2>

                {/* Backend Error Alert */}
                {backendError && (
                  <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start'>
                    <FaExclamationCircle className='text-red-500 mr-2 mt-0.5 flex-shrink-0' />
                    <div className='text-sm text-red-700'>{backendError}</div>
                  </div>
                )}

                <Formik
                  initialValues={initialValues}
                  validationSchema={walletValidationSchema}
                  onSubmit={handleCreateWallet}
                  enableReinitialize
                >
                  {({ isSubmitting }) => (
                    <Form className='space-y-4'>
                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          ওয়ালেটের নাম
                        </label>
                        <Field
                          as='select'
                          name='walletName'
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        >
                          <option value=''>ওয়ালেট নির্বাচন করুন</option>
                          <option value='Bkash'>বিকাশ</option>
                          <option value='Nagad'>নগদ</option>
                        </Field>
                        <ErrorMessage
                          name='walletName'
                          component='div'
                          className='mt-1 text-sm text-red-600'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          ফোন নম্বর
                        </label>
                        <Field
                          type='tel'
                          name='walletPhoneNo'
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                          placeholder='01XXXXXXXXX (১১ ডিজিট)'
                          maxLength={11}
                        />
                        <ErrorMessage
                          name='walletPhoneNo'
                          component='div'
                          className='mt-1 text-sm text-red-600'
                        />
                      </div>

                      <div className='mt-6 flex justify-end space-x-3'>
                        <button
                          type='button'
                          onClick={handleModalClose}
                          disabled={isSubmitting}
                          className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                        >
                          বাতিল
                        </button>
                        <button
                          type='submit'
                          disabled={isSubmitting}
                          className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]'
                        >
                          {isSubmitting ? (
                            <div className='h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                          ) : (
                            'তৈরি করুন'
                          )}
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && selectedWallet && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-xl shadow-xl w-full max-w-sm'>
              <div className='p-6'>
                <h2 className='text-xl font-bold text-gray-800 mb-4'>
                  {selectedWallet.isActive ? 'inactive করবেন?' : 'active করবেন?'}
                </h2>
                <p className='text-gray-600 mb-6'>
                  আপনি কি নিশ্চিত যে আপনি{' '}
                  <span className='font-semibold'>{selectedWallet.walletName}</span> ওয়ালেটটি{' '}
                  {selectedWallet.isActive ? 'inactive' : 'active'} করতে চান?
                </p>

                <div className='flex flex-col sm:flex-row sm:justify-end gap-3'>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    disabled={updatingWalletId === selectedWallet.walletId}
                    className='px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    বাতিল
                  </button>
                  <button
                    onClick={handleConfirmToggle}
                    disabled={updatingWalletId === selectedWallet.walletId}
                    className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px] ${
                      selectedWallet.isActive
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-green-500 hover:bg-green-600'
                    }`}
                  >
                    {updatingWalletId === selectedWallet.walletId ? (
                      <div className='h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                    ) : selectedWallet.isActive ? (
                      'কনফার্ম করুন'
                    ) : (
                      'কনফার্ম করুন'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SystemWalletPage
