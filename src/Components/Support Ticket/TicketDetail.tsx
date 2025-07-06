import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import { useNavigate, useParams } from 'react-router-dom'
import supportTicketApi, { type TicketMessage } from '../../Api/support-ticket.api'
import { useAuth } from '../../Hooks/useAuth'
import type { TicketStatus } from './types'

const AdminTicketDetail = () => {
  const { ticketId } = useParams<{ ticketId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [previewAttachment, setPreviewAttachment] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch ticket details
  const {
    data: ticketData,
    isLoading,
    isError,
  } = useQuery(['support-ticket', ticketId], () => supportTicketApi.getTicketDetails(ticketId!), {
    enabled: !!ticketId,
  })

  // Mutation for replying to ticket
  const replyMutation = useMutation(
    () => supportTicketApi.replyToTicket(ticketId!, message, files, true),
    {
      onSuccess: response => {
        if (!response.success) {
          setError(response.message || 'Failed to send reply')
          return
        }
        queryClient.invalidateQueries(['support-ticket', ticketId])
        setMessage('')
        setFiles([])
        setError(null)
      },
      onError: (err: any) => {
        setError(err.message || 'Failed to send reply')
      },
    }
  )

  // Mutation for closing ticket
  const closeTicketMutation = useMutation(() => supportTicketApi.closeTicket(ticketId!), {
    onSuccess: response => {
      if (!response.success) {
        setError(response.message || 'Failed to close ticket')
        return
      }
      queryClient.invalidateQueries(['support-ticket', ticketId])
      queryClient.invalidateQueries(['support-tickets'])
      setShowCloseConfirm(false)
      setError(null)
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to close ticket')
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)

      // Check if total files exceed 5
      if (files.length + newFiles.length > 5) {
        setError('সর্বোচ্চ ৫টি ছবি আপলোড করতে পারবেন')
        return
      }

      // Check each file for image type
      const invalidFiles = newFiles.filter(file => !file.type.match('image.*'))
      if (invalidFiles.length > 0) {
        setError('Only image files are allowed (JPEG, PNG, etc.)')
        return
      }

      setFiles([...files, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
  }

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!message.trim() && files.length === 0) {
      setError('Please enter a message or attach an image')
      return
    }

    replyMutation.mutate()
  }

  const handleCloseTicket = () => {
    closeTicketMutation.mutate()
  }

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS':
        return 'bg-yellow-100 text-yellow-800'
      case 'WAITING_RESPONSE':
        return 'bg-purple-100 text-purple-800'
      case 'RESOLVED':
        return 'bg-green-100 text-green-800'
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800'
      case 'HIGH':
        return 'bg-yellow-100 text-yellow-800'
      case 'CRITICAL':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
    return new Date(date).toLocaleDateString('bn-BD', options)
  }

  if (isLoading) {
    return (
      <div className='p-4 space-y-4'>
        <div className='h-8 w-1/3 bg-gray-200 animate-pulse rounded'></div>
        <div className='space-y-2'>
          {[...Array(5)].map((_, i) => (
            <div key={i} className='h-4 w-full bg-gray-200 animate-pulse rounded'></div>
          ))}
        </div>
        <div className='h-32 w-full bg-gray-200 animate-pulse rounded'></div>
      </div>
    )
  }

  if (isError || !ticketData?.data) {
    return (
      <div className='p-4 text-center text-red-500'>
        টিকেট লোড করতে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।
        <button
          onClick={() => navigate(-1)}
          className='mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700'
        >
          ফিরে যান
        </button>
      </div>
    )
  }

  const ticket = ticketData.data
  const messages = ticket.messages || []

  return (
    <div className='space-y-6 p-4 relative'>
      {/* Error message display */}

      {/* Header with back button */}
      <div className='flex items-center justify-between'>
        <button
          onClick={() => navigate(-1)}
          className='flex items-center text-indigo-600 hover:text-indigo-800'
        >
          <svg className='w-5 h-5 mr-1' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M10 19l-7-7m0 0l7-7m-7 7h18'
            />
          </svg>
          ফিরে যান
        </button>
        <div className='flex items-center space-x-2'>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(
              ticket.priority
            )}`}
          >
            {ticket.priority}
          </span>
          <span
            className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
              ticket.status
            )}`}
          >
            {ticket.status}
          </span>
        </div>
      </div>

      {/* Ticket Info */}
      <div className='bg-white rounded-lg shadow p-4'>
        <h1 className='text-xl font-bold text-gray-800 mb-2'>{ticket.subject}</h1>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
          <div>
            <p className='text-gray-600'>
              টিকেট আইডি: <span className='text-gray-800'>#{ticket.ticketId.slice(0, 8)}</span>
            </p>
            <p className='text-gray-600'>
              শপ: <span className='text-gray-800'>{ticket.shopName || '-'}</span>
            </p>
            <p className='text-gray-600'>
              ইউজার: <span className='text-gray-800'>{ticket.userName}</span>
            </p>
          </div>
          <div>
            <p className='text-gray-600'>
              ক্যাটাগরি: <span className='text-gray-800'>{ticket.category}</span>
            </p>
            <p className='text-gray-600'>
              তারিখ: <span className='text-gray-800'>{formatDate(ticket.createdAt)}</span>
            </p>
            {ticket.orderId && (
              <p className='text-gray-600'>
                অর্ডার আইডি: <span className='text-gray-800'>{ticket.orderId}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Close Ticket Button (for admins only when ticket is open) */}
      {(user?.role === 'Admin' || user?.role === 'SuperAdmin') && ticket.status !== 'CLOSED' && (
        <div className='flex justify-end'>
          <button
            onClick={() => setShowCloseConfirm(true)}
            className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center'
          >
            <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
              />
            </svg>
            টিকেট বন্ধ করুন
          </button>
        </div>
      )}

      {/* Messages */}
      <div className='space-y-4'>
        {messages.map((msg: TicketMessage) => (
          <div
            key={msg.messageId}
            className={`p-4 rounded-lg shadow ${
              msg.senderType === 'SYSTEM' ? 'bg-indigo-50' : 'bg-white'
            }`}
          >
            <div className='flex justify-between items-start mb-2'>
              <div>
                <p className='font-medium'>{msg.senderName}</p>
                <p className='text-xs text-gray-500'>{formatDate(msg.createdAt)}</p>
              </div>
              <span className='text-xs px-2 py-1 bg-gray-100 rounded-full'>
                {msg.senderType === 'SYSTEM' ? 'Admin' : 'Seller'}
              </span>
            </div>
            <p className='text-gray-800 whitespace-pre-line'>{msg.content}</p>

            {/* Attachments */}
            {msg.attachments?.length > 0 && (
              <div className='mt-3'>
                <p className='text-xs text-gray-500 mb-1'>Attachments:</p>
                <div className='flex flex-wrap gap-2'>
                  {msg.attachments.map((url, index) => (
                    <div key={index} className='relative'>
                      <button
                        onClick={() => setPreviewAttachment(url)}
                        className='text-xs text-indigo-600 hover:text-indigo-800 break-all underline'
                      >
                        Image {index + 1}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {error && (
        <div className='bg-red-50 border-l-4 border-red-500 p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <svg className='h-5 w-5 text-red-500' fill='currentColor' viewBox='0 0 20 20'>
                <path
                  fillRule='evenodd'
                  d='M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z'
                  clipRule='evenodd'
                />
              </svg>
            </div>
            <div className='ml-3'>
              <p className='text-sm text-red-700'>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Reply Form (only if ticket is not closed) */}
      {ticket.status !== 'CLOSED' && (
        <form onSubmit={handleSubmitReply} className='bg-white rounded-lg shadow p-4'>
          <h2 className='text-lg font-medium text-gray-800 mb-3'>Reply to Ticket</h2>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder='আপনার মেসেজ লিখুন...'
            className='w-full p-3 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500'
            rows={4}
          />

          {/* File attachments */}
          <div className='mt-3'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Image Attachments (max 5, JPG/PNG only)
            </label>
            <input
              type='file'
              onChange={handleFileChange}
              multiple
              accept='image/*'
              className='block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100'
              disabled={files.length >= 5}
            />
            {files.length > 0 && (
              <div className='mt-2 space-y-1'>
                {files.map((file, index) => (
                  <div key={index} className='flex items-center justify-between text-sm'>
                    <span className='truncate max-w-xs'>{file.name}</span>
                    <button
                      type='button'
                      onClick={() => removeFile(index)}
                      className='text-red-500 hover:text-red-700'
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type='submit'
            disabled={replyMutation.isLoading || (!message.trim() && files.length === 0)}
            className='mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {replyMutation.isLoading ? 'Sending...' : 'Send Reply'}
          </button>
        </form>
      )}

      {/* Closed ticket message */}
      {ticket.status === 'CLOSED' && (
        <div className='bg-gray-100 p-4 rounded-lg text-center text-gray-600'>
          This ticket has been closed. No further replies can be added.
        </div>
      )}

      {/* Close Ticket Confirmation Modal */}
      {showCloseConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-md w-full'>
            <div className='p-6'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>টিকেট বন্ধ করার নিশ্চিতকরণ</h3>
              <p className='text-gray-600 mb-6'>
                আপনি কি নিশ্চিত যে আপনি এই টিকেটটি বন্ধ করতে চান? টিকেট বন্ধ হয়ে গেলে আর কোনো উত্তর
                যোগ করা যাবে না।
              </p>
              <div className='flex justify-end space-x-3'>
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className='px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50'
                >
                  বাতিল করুন
                </button>
                <button
                  onClick={handleCloseTicket}
                  disabled={closeTicketMutation.isLoading}
                  className='px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50'
                >
                  {closeTicketMutation.isLoading ? 'বন্ধ হচ্ছে...' : 'হ্যাঁ, বন্ধ করুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {previewAttachment && (
        <div className='fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col'>
            <div className='flex justify-between items-center border-b p-4'>
              <h3 className='text-lg font-medium'>Image Preview</h3>
              <button
                onClick={() => setPreviewAttachment(null)}
                className='text-gray-500 hover:text-gray-700'
              >
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
                src={previewAttachment}
                alt='Attachment preview'
                className='max-w-full max-h-[70vh] object-contain'
              />
            </div>
            <div className='border-t p-4 text-right'>
              <a
                href={previewAttachment}
                download
                className='mr-3 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-flex items-center'
              >
                <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                  />
                </svg>
                Download
              </a>
              <button
                onClick={() => setPreviewAttachment(null)}
                className='px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTicketDetail
