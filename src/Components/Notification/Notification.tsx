import React, { useEffect, useRef, useState } from 'react'

import { useAuth } from '../../Hooks/useAuth'
import { notificationService } from './notification.services'
import type { FrontendNotification } from './notification.types'
import { NotificationType } from './notification.types'
import './NotificationDropdown.css'

interface NotificationDropdownProps {
  isOpen: boolean
  onClose: () => void
  onMarkAllAsRead: () => void
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onMarkAllAsRead,
}) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<FrontendNotification[]>([
    {
      id: '1',
      type: NotificationType.NEW_ORDER,
      title: 'New Order',
      message: 'You have a new order.',
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      read: false,
      relatedId: 123,
    },
    {
      id: '2',
      type: NotificationType.PAYMENT_REQUEST,
      title: 'Payment Received',
      message: 'Your payment has been received.',
      timestamp: new Date().toISOString(),
      timeAgo: '5 minutes ago',
      read: false,
      relatedId: 'pay_456',
    },
    {
      id: '3',
      type: NotificationType.WITHDRAW_REQUEST,
      title: 'Withdraw Processed',
      message: 'Your withdraw request has been processed.',
      timestamp: new Date().toISOString(),
      timeAgo: '1 hour ago',
      read: true,
      relatedId: 'with_789',
    },
    {
      id: '4',
      type: NotificationType.TICKET_MESSAGE,
      title: 'Support Ticket',
      message: 'You have a new message in your support ticket.',
      timestamp: new Date().toISOString(),
      timeAgo: '2 hours ago',
      read: true,
      relatedId: 'tick_101',
    },
    {
      id: '5',
      type: NotificationType.NEW_ORDER,
      title: 'New Order',
      message: 'You have a new order.',
      timestamp: new Date().toISOString(),
      timeAgo: '3 hours ago',
      read: false,
      relatedId: 124,
    },
    {
      id: '6',
      type: NotificationType.PAYMENT_REQUEST,
      title: 'Payment Received',
      message: 'Your payment has been received.',
      timestamp: new Date().toISOString(),
      timeAgo: '4 hours ago',
      read: true,
      relatedId: 'pay_457',
    },
    {
      id: '7',
      type: NotificationType.WITHDRAW_REQUEST,
      title: 'Withdraw Processed',
      message: 'Your withdraw request has been processed.',
      timestamp: new Date().toISOString(),
      timeAgo: '5 hours ago',
      read: false,
      relatedId: 'with_790',
    },
    {
      id: '8',
      type: NotificationType.TICKET_MESSAGE,
      title: 'Support Ticket',
      message: 'You have a new message in your support ticket.',
      timestamp: new Date().toISOString(),
      timeAgo: '6 hours ago',
      read: true,
      relatedId: 'tick_102',
    },
  ])
  const [showAll, setShowAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(notif => !notif.read).length

  // Fetch notifications
  useEffect(() => {
    if (isOpen && user?.userId) {
      fetchNotifications()
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

  const fetchNotifications = async () => {
    if (!user?.userId) return

    setLoading(true)
    try {
      const fetchedNotifications = await notificationService.getNotifications(user.userId)
      // setNotifications(fetchedNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.userId) return

    const success = await notificationService.markAsRead(notificationId, user.userId)
    if (success) {
      setNotifications(prev =>
        prev.map(notif => (notif.id === notificationId ? { ...notif, read: true } : notif))
      )
      onMarkAllAsRead()
    }
  }

  const handleMarkAllAsRead = async () => {
    if (!user?.userId) return

    const success = await notificationService.markAllAsRead(user.userId)
    if (success) {
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })))
      onMarkAllAsRead()
    }
  }

  const handleNotificationClick = (notification: FrontendNotification) => {
    // Mark as read immediately for better UX
    handleMarkAsRead(notification.id)

    // Navigate based on notification type
    let targetUrl = ''
    switch (notification.type) {
      case NotificationType.NEW_ORDER:
        targetUrl = notification.relatedId
          ? `/dashboard/orders/${notification.relatedId}`
          : '/dashboard/orders'
        break
      case NotificationType.PAYMENT_REQUEST:
        targetUrl = '/dashboard/payments'
        break
      case NotificationType.WITHDRAW_REQUEST:
        targetUrl = '/dashboard/withdrawals'
        break
      case NotificationType.TICKET_MESSAGE:
        targetUrl = notification.relatedId
          ? `/dashboard/support/tickets/${notification.relatedId}`
          : '/dashboard/support/tickets'
        break
      default:
        targetUrl = '/dashboard'
    }

    handleClose()

    // Use setTimeout to ensure dropdown closes before navigation
    setTimeout(() => {
      window.location.href = targetUrl
    }, 100)
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
            Notifications
            {unreadCount > 0 && <span className='notification-badge'>{unreadCount} new</span>}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead} className='mark-all-read-btn'>
              Mark all read
            </button>
          )}
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
                onClick={() => handleNotificationClick(notification)}
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
              <p>No notifications yet</p>
              <span>We'll notify you when something arrives</span>
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
