import { apiClient, type ApiResponse } from './ApiClient'

// Define interfaces for request/response types
export interface User {
  userId: string
  phoneNo: string
  name: string
  balance: number
  email?: string
  zilla?: string
  upazilla?: string
  address?: string
  shopName?: string
  nomineePhone?: string
  facebookProfileLink?: string
  profileImage?: string
  role?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  isVerified: boolean
  referralCode?: string
  userRoles?: {
    userRoleId: string
    roleId: string
    role: {
      roleId: string
      roleName: string
    }
  }[]
  referredBy?: {
    name: string
    phoneNo: string
  }
  Wallet?: [
    {
      walletId: string
      walletName: string
      walletPhoneNo: string
    }
  ]
  _count?: {
    referrals: number
  }
}

export interface Customer {
  customerId: string
  customerName: string
  customerPhoneNo: string
  sellerCode: string
  createdAt: Date
  updatedAt: Date
}

export interface Role {
  roleId: string
  roleName: string
  description?: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Permission {
  permissionId: string
  permissionType: PermissionType
  actions: ActionType[]
  createdAt: Date
  updatedAt: Date
}

export interface BlockedUser {
  blockId: string
  userPhoneNo: string
  reason?: string
  actionTypes: BlockActionType[]
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export type PermissionType =
  | 'USER_MANAGEMENT'
  | 'CUSTOMER_MANAGEMENT'
  | 'SELLER_MANAGEMENT'
  | 'ADMIN_MANAGEMENT'
  | 'PRODUCT_MANAGEMENT'
  | 'ORDER_MANAGEMENT'
  | 'WITHDRAWAL_MANAGEMENT'
  | 'PAYMENT_MANAGEMENT'
  | 'DASHBOARD_ACCESS'
  | 'SETTINGS_MANAGEMENT'
  | 'CONTENT_MANAGEMENT'
  | 'WALLET_ADDITION'
  | 'WALLET_MANAGEMENT'
  | 'REPORT_VIEW'
  | 'ALL'
// ... other permission types

export type ActionType =
  | 'ALL'
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'APPROVE'
  | 'REJECT'
  | 'BLOCK'
  | 'NOTIFY'
// ... other action types

export type BlockActionType =
  | 'ORDER_REQUEST'
  | 'WITHDRAW_REQUEST'
  | 'PASSWORD_RESET'
  | 'PAYMENT_REQUEST'
  | 'WALLET_ADDITION'
  | 'ALL'
// ... other block action types

export interface LoginResponse {
  user: User
  token: string
}

class UserManagementApiService {
  // ==========================================
  // AUTHENTICATION METHODS
  // ==========================================

  async login(phoneNo: string, password: string): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>('auth/login', { phoneNo, password })
  }

  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post<void>('auth/logout')
  }

  async checkLoggedInUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('auth/check')
  }

  // ==========================================
  // USER MANAGEMENT METHODS
  // ==========================================

  async createFirstSuperAdmin(
    phoneNo: string,
    name: string,
    password: string,
    email?: string
  ): Promise<ApiResponse<User>> {
    return apiClient.post<User>('users/first-super-admin', {
      phoneNo,
      name,
      password,
      email,
    })
  }

  async createSuperAdmin(
    phoneNo: string,
    name: string,
    password: string,
    email?: string
  ): Promise<ApiResponse<User>> {
    return apiClient.post<User>('users/super-admin', {
      phoneNo,
      name,
      password,
      email,
    })
  }

  async createAdmin(
    phoneNo: string,
    name: string,
    password: string,
    email?: string
  ): Promise<ApiResponse<User>> {
    return apiClient.post<User>('users/admin', {
      phoneNo,
      name,
      password,
      email,
    })
  }

  async createSeller(
    phoneNo: string,
    name: string,
    password: string,
    zilla: string,
    upazilla: string,
    address: string,
    shopName: string,
    email?: string,
    nomineePhone?: string,
    facebookProfileLink?: string,
    referralCode?: string
  ): Promise<ApiResponse<User>> {
    return apiClient.post<User>('users/seller', {
      phoneNo,
      name,
      password,
      email,
      zilla,
      upazilla,
      address,
      shopName,
      nomineePhone,
      facebookProfileLink,
      referralCode,
    })
  }

  async createCustomer(
    customerName: string,
    customerPhoneNo: string,
    sellerCode: string
  ): Promise<ApiResponse<Customer>> {
    return apiClient.post<Customer>('users/customer', {
      customerName,
      customerPhoneNo,
      sellerCode,
    })
  }

  async promoteAdmin(adminId: string): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`users/promote-admin/${adminId}`)
  }

  async demoteSuperAdmin(superAdminId: string): Promise<ApiResponse<User>> {
    return apiClient.patch<User>(`users/demote-super-admin/${superAdminId}`)
  }

  async resetPassword(phoneNo: string): Promise<ApiResponse<User>> {
    return apiClient.post<User>('users/reset-password', { phoneNo })
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('users/profile')
  }

  async updateProfile(updates: {
    name?: string
    email?: string
    zilla?: string
    upazilla?: string
    address?: string
    shopName?: string
    nomineePhone?: string
    facebookProfileLink?: string
  }): Promise<ApiResponse<User>> {
    return apiClient.patch<User>('users/profile', updates)
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<User>> {
    return apiClient.patch<User>('users/change-password', {
      currentPassword,
      newPassword,
    })
  }

  async addReferralCode(referralCode: string): Promise<ApiResponse<User>> {
    return apiClient.patch<User>('users/add-referral', { referralCode })
  }

  async getAllUsers(params: {
    page?: number
    limit?: number
    role?: string | string[]
    searchTerm?: string
  }): Promise<
    ApiResponse<{ users: User[]; totalCount: number; totalPages: number; currentPage: number }>
  > {
    // please don't pass empty params

    return apiClient.get<{
      users: User[]
      totalCount: number
      totalPages: number
      currentPage: number
    }>('auth/get-all-users', { params })
  }
  async getAllCustomers({
    page = 1,
    limit = 10,
    phoneNo,
  }: {
    page?: number
    limit?: number
    phoneNo?: string
  }) {
    return apiClient.get('auth/get-all-customers', {
      params: { page, limit, phoneNo },
    })
  }

  // ==========================================
  // ROLE & PERMISSION METHODS
  // ==========================================

  async createRole(
    roleName: string,
    description?: string,
    isDefault?: boolean
  ): Promise<ApiResponse<Role>> {
    return apiClient.post<Role>('roles', { roleName, description, isDefault })
  }

  async assignPermissionToRole(
    roleId: string,
    permission: PermissionType,
    actions: ActionType[]
  ): Promise<ApiResponse<Permission>> {
    return apiClient.post<Permission>(`roles/${roleId}/permissions`, {
      permission,
      actions,
    })
  }

  async assignMultiplePermissionsToRole(
    roleId: string,
    permissions: PermissionType[],
    actions: ActionType[]
  ): Promise<ApiResponse<Permission[]>> {
    return apiClient.post<Permission[]>(`roles/${roleId}/permissions/multiple`, {
      permissions,
      actions,
    })
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<ApiResponse<User>> {
    return apiClient.post<User>(`users/${userId}/roles`, { roleId })
  }
}

// Export a singleton instance
export const userManagementApiService = new UserManagementApiService()
