// src/Api/role.api.ts

import { apiClient, type ApiResponse } from './ApiClient'
import type { ActionType, PermissionType } from './user.api'

export interface Role {
  roleId: string
  roleName: string
  roleDescription?: string
  isDefault: boolean
  permissions?: RolePermission[]
  createdAt: Date
  updatedAt: Date
}

export interface RolePermission {
  rolePermissionId: string
  roleId: string
  permission: PermissionType
  actions: ActionType[]
}

export interface UserRole {
  userRoleId: string
  userId: string
  roleId: string
  role: Role
}

class RoleApiService {
  /**
   * Get all roles with their permissions
   */
  async getAllRoles() {
    return apiClient.get('roles')
  }

  /**
   * Get a single role with its permissions
   */
  async getRoleWithPermissions(roleId: string) {
    return apiClient.get(`roles/${roleId}`)
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions() {
    return apiClient.get('roles/permissions')
  }

  /**
   * Get all available actions
   */
  async getAllActions() {
    return apiClient.get('roles/actions')
  }

  /**
   * Create a new role with optional permissions
   */
  async createRole(data: {
    roleName: string
    description?: string
    isDefault?: boolean
    permissions?: {
      permission: PermissionType
      actions: ActionType[]
    }[]
  }): Promise<ApiResponse<Role>> {
    return apiClient.post<Role>('roles', data)
  }

  /**
   * Update role permissions in bulk
   */
  async updateRolePermissions(
    roleId: string,
    permissions: {
      permission: PermissionType
      actions: ActionType[]
    }[]
  ) {
    return apiClient.put(`roles/${roleId}/permissions`, { permissions })
  }

  /**
   * Get all roles assigned to a user
   */
  async getUserRoles(userId: string) {
    return apiClient.get(`roles/user/${userId}`)
  }

  /**
   * Update user roles in bulk
   */
  async updateUserRoles(userId: string, roleIds: string[]) {
    return apiClient.put(`roles/user/${userId}`, { roleIds })
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string) {
    return apiClient.delete(`roles/${roleId}`)
  }

  /**
   * Get all permissions with actions for a user
   */
  async getUserPermissions(userId: string) {
    return apiClient.get(`roles/user/${userId}/permissions`)
  }
}

// Export a singleton instance
export const roleApiService = new RoleApiService()
