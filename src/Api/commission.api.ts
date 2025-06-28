import { apiClient } from './ApiClient'

export type CommissionRange = {
  startPrice: number
  endPrice: number | null
  commission: number
  level: number
}

class CommissionApi {
  /**
   * ADMIN ONLY: Replace the entire commission table
   */
  public async replaceCommissionTable(commissions: CommissionRange[]) {
    return apiClient.post('commissions/replace-table', {
      commissions,
    })
  }

  /**
   * Get the current commission table
   */
  public async getCommissionTable() {
    return apiClient.get<CommissionRange[]>('commissions/table')
  }

  /**
   * Calculate commissions for a specific price and user
   */
}

export default new CommissionApi()
