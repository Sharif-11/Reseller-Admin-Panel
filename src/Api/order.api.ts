import { apiClient } from './ApiClient'

export type OrderStatus =
  | 'UNPAID'
  | 'PAID'
  | 'CONFIRMED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'RETURNED'
  | 'REFUNDED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REJECTED'
export type PaymentMethod = 'WALLET' | 'BALANCE'
export type PaymentStatus = 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REJECTED' | 'PENDING'
export type PaymentType = 'ORDER_PAYMENT' | 'WITHDRAWAL_PAYMENT' | 'DUE_PAYMENT'

class OrderApi {
  public getOrdersByAdmin({
    page,
    limit,
    orderStatus,
    search,
  }: {
    page?: number
    limit?: number
    orderStatus?: OrderStatus | OrderStatus[]
    search?: string
  }) {
    return apiClient.get(`orders/admin`, {
      params: { page, limit, orderStatus, search },
    })
  }
  public confirmOrderByAdmin(orderId: number) {
    return apiClient.post(`orders/admin/confirm/${orderId}`)
  }
  public cancelOrderByAdmin(orderId: number, reason?: string) {
    return apiClient.post(`orders/admin/cancel/${orderId}`, { reason })
  }

  public deliverOrderByAdmin({ orderId, trackingUrl }: { orderId: number; trackingUrl: string }) {
    return apiClient.post(`orders/admin/deliver/${orderId}`, { trackingUrl })
  }
}

export const orderApi = new OrderApi()
