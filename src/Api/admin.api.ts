// src/Api/admin.api.ts
import { apiClient, type ApiResponse } from './ApiClient'
import type { User } from './user.api'

export interface AdminUser extends User {
  userRoles: {
    userRoleId: string
    roleId: string
    role: {
      roleId: string
      roleName: string
    }
  }[]
}

export interface Role {
  roleId: string
  roleName: string
  roleDescription?: string
  isDefault: boolean
}
export interface CreateAdminPayload {
  phoneNo: string
  name: string
  password: string
  email?: string
}
class AdminApiService {
  async createSuperAdmin(payload: CreateAdminPayload): Promise<ApiResponse<AdminUser>> {
    return apiClient.post<AdminUser>('auth/super-admin', payload)
  }

  /**
   * Create a new Admin
   */
  async createAdmin(payload: CreateAdminPayload): Promise<ApiResponse<AdminUser>> {
    return apiClient.post<AdminUser>('auth/admin', payload)
  }
  /**
   * Get all admin users (both Admin and SuperAdmin)
   */
  async getAllAdmins(params: {
    page?: number
    limit?: number
    searchTerm?: string
  }): Promise<ApiResponse<{ users: AdminUser[]; totalCount: number }>> {
    return apiClient.get('admin/users', { params })
  }

  /**
   * Get all available roles
   */
  async getAllRoles(): Promise<ApiResponse<Role[]>> {
    return apiClient.get('roles')
  }

  /**
   * Get roles assigned to a specific user
   */
  async getUserRoles(userId: string): Promise<ApiResponse<{ roleId: string }[]>> {
    return apiClient.get(`roles/user/${userId}`)
  }

  /**
   * Update user roles
   */
  async updateUserRoles(
    userId: string,
    roleIds: string[]
  ): Promise<ApiResponse<{ userRoles: { roleId: string }[] }>> {
    return apiClient.put(`roles/user/${userId}`, { roleIds })
  }
}

// Export a singleton instance
export const adminApiService = new AdminApiService()
