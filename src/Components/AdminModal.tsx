import { ShieldExclamationIcon } from '@heroicons/react/24/outline'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import { Field, Form, Formik } from 'formik'

const AdminModals = ({
  isCreateModalOpen,
  setIsCreateModalOpen,
  isCreateSuperAdminModalOpen,
  setIsCreateSuperAdminModalOpen,
  showConfirmModal,
  setShowConfirmModal,
  bengaliTranslations,
  adminValidationSchema,
  formError,
  isCreating,
  handleCreateAdmin,
  handleCreateSuperAdmin,
  confirmAction,
  handleConfirmedAction,
}: {
  isCreateModalOpen: boolean
  setIsCreateModalOpen: (open: boolean) => void
  isCreateSuperAdminModalOpen: boolean
  setIsCreateSuperAdminModalOpen: (open: boolean) => void
  showConfirmModal: boolean
  setShowConfirmModal: (open: boolean) => void
  bengaliTranslations: Record<string, string>
  adminValidationSchema: any
  formError: string | null
  isCreating: boolean
  handleCreateAdmin: (values: any) => void
  handleCreateSuperAdmin: (values: any) => void
  confirmAction: any
  handleConfirmedAction: () => void
}) => {
  // Close modal when clicking on backdrop
  interface BackdropClickHandler {
    (e: React.MouseEvent<HTMLDivElement>, onClose: () => void): void
  }

  const handleBackdropClick: BackdropClickHandler = (e, onClose) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <>
      {/* Create Admin Modal */}
      {isCreateModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto'
          onClick={e => handleBackdropClick(e, () => setIsCreateModalOpen(false))}
        >
          <div className='bg-white rounded-lg w-full max-w-md mx-auto'>
            <div className='p-4'>
              <h3 className='text-lg font-medium text-gray-900 text-center'>
                {bengaliTranslations.createAdmin}
              </h3>
              <div className='px-2 sm:px-4 mt-2'>
                <Formik
                  initialValues={{
                    phoneNo: '',
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                  }}
                  validationSchema={adminValidationSchema}
                  onSubmit={values => {
                    handleCreateAdmin({
                      phoneNo: values.phoneNo,
                      name: values.name,
                      email: values.email || undefined,
                      password: values.password,
                    })
                  }}
                >
                  {({ errors, touched }) => (
                    <Form className='space-y-3'>
                      {formError && (
                        <div className='rounded-md bg-red-50 p-3 mb-2'>
                          <div className='flex'>
                            <div className='flex-shrink-0'>
                              <ShieldExclamationIcon className='h-5 w-5 text-red-400' />
                            </div>
                            <div className='ml-3'>
                              <p className='text-sm text-red-700'>{formError}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <Field
                          as={TextField}
                          name='name'
                          label='Full Name'
                          fullWidth
                          size='small'
                          variant='outlined'
                          error={touched.name && !!errors.name}
                          helperText={touched.name && errors.name}
                          className='text-sm'
                        />
                      </div>

                      <div>
                        <Field
                          as={TextField}
                          name='phoneNo'
                          label='Phone Number'
                          fullWidth
                          size='small'
                          variant='outlined'
                          error={touched.phoneNo && !!errors.phoneNo}
                          helperText={touched.phoneNo && errors.phoneNo}
                          className='text-sm'
                        />
                      </div>

                      <div>
                        <Field
                          as={TextField}
                          name='email'
                          label='Email (Optional)'
                          fullWidth
                          size='small'
                          variant='outlined'
                          error={touched.email && !!errors.email}
                          helperText={touched.email && errors.email}
                          className='text-sm'
                        />
                      </div>

                      <div>
                        <Field
                          as={TextField}
                          name='password'
                          label='Password'
                          type='password'
                          fullWidth
                          size='small'
                          variant='outlined'
                          error={touched.password && !!errors.password}
                          helperText={touched.password && errors.password}
                          className='text-sm'
                        />
                      </div>

                      <div>
                        <Field
                          as={TextField}
                          name='confirmPassword'
                          label='Confirm Password'
                          type='password'
                          fullWidth
                          size='small'
                          variant='outlined'
                          error={touched.confirmPassword && !!errors.confirmPassword}
                          helperText={touched.confirmPassword && errors.confirmPassword}
                          className='text-sm'
                        />
                      </div>

                      <div className='flex justify-end space-x-3 pt-4 pb-2'>
                        <Button
                          onClick={() => setIsCreateModalOpen(false)}
                          variant='outlined'
                          color='secondary'
                          size='small'
                          disabled={isCreating}
                          className='text-xs sm:text-sm'
                        >
                          {bengaliTranslations.cancel}
                        </Button>
                        <Button
                          type='submit'
                          variant='contained'
                          color='primary'
                          size='small'
                          disabled={isCreating}
                          startIcon={isCreating ? <CircularProgress size={16} /> : null}
                          className='text-xs sm:text-sm'
                        >
                          {isCreating ? 'Creating...' : bengaliTranslations.createAdmin}
                        </Button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Super Admin Modal */}
      {isCreateSuperAdminModalOpen && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto'
          onClick={e => handleBackdropClick(e, () => setIsCreateSuperAdminModalOpen(false))}
        >
          <div className='bg-white rounded-lg w-full max-w-md mx-auto'>
            <div className='p-4'>
              <h3 className='text-lg font-medium text-gray-900 text-center'>
                {bengaliTranslations.createSuperAdmin}
              </h3>
              <div className='px-2 sm:px-4 mt-2'>
                <Formik
                  initialValues={{
                    phoneNo: '',
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                  }}
                  validationSchema={adminValidationSchema}
                  onSubmit={values => {
                    handleCreateSuperAdmin({
                      phoneNo: values.phoneNo,
                      name: values.name,
                      email: values.email || undefined,
                      password: values.password,
                    })
                  }}
                >
                  {({ errors, touched }) => (
                    <Form className='space-y-3'>
                      {formError && (
                        <div className='rounded-md bg-red-50 p-3 mb-2'>
                          <div className='flex'>
                            <div className='flex-shrink-0'>
                              <ShieldExclamationIcon className='h-5 w-5 text-red-400' />
                            </div>
                            <div className='ml-3'>
                              <p className='text-sm text-red-700'>{formError}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      <div>
                        <Field
                          as={TextField}
                          name='name'
                          label='Full Name'
                          fullWidth
                          size='small'
                          variant='outlined'
                          error={touched.name && !!errors.name}
                          helperText={touched.name && errors.name}
                          className='text-sm'
                        />
                      </div>

                      <div>
                        <Field
                          as={TextField}
                          name='phoneNo'
                          label='Phone Number'
                          fullWidth
                          size='small'
                          variant='outlined'
                          error={touched.phoneNo && !!errors.phoneNo}
                          helperText={touched.phoneNo && errors.phoneNo}
                          className='text-sm'
                        />
                      </div>

                      <div>
                        <Field
                          as={TextField}
                          name='email'
                          label='Email (Optional)'
                          fullWidth
                          size='small'
                          variant='outlined'
                          error={touched.email && !!errors.email}
                          helperText={touched.email && errors.email}
                          className='text-sm'
                        />
                      </div>

                      <div>
                        <Field
                          as={TextField}
                          name='password'
                          label='Password'
                          type='password'
                          fullWidth
                          size='small'
                          variant='outlined'
                          error={touched.password && !!errors.password}
                          helperText={touched.password && errors.password}
                          className='text-sm'
                        />
                      </div>

                      <div>
                        <Field
                          as={TextField}
                          name='confirmPassword'
                          label='Confirm Password'
                          type='password'
                          fullWidth
                          size='small'
                          variant='outlined'
                          error={touched.confirmPassword && !!errors.confirmPassword}
                          helperText={touched.confirmPassword && errors.confirmPassword}
                          className='text-sm'
                        />
                      </div>

                      <div className='flex justify-end space-x-3 pt-4 pb-2'>
                        <Button
                          onClick={() => setIsCreateSuperAdminModalOpen(false)}
                          variant='outlined'
                          color='secondary'
                          size='small'
                          disabled={isCreating}
                          className='text-xs sm:text-sm'
                        >
                          {bengaliTranslations.cancel}
                        </Button>
                        <Button
                          type='submit'
                          variant='contained'
                          color='primary'
                          size='small'
                          disabled={isCreating}
                          startIcon={isCreating ? <CircularProgress size={16} /> : null}
                          className='text-xs sm:text-sm'
                        >
                          {isCreating ? 'Creating...' : bengaliTranslations.createSuperAdmin}
                        </Button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto'
          onClick={e => handleBackdropClick(e, () => setShowConfirmModal(false))}
        >
          <div className='bg-white rounded-lg w-full max-w-xs mx-auto'>
            <div className='p-4'>
              <h3 className='text-lg font-medium text-gray-900 text-center'>
                {bengaliTranslations.confirm}
              </h3>
              <div className='px-4 py-2'>
                <p className='text-sm text-gray-600 text-center'>
                  {confirmAction?.type === 'promote'
                    ? bengaliTranslations.promoteConfirm
                    : confirmAction?.type === 'demote'
                    ? bengaliTranslations.demoteConfirm
                    : confirmAction?.isAdding
                    ? bengaliTranslations.roleAddConfirm.replace(
                        '{{role}}',
                        confirmAction.roleName || ''
                      )
                    : bengaliTranslations.roleRemoveConfirm.replace(
                        '{{role}}',
                        confirmAction?.roleName || ''
                      )}
                </p>
                <div className='flex justify-center space-x-4 mt-6'>
                  <Button
                    onClick={() => setShowConfirmModal(false)}
                    variant='outlined'
                    color='secondary'
                    size='small'
                    className='text-xs sm:text-sm'
                  >
                    {bengaliTranslations.cancel}
                  </Button>
                  <Button
                    onClick={handleConfirmedAction}
                    variant='contained'
                    color='primary'
                    size='small'
                    className='text-xs sm:text-sm'
                  >
                    {bengaliTranslations.proceed}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AdminModals
