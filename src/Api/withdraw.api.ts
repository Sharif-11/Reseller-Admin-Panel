import { apiClient } from './ApiClient'

export type Withdraw = {
  withdrawId: string
  requestedAt: Date
  processedAt?: Date | null
  withdrawStatus: 'PENDING' | 'COMPLETED' | 'REJECTED'
  userId: string
  userName: string
  userPhoneNo: string
  amount: number
  transactionFee?: number | null
  actualAmount?: number | null
  transactionId?: string | null
  walletName: string
  walletPhoneNo: string
  systemWalletPhoneNo?: string | null
  paymentId?: string | null
  remarks?: string | null
}

class WithdrawApi {
  /**
   * Create a new withdraw request
   */
  public async createWithdraw({
    amount,
    walletName,
    walletPhoneNo,
  }: {
    amount: number
    walletName: string
    walletPhoneNo: string
  }) {
    return apiClient.post('withdraws', {
      amount,
      walletName,
      walletPhoneNo,
    })
  }

  /**
   * Cancel a withdraw request
   */
  public async cancelWithdraw(withdrawId: string) {
    return apiClient.delete(`withdraws/${withdrawId}`)
  }

  /**
   * Get withdraw requests for current user
   */
  public async getMyWithdraws({
    page = 1,
    limit = 10,
    status,
    search,
  }: {
    page?: number
    limit?: number
    status?: 'PENDING' | 'COMPLETED' | 'REJECTED' | ('PENDING' | 'COMPLETED' | 'REJECTED')[]
    search?: string
  } = {}) {
    return apiClient.get('withdraws/seller', {
      params: {
        page,
        limit,
        status,
        search,
      },
    })
  }

  /**
   * Get withdraw details by ID
   */
  public async getWithdrawDetails(withdrawId: string) {
    return apiClient.get(`withdraws/${withdrawId}`)
  }

  /**
   * ADMIN ONLY: Get all withdraw requests
   */
  public async getAllWithdraws({
    page = 1,
    limit = 10,
    search,
    status,
  }: {
    page?: number
    limit?: number
    search?: string
    status?: 'PENDING' | 'COMPLETED' | 'REJECTED' | ('PENDING' | 'COMPLETED' | 'REJECTED')[]
  } = {}) {
    return apiClient.get('withdraws/admin', {
      params: {
        page,
        limit,
        search,
        status,
      },
    })
  }

  /**
   * ADMIN ONLY: Approve a withdraw request
   */
  public async approveWithdraw({
    withdrawId,
    systemWalletPhoneNo,
    transactionId,
  }: {
    withdrawId: string
    systemWalletPhoneNo: string
    transactionId: string
  }) {
    return apiClient.patch(`withdraws/${withdrawId}/approve`, {
      systemWalletPhoneNo,
      transactionId,
    })
  }

  /**
   * ADMIN ONLY: Reject a withdraw request
   */
  public async rejectWithdraw({ withdrawId, remarks }: { withdrawId: string; remarks?: string }) {
    return apiClient.patch(`withdraws/${withdrawId}/reject`, {
      remarks,
    })
  }
}

export default new WithdrawApi()
