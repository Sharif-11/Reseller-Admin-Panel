import { useState } from 'react'
import {
  FaEnvelope,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPhoneAlt,
  FaSearch,
  FaShopify,
  FaTrash,
  FaUser,
  FaWallet,
} from 'react-icons/fa'
import { walletApiService, type Wallet } from '../Api/wallet.api'

interface SellerDetails {
  userId: string
  name: string
  phoneNo: string
  email: string | null
  zilla: string
  upazilla: string
  address: string
  shopName: string
  nomineePhone: string
  balance: string
  Wallet: Wallet[]
}

const SellerWalletManagementPage = () => {
  const [sellerDetails, setSellerDetails] = useState<SellerDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null)
  const [sellerPhoneNo, setSellerPhoneNo] = useState('')
  const [error, setError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [walletToDelete, setWalletToDelete] = useState<number | null>(null)

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '')
    const truncated = digitsOnly.slice(0, 11)
    setSellerPhoneNo(truncated)
  }

  const fetchSellerWallets = async () => {
    if (!sellerPhoneNo) {
      setError('Phone number is required')
      return
    }

    if (!/^01[3-9]\d{8}$/.test(sellerPhoneNo)) {
      setError('Invalid Bangladeshi phone number')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await walletApiService.getSellerWalletsByPhone(sellerPhoneNo)

      if (response.success && response.data) {
        setSellerDetails(response.data)
      } else {
        setSellerDetails(null)
        setError(response.message || 'No seller found with this phone number')
      }
    } catch (err) {
      console.error('Failed to fetch seller details:', err)
      setError('Failed to fetch seller details. Please try again.')
      setSellerDetails(null)
    } finally {
      setLoading(false)
    }
  }

  const confirmDeleteWallet = (walletId: number) => {
    setWalletToDelete(walletId)
    setShowDeleteModal(true)
  }

  const handleDeleteWallet = async () => {
    if (!walletToDelete) return

    try {
      setDeleteLoadingId(walletToDelete)
      const response = await walletApiService.deleteWallet(walletToDelete)
      if (response.success && sellerDetails) {
        setSellerDetails({
          ...sellerDetails,
          Wallet: sellerDetails.Wallet.filter(wallet => wallet.walletId !== walletToDelete),
        })
      }
    } catch (err) {
      console.error('Failed to delete wallet:', err)
    } finally {
      setDeleteLoadingId(null)
      setShowDeleteModal(false)
      setWalletToDelete(null)
    }
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4 md:p-8'>
      <div className='max-w-4xl mx-auto'>
        {/* Header */}
        <div className='flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4'>
          <div className='flex items-center'>
            <FaWallet className='text-indigo-600 text-2xl mr-3' />
            <h1 className='text-2xl font-bold text-gray-800'>Seller Wallet Management</h1>
          </div>
        </div>

        {/* Search Section */}
        <div className='bg-white rounded-xl shadow-sm p-6 mb-8'>
          <h2 className='text-lg font-semibold text-gray-800 mb-4'>Find Seller</h2>

          <div className='flex flex-col md:flex-row gap-4 mb-4'>
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Seller Phone Number
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <span className='text-gray-500'>+88</span>
                </div>
                <input
                  type='tel'
                  value={sellerPhoneNo}
                  onChange={handlePhoneNumberChange}
                  className='w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  placeholder='01XXXXXXXXX'
                  maxLength={11}
                />
              </div>
            </div>

            <div className='flex items-end'>
              <button
                onClick={fetchSellerWallets}
                disabled={loading}
                type='submit'
                className='flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed h-[42px]'
              >
                {loading ? (
                  <div className='h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                ) : (
                  <FaSearch className='mr-2' />
                )}
                Find Seller
              </button>
            </div>
          </div>

          {error && <p className='text-red-500 text-sm'>{error}</p>}
        </div>

        {/* Seller Details and Wallet List */}
        {loading && !sellerDetails ? (
          <div className='flex justify-center items-center p-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600'></div>
          </div>
        ) : sellerDetails ? (
          <div className='space-y-6'>
            {/* Seller Information Card */}
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <h2 className='text-lg font-semibold text-gray-800 mb-4'>Seller Information</h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex items-start'>
                  <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                    <FaUser className='text-indigo-600' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='text-sm font-medium text-gray-500'>Name</h3>
                    <p className='text-gray-900 truncate'>{sellerDetails.name}</p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                    <FaPhoneAlt className='text-indigo-600' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='text-sm font-medium text-gray-500'>Phone</h3>
                    <p className='text-gray-900 truncate'>{sellerDetails.phoneNo}</p>
                  </div>
                </div>

                {sellerDetails.email && (
                  <div className='flex items-start'>
                    <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                      <FaEnvelope className='text-indigo-600' />
                    </div>
                    <div className='min-w-0'>
                      <h3 className='text-sm font-medium text-gray-500'>Email</h3>
                      <p className='text-gray-900 break-all'>{sellerDetails.email}</p>
                    </div>
                  </div>
                )}

                <div className='flex items-start'>
                  <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                    <FaShopify className='text-indigo-600' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='text-sm font-medium text-gray-500'>Shop Name</h3>
                    <p className='text-gray-900 truncate'>{sellerDetails.shopName}</p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                    <FaPhoneAlt className='text-indigo-600' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='text-sm font-medium text-gray-500'>Nominee Phone</h3>
                    <p className='text-gray-900 truncate'>{sellerDetails.nomineePhone}</p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                    <FaMoneyBillWave className='text-indigo-600' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='text-sm font-medium text-gray-500'>Balance</h3>
                    <p className='text-gray-900'>{sellerDetails.balance} BDT</p>
                  </div>
                </div>

                <div className='flex items-start md:col-span-2'>
                  <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                    <FaMapMarkerAlt className='text-indigo-600' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='text-sm font-medium text-gray-500'>Address</h3>
                    <p className='text-gray-900 break-words'>
                      {sellerDetails.upazilla}, {sellerDetails.zilla}
                      <br />
                      {sellerDetails.address}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Wallets Section */}
            <div className='bg-white rounded-xl shadow-sm p-6'>
              <div className='flex justify-between items-center mb-4'>
                <h2 className='text-lg font-semibold text-gray-800'>Wallet Information</h2>
                <span className='text-sm text-gray-500'>
                  {sellerDetails.Wallet.length}{' '}
                  {sellerDetails.Wallet.length === 1 ? 'wallet' : 'wallets'}
                </span>
              </div>

              {sellerDetails.Wallet.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>
                  No wallets found for this seller
                </div>
              ) : (
                <div className='space-y-4'>
                  {sellerDetails.Wallet.map(wallet => (
                    <div
                      key={wallet.walletId}
                      className='bg-gray-50 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4'
                    >
                      <div className='flex items-center gap-4 min-w-0'>
                        <div className='bg-indigo-100 p-3 rounded-lg'>
                          <FaWallet className='text-indigo-600' />
                        </div>
                        <div className='min-w-0'>
                          <h3 className='font-medium text-gray-900 truncate'>
                            {wallet.walletName}
                          </h3>
                          <p className='text-sm text-gray-600 flex items-center truncate'>
                            <FaPhoneAlt className='mr-2 flex-shrink-0' />
                            <span className='truncate'>{wallet.walletPhoneNo}</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => confirmDeleteWallet(wallet.walletId)}
                        disabled={deleteLoadingId === wallet.walletId}
                        className='flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed sm:self-end'
                      >
                        <FaTrash className='mr-2' />
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className='bg-white rounded-xl shadow-sm p-8 text-center'>
            <p className='text-gray-500'>
              {sellerPhoneNo
                ? 'No seller found with this phone number'
                : 'Enter seller phone number to find their details'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
          <div className='bg-white rounded-lg w-full max-w-md mx-auto p-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>Confirm Deletion</h3>
            <p className='text-gray-600 mb-6'>
              Are you sure you want to delete this wallet? This action cannot be undone.
            </p>
            <div className='flex justify-end space-x-3'>
              <button
                onClick={() => setShowDeleteModal(false)}
                className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteWallet}
                disabled={deleteLoadingId !== null}
                className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-70'
              >
                {deleteLoadingId ? (
                  <span className='flex items-center'>
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
                    Deleting...
                  </span>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SellerWalletManagementPage
