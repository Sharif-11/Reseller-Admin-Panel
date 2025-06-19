// src/features/AdminManagement/AdminManagement.tsx
import {
  CheckCircleIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  PlusIcon,
  ShieldExclamationIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Button, Dialog, DialogContent, DialogTitle } from '@mui/material'
import { useEffect, useState } from 'react'
import { adminApiService, type AdminUser, type Role } from '../Api/admin.api'
import { userManagementApiService } from '../Api/user.api'
import CreateAdminForm from './CreateAdminForm'

const AdminManagement = () => {
  // State management
  const [admins, setAdmins] = useState<AdminUser[]>([])
  const [filteredAdmins, setFilteredAdmins] = useState<AdminUser[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [allRoles, setAllRoles] = useState<Role[]>([])
  const [userRolesMap, setUserRolesMap] = useState<Record<string, string[]>>({})
  const [pageSize, setPageSize] = useState(10)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreateSuperAdminModalOpen, setIsCreateSuperAdminModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Fetch admins
  const fetchAdmins = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await userManagementApiService.getAllUsers({
        page: currentPage,
        limit: pageSize,
        searchTerm,
        role: ['SuperAdmin', 'Admin'],
      })

      if (response.success && response.data) {
        setAdmins(response.data.users as AdminUser[])
        setFilteredAdmins(response.data.users as AdminUser[])
        setTotalPages(Math.ceil(response.data.totalCount / pageSize))

        // Initialize user roles map
        const rolesMap: Record<string, string[]> = {}
        response.data.users.forEach(admin => {
          rolesMap[admin.userId] = admin.userRoles!.map(ur => ur.role.roleId)
        })
        setUserRolesMap(rolesMap)
      } else {
        setError(response.message || 'Failed to fetch admins')
      }
    } catch (err) {
      setError('Failed to fetch admins')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAdmin = async (values: {
    phoneNo: string
    name: string
    email?: string
    password: string
  }) => {
    setIsCreating(true)
    try {
      const response = await adminApiService.createAdmin(values)
      if (response.success) {
        setSuccess('Admin created successfully')
        setIsCreateModalOpen(false)
        fetchAdmins() // Refresh the list
      } else {
        setError(response.message || 'Failed to create admin')
      }
    } catch (error) {
      setError('Failed to create admin')
    } finally {
      setIsCreating(false)
    }
  }

  const handleCreateSuperAdmin = async (values: {
    phoneNo: string
    name: string
    email?: string
    password: string
  }) => {
    setIsCreating(true)
    try {
      const response = await adminApiService.createSuperAdmin(values)
      if (response.success) {
        setSuccess('Super Admin created successfully')
        setIsCreateSuperAdminModalOpen(false)
        fetchAdmins() // Refresh the list
      } else {
        setError(response.message || 'Failed to create super admin')
      }
    } catch (error) {
      setError('Failed to create super admin')
    } finally {
      setIsCreating(false)
    }
  }

  // Fetch all available roles
  const fetchAllRoles = async () => {
    try {
      const response = await adminApiService.getAllRoles()
      if (response.success && response.data) {
        setAllRoles(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err)
    }
  }

  // Update user roles
  const updateUserRoles = async (userId: string, roleIds: string[]) => {
    try {
      const response = await adminApiService.updateUserRoles(userId, roleIds)
      if (response.success) {
        setSuccess('User roles updated successfully')
        // Update local state
        setUserRolesMap(prev => ({
          ...prev,
          [userId]: roleIds,
        }))
      } else {
        setError(response.message || 'Failed to update user roles')
      }
    } catch (err) {
      setError('Failed to update user roles')
    }
  }

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  // Apply filters
  useEffect(() => {
    if (searchTerm) {
      const filtered = admins.filter(
        admin =>
          admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          admin.phoneNo.includes(searchTerm) ||
          (admin.email && admin.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredAdmins(filtered)
    } else {
      setFilteredAdmins(admins)
    }
  }, [searchTerm, admins])

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // Toggle role assignment
  const toggleRole = (userId: string, roleId: string) => {
    const currentRoles = userRolesMap[userId] || []
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter(id => id !== roleId)
      : [...currentRoles, roleId]

    // Optimistic update
    setUserRolesMap(prev => ({
      ...prev,
      [userId]: newRoles,
    }))

    // API call
    updateUserRoles(userId, newRoles)
  }

  // Initialize
  useEffect(() => {
    fetchAdmins()
    fetchAllRoles()
  }, [currentPage, pageSize])

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
      {/* Header - Made responsive */}
      <div className='mb-6'>
        <div className='mb-4 md:mb-0'>
          <h1 className='text-xl font-bold text-gray-900 md:text-2xl'>Admin Management</h1>
          <p className='text-sm text-gray-600 md:text-base'>
            Manage all admin users and their roles
          </p>
        </div>
        <div className='flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 mt-4'>
          <Button
            variant='contained'
            color='primary'
            size='small'
            fullWidth
            className='sm:w-auto'
            startIcon={<PlusIcon className='h-4 w-4 md:h-5 md:w-5' />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span className='text-xs md:text-sm'>Create Admin</span>
          </Button>
          <Button
            variant='outlined'
            color='secondary'
            size='small'
            fullWidth
            className='sm:w-auto'
            startIcon={<PlusIcon className='h-4 w-4 md:h-5 md:w-5' />}
            onClick={() => setIsCreateSuperAdminModalOpen(true)}
          >
            <span className='text-xs md:text-sm'>Create Super Admin</span>
          </Button>
        </div>
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

      {/* Toolbar - Made more compact on mobile */}
      <div className='mb-4 flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0'>
        <div className='relative flex-1'>
          <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
            <MagnifyingGlassIcon
              className='h-4 w-4 text-gray-400 md:h-5 md:w-5'
              aria-hidden='true'
            />
          </div>
          <input
            type='text'
            className='block w-full rounded-md border border-gray-300 bg-white py-1.5 pl-9 pr-3 text-xs placeholder-gray-500 focus:border-indigo-500 focus:text-gray-900 focus:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 md:text-sm md:py-2 md:pl-10'
            placeholder='Search admins...'
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className='flex items-center justify-end sm:justify-start'>
          <select
            className='rounded-md border border-gray-300 bg-white py-1.5 pl-2 pr-7 text-xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 md:text-sm md:py-2 md:pl-3 md:pr-8'
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
          >
            <option value={10}>10/page</option>
            <option value={25}>25/page</option>
            <option value={50}>50/page</option>
            <option value={100}>100/page</option>
          </select>
        </div>
      </div>

      {/* Mobile View - Card List */}
      <div className='sm:hidden space-y-3'>
        {isLoading ? (
          <div className='flex justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className='rounded-lg bg-white p-4 shadow text-center'>
            {searchTerm ? 'No admins found' : 'No admins available'}
          </div>
        ) : (
          filteredAdmins.map(admin => (
            <div key={admin.userId} className='rounded-lg bg-white p-4 shadow'>
              <div className='flex items-start space-x-3'>
                <div className='flex-shrink-0'>
                  <UserCircleIcon className='h-10 w-10 text-gray-400' aria-hidden='true' />
                </div>
                <div className='flex-1 min-w-0'>
                  <h3 className='text-sm font-medium text-gray-900 truncate'>{admin.name}</h3>
                  <div className='mt-1 text-sm text-gray-500 truncate'>
                    <div className='flex items-center'>
                      <PhoneIcon className='mr-1 h-3.5 w-3.5' />
                      {admin.phoneNo}
                    </div>
                    {admin.email && (
                      <div className='flex items-center mt-1'>
                        <EnvelopeIcon className='mr-1 h-3.5 w-3.5' />
                        {admin.email}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Role Assignment */}
              <div className='mt-3'>
                <h4 className='text-xs font-medium text-gray-500 mb-1'>Roles</h4>
                <div className='space-y-1'>
                  {allRoles.map(role => (
                    <div key={role.roleId} className='flex items-center'>
                      <input
                        id={`${admin.userId}-${role.roleId}`}
                        type='checkbox'
                        checked={userRolesMap[admin.userId]?.includes(role.roleId) || false}
                        onChange={() => toggleRole(admin.userId, role.roleId)}
                        className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                      />
                      <label
                        htmlFor={`${admin.userId}-${role.roleId}`}
                        className='ml-2 text-sm text-gray-700'
                      >
                        {role.roleName}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View - Table - Made more compact on smaller screens */}
      <div className='hidden sm:block overflow-x-auto rounded-lg shadow'>
        <table className='min-w-full divide-y divide-gray-200'>
          <thead className='bg-gray-50'>
            <tr>
              <th
                scope='col'
                className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 md:py-3'
              >
                Admin
              </th>
              <th
                scope='col'
                className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 md:py-3'
              >
                Contact
              </th>
              <th
                scope='col'
                className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 md:py-3'
              >
                Created
              </th>
              <th
                scope='col'
                className='px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider md:px-6 md:py-3'
              >
                Roles
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
            ) : filteredAdmins.length === 0 ? (
              <tr>
                <td colSpan={4} className='px-6 py-4 text-center text-gray-500'>
                  {searchTerm ? 'No admins found' : 'No admins available'}
                </td>
              </tr>
            ) : (
              filteredAdmins.map(admin => (
                <tr key={admin.userId} className='hover:bg-gray-50'>
                  <td className='px-3 py-3 whitespace-nowrap md:px-6 md:py-4'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0 h-8 w-8 md:h-10 md:w-10'>
                        <UserCircleIcon
                          className='h-8 w-8 text-gray-400 md:h-10 md:w-10'
                          aria-hidden='true'
                        />
                      </div>
                      <div className='ml-2 md:ml-4'>
                        <div className='text-xs font-medium text-gray-900 md:text-sm'>
                          {admin.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className='px-3 py-3 whitespace-nowrap md:px-6 md:py-4'>
                    <div className='text-xs text-gray-900 md:text-sm'>{admin.phoneNo}</div>
                    {admin.email && (
                      <div className='text-xs text-gray-500 md:text-sm'>{admin.email}</div>
                    )}
                  </td>
                  <td className='px-3 py-3 whitespace-nowrap md:px-6 md:py-4'>
                    <div className='text-xs text-gray-500 md:text-sm'>
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className='px-3 py-3 md:px-6 md:py-4'>
                    <div className='flex flex-wrap gap-1 md:gap-2'>
                      {allRoles.map(role => (
                        <div key={role.roleId} className='flex items-center'>
                          <input
                            id={`${admin.userId}-${role.roleId}`}
                            type='checkbox'
                            checked={userRolesMap[admin.userId]?.includes(role.roleId) || false}
                            onChange={() => toggleRole(admin.userId, role.roleId)}
                            className='h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
                          />
                          <label
                            htmlFor={`${admin.userId}-${role.roleId}`}
                            className='ml-1 text-xs text-gray-700 md:text-sm'
                          >
                            {role.roleName}
                          </label>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className='mt-4 flex items-center justify-between'>
          <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
            <div>
              <p className='text-xs text-gray-700 md:text-sm'>
                Showing <span className='font-medium'>{(currentPage - 1) * pageSize + 1}</span> to{' '}
                <span className='font-medium'>
                  {Math.min(currentPage * pageSize, filteredAdmins.length)}
                </span>{' '}
                of <span className='font-medium'>{filteredAdmins.length}</span> admins
              </p>
            </div>
            <div>
              <nav
                className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'
                aria-label='Pagination'
              >
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <span className='sr-only'>Previous</span>
                  <svg
                    className='h-5 w-5'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      fillRule='evenodd'
                      d='M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <span className='sr-only'>Next</span>
                  <svg
                    className='h-5 w-5'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                    aria-hidden='true'
                  >
                    <path
                      fillRule='evenodd'
                      d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                      clipRule='evenodd'
                    />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Create Admin Modal */}
      <Dialog
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Create New Admin</DialogTitle>
        <DialogContent>
          <CreateAdminForm
            onCreate={handleCreateAdmin}
            onCancel={() => setIsCreateModalOpen(false)}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>

      {/* Create Super Admin Modal */}
      <Dialog
        open={isCreateSuperAdminModalOpen}
        onClose={() => setIsCreateSuperAdminModalOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Create New Super Admin</DialogTitle>
        <DialogContent>
          <CreateAdminForm
            isSuperAdmin
            onCreate={handleCreateSuperAdmin}
            onCancel={() => setIsCreateSuperAdminModalOpen(false)}
            isLoading={isCreating}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminManagement
