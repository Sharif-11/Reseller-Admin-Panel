import { apiClient, type ApiResponse } from './ApiClient'

export type BlockActionType =
  | 'ORDER_REQUEST'
  | 'WITHDRAW_REQUEST'
  | 'PASSWORD_RESET'
  | 'PAYMENT_REQUEST'
  | 'WALLET_ADDITION'
  | 'ALL'

export interface BlockAction {
  actionType: BlockActionType
  active: boolean
  reason?: string
  expiresAt?: Date | null
  createdAt?: Date
}

export interface BlockStatus {
  user: {
    name: string
    phoneNo: string
  }
  blockId?: string
  actions: BlockActionType[]
}

export interface BlockedUser {
  blockId: string
  userName: string
  userPhoneNo: string
  actions: BlockAction[]
  createdAt: Date
  updatedAt: Date
}

class BlockApiService {
  /**
   * Get all blocked actions for a specific user
   * @param phoneNo User's phone number
   */
  async getUserBlockActions(phoneNo: string): Promise<ApiResponse<BlockStatus>> {
    return apiClient.get<BlockStatus>(`block/${phoneNo}`)
  }

  /**
   * Update block actions for a user
   * @param phoneNo User's phone number
   * @param actions Array of actions to update
   * @param reason Optional reason for blocking
   * @param expiresAt Optional expiration date
   */
  async updateBlockActions(
    phoneNo: string,
    actions: BlockAction[],
    reason?: string,
    expiresAt?: Date | null
  ): Promise<ApiResponse<BlockStatus>> {
    return apiClient.put<BlockStatus>(`block/${phoneNo}`, {
      actions,
      reason,
      expiresAt,
    })
  }

  /**
   * Check if a user is blocked for a specific action
   * @param phoneNo User's phone number
   * @param actionType Action type to check
   */
  async checkBlockStatus(
    phoneNo: string,
    actionType: BlockActionType
  ): Promise<ApiResponse<{ blocked: boolean; reason?: string; expiresAt?: Date }>> {
    return apiClient.get<{ blocked: boolean; reason?: string; expiresAt?: Date }>(
      `block/check/${phoneNo}`,
      { params: { actionType } }
    )
  }

  /**
   * Get all blocked users with pagination
   * @param page Page number (default: 1)
   * @param limit Items per page (default: 10)
   */

  /**
   * Get all available block action types
   */
  async getAvailableBlockActionTypes(): Promise<ApiResponse<BlockActionType[]>> {
    return apiClient.get<BlockActionType[]>('block')
  }
}

// Export a singleton instance
export const blockApiService = new BlockApiService()
