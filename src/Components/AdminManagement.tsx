// src/features/AdminManagement/AdminManagement.tsx
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  PlusIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { Button } from '@mui/material'
import { useEffect, useState } from 'react'
import * as Yup from 'yup'
import { adminApiService, type AdminUser, type Role } from '../Api/admin.api'
import { userManagementApiService } from '../Api/user.api'
import AdminModals from './AdminModal'

// Bengali translations
const bengaliTranslations = {
  promoteConfirm: 'আপনি কি এই অ্যাডমিনকে সুপার অ্যাডমিন করতে চান?',
  demoteConfirm: 'আপনি কি এই সুপার অ্যাডমিনকে অ্যাডমিন করতে চান?',
  roleAddConfirm: 'আপনি কি {{role}} রোলটি যোগ করতে চান?',
  roleRemoveConfirm: 'আপনি কি {{role}} রোলটি সরাতে চান?',
  confirm: 'নিশ্চিত করুন',
  cancel: 'বাতিল',
  proceed: 'নিশ্চিত করুন',
  createAdmin: 'নতুন অ্যাডমিন তৈরি করুন',
  createSuperAdmin: 'নতুন সুপার অ্যাডমিন তৈরি করুন',
}

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
  const [pageSize, setPageSize] = useState(5)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isCreateSuperAdminModalOpen, setIsCreateSuperAdminModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{
    type: 'promote' | 'demote' | 'roleChange'
    userId: string
    roleId?: string
    roleName?: string
    isAdding?: boolean
  } | null>(null)

  // Validation schema for admin creation
  const adminValidationSchema = Yup.object({
    phoneNo: Yup.string()
      .required('Phone number is required')
      .matches(
        /^01[3-9]\d{8}$/,
        'Must be a valid Bangladeshi phone number (11 digits starting with 01)'
      ),
    name: Yup.string()
      .required('Name is required')
      .min(3, 'Name must be at least 3 characters')
      .max(50, 'Name must be less than 50 characters'),
    email: Yup.string().email('Invalid email address').optional(),
    password: Yup.string()
      .required('Password is required')
      .min(6, 'Password must be at least 6 characters')
      .max(16, 'Password must be at most 16 characters'),
    confirmPassword: Yup.string()
      .required('Please confirm your password')
      .oneOf([Yup.ref('password')], 'Passwords must match'),
  })

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
    setFormError(null)
    try {
      const response = await adminApiService.createAdmin(values)
      if (response.success) {
        setSuccess('Admin created successfully')
        setIsCreateModalOpen(false)
        fetchAdmins() // Refresh the list
      } else {
        setFormError(response.message || 'Failed to create admin')
      }
    } catch (error) {
      setFormError('Failed to create admin')
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
    setFormError(null)
    try {
      const response = await adminApiService.createSuperAdmin(values)
      if (response.success) {
        setSuccess('Super Admin created successfully')
        setIsCreateSuperAdminModalOpen(false)
        fetchAdmins() // Refresh the list
      } else {
        setFormError(response.message || 'Failed to create super admin')
      }
    } catch (error) {
      setFormError('Failed to create super admin')
    } finally {
      setIsCreating(false)
    }
  }

  // Promote admin to super admin
  const handlePromoteAdmin = async (userId: string) => {
    try {
      const response = await adminApiService.promoteAdminToSuperAdmin(userId)
      if (response.success) {
        setSuccess('Admin promoted to Super Admin successfully')
        fetchAdmins() // Refresh the list
      } else {
        setError(response.message || 'Failed to promote admin')
      }
    } catch (err) {
      setError('Failed to promote admin')
    }
  }

  // Demote super admin to admin
  const handleDemoteSuperAdmin = async (userId: string) => {
    try {
      const response = await adminApiService.demoteSuperAdminToAdmin(userId)
      if (response.success) {
        setSuccess('Super Admin demoted to Admin successfully')
        fetchAdmins() // Refresh the list
      } else {
        setError(response.message || 'Failed to demote super admin')
      }
    } catch (err) {
      setError('Failed to demote super admin')
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

  // Toggle role assignment with confirmation
  const toggleRole = (userId: string, roleId: string, roleName: string) => {
    const currentRoles = userRolesMap[userId] || []
    const isAdding = !currentRoles.includes(roleId)

    setConfirmAction({
      type: 'roleChange',
      userId,
      roleId,
      roleName,
      isAdding,
    })
    setShowConfirmModal(true)
  }

  // Handle promote click with confirmation
  const handlePromoteClick = (userId: string) => {
    setConfirmAction({
      type: 'promote',
      userId,
    })
    setShowConfirmModal(true)
  }

  // Handle demote click with confirmation
  const handleDemoteClick = (userId: string) => {
    setConfirmAction({
      type: 'demote',
      userId,
    })
    setShowConfirmModal(true)
  }

  // Handle confirmed action
  const handleConfirmedAction = async () => {
    if (!confirmAction) return

    try {
      switch (confirmAction.type) {
        case 'promote':
          await handlePromoteAdmin(confirmAction.userId)
          break
        case 'demote':
          await handleDemoteSuperAdmin(confirmAction.userId)
          break
        case 'roleChange':
          if (confirmAction.roleId) {
            const currentRoles = userRolesMap[confirmAction.userId] || []
            const newRoles = confirmAction.isAdding
              ? [...currentRoles, confirmAction.roleId]
              : currentRoles.filter(id => id !== confirmAction.roleId)

            // Optimistic update
            setUserRolesMap(prev => ({
              ...prev,
              [confirmAction.userId]: newRoles,
            }))

            // API call
            await updateUserRoles(confirmAction.userId, newRoles)
          }
          break
      }
    } catch (err) {
      setError('Action failed')
    } finally {
      setShowConfirmModal(false)
      setConfirmAction(null)
    }
  }

  // Get role name for a user
  const getUserRole = (admin: AdminUser) => {
    return admin.role
  }

  // Check if user is super admin
  const isSuperAdmin = (userId: string) => {
    const admin = admins.find(admin => admin.userId === userId)
    return admin ? getUserRole(admin) === 'SuperAdmin' : false
  }

  // Initialize
  useEffect(() => {
    fetchAdmins()
    fetchAllRoles()
  }, [currentPage, pageSize, searchTerm])

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
            placeholder='Search admins by name or phone number...'
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
            <option value={5}>5/page</option>
            <option value={10}>10/page</option>
            <option value={25}>25/page</option>
            <option value={50}>50/page</option>
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
            <div key={admin.userId}>
              {/* Combined User Info and Roles Section */}
              <div className='rounded-lg bg-white p-4 shadow'>
                {/* User Info Section */}
                <div
                  onClick={() => setSelectedAdmin(admin)}
                  className='cursor-pointer active:bg-gray-50 pb-3'
                >
                  <div className='flex items-start space-x-3'>
                    <div className='flex-shrink-0'>
                      <UserCircleIcon className='h-10 w-10 text-gray-400' aria-hidden='true' />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex justify-between items-start'>
                        <h3 className='text-sm font-medium text-gray-900 truncate'>{admin.name}</h3>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full flex-shrink-0 ${
                            admin.role === 'SuperAdmin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {admin.role}
                        </span>
                      </div>
                      <div className='mt-1 text-sm text-gray-500'>
                        <div className='flex items-center'>
                          <PhoneIcon className='mr-1 h-3.5 w-3.5' />
                          <span className='truncate'>{admin.phoneNo}</span>
                        </div>
                        {admin.email && (
                          <div className='flex items-center mt-1'>
                            <EnvelopeIcon className='mr-1 h-3.5 w-3.5' />
                            <span className='truncate'>{admin.email}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className='border-t border-gray-200 my-3'></div>

                {/* Roles Section */}
                <div>
                  <div className='flex justify-between items-center mb-2'>
                    <h4 className='text-xs font-medium text-gray-500'>Roles</h4>
                    <div className='flex space-x-2'>
                      {!isSuperAdmin(admin.userId) ? (
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handlePromoteClick(admin.userId)
                          }}
                          className='flex items-center text-xs text-purple-600 hover:text-purple-800'
                        >
                          <ArrowUpIcon className='h-3 w-3 mr-1' />
                          Promote
                        </button>
                      ) : (
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            handleDemoteClick(admin.userId)
                          }}
                          className='flex items-center text-xs text-blue-600 hover:text-blue-800'
                        >
                          <ArrowDownIcon className='h-3 w-3 mr-1' />
                          Demote
                        </button>
                      )}
                    </div>
                  </div>
                  <div className='space-y-1'>
                    {allRoles.map(role => (
                      <div key={role.roleId} className='flex items-center'>
                        <input
                          id={`${admin.userId}-${role.roleId}`}
                          type='checkbox'
                          checked={userRolesMap[admin.userId]?.includes(role.roleId) || false}
                          onChange={e => {
                            e.stopPropagation()
                            toggleRole(admin.userId, role.roleId, role.roleName)
                          }}
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

              {/* Detail Modal (unchanged) */}
              {selectedAdmin?.userId === admin.userId && (
                <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
                  <div
                    className='bg-white rounded-lg w-full max-w-sm max-h-[90vh] overflow-y-auto'
                    onClick={e => e.stopPropagation()}
                  >
                    <div className='p-6'>
                      <div className='flex justify-between items-start'>
                        <h2 className='text-xl font-bold text-gray-900'>{selectedAdmin.name}</h2>
                        <button
                          onClick={() => setSelectedAdmin(null)}
                          className='text-gray-500 hover:text-gray-700'
                        >
                          <XMarkIcon className='h-6 w-6' />
                        </button>
                      </div>

                      <div className='mt-6 space-y-4'>
                        <div className='flex items-center'>
                          <UserCircleIcon className='h-5 w-5 text-gray-400 mr-2' />
                          <div>
                            <p className='text-sm text-gray-500'>Name</p>
                            <p className='text-sm font-medium text-gray-900'>
                              {selectedAdmin.name}
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center'>
                          <EnvelopeIcon className='h-5 w-5 text-gray-400 mr-2' />
                          <div>
                            <p className='text-sm text-gray-500'>Email</p>
                            <p className='text-sm font-medium text-gray-900'>
                              {selectedAdmin.email || 'Not provided'}
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center'>
                          <PhoneIcon className='h-5 w-5 text-gray-400 mr-2' />
                          <div>
                            <p className='text-sm text-gray-500'>Phone</p>
                            <p className='text-sm font-medium text-gray-900'>
                              {selectedAdmin.phoneNo}
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center'>
                          <ShieldCheckIcon className='h-5 w-5 text-gray-400 mr-2' />
                          <div>
                            <p className='text-sm text-gray-500'>Role</p>
                            <p className='text-sm font-medium text-gray-900'>
                              {selectedAdmin.role}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className='mt-6 pt-4 border-t border-gray-200'>
                        <button
                          onClick={() => setSelectedAdmin(null)}
                          className='w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                Role Action
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
                <td colSpan={5} className='px-6 py-4 text-center'>
                  <div className='flex justify-center py-8'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600'></div>
                  </div>
                </td>
              </tr>
            ) : filteredAdmins.length === 0 ? (
              <tr>
                <td colSpan={5} className='px-6 py-4 text-center text-gray-500'>
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
                        <div className='flex items-center space-x-2'>
                          <div className='text-xs font-medium text-gray-900 md:text-sm'>
                            {admin.name}
                          </div>
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full ${
                              admin.role === 'SuperAdmin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {admin.role}
                          </span>
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
                  <td className='px-3 py-3 whitespace-nowrap md:px-6 md:py-4'>
                    {!isSuperAdmin(admin.userId) ? (
                      <Button
                        variant='outlined'
                        color='secondary'
                        size='small'
                        startIcon={<ArrowUpIcon className='h-4 w-4' />}
                        onClick={() => handlePromoteClick(admin.userId)}
                      >
                        Promote
                      </Button>
                    ) : (
                      <Button
                        variant='outlined'
                        color='primary'
                        size='small'
                        startIcon={<ArrowDownIcon className='h-4 w-4' />}
                        onClick={() => handleDemoteClick(admin.userId)}
                      >
                        Demote
                      </Button>
                    )}
                  </td>
                  <td className='px-3 py-3 md:px-6 md:py-4'>
                    <div className='flex flex-wrap gap-1 md:gap-2'>
                      {allRoles.map(role => (
                        <div key={role.roleId} className='flex items-center'>
                          <input
                            id={`${admin.userId}-${role.roleId}`}
                            type='checkbox'
                            checked={userRolesMap[admin.userId]?.includes(role.roleId) || false}
                            onChange={() => toggleRole(admin.userId, role.roleId, role.roleName)}
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
      {/* Pagination - Updated for mobile visibility */}
      {totalPages > 1 && (
        <div className='mt-4'>
          <div className='flex flex-col sm:flex-row items-center justify-between'>
            {/* Mobile pagination info */}
            <div className='sm:hidden mb-2 text-xs text-gray-700'>
              Page {currentPage} of {totalPages}
            </div>

            {/* Desktop pagination info */}
            <div className='hidden sm:block text-xs text-gray-700 md:text-sm'>
              Showing <span className='font-medium'>{(currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className='font-medium'>
                {Math.min(currentPage * pageSize, filteredAdmins.length)}
              </span>{' '}
              of <span className='font-medium'>{filteredAdmins.length}</span> admins
            </div>

            {/* Pagination controls - visible on all devices */}
            <nav className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'>
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

              {/* Show limited page numbers on mobile */}
              <div className='sm:hidden flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700'>
                {currentPage}
              </div>

              {/* Show full pagination on desktop */}
              <div className='hidden sm:flex'>
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
              </div>

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

          {/* Mobile page jump - Optional */}
          <div className='mt-2 sm:hidden flex justify-center space-x-2'>
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className='px-3 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50'
            >
              First
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className='px-3 py-1 text-xs rounded border border-gray-300 bg-white text-gray-700 disabled:opacity-50'
            >
              Last
            </button>
          </div>
        </div>
      )}
      {/* Create Admin Modal */}
      <AdminModals
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        isCreateSuperAdminModalOpen={isCreateSuperAdminModalOpen}
        setIsCreateSuperAdminModalOpen={setIsCreateSuperAdminModalOpen}
        showConfirmModal={showConfirmModal}
        setShowConfirmModal={setShowConfirmModal}
        bengaliTranslations={bengaliTranslations}
        adminValidationSchema={adminValidationSchema}
        formError={formError}
        isCreating={isCreating}
        handleCreateAdmin={handleCreateAdmin}
        handleCreateSuperAdmin={handleCreateSuperAdmin}
        confirmAction={confirmAction}
        handleConfirmedAction={handleConfirmedAction}
      />
    </div>
  )
}

export default AdminManagement
