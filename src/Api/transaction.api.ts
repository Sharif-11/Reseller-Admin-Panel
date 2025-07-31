import { apiClient } from './ApiClient'

class TransactionApi {
  public async getTransactions({
    page,
    limit,
    search,
  }: {
    page?: number
    limit?: number
    search?: string
  }) {
    return apiClient.get('/transactions/admin', {
      params: {
        page,
        limit,
        search,
      },
    })
  }
  public async updateUserBalance({
    sellerId,
    amount,
    transactionType,
    reason,
  }: {
    sellerId: string
    amount: number
    transactionType: 'add' | 'deduct'
    reason?: string
  }) {
    return apiClient.patch(`/transactions/balance/${sellerId}`, {
      amount,
      transactionType,
      reason,
    })
  }
}
export const transactionApi = new TransactionApi()
