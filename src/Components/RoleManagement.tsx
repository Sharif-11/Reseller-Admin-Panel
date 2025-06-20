import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldExclamationIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import { roleApiService } from '../Api/role.api'
import type { ActionType, PermissionType } from '../Api/user.api'

interface Role {
  roleId: string
  roleName: string
  roleDescription?: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
  permissions: {
    rolePermissionId: string
    permission: PermissionType
    actions: ActionType[]
  }[]
  userRoles: {
    userRoleId: string
    userId: string
    roleId: string
  }[]
}

const RoleManagement = () => {
  // State management
  const [roles, setRoles] = useState<Role[]>([])
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [allPermissions, setAllPermissions] = useState<PermissionType[]>([])
  const [allActions, setAllActions] = useState<ActionType[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newRole, setNewRole] = useState({
    roleName: '',
    description: '',
    isDefault: false,
    permissions: [] as {
      permission: PermissionType
      actions: ActionType[]
    }[],
  })
  const [showDeleteModal, setShowDeleteModal] = useState({
    show: false,
    roleId: '',
    roleName: '',
  })
  const [showUpdateModal, setShowUpdateModal] = useState({
    show: false,
    roleId: '',
    permissions: [] as {
      permission: PermissionType
      actions: ActionType[]
    }[],
  })

  // Fetch all data
  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [rolesRes, permissionsRes, actionsRes] = await Promise.all([
        roleApiService.getAllRoles(),
        roleApiService.getAllPermissions(),
        roleApiService.getAllActions(),
      ])

      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data)
        setFilteredRoles(rolesRes.data)
      }
      if (permissionsRes.success && permissionsRes.data) {
        setAllPermissions(permissionsRes.data)
      }
      if (actionsRes.success && actionsRes.data) {
        setAllActions(actionsRes.data)
      }
    } catch (err) {
      setError('Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value
    setSearchTerm(term)
    setFilteredRoles(roles.filter(role => role.roleName.toLowerCase().includes(term.toLowerCase())))
  }

  // Create new role
  const handleCreateRole = async () => {
    if (!newRole.roleName.trim()) {
      setError('Role name is required')
      return
    }

    try {
      const response = await roleApiService.createRole(newRole)
      if (response.success) {
        setSuccess('Role created successfully')
        setShowCreateModal(false)
        setNewRole({
          roleName: '',
          description: '',
          isDefault: false,
          permissions: [],
        })
        fetchData()
      } else {
        setError(response.message || 'Failed to create role')
      }
    } catch (err) {
      setError('Failed to create role')
    }
  }

  // Prepare permission update with all current permissions
  const preparePermissionUpdate = (roleId: string) => {
    const role = roles.find(r => r.roleId === roleId)
    if (!role) return

    setShowUpdateModal({
      show: true,
      roleId,
      permissions: role.permissions.map(p => ({
        permission: p.permission,
        actions: p.actions,
      })),
    })
  }

  // Confirm permission update
  const confirmPermissionUpdate = async () => {
    const { roleId, permissions } = showUpdateModal

    try {
      // Optimistic update
      setRoles(prev =>
        prev.map(role => {
          if (role.roleId !== roleId) return role
          return {
            ...role,
            permissions: permissions.map(p => ({
              rolePermissionId:
                role.permissions.find(rp => rp.permission === p.permission)?.rolePermissionId ||
                `temp-${Date.now()}`,
              permission: p.permission,
              actions: p.actions.includes('ALL') ? ['ALL'] : p.actions,
            })),
          }
        })
      )
      setFilteredRoles(prev =>
        prev.map(role => {
          if (role.roleId !== roleId) return role
          return {
            ...role,
            permissions: permissions.map(p => ({
              rolePermissionId:
                role.permissions.find(rp => rp.permission === p.permission)?.rolePermissionId ||
                `temp-${Date.now()}`,
              permission: p.permission,
              actions: p.actions.includes('ALL') ? ['ALL'] : p.actions,
            })),
          }
        })
      )

      // Prepare permissions for API call
      const permissionsToUpdate = permissions.map(p => ({
        permission: p.permission,
        actions: p.actions,
      }))

      // API call
      const response = await roleApiService.updateRolePermissions(
        roleId,
        permissionsToUpdate as {
          permission: PermissionType
          actions: ActionType[]
        }[]
      )

      if (!response.success) {
        setError(response.message || 'Failed to update permissions')
        fetchData() // Revert by refetching
      } else {
        setSuccess('Permissions updated successfully')
      }
    } catch (err) {
      setError('Failed to update permissions')
      fetchData() // Revert by refetching
    } finally {
      setShowUpdateModal({
        show: false,
        roleId: '',
        permissions: [],
      })
    }
  }

  // Toggle permission in update modal
  const toggleUpdatePermission = (permission: PermissionType) => {
    setShowUpdateModal(prev => {
      const exists = prev.permissions.some(p => p.permission === permission)
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter(p => p.permission !== permission)
          : [...prev.permissions, { permission, actions: ['READ'] }],
      }
    })
  }

  // Toggle action in update modal
  const toggleUpdateAction = (permission: PermissionType, action: ActionType) => {
    setShowUpdateModal(prev => {
      const permissionIndex = prev.permissions.findIndex(p => p.permission === permission)
      if (permissionIndex === -1) return prev

      const updatedPermissions = [...prev.permissions]
      const currentActions = updatedPermissions[permissionIndex].actions

      if (action === 'ALL') {
        updatedPermissions[permissionIndex] = {
          ...updatedPermissions[permissionIndex],
          actions: currentActions.includes('ALL') ? [] : ['ALL'],
        }
      } else if (currentActions.includes('ALL')) {
        return prev // Can't modify individual actions when ALL is selected
      } else {
        updatedPermissions[permissionIndex] = {
          ...updatedPermissions[permissionIndex],
          actions: currentActions.includes(action)
            ? currentActions.filter(a => a !== action)
            : [...currentActions, action],
        }
      }

      return {
        ...prev,
        permissions: updatedPermissions,
      }
    })
  }

  // Prepare role deletion
  const prepareDeleteRole = (roleId: string, roleName: string) => {
    setShowDeleteModal({
      show: true,
      roleId,
      roleName,
    })
  }

  // Confirm role deletion
  const confirmDeleteRole = async () => {
    const { roleId } = showDeleteModal

    try {
      // Optimistic update
      setRoles(prev => prev.filter(role => role.roleId !== roleId))
      setFilteredRoles(prev => prev.filter(role => role.roleId !== roleId))

      const response = await roleApiService.deleteRole(roleId)
      if (!response.success) {
        setError(response.message || 'Failed to delete role')
        fetchData() // Revert by refetching
      } else {
        setSuccess('Role deleted successfully')
      }
    } catch (err) {
      setError('Failed to delete role')
      fetchData() // Revert by refetching
    } finally {
      setShowDeleteModal({
        show: false,
        roleId: '',
        roleName: '',
      })
    }
  }

  // Toggle permission in create modal
  const toggleCreatePermission = (permission: PermissionType) => {
    setNewRole(prev => {
      const exists = prev.permissions.some(p => p.permission === permission)
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter(p => p.permission !== permission)
          : [...prev.permissions, { permission, actions: ['READ'] }],
      }
    })
  }

  // Toggle action in create modal
  const toggleCreateAction = (permission: PermissionType, action: ActionType) => {
    setNewRole(prev => ({
      ...prev,
      permissions: prev.permissions.map(p =>
        p.permission === permission
          ? {
              ...p,
              actions: p.actions.includes(action)
                ? p.actions.filter(a => a !== action)
                : [...p.actions, action],
            }
          : p
      ),
    }))
  }

  // Initialize
  useEffect(() => {
    fetchData()
  }, [])

  // Close messages after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setSuccess(null)
      setError(null)
    }, 5000)
    return () => clearTimeout(timer)
  }, [success, error])

  return (
    <div className='min-h-screen bg-gray-50 p-4 md:p-6'>
      {/* Header */}
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-900'>Role Management</h1>
        <p className='text-gray-600'>Manage roles and their permissions</p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className='mb-4 rounded-md bg-green-50 p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <CheckCircleIcon className='h-5 w-5 text-green-400' aria-hidden='true' />
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-green-800'>{success}</p>
            </div>
            <div className='ml-auto pl-3'>
              <button
                type='button'
                className='inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 focus:ring-offset-green-50'
                onClick={() => setSuccess(null)}
              >
                <XMarkIcon className='h-5 w-5' aria-hidden='true' />
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className='mb-4 rounded-md bg-red-50 p-4'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <ShieldExclamationIcon className='h-5 w-5 text-red-400' aria-hidden='true' />
            </div>
            <div className='ml-3'>
              <p className='text-sm font-medium text-red-800'>{error}</p>
            </div>
            <div className='ml-auto pl-3'>
              <button
                type='button'
                className='inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 focus:ring-offset-red-50'
                onClick={() => setError(null)}
              >
                <XMarkIcon className='h-5 w-5' aria-hidden='true' />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className='mb-4 flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
        <div className='relative flex-1'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
            <MagnifyingGlassIcon className='h-5 w-5 text-gray-400' aria-hidden='true' />
          </div>
          <input
            type='text'
            className='block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:border-indigo-500 focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500'
            placeholder='Search roles...'
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className='inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
        >
          <PlusIcon className='-ml-1 mr-1 h-5 w-5' />
          Create Role
        </button>
      </div>

      {/* Mobile View - Card List */}
      <div className='sm:hidden space-y-4'>
        {isLoading ? (
          <div className='flex justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className='rounded-lg bg-white p-4 shadow text-center'>
            {searchTerm ? 'No roles found' : 'No roles available'}
          </div>
        ) : (
          filteredRoles.map(role => (
            <div key={role.roleId} className='rounded-lg bg-white p-4 shadow'>
              <div className='flex justify-between items-start'>
                <div>
                  <h3 className='text-lg font-medium text-gray-900'>{role.roleName}</h3>
                  {role.roleDescription && (
                    <p className='mt-1 text-sm text-gray-500'>{role.roleDescription}</p>
                  )}
                  {role.isDefault && (
                    <span className='mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                      Default
                    </span>
                  )}
                </div>
                <div className='flex space-x-2'>
                  <button
                    onClick={() => preparePermissionUpdate(role.roleId)}
                    className='text-indigo-600 hover:text-indigo-900'
                    title='Update Permissions'
                  >
                    <ShieldExclamationIcon className='h-5 w-5' />
                  </button>
                  <button
                    onClick={() => prepareDeleteRole(role.roleId, role.roleName)}
                    className='text-red-600 hover:text-red-900'
                    title='Delete Role'
                  >
                    <TrashIcon className='h-5 w-5' />
                  </button>
                </div>
              </div>

              <div className='mt-4'>
                <h4 className='text-sm font-medium text-gray-500 mb-2'>Permissions</h4>
                <div className='space-y-3'>
                  {allPermissions.map(permission => {
                    const rolePermission = role.permissions.find(p => p.permission === permission)
                    const isChecked = !!rolePermission
                    const hasAllActions = rolePermission?.actions.includes('ALL')

                    return (
                      <div key={permission} className='space-y-1'>
                        <div className='flex items-center'>
                          <input
                            id={`${role.roleId}-${permission}`}
                            type='checkbox'
                            checked={isChecked}
                            className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                            readOnly
                          />
                          <label
                            htmlFor={`${role.roleId}-${permission}`}
                            className='ml-2 text-sm text-gray-700 capitalize'
                          >
                            {permission.toLowerCase().replace(/_/g, ' ')}
                          </label>
                        </div>

                        {isChecked && (
                          <div className='ml-6 flex flex-wrap gap-2'>
                            {allActions.map(action => (
                              <div key={action} className='flex items-center'>
                                <input
                                  id={`${role.roleId}-${permission}-${action}`}
                                  type='checkbox'
                                  checked={
                                    hasAllActions ||
                                    (rolePermission?.actions.includes(action) ?? false)
                                  }
                                  className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${
                                    hasAllActions ? 'opacity-50 cursor-not-allowed' : ''
                                  }`}
                                  readOnly
                                />
                                <label
                                  htmlFor={`${role.roleId}-${permission}-${action}`}
                                  className={`ml-1 text-xs text-gray-600 capitalize ${
                                    hasAllActions ? 'opacity-50' : ''
                                  }`}
                                >
                                  {action.toLowerCase()}
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View - Table */}
      <div className='hidden sm:block overflow-scroll rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Role
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Description
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Permissions
              </th>
              <th
                scope='col'
                className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {isLoading ? (
              <tr>
                <td colSpan={4} className='px-6 py-4 text-center'>
                  <div className='flex justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
                  </div>
                </td>
              </tr>
            ) : filteredRoles.length === 0 ? (
              <tr>
                <td colSpan={4} className='px-6 py-4 text-center text-gray-500'>
                  {searchTerm ? 'No roles found' : 'No roles available'}
                </td>
              </tr>
            ) : (
              filteredRoles.map(role => (
                <tr key={role.roleId} className='hover:bg-gray-50'>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm font-medium text-gray-900'>{role.roleName}</div>
                    {role.isDefault && (
                      <span className='mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                        Default
                      </span>
                    )}
                  </td>
                  <td className='px-6 py-4'>
                    <div className='text-sm text-gray-500'>
                      {role.roleDescription || 'No description'}
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='space-y-2'>
                      {allPermissions.map(permission => {
                        const rolePermission = role.permissions.find(
                          p => p.permission === permission
                        )
                        const isChecked = !!rolePermission
                        const hasAllActions = rolePermission?.actions.includes('ALL')

                        return (
                          <div key={permission} className='flex items-start'>
                            <div className='flex items-center h-5'>
                              <input
                                id={`${role.roleId}-${permission}`}
                                type='checkbox'
                                checked={isChecked}
                                className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                                readOnly
                              />
                            </div>
                            <div className='ml-3 text-sm'>
                              <label
                                htmlFor={`${role.roleId}-${permission}`}
                                className='font-medium text-gray-700 capitalize'
                              >
                                {permission.toLowerCase().replace(/_/g, ' ')}
                              </label>
                              {isChecked && (
                                <div className='mt-1 flex flex-wrap gap-1'>
                                  {allActions.map(action => (
                                    <div key={action} className='flex items-center'>
                                      <input
                                        id={`${role.roleId}-${permission}-${action}`}
                                        type='checkbox'
                                        checked={
                                          hasAllActions ||
                                          (rolePermission?.actions.includes(action) ?? false)
                                        }
                                        className={`h-3 w-3 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${
                                          hasAllActions ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        readOnly
                                      />
                                      <label
                                        htmlFor={`${role.roleId}-${permission}-${action}`}
                                        className={`ml-1 text-xs text-gray-600 capitalize ${
                                          hasAllActions ? 'opacity-50' : ''
                                        }`}
                                      >
                                        {action.toLowerCase()}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    <div className='flex justify-end space-x-2'>
                      <button
                        onClick={() => preparePermissionUpdate(role.roleId)}
                        className='text-indigo-600 hover:text-indigo-900'
                        title='Update Permissions'
                      >
                        <ShieldExclamationIcon className='h-5 w-5' />
                      </button>
                      <button
                        onClick={() => prepareDeleteRole(role.roleId, role.roleName)}
                        className='text-red-600 hover:text-red-900'
                        title='Delete Role'
                      >
                        <TrashIcon className='h-5 w-5' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
            <div
              className='fixed inset-0 transition-opacity bg-black bg-opacity-50'
              aria-hidden='true'
              onClick={() => setShowCreateModal(false)}
            ></div>

            <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-3xl mx-4 sm:my-8 sm:align-middle sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='flex justify-between items-start'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900'>Create New Role</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className='text-gray-400 hover:text-gray-500 focus:outline-none'
                  >
                    <XMarkIcon className='h-6 w-6' />
                  </button>
                </div>

                <div className='mt-4 space-y-4'>
                  <div>
                    <label htmlFor='roleName' className='block text-sm font-medium text-gray-700'>
                      Role Name*
                    </label>
                    <input
                      type='text'
                      id='roleName'
                      className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
                      value={newRole.roleName}
                      onChange={e => setNewRole({ ...newRole, roleName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='description'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Description
                    </label>
                    <textarea
                      id='description'
                      rows={3}
                      className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
                      value={newRole.description}
                      onChange={e => setNewRole({ ...newRole, description: e.target.value })}
                    />
                  </div>

                  <div className='flex items-center'>
                    <input
                      id='isDefault'
                      type='checkbox'
                      className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                      checked={newRole.isDefault}
                      onChange={e => setNewRole({ ...newRole, isDefault: e.target.checked })}
                    />
                    <label htmlFor='isDefault' className='ml-2 block text-sm text-gray-700'>
                      Default Role
                    </label>
                  </div>

                  <div className='mt-4'>
                    <h4 className='text-sm font-medium text-gray-700 mb-2'>Permissions</h4>
                    <div className='space-y-3'>
                      {allPermissions.map(permission => {
                        const isChecked = newRole.permissions.some(p => p.permission === permission)
                        const rolePermission = newRole.permissions.find(
                          p => p.permission === permission
                        )
                        const hasAllActions = rolePermission?.actions.includes('ALL')

                        return (
                          <div key={permission} className='space-y-1'>
                            <div className='flex items-center'>
                              <input
                                id={`new-${permission}`}
                                type='checkbox'
                                checked={isChecked}
                                onChange={() => toggleCreatePermission(permission)}
                                className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                              />
                              <label
                                htmlFor={`new-${permission}`}
                                className='ml-2 text-sm text-gray-700 capitalize'
                              >
                                {permission.toLowerCase().replace(/_/g, ' ')}
                              </label>
                            </div>

                            {isChecked && rolePermission && (
                              <div className='ml-6 flex flex-wrap gap-2'>
                                {allActions.map(action => (
                                  <div key={action} className='flex items-center'>
                                    <input
                                      id={`new-${permission}-${action}`}
                                      type='checkbox'
                                      checked={
                                        hasAllActions || rolePermission.actions.includes(action)
                                      }
                                      onChange={() => toggleCreateAction(permission, action)}
                                      className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${
                                        hasAllActions ? 'opacity-50 cursor-not-allowed' : ''
                                      }`}
                                      disabled={hasAllActions}
                                    />
                                    <label
                                      htmlFor={`new-${permission}-${action}`}
                                      className={`ml-1 text-xs text-gray-600 capitalize ${
                                        hasAllActions ? 'opacity-50' : ''
                                      }`}
                                    >
                                      {action.toLowerCase()}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  type='button'
                  onClick={handleCreateRole}
                  className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Create Role
                </button>
                <button
                  type='button'
                  onClick={() => setShowCreateModal(false)}
                  className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal.show && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
            <div
              className='fixed inset-0 transition-opacity bg-black bg-opacity-50'
              aria-hidden='true'
            ></div>

            <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='sm:flex sm:items-start'>
                  <div className='mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'>
                    <ShieldExclamationIcon className='h-6 w-6 text-red-600' />
                  </div>
                  <div className='mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left'>
                    <h3 className='text-lg leading-6 font-medium text-gray-900'>
                      Delete Role: {showDeleteModal.roleName}
                    </h3>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500'>
                        Are you sure you want to delete this role? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  type='button'
                  onClick={confirmDeleteRole}
                  className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Delete
                </button>
                <button
                  type='button'
                  onClick={() => setShowDeleteModal({ show: false, roleId: '', roleName: '' })}
                  className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Permissions Confirmation Modal */}
      {showUpdateModal.show && (
        <div className='fixed inset-0 z-50 overflow-y-auto'>
          <div className='flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0'>
            <div
              className='fixed inset-0 transition-opacity bg-black bg-opacity-50'
              aria-hidden='true'
            ></div>

            <div className='inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full'>
              <div className='bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4'>
                <div className='sm:flex sm:items-start'>
                  <div className='mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10'>
                    <ShieldExclamationIcon className='h-6 w-6 text-blue-600' />
                  </div>
                  <div className='mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full'>
                    <h3 className='text-lg leading-6 font-medium text-gray-900'>
                      Update Permissions
                    </h3>
                    <div className='mt-2'>
                      <p className='text-sm text-gray-500 mb-4'>
                        Update permissions for this role. Changes will be applied to all users with
                        this role.
                      </p>
                      <div className='space-y-4'>
                        {allPermissions.map(permission => {
                          const rolePermission = showUpdateModal.permissions.find(
                            p => p.permission === permission
                          )
                          const isChecked = !!rolePermission
                          const hasAllActions = rolePermission?.actions.includes('ALL')

                          return (
                            <div key={permission} className='space-y-2'>
                              <div className='flex items-center'>
                                <input
                                  id={`update-${permission}`}
                                  type='checkbox'
                                  checked={isChecked}
                                  onChange={() => toggleUpdatePermission(permission)}
                                  className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                                />
                                <label
                                  htmlFor={`update-${permission}`}
                                  className='ml-2 text-sm font-medium text-gray-700 capitalize'
                                >
                                  {permission.toLowerCase().replace(/_/g, ' ')}
                                </label>
                              </div>

                              {isChecked && (
                                <div className='ml-6 flex flex-wrap gap-2'>
                                  {allActions.map(action => (
                                    <div key={action} className='flex items-center'>
                                      <input
                                        id={`update-${permission}-${action}`}
                                        type='checkbox'
                                        checked={
                                          hasAllActions ||
                                          (rolePermission?.actions.includes(action) ?? false)
                                        }
                                        onChange={() => toggleUpdateAction(permission, action)}
                                        className={`h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${
                                          hasAllActions ? 'opacity-50 cursor-not-allowed' : ''
                                        }`}
                                        disabled={hasAllActions && action !== 'ALL'}
                                      />
                                      <label
                                        htmlFor={`update-${permission}-${action}`}
                                        className={`ml-1 text-xs text-gray-600 capitalize ${
                                          hasAllActions && action !== 'ALL' ? 'opacity-50' : ''
                                        }`}
                                      >
                                        {action.toLowerCase()}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className='bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse'>
                <button
                  type='button'
                  onClick={confirmPermissionUpdate}
                  className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Update Permissions
                </button>
                <button
                  type='button'
                  onClick={() =>
                    setShowUpdateModal({
                      show: false,
                      roleId: '',
                      permissions: [],
                    })
                  }
                  className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleManagement
