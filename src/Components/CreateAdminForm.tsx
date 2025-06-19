// src/features/AdminManagement/components/CreateAdminForm.tsx
import {
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline'
import { Box, Button, TextField, Typography } from '@mui/material'
import { useFormik } from 'formik'
import * as Yup from 'yup'

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

interface CreateAdminFormProps {
  isSuperAdmin?: boolean
  onCreate: (values: { phoneNo: string; name: string; email?: string; password: string }) => void
  onCancel: () => void
  isLoading: boolean
}

const CreateAdminForm = ({
  isSuperAdmin = false,
  onCreate,
  onCancel,
  isLoading,
}: CreateAdminFormProps) => {
  const formik = useFormik({
    initialValues: {
      phoneNo: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validationSchema: adminValidationSchema,
    onSubmit: values => {
      const { confirmPassword, ...submitValues } = values
      onCreate(submitValues)
    },
  })

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: { xs: '100%', sm: 500 },
        margin: '0 auto',
        padding: { xs: 2, sm: 3 },
        backgroundColor: 'background.paper',
        borderRadius: 2,
        boxShadow: { xs: 0, sm: 1 },
      }}
    >
      <Typography
        variant='h6'
        gutterBottom
        sx={{
          fontWeight: 600,
          mb: 3,
          fontSize: { xs: '1.25rem', sm: '1.5rem' },
        }}
      >
        Create {isSuperAdmin ? 'Super Admin' : 'Admin'} Account
      </Typography>

      <form onSubmit={formik.handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            id='phoneNo'
            name='phoneNo'
            label='Phone Number'
            type='tel'
            placeholder='01XXXXXXXXX'
            value={formik.values.phoneNo}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.phoneNo && Boolean(formik.errors.phoneNo)}
            helperText={formik.touched.phoneNo && formik.errors.phoneNo}
            InputProps={{
              startAdornment: <PhoneIcon className='h-5 w-5 text-gray-400 mr-2' />,
            }}
            size='small'
            sx={{
              '& .MuiInputBase-root': {
                height: { xs: 48, sm: 40 },
              },
            }}
          />

          <TextField
            fullWidth
            id='name'
            name='name'
            label='Full Name'
            placeholder='John Doe'
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && Boolean(formik.errors.name)}
            helperText={formik.touched.name && formik.errors.name}
            InputProps={{
              startAdornment: <UserCircleIcon className='h-5 w-5 text-gray-400 mr-2' />,
            }}
            size='small'
            sx={{
              '& .MuiInputBase-root': {
                height: { xs: 48, sm: 40 },
              },
            }}
          />

          <TextField
            fullWidth
            id='email'
            name='email'
            label='Email (Optional)'
            type='email'
            placeholder='example@domain.com'
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && Boolean(formik.errors.email)}
            helperText={formik.touched.email && formik.errors.email}
            InputProps={{
              startAdornment: <EnvelopeIcon className='h-5 w-5 text-gray-400 mr-2' />,
            }}
            size='small'
            sx={{
              '& .MuiInputBase-root': {
                height: { xs: 48, sm: 40 },
              },
            }}
          />

          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
            }}
          >
            <TextField
              fullWidth
              id='password'
              name='password'
              label='Password'
              type='password'
              placeholder='6-16 characters'
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                startAdornment: <LockClosedIcon className='h-5 w-5 text-gray-400 mr-2' />,
              }}
              size='small'
              sx={{
                '& .MuiInputBase-root': {
                  height: { xs: 48, sm: 40 },
                },
              }}
            />

            <TextField
              fullWidth
              id='confirmPassword'
              name='confirmPassword'
              label='Confirm Password'
              type='password'
              placeholder='Re-enter password'
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
              InputProps={{
                startAdornment: <LockClosedIcon className='h-5 w-5 text-gray-400 mr-2' />,
              }}
              size='small'
              sx={{
                '& .MuiInputBase-root': {
                  height: { xs: 48, sm: 40 },
                },
              }}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 2,
              mt: 2,
            }}
          >
            <Button
              variant='outlined'
              onClick={onCancel}
              disabled={isLoading}
              sx={{
                minWidth: 100,
                py: { xs: 1.5, sm: 1 },
              }}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              variant='contained'
              color='primary'
              disabled={isLoading || !formik.isValid}
              sx={{
                minWidth: 150,
                py: { xs: 1.5, sm: 1 },
              }}
            >
              {isLoading ? 'Creating...' : `Create ${isSuperAdmin ? 'Super Admin' : 'Admin'}`}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  )
}

export default CreateAdminForm
