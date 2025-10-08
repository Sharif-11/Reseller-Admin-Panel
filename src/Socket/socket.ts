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
  userType: 'admin' | 'user' | 'super_admin' // Add more types as needed
  token?: string
}

export interface NotificationClientOptions {
  serverUrl: string
  onConnected?: () => void
  onDisconnected?: () => void
  onAuthenticationSuccess?: (data: any) => void
  onAuthenticationError?: (error: any) => void
  onNewNotification?: (notification: Notification) => void
  onAllNotifications?: (notifications: Notification[]) => void
  onUnreadCount?: (count: number) => void
  onError?: (error: any) => void
}

export class NotificationClient {
  private socket: Socket | null = null
  private isConnected: boolean = false
  private options: NotificationClientOptions

  constructor(options: NotificationClientOptions) {
    this.options = options
  }

  connect(userId: string, userType: 'admin' | 'user' | 'super_admin', token?: string): void {
    if (this.socket) {
      console.warn('Socket already connected. Disconnecting first.')
      this.disconnect()
    }

    this.socket = io(this.options.serverUrl, {
      auth: {
        userId,
        userType,
        token,
      },
      transports: ['websocket', 'polling'], // Fallback transports
    })

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('Connected to server')
      this.isConnected = true
      this.options.onConnected?.()
    })

    this.socket.on('authenticated', (data: any) => {
      console.log('Authentication successful', data)
      this.options.onAuthenticationSuccess?.(data)
    })

    this.socket.on('authentication_error', (error: any) => {
      console.error('Authentication failed', error)
      this.options.onAuthenticationError?.(error)
    })

    this.socket.on('new_notification', (notification: Notification) => {
      console.log('New notification received:', notification)
      this.options.onNewNotification?.(notification)
    })

    this.socket.on('all_notifications', (notifications: Notification[]) => {
      console.log('All notifications received:', notifications)
      this.options.onAllNotifications?.(notifications)
    })

    this.socket.on('unread_count', (count: number) => {
      console.log('Unread count updated:', count)
      this.options.onUnreadCount?.(count)
    })

    this.socket.on('mark_as_read_success', (data: { notificationId: string }) => {
      console.log('Notification marked as read:', data.notificationId)
    })

    this.socket.on('mark_as_read_error', (error: { notificationId: string; message: string }) => {
      console.error('Failed to mark notification as read:', error)
    })

    this.socket.on(
      'notifications_by_type',
      (data: { type: NotificationType; notifications: Notification[] }) => {
        console.log(`Notifications by type ${data.type}:`, data.notifications)
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

  authenticate(userId: string, userType: 'admin' | 'user' | 'super_admin', token?: string): void {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.')
      return
    }

    this.socket.emit('authenticate', { userId, userType, token })
  }

  markAsRead(notificationId: string): void {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.')
      return
    }

    this.socket.emit('mark_as_read', { notificationId })
  }

  getAllNotifications(): void {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.')
      return
    }

    this.socket.emit('get_all_notifications')
  }

  getUnreadNotifications(): void {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.')
      return
    }

    this.socket.emit('get_unread_notifications')
  }

  getNotificationsByType(type: NotificationType): void {
    if (!this.socket) {
      console.error('Socket not connected. Call connect() first.')
      return
    }

    this.socket.emit('get_notifications_by_type', type)
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
      console.log('Disconnected from server')
    }
  }

  // Utility methods
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  getSocketId(): string | null {
    return this.socket?.id || null
  }

  // Method to manually trigger event handlers for testing
  triggerManualReconnect(): void {
    if (this.socket) {
      this.socket.connect()
    }
  }
}

// Default export with convenience function
export const createNotificationClient = (
  options: NotificationClientOptions
): NotificationClient => {
  return new NotificationClient(options)
}
