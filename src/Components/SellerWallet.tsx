import { useState } from 'react'
import { FaPhoneAlt, FaSearch, FaTrash, FaWallet } from 'react-icons/fa'
import { walletApiService, type Wallet } from '../Api/wallet.api'

const SellerWalletManagementPage = () => {
  const [wallets, setWallets] = useState<Wallet[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null)
  const [sellerPhoneNo, setSellerPhoneNo] = useState('')
  const [error, setError] = useState('')

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
        setWallets(response.data)
      } else {
        setWallets([])
        setError(response.message || 'No wallets found for this seller')
      }
    } catch (err) {
      console.error('Failed to fetch wallets:', err)
      setError('Failed to fetch wallets. Please try again.')
      setWallets([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteWallet = async (walletId: number) => {
    if (!confirm('Are you sure you want to delete this wallet?')) return

    try {
      setDeleteLoadingId(walletId)
      const response = await walletApiService.deleteWallet(walletId)
      if (response.success) {
        setWallets(prev => prev.filter(wallet => wallet.walletId !== walletId))
      }
    } catch (err) {
      console.error('Failed to delete wallet:', err)
    } finally {
      setDeleteLoadingId(null)
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
          <h2 className='text-lg font-semibold text-gray-800 mb-4'>Find Seller Wallets</h2>

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
                className='flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed h-[42px]'
              >
                {loading ? (
                  <div className='h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                ) : (
                  <FaSearch className='mr-2' />
                )}
                Find Wallets
              </button>
            </div>
          </div>

          {error && <p className='text-red-500 text-sm'>{error}</p>}
        </div>

        {/* Wallet List */}
        <div className='space-y-4'>
          {loading && wallets.length === 0 ? (
            <div className='flex justify-center items-center p-12'>
              <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600'></div>
            </div>
          ) : wallets.length === 0 ? (
            <div className='bg-white rounded-xl shadow-sm p-8 text-center'>
              <p className='text-gray-500'>
                {sellerPhoneNo
                  ? 'No wallets found for this seller'
                  : 'Enter seller phone number to find their wallets'}
              </p>
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
                      className='flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed'
                    >
                      {deleteLoadingId === wallet.walletId ? (
                        <div className='h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2'></div>
                      ) : (
                        <>
                          <FaTrash className='mr-2' />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default SellerWalletManagementPage
