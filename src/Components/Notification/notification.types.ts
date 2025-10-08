export type NotificationType =
  | 'NEW_ORDER'
  | 'PAYMENT_REQUEST'
  | 'WITHDRAW_REQUEST'
  | 'TICKET_MESSAGE'

export const NotificationType = {
  NEW_ORDER: 'NEW_ORDER',
  PAYMENT_REQUEST: 'PAYMENT_REQUEST',
  WITHDRAW_REQUEST: 'WITHDRAW_REQUEST',
  TICKET_MESSAGE: 'TICKET_MESSAGE',
} as const

export interface NotificationData {
  orderNumber?: string
  customerName?: string
  totalAmount?: number
  paymentId?: string
  withdrawId?: string
  ticketId?: string
  [key: string]: any
}

export interface BackendNotification {
  notificationId: string
  type: NotificationType
  title: string
  message: string
  data?: NotificationData
  orderId?: number
  paymentId?: string
  withdrawId?: string
  ticketId?: string
  targetUserIds: string[]
  readBy: string[]
  isDelivered: boolean
  deliveredAt?: string
  createdAt: string
  updatedAt: string
}

export interface FrontendNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: NotificationData
  timestamp: string
  timeAgo: string
  read: boolean
  relatedId?: number | string
}
