import React, { useEffect, useRef, useState } from 'react'

import { rootURL } from '../../Axios/baseUrl'
import { useAuth } from '../../Hooks/useAuth'
import { NotificationClient } from '../../Socket/socket'
import audioFile from './Assets/notification.mp3'
import { notificationService } from './notification.services'
import type { FrontendNotification } from './notification.types'
import { NotificationType } from './notification.types'
import './NotificationDropdown.css'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  onMarkAllAsRead: () => void
  setUnreadCount: (count: number) => void
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  setUnreadCount,
}) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<FrontendNotification[]>([])
  const [, setSocketInstance] = useState<NotificationClient | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(notif => !notif.read).length

  // Fetch notifications
  useEffect(() => {
    if (user?.userId) {
      setLoading(true)
      const newClient = new NotificationClient({
        serverUrl: rootURL,
        onConnected: () => console.log('Connected to notification server'),
        onDisconnected: () => console.log('Disconnected from notification server'),
        onIdentificationSuccess: data => console.log('Identified:', data),
        onIdentificationError: error => console.error('Identification error:', error),
        onNewNotification: notification => {
          // we have an audio file at public/notification.mp3 which must be played when a new notification arrives
          const audio = new Audio(audioFile)
          audio.play().catch(err => console.error('Audio play error:', err.message))

          notification &&
            setNotifications(prev => [
              notificationService.convertToFrontendFormat(notification, user.userId),
              ...prev,
            ])
        },
        onAllNotifications: notifications =>
          notifications &&
          setNotifications(
            notifications.map(notif =>
              notificationService.convertToFrontendFormat(notif, user.userId)
            )
          ),
        onUnreadCount: count => setUnreadCount(count),
        onError: error => console.error('Socket error:', error),
      })
      newClient.connect(user.userId)
      setSocketInstance(newClient)
      setLoading(false)
    }
  }, [isOpen, user?.userId])

  // Close dropdown when clicking outside or pressing escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        handleClose()
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
      // Prevent body scroll on mobile when dropdown is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleClose = () => {
    onClose()
    setShowAll(false)
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_ORDER:
        return '🛒'
      case NotificationType.PAYMENT_REQUEST:
        return '💳'
      case NotificationType.WITHDRAW_REQUEST:
        return '💰'
      case NotificationType.TICKET_MESSAGE:
        return '🎫'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.NEW_ORDER:
        return '#10b981' // green
      case NotificationType.PAYMENT_REQUEST:
        return '#f59e0b' // amber
      case NotificationType.WITHDRAW_REQUEST:
        return '#ef4444' // red
      case NotificationType.TICKET_MESSAGE:
        return '#8b5cf6' // violet
      default:
        return '#6b7280' // gray
    }
  }

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 3)

  if (!isOpen) return null

  return (
    <>
      {/* Mobile overlay */}
      <div
        className='notification-overlay'
        onClick={handleClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: 40,
        }}
      />

      <div ref={dropdownRef} className='notification-dropdown'>
        {/* Header */}
        <div className='notification-header'>
          <div className='notification-title'>
            <span className='notification-icon'>🔔</span>
            নোটিফিকেশন
            {unreadCount > 0 && <span className='notification-badge'>{unreadCount} new</span>}
          </div>
        </div>

        {/* Notifications List */}
        <div className='notification-list'>
          {loading ? (
            <div className='notification-loading'>
              <div>Loading notifications...</div>
            </div>
          ) : displayedNotifications.length > 0 ? (
            displayedNotifications.map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
              >
                <div
                  className='notification-icon-type'
                  style={{ color: getNotificationColor(notification.type) }}
                >
                  {getNotificationIcon(notification.type)}
                </div>
                <div className='notification-content'>
                  <div className='notification-message' title={notification.message}>
                    {notification.message}
                  </div>
                  <div className='notification-time'>
                    <span>🕒</span>
                    {notification.timeAgo}
                  </div>
                </div>
                {!notification.read && <div className='unread-indicator' />}
              </div>
            ))
          ) : (
            <div className='notification-empty'>
              <div className='empty-icon'>🔔</div>
              <p>কোন নোটিফিকেশন নেই</p>
              <span>কোন নোটিফিকেশন আসলে আপনাকে জানানো হবে</span>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showAll && notifications.length > 3 && (
          <div className='notification-footer'>
            <button onClick={() => setShowAll(true)} className='view-all-btn'>
              View All Notifications ({notifications.length})
            </button>
          </div>
        )}

        {showAll && (
          <div className='notification-footer'>
            <button onClick={() => setShowAll(false)} className='view-less-btn'>
              Show Less
            </button>
          </div>
        )}
      </div>
    </>
  )
}

export default NotificationDropdown
