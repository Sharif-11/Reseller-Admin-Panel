import { useEffect, useState } from 'react'
import { FiSave } from 'react-icons/fi'
import { configApiService } from '../Api/config.api'

// Default notification settings with camelCase keys
const DEFAULT_NOTIFICATIONS = {
  withdrawRequestNotification: false,
  orderArrivalNotification: true,
  orderDeliveryNotification: true,
  orderCompletionNotification: false,
  withdrawCompletionNotification: true,
}

export const NotificationSettings = () => {
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch notification settings
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const { success, data } = await configApiService.getConfig('notifications')

      if (success && data?.content) {
        // Merge with defaults to ensure all fields exist
        setNotifications({
          ...DEFAULT_NOTIFICATIONS,
          ...data.content,
        })
      } else {
        // Use defaults if no data exists
        setNotifications(DEFAULT_NOTIFICATIONS)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  // Save notification settings
  const saveSettings = async () => {
    try {
      setSaving(true)
      const { success, message } = await configApiService.upsertConfig(
        'notifications',
        notifications
      )

      if (success) {
        setMessage({ type: 'success', text: message || 'Settings saved successfully' })
      } else {
        setMessage({ type: 'error', text: message || 'Failed to save settings' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error saving settings' })
    } finally {
      setSaving(false)
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000)
    }
  }

  // Toggle individual notification setting
  const toggleNotification = (key: keyof typeof DEFAULT_NOTIFICATIONS) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  // Format camelCase keys for display
  const formatLabel = (key: string) => {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    )
  }

  return (
    <div className='w-full px-4 py-6 bg-white rounded-lg shadow-md sm:max-w-md md:max-w-2xl mx-auto'>
      <h1 className='text-xl font-bold text-gray-800 mb-6 sm:text-2xl'>Notification Settings</h1>

      {message && (
        <div
          className={`mb-4 p-3 rounded-md text-sm sm:text-base ${
            message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className='space-y-3 sm:space-y-4'>
        {Object.entries(notifications).map(([key, value]) => (
          <div
            key={key}
            className='flex items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg'
          >
            <span className='text-sm text-gray-700 sm:text-base'>{formatLabel(key)}</span>
            <button
              onClick={() => toggleNotification(key as keyof typeof DEFAULT_NOTIFICATIONS)}
              className={`relative inline-flex items-center h-5 rounded-full w-10 sm:h-6 sm:w-11 transition-colors focus:outline-none ${
                value ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block w-3 h-3 sm:w-4 sm:h-4 transform transition-transform ${
                  value ? 'translate-x-5 sm:translate-x-6' : 'translate-x-1'
                } bg-white rounded-full`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className='mt-6 sm:mt-8 flex justify-end'>
        <button
          onClick={saveSettings}
          disabled={saving}
          className='flex items-center px-3 py-1.5 text-sm sm:px-4 sm:py-2 sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50'
        >
          <FiSave className='mr-1 sm:mr-2' />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

export default NotificationSettings
