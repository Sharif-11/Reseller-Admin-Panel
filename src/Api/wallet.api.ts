import { apiClient, type ApiResponse } from './ApiClient'

export interface Wallet {
  walletId: number
  walletName: string
  walletPhoneNo: string
  walletType: 'SELLER' | 'SYSTEM'
  isActive: boolean
  isVerified: boolean
  createdAt: Date
  updatedAt: Date
}

export interface VerificationResult {
  isVerified: boolean
  alreadyVerified: boolean
  message?: string
}

export interface OtpResponse {
  sendOTP: boolean
  message?: string
}

class WalletApiService {
  /**
   * Create a new wallet
   * @param data Wallet creation data
   * @returns Created wallet
   */
  async createWallet(data: {
    walletName: string
    walletPhoneNo: string
    walletType?: 'SELLER' | 'SYSTEM'
  }): Promise<ApiResponse<Wallet>> {
    return apiClient.post<Wallet>('/wallets', data)
  }

  /**
   * Get all system wallets (Admin only)
   * @returns List of system wallets
   */
  async getSystemWallets() {
    return apiClient.get('/wallets/system')
  }

  /**
   * Get wallets for a specific seller
   * @param sellerId ID of the seller
   * @returns List of seller's wallets
   */
  async getSellerWallets(sellerId: string): Promise<ApiResponse<Wallet[]>> {
    return apiClient.get<Wallet[]>(`/wallets/seller/${sellerId}`)
  }

  /**
   * Get wallet by ID
   * @param walletId ID of the wallet
   * @returns Wallet details
   */
  async getWallet(walletId: number): Promise<ApiResponse<Wallet>> {
    return apiClient.get<Wallet>(`/wallets/${walletId}`)
  }

  /**
   * Update wallet information
   * @param walletId ID of the wallet to update
   * @param data Update data
   * @returns Updated wallet
   */
  async updateWallet(
    walletId: number,
    data: {
      isActive?: boolean
    }
  ): Promise<ApiResponse<Wallet>> {
    return apiClient.patch<Wallet>(`/wallets/${walletId}`, data)
  }

  /**
   * Delete a wallet
   * @param walletId ID of the wallet to delete
   * @returns Deletion confirmation
   */
  async deleteWallet(walletId: number): Promise<ApiResponse<Wallet>> {
    return apiClient.delete<Wallet>(`/wallets/${walletId}`)
  }

  /**
   * Initiate wallet verification by sending OTP
   * @param walletPhoneNo Wallet phone number
   * @returns OTP sending status
   */
  async sendOtp(walletPhoneNo: string): Promise<ApiResponse<OtpResponse>> {
    return apiClient.post<OtpResponse>('/wallets/send-otp', { walletPhoneNo })
  }

  /**
   * Verify wallet using OTP
   * @param walletPhoneNo Wallet phone number
   * @param otp OTP code
   * @returns Verification result
   */
  async verifyOtp(walletPhoneNo: string, otp: string): Promise<ApiResponse<VerificationResult>> {
    return apiClient.post<VerificationResult>('/wallets/verify-otp', {
      walletPhoneNo,
      otp,
    })
  }
  /**
   * Get wallet by phone number
   * @param walletPhoneNo Wallet phone number
   * @returns Wallet details
   */
  /**
   * Get wallet by name and phone number
   * @param walletName Wallet name (Bkash/Nagad)
   * @param walletPhoneNo Wallet phone number
   * @returns Wallet details
   */
  /**
   * Get all wallets for a seller by phone number
   * @param phoneNo Seller's phone number
   * @returns List of seller's wallets
   */
  async getSellerWalletsByPhone(phoneNo: string) {
    return apiClient.get(`wallets/seller/${phoneNo}`)
  }
}

// Export a singleton instance
export const walletApiService = new WalletApiService()
