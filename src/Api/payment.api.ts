import { apiClient } from './ApiClient'

class PaymentAPI {
  public async getAllPaymentsForAdmin({
    paymentStatus,
    page = 1,
    limit = 10,
    search,
    transactionId,
  }: {
    paymentStatus?: string
    page?: number
    limit?: number
    search?: string
    transactionId?: string
  }) {
    return apiClient.get('/payments/admin', {
      params: {
        paymentStatus,
        page,
        limit,
        search,
        transactionId,
      },
    })
  }

  public async verifyPayment({
    paymentId,
    transactionId,
  }: {
    paymentId: string
    transactionId: string
  }) {
    return apiClient.post(`/payments/admin/verify/${paymentId}`, { transactionId })
  }

  public async rejectPayment({ paymentId, remarks }: { paymentId: string; remarks: string }) {
    return apiClient.post(`/payments/admin/reject/${paymentId}`, { remarks })
  }
}
export const paymentAPI = new PaymentAPI()
