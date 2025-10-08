import type { BackendNotification, FrontendNotification } from './notification.types'

class NotificationService {
  private baseUrl = '/api/notifications'

  // Convert backend notification to frontend format
  public convertToFrontendFormat(
    backendNotif: BackendNotification,
    currentUserId: string
  ): FrontendNotification {
    const isRead = backendNotif.readBy.includes(currentUserId)

    return {
      id: backendNotif.notificationId,
      type: backendNotif.type,
      title: backendNotif.title,
      message: backendNotif.message,
      data: backendNotif.data,
      timestamp: backendNotif.createdAt,
      timeAgo: this.getTimeAgo(backendNotif.createdAt),
      read: isRead,
      relatedId:
        backendNotif.orderId ||
        backendNotif.paymentId ||
        backendNotif.withdrawId ||
        backendNotif.ticketId,
    }
  }

  // Get time ago string
  private getTimeAgo(timestamp: string): string {
    const now = new Date()
    const past = new Date(timestamp)
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    return `${Math.floor(diffInSeconds / 86400)} days ago`
  }

  // Fetch notifications from backend
  async getNotifications(userId: string): Promise<FrontendNotification[]> {
    try {
      const response = await fetch(`${this.baseUrl}?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch notifications')

      const backendNotifications: BackendNotification[] = await response.json()
      return backendNotifications.map(notif => this.convertToFrontendFormat(notif, userId))
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })
      return response.ok
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/mark-all-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })
      return response.ok
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      return false
    }
  }

  // Get unread count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const response = await fetch(`${this.baseUrl}/unread-count?userId=${userId}`)
      if (!response.ok) throw new Error('Failed to fetch unread count')

      const data = await response.json()
      return data.count
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  }
}

export const notificationService = new NotificationService()
