import { useState } from 'react'
import {
  FaEnvelope,
  FaInfoCircle,
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
  const [showInstructions, setShowInstructions] = useState(true)

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '')
    const truncated = digitsOnly.slice(0, 11)
    setSellerPhoneNo(truncated)
  }

  const fetchSellerWallets = async () => {
    if (!sellerPhoneNo) {
      setError('ফোন নম্বর প্রয়োজন')
      return
    }

    if (!/^01[3-9]\d{8}$/.test(sellerPhoneNo)) {
      setError('সঠিক বাংলাদেশী ফোন নম্বর দিন')
      return
    }

    setLoading(true)
    setError('')
    setShowInstructions(false)
    try {
      const response = await walletApiService.getSellerWalletsByPhone(sellerPhoneNo)

      if (response.success && response.data) {
        setSellerDetails(response.data)
      } else {
        setSellerDetails(null)
        setError(response.message || 'এই ফোন নম্বর দিয়ে কোন বিক্রেতা পাওয়া যায়নি')
      }
    } catch (err) {
      console.error('বিক্রেতার তথ্য আনতে ব্যর্থ:', err)
      setError('বিক্রেতার তথ্য আনতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
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
      console.error('ওয়ালেট মুছতে ব্যর্থ:', err)
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
            <h1 className='text-2xl font-bold text-gray-800'>সেলার ওয়ালেট ম্যানেজমেন্ট</h1>
          </div>
        </div>

        {/* Admin Instructions */}
        {showInstructions && (
          <div className='bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6'>
            <div className='flex items-start'>
              <FaInfoCircle className='text-blue-500 mt-1 mr-3 flex-shrink-0' />
              <div>
                <h3 className='font-medium text-blue-800 mb-2'>ব্যবহারের নির্দেশনা</h3>
                <ol className='list-decimal list-inside text-sm text-blue-700 space-y-1'>
                  <li>বিক্রেতার ফোন নম্বর দিয়ে খুঁজুন (যে ফোন নম্বর দিয়ে রেজিস্ট্রেশন করা)</li>
                  <li>বিক্রেতার প্রোফাইল তথ্য দেখুন (নাম, দোকানের নাম, ঠিকানা ইত্যাদি)</li>
                  <li>বিক্রেতাকে তার ব্যক্তিগত তথ্য জিজ্ঞাসা করে মালিকানা যাচাই করুন</li>
                  <li>যাচাই সম্পন্ন হলে সংশ্লিষ্ট ওয়ালেট ডিলিট করুন</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className='bg-white rounded-xl shadow-sm p-6 mb-8'>
          <h2 className='text-lg font-semibold text-gray-800 mb-4'>বিক্রেতা খুঁজুন</h2>

          <div className='flex flex-col md:flex-row gap-4 mb-4'>
            <div className='flex-1'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                বিক্রেতার ফোন নম্বর
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
                খুঁজুন
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
              <h2 className='text-lg font-semibold text-gray-800 mb-4'>বিক্রেতার তথ্য</h2>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='flex items-start'>
                  <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                    <FaUser className='text-indigo-600' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='text-sm font-medium text-gray-500'>নাম</h3>
                    <p className='text-gray-900 truncate'>{sellerDetails.name}</p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                    <FaPhoneAlt className='text-indigo-600' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='text-sm font-medium text-gray-500'>ফোন</h3>
                    <p className='text-gray-900 truncate'>{sellerDetails.phoneNo}</p>
                  </div>
                </div>

                {sellerDetails.email && (
                  <div className='flex items-start'>
                    <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                      <FaEnvelope className='text-indigo-600' />
                    </div>
                    <div className='min-w-0'>
                      <h3 className='text-sm font-medium text-gray-500'>ইমেইল</h3>
                      <p className='text-gray-900 break-all'>{sellerDetails.email}</p>
                    </div>
                  </div>
                )}

                <div className='flex items-start'>
                  <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                    <FaShopify className='text-indigo-600' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='text-sm font-medium text-gray-500'>দোকানের নাম</h3>
                    <p className='text-gray-900 truncate'>{sellerDetails.shopName}</p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                    <FaPhoneAlt className='text-indigo-600' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='text-sm font-medium text-gray-500'>নমিনির ফোন</h3>
                    <p className='text-gray-900 truncate'>{sellerDetails.nomineePhone}</p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                    <FaMoneyBillWave className='text-indigo-600' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='text-sm font-medium text-gray-500'>ব্যালেন্স</h3>
                    <p className='text-gray-900'>{sellerDetails.balance} টাকা</p>
                  </div>
                </div>

                <div className='flex items-start md:col-span-2'>
                  <div className='bg-indigo-100 p-3 rounded-lg mr-4'>
                    <FaMapMarkerAlt className='text-indigo-600' />
                  </div>
                  <div className='min-w-0'>
                    <h3 className='text-sm font-medium text-gray-500'>ঠিকানা</h3>
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
                <h2 className='text-lg font-semibold text-gray-800'>ওয়ালেট তথ্য</h2>
                <span className='text-sm text-gray-500'>
                  {sellerDetails.Wallet.length} টি ওয়ালেট
                </span>
              </div>

              {sellerDetails.Wallet.length === 0 ? (
                <div className='text-center py-8 text-gray-500'>এই বিক্রেতার কোন ওয়ালেট নেই</div>
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
                        {deleteLoadingId === wallet.walletId ? (
                          <div className='h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                        ) : (
                          <FaTrash className='mr-2' />
                        )}
                        মুছুন
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
                ? 'এই ফোন নম্বর দিয়ে কোন বিক্রেতা পাওয়া যায়নি'
                : 'বিক্রেতার ফোন নম্বর দিন'}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50'>
          <div className='bg-white rounded-lg w-full max-w-md mx-auto p-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>ওয়ালেট মুছুন</h3>
            <p className='text-gray-600 mb-6'>
              আপনি কি নিশ্চিত যে আপনি এই ওয়ালেটটি মুছতে চান? এই কাজটি পূর্বাবস্থায় ফেরানো যাবে না।
            </p>
            <div className='flex justify-end space-x-3'>
              <button
                onClick={() => setShowDeleteModal(false)}
                className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
              >
                বাতিল
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
                    মুছছে...
                  </span>
                ) : (
                  'মুছুন'
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
