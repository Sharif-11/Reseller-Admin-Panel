import type { User } from '../Context/userContext'
import { apiClient, type ApiResponse } from './ApiClient'

interface LoginCredentials {
  phoneNo: string
  password: string
}

interface ChangePasswordData {
  newPassword: string
  currentPassword: string
}

class AuthService {
  // Login with phone number and password
  async login(credentials: LoginCredentials): Promise<ApiResponse<any>> {
    return apiClient.post<any>('auth/admin-login', credentials)
  }

  // Verify current login session
  async verifyLogin(): Promise<ApiResponse<any>> {
    return apiClient.get<any>('auth/verify-login')
  }

  // Logout current session
  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('auth/logout')
  }

  // Initiate password reset
  async forgotPassword(phoneNo: string): Promise<ApiResponse<void>> {
    return apiClient.post<void>('auth/forgot-password', { phoneNo })
  }

  // Change password while authenticated
  async changePassword(data: ChangePasswordData): Promise<ApiResponse<void>> {
    return apiClient.patch<void>('auth/change-password', data)
  }
  async profile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('auth/profile')
  }
  async updateProfile(data: { name: string; email: string }): Promise<ApiResponse<User>> {
    return apiClient.patch<User>('auth/profile', data)
  }
  async checkSuperAdminExists() {
    return apiClient.get('auth/check-super-admin')
  }
  async createFirstSuperAdmin({
    phoneNo,
    name,
    password,
    email,
  }: {
    phoneNo: string
    name: string
    password: string
    email?: string
  }) {
    return apiClient.post('auth/first-super-admin', {
      phoneNo,
      name,
      password,
      email,
    })
  }
  // profile fetch
}

// Export a singleton instance
export const authService = new AuthService()
