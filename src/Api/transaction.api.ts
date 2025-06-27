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
}
export const transactionApi = new TransactionApi()
