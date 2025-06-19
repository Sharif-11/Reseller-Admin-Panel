import { ErrorMessage, Field, Form, Formik } from 'formik'
import { useEffect, useState } from 'react'
import { FaExclamationCircle, FaPhoneAlt, FaPlus, FaTrash, FaWallet } from 'react-icons/fa'
import * as Yup from 'yup'
import { walletApiService, type Wallet } from '../Api/wallet.api'

// Validation schema
const walletValidationSchema = Yup.object({
  walletName: Yup.string()
    .required('Wallet name is required')
    .oneOf(['Bkash', 'Nagad'], 'Must be Bkash or Nagad'),
  walletPhoneNo: Yup.string()
    .required('Phone number is required')
    .matches(/^01[3-9]\d{8}$/, 'Invalid Phone Number'),
})

const SystemWalletPage = () => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null)
  const [backendError, setBackendError] = useState<string>('')

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
      console.error('Failed to fetch wallets:', error)
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
        setBackendError(response.message || 'Failed to create wallet. Please try again.')
      }
    } catch (error) {
      console.error('Failed to create wallet:')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteWallet = async (walletId: number) => {
    try {
      setDeleteLoadingId(walletId)
      const response = await walletApiService.deleteWallet(walletId)
      if (response.success) {
        fetchWallets()
      }
    } catch (error) {
      console.error('Failed to delete wallet:', error)
    } finally {
      setDeleteLoadingId(null)
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
            <h1 className='text-2xl font-bold text-gray-800'>System Wallets</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className='flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors'
          >
            <FaPlus className='mr-2' />
            Add Wallet
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
              <p className='text-gray-500'>No wallets found</p>
            </div>
          ) : (
            wallets.map(wallet => (
              <div
                key={wallet.walletId}
                className='bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden'
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
                    </div>
                    <div className='flex items-center mt-1 text-gray-600'>
                      <FaPhoneAlt className='mr-2 text-sm' />
                      <span className='text-sm'>{wallet.walletPhoneNo}</span>
                    </div>
                  </div>

                  <div className='flex-shrink-0'>
                    <button
                      onClick={() => handleDeleteWallet(wallet.walletId)}
                      disabled={deleteLoadingId === wallet.walletId}
                      className='text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors'
                    >
                      {deleteLoadingId === wallet.walletId ? (
                        <div className='h-5 w-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin'></div>
                      ) : (
                        <FaTrash />
                      )}
                    </button>
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
                <h2 className='text-xl font-bold text-gray-800 mb-4'>Add New Wallet</h2>

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
                          Wallet Name
                        </label>
                        <Field
                          as='select'
                          name='walletName'
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                        >
                          <option value=''>Select wallet</option>
                          <option value='Bkash'>Bkash</option>
                          <option value='Nagad'>Nagad</option>
                        </Field>
                        <ErrorMessage
                          name='walletName'
                          component='div'
                          className='mt-1 text-sm text-red-600'
                        />
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-gray-700 mb-1'>
                          Phone Number
                        </label>
                        <Field
                          type='tel'
                          name='walletPhoneNo'
                          className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500'
                          placeholder='01XXXXXXXXX (11 digits)'
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
                          Cancel
                        </button>
                        <button
                          type='submit'
                          disabled={isSubmitting}
                          className='px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]'
                        >
                          {isSubmitting ? (
                            <div className='h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                          ) : (
                            'Create Wallet'
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
      </div>
    </div>
  )
}

export default SystemWalletPage
