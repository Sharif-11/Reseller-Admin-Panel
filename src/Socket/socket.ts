import { io, Socket } from 'socket.io-client'

// NotificationTypes.ts
export const NotificationType = {
  NEW_ORDER: 'NEW_ORDER',
  PAYMENT_REQUEST: 'PAYMENT_REQUEST',
  WITHDRAW_REQUEST: 'WITHDRAW_REQUEST',
  TICKET_MESSAGE: 'TICKET_MESSAGE',
} as const

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

export interface NotificationData {
  type: NotificationType
  title: string
  message: string
  data?: any // Flexible data storage for additional context
  orderId?: number
  paymentId?: string
  withdrawId?: string
  ticketId?: string
}

export interface Notification extends NotificationData {
  notificationId: string
  targetUserIds: string[]
  readBy: string[]
  isDelivered: boolean
  deliveredAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface SocketUser {
  userId: string
  socket: any // Replace with your socket type
}

export interface SocketAuthPayload {
  userId: string
}

export interface NotificationClientOptions {
  serverUrl: string
  onConnected?: () => void
  onDisconnected?: () => void
  onIdentificationSuccess?: (data: any) => void
  onIdentificationError?: (error: any) => void
  onNewNotification?: (notification: Notification) => void
  onAllNotifications?: (notifications: Notification[]) => void
  onUnreadCount?: (count: number) => void
  onUnreadNotifications?: (notifications: Notification[]) => void
  onNotificationsByType?: (data: { type: NotificationType; notifications: Notification[] }) => void
  onMarkAsReadSuccess?: (data: { notificationId: string }) => void
  onMarkAsReadError?: (error: { notificationId: string; message: string }) => void
  onError?: (error: any) => void
}

export class NotificationClient {
  private socket: Socket | null = null
  private isConnected: boolean = false
  private options: NotificationClientOptions
  private currentUserId: string | null = null

  constructor(options: NotificationClientOptions) {
    this.options = options
  }

  /**
   * Connect to the notification server and identify with userId
   */
  connect(userId: string): void {
    if (this.socket) {
      console.warn('Socket already connected. Disconnecting first.')
      this.disconnect()
    }

    this.currentUserId = userId
    this.socket = io(this.options.serverUrl, {
      transports: ['websocket', 'polling'], // Fallback transports
    })

    this.setupEventListeners()

    // Identify user after connection is established
    this.socket.on('connect', () => {
      this.identify(userId)
    })
  }

  private setupEventListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Connected to notification server')
      this.isConnected = true
      this.options.onConnected?.()
    })

    this.socket.on('identified', (data: any) => {
      console.log('Identification successful', data)
      this.options.onIdentificationSuccess?.(data)

      // Automatically fetch initial data after identification
      this.getAllNotifications()
      this.getUnreadNotifications()
    })

    this.socket.on('identification_error', (error: any) => {
      console.error('Identification failed', error)
      this.options.onIdentificationError?.(error)
    })

    this.socket.on('new_notification', (notification: Notification) => {
      console.log('New notification received:', notification)
      this.options.onNewNotification?.(notification)

      // Automatically update unread count when new notification arrives
      this.getUnreadNotifications()
    })

    this.socket.on('all_notifications', (notifications: Notification[]) => {
      console.log('All notifications received:', notifications)
      this.options.onAllNotifications?.(notifications)
    })

    this.socket.on('unread_notifications', (notifications: Notification[]) => {
      console.log('Unread notifications received:', notifications)
      this.options.onUnreadNotifications?.(notifications)
    })

    this.socket.on('unread_count', (count: number) => {
      console.log('Unread count updated:', count)
      this.options.onUnreadCount?.(count)
    })

    this.socket.on('mark_as_read_success', (data: { notificationId: string }) => {
      console.log('Notification marked as read:', data.notificationId)
      this.options.onMarkAsReadSuccess?.(data)

      // Refresh unread count after marking as read
      this.getUnreadNotifications()
    })

    this.socket.on('mark_as_read_error', (error: { notificationId: string; message: string }) => {
      console.error('Failed to mark notification as read:', error)
      this.options.onMarkAsReadError?.(error)
    })

    this.socket.on(
      'notifications_by_type',
      (data: { type: NotificationType; notifications: Notification[] }) => {
        console.log(`Notifications by type ${data.type}:`, data.notifications)
        this.options.onNotificationsByType?.(data)
      }
    )

    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from server. Reason:', reason)
      this.isConnected = false
      this.options.onDisconnected?.()
    })

    this.socket.on('connect_error', (error: Error) => {
      console.error('Connection error:', error)
      this.options.onError?.(error)
    })

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error)
      this.options.onError?.(error)
    })
  }

  /**
   * Identify user with userId (no authentication required)
   */
  identify(userId: string): void {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.')
      return
    }

    this.currentUserId = userId
    this.socket.emit('identify', { userId })
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): void {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.')
      return
    }

    this.socket.emit('mark_as_read', { notificationId })
  }

  /**
   * Request all notifications for the current user
   */
  getAllNotifications(): void {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.')
      return
    }

    this.socket.emit('get_all_notifications')
  }

  /**
   * Request unread notifications only
   */
  getUnreadNotifications(): void {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.')
      return
    }

    this.socket.emit('get_unread_notifications')
  }

  /**
   * Request notifications by specific type
   */
  getNotificationsByType(type: NotificationType): void {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.')
      return
    }

    this.socket.emit('get_notifications_by_type', type)
  }

  /**
   * Disconnect from the server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      this.currentUserId = null
      console.log('Disconnected from notification server')
    }
  }

  /**
   * Reconnect with the same userId
   */
  reconnect(): void {
    if (this.currentUserId) {
      this.connect(this.currentUserId)
    } else {
      console.error('No user ID available for reconnection')
    }
  }

  // Utility methods
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  getSocketId(): string | null {
    return this.socket?.id || null
  }

  getCurrentUserId(): string | null {
    return this.currentUserId
  }
}

// Convenience function to create a notification client
export const createNotificationClient = (
  options: NotificationClientOptions
): NotificationClient => {
  return new NotificationClient(options)
}

// Default instance with common configuration
// export const notificationClient = new NotificationClient({
//   serverUrl: 'http://localhost:3000',
//   onConnected: () => console.log('Connected to notification server'),
//   onDisconnected: () => console.log('Disconnected from notification server'),
//   onIdentificationSuccess: data => console.log('Identified:', data),
//   onIdentificationError: error => console.error('Identification error:', error),
//   onNewNotification: notification => console.log('New notification:', notification),
//   onAllNotifications: notifications => console.log('All notifications:', notifications.length),
//   onUnreadCount: count => console.log('Unread count:', count),
//   onError: error => console.error('Socket error:', error),
// })

// Usage examples:
/*
// Basic usage
const client = new NotificationClient({
  serverUrl: 'http://localhost:3000',
  onNewNotification: (notification) => {
    console.log('Received notification:', notification)
    // Show toast, update UI, etc.
  },
  onUnreadCount: (count) => {
    console.log('Unread count:', count)
    // Update badge counter
  }
})

// Connect with user ID
client.connect('user-123')

// Mark notification as read when user clicks
client.markAsRead('notification-id-123')

// Get specific type of notifications
client.getNotificationsByType('NEW_ORDER')
*/
