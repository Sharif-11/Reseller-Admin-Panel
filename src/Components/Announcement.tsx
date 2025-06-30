import { useEffect, useState } from 'react'
import { FiCheckCircle, FiPlus, FiSave, FiTrash2 } from 'react-icons/fi'
import { getAllAnnouncements, updateAnnouncements } from '../Api/announcement.api'

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState<string[]>([])
  const [newAnnouncement, setNewAnnouncement] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Fetch announcements on component mount
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setIsLoading(true)
      setError('')
      setSuccessMessage('')
      try {
        const response = await getAllAnnouncements()
        if (response.success) {
          setAnnouncements(response.data || [])
        } else {
          setError(response.message || 'Failed to load announcements')
        }
      } catch (err) {
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  const handleAddAnnouncement = () => {
    if (newAnnouncement.trim()) {
      setAnnouncements([...announcements, newAnnouncement])
      setNewAnnouncement('')
      setSuccessMessage('')
    }
  }

  const handleRemoveAnnouncement = (index: number) => {
    const updated = [...announcements]
    updated.splice(index, 1)
    setAnnouncements(updated)
    setSuccessMessage('')
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    try {
      const response = await updateAnnouncements(announcements)
      if (response.success) {
        setSuccessMessage('Announcements updated successfully!')
      } else {
        setError(response.message || 'Failed to update announcements')
      }
    } catch (err) {
      setError('An error occurred while saving announcements')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500'></div>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='bg-white shadow rounded-lg p-6'>
        <h2 className='text-lg font-medium text-gray-900 mb-4'>Announcement Management</h2>

        {/* Success message */}
        {successMessage && (
          <div className='mb-4 bg-green-50 border-l-4 border-green-500 p-4'>
            <div className='flex items-center'>
              <div className='flex-shrink-0'>
                <FiCheckCircle className='h-5 w-5 text-green-500' />
              </div>
              <div className='ml-3'>
                <p className='text-sm text-green-700'>{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className='mb-4 bg-red-50 border-l-4 border-red-500 p-4'>
            <div className='flex'>
              <div className='flex-shrink-0'>
                <svg
                  className='h-5 w-5 text-red-500'
                  xmlns='http://www.w3.org/2000/svg'
                  viewBox='0 0 20 20'
                  fill='currentColor'
                >
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

        <div className='space-y-4'>
          {/* Add new announcement */}
          <div className='space-y-2'>
            <textarea
              value={newAnnouncement}
              onChange={e => setNewAnnouncement(e.target.value)}
              placeholder='Enter new announcement (supports multiple lines)'
              rows={5}
              className='block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm'
            />
            <button
              onClick={handleAddAnnouncement}
              disabled={!newAnnouncement.trim()}
              className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300'
            >
              <FiPlus className='mr-1' /> Add Announcement
            </button>
          </div>

          {/* Announcements list */}
          <div className='border border-gray-200 rounded-md divide-y divide-gray-200'>
            {announcements.length === 0 ? (
              <div className='p-4 text-center text-gray-500'>No announcements yet</div>
            ) : (
              announcements.map((announcement, index) => (
                <div key={index} className='p-4'>
                  <div className='flex justify-between items-start gap-4'>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm sm:text-base whitespace-pre-line break-words text-gray-800'>
                        {announcement}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveAnnouncement(index)}
                      className='text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50'
                      title='Remove announcement'
                    >
                      <FiTrash2 className='w-4 h-4 sm:w-5 sm:h-5' />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Save button - only shown when there are announcements */}
          <div className='pt-2'>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400'
            >
              {isSaving ? (
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
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className='mr-1' /> Save All Announcements
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className='bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md'>
        <div className='flex'>
          <div className='flex-shrink-0'>
            <svg
              className='h-5 w-5 text-blue-400'
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9z'
                clipRule='evenodd'
              />
            </svg>
          </div>
          <div className='ml-3'>
            <h3 className='text-sm font-medium text-blue-800'>Usage Instructions</h3>
            <div className='mt-2 text-sm text-blue-700'>
              <p>
                Add announcements that will be displayed to users. These could be important
                notifications, system updates, or promotional messages.
              </p>
              <ul className='list-disc pl-5 mt-1 space-y-1'>
                <li>Type your announcement in the text area (supports multiple lines)</li>
                <li>Click "Add Announcement" to add it to the list</li>
                <li>Click the trash icon to remove an announcement</li>
                <li>Click "Save All Announcements" to update the announcements</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnnouncementManagement
