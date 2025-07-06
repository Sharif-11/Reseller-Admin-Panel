const ProductImagePreviewModal = ({
  imageUrl,
  productName,
  onClose,
}: {
  imageUrl: string
  productName: string
  onClose: () => void
}) => {
  return (
    <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col'>
        <div className='flex justify-between items-center border-b p-4'>
          <h3 className='text-lg font-medium truncate max-w-[80%]'>{productName}</h3>
          <button onClick={onClose} className='text-gray-500 hover:text-gray-700'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
          </button>
        </div>
        <div className='flex-1 overflow-auto p-4 flex items-center justify-center'>
          <img
            src={imageUrl}
            alt={productName}
            className='max-w-full max-h-[70vh] object-contain'
          />
        </div>
        <div className='border-t p-4 text-right'>
          <button
            onClick={onClose}
            className='px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300'
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
export default ProductImagePreviewModal
