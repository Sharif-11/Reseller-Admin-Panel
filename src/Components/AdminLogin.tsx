import { ErrorMessage, Field, Formik } from 'formik'
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail, Phone, User } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import { authService } from '../Api/auth.api'
import logo from '../assets/shopbd_logo.png'
import { useAuth } from '../Hooks/useAuth'
import Loading from './Loading'

// Validation Schema for Login
const loginValidationSchema = Yup.object({
  phone: Yup.string()
    .matches(/^01[3-9]\d{8}$/, 'বৈধ বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01712345678)')
    .required('মোবাইল নম্বর আবশ্যক'),
  password: Yup.string()
    .min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
    .required('পাসওয়ার্ড আবশ্যক'),
})

// Validation Schema for Super Admin Creation
const superAdminValidationSchema = Yup.object({
  name: Yup.string().required('নাম আবশ্যক'),
  phone: Yup.string()
    .matches(/^01[3-9]\d{8}$/, 'বৈধ বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01712345678)')
    .required('মোবাইল নম্বর আবশ্যক'),
  email: Yup.string().email('বৈধ ইমেইল দিন').optional(),
  password: Yup.string()
    .min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
    .max(16, 'পাসওয়ার্ড সর্বোচ্চ ১৬ অক্ষরের হতে হবে')
    .required('পাসওয়ার্ড আবশ্যক'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'পাসওয়ার্ড মেলেনি')
    .required('পাসওয়ার্ড নিশ্চিত করুন'),
})

const AdminLogin = () => {
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [hasSuperAdmin, setHasSuperAdmin] = useState<boolean | null>(true) // null means not checked yet
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true)

  const { setUser } = useAuth()
  const navigate = useNavigate()
  useEffect(() => {
    const checkLogin = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          const result = await authService.verifyLogin()
          if (result?.success) {
            setUser(result.data || null)
            //please navigate to the route from where the user came
            // If user is already logged in, redirect to dashboard
            const from = (location.state as any)?.from || '/dashboard'

            navigate(from)
          }
        } catch (error) {
          console.error('Login verification failed:', error)
          localStorage.removeItem('token') // Clear token on error
        }
      }
    }
    checkLogin()
  }, [])

  // Check if super admin exists
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        setIsCheckingAdmin(true)
        const { success, data } = await authService.checkSuperAdminExists()
        if (success && !data?.exists) {
          setHasSuperAdmin(false)
        }
      } catch (error) {
        console.error('Error checking super admin:', error)
        setHasSuperAdmin(true) // Fallback to login form
      } finally {
        setIsCheckingAdmin(false)
      }
    }
    checkSuperAdmin()
  }, [])

  // Handle login submission
  const handleLoginSubmit = async (values: { phone: string; password: string }) => {
    setIsLoading(true)
    setLoginError('')

    try {
      const { success, message, data } = await authService.login({
        phoneNo: values.phone,
        password: values.password,
      })

      if (success && data?.token && data?.user) {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        navigate('/dashboard')
      } else {
        setLoginError(message || 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setLoginError(error.response?.data?.message || 'লগইন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle super admin creation
  const handleSuperAdminSubmit = async (values: {
    name: string
    phone: string
    email?: string
    password: string
  }) => {
    setIsLoading(true)
    setLoginError('')

    try {
      const { success, message } = await authService.createFirstSuperAdmin({
        name: values.name,
        phoneNo: values.phone,
        email: values.email,
        password: values.password,
      })

      if (success) {
        // After successful creation, automatically log the user in
        const loginResponse = await authService.login({
          phoneNo: values.phone,
          password: values.password,
        })

        if (loginResponse.success && loginResponse.data?.token && loginResponse.data?.user) {
          localStorage.setItem('token', loginResponse.data.token)
          setUser(loginResponse.data.user)
          navigate('/dashboard')
        }
      } else {
        setLoginError(message || 'সুপার অ্যাডমিন তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
      }
    } catch (error: any) {
      console.error('Super admin creation error:', error)
      setLoginError(
        error.response?.data?.message || 'সুপার অ্যাডমিন তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking for super admin
  if (isCheckingAdmin) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
        <Loading />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex  justify-center px-4 py-8'>
      <div className='w-full max-w-md mx-4'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='inline-block mb-6'>
            <img src={logo} alt='Logo' className='h-16 w-16 mx-auto rounded-full shadow-lg' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            {hasSuperAdmin ? 'অ্যাডমিন লগইন' : 'সুপার অ্যাডমিন তৈরি করুন'}
          </h1>
          <p className='text-gray-600'>
            {hasSuperAdmin
              ? 'আপনার অ্যাকাউন্টে প্রবেশ করুন'
              : 'প্রথম সুপার অ্যাডমিন অ্যাকাউন্ট তৈরি করুন'}
          </p>
        </div>

        {/* Login Form or Super Admin Creation Form */}
        <div className='bg-white rounded-2xl shadow-xl p-6 sm:p-8'>
          {hasSuperAdmin ? (
            // Login Form
            <Formik
              initialValues={{ phone: '', password: '' }}
              validationSchema={loginValidationSchema}
              onSubmit={handleLoginSubmit}
            >
              {({ errors, touched, handleSubmit }) => (
                <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-6'>
                  {/* Phone Number Field */}
                  <div>
                    <label
                      htmlFor='phone'
                      className='block text-sm font-medium text-gray-700 mb-1 sm:mb-2'
                    >
                      মোবাইল নম্বর
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <Phone className='h-5 w-5 text-gray-400' />
                      </div>
                      <Field
                        id='phone'
                        name='phone'
                        type='tel'
                        placeholder='01712345678'
                        className={`w-full pl-10 pr-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.phone && touched.phone
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white'
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    <ErrorMessage
                      name='phone'
                      component='div'
                      className='mt-1 text-sm text-red-600 flex items-center'
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label
                      htmlFor='password'
                      className='block text-sm font-medium text-gray-700 mb-1 sm:mb-2'
                    >
                      পাসওয়ার্ড
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <Lock className='h-5 w-5 text-gray-400' />
                      </div>
                      <Field
                        id='password'
                        name='password'
                        type={showPassword ? 'text' : 'password'}
                        placeholder='আপনার পাসওয়ার্ড'
                        className={`w-full pl-10 pr-12 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.password && touched.password
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white'
                        }`}
                        disabled={isLoading}
                      />
                      <button
                        type='button'
                        className='absolute inset-y-0 right-0 pr-3 flex items-center'
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                        ) : (
                          <Eye className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                        )}
                      </button>
                    </div>
                    <ErrorMessage
                      name='password'
                      component='div'
                      className='mt-1 text-sm text-red-600 flex items-center'
                    />
                  </div>

                  {/* Forgot Password Link */}
                  <div className='flex justify-end'>
                    <button
                      type='button'
                      onClick={() => navigate('/forgot-password')}
                      className='text-sm text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none'
                      disabled={isLoading}
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  </div>

                  {/* Login Error */}
                  {loginError && (
                    <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                      <div className='flex'>
                        <div className='text-sm text-red-800'>{loginError}</div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type='submit'
                    disabled={isLoading}
                    className='w-full flex justify-center items-center py-2 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className='animate-spin -ml-1 mr-3 h-5 w-5' />
                        লগইন হচ্ছে...
                      </>
                    ) : (
                      <>
                        <LogIn className='w-5 h-5 mr-2' />
                        লগইন করুন
                      </>
                    )}
                  </button>
                </form>
              )}
            </Formik>
          ) : (
            // Super Admin Creation Form
            <Formik
              initialValues={{
                name: '',
                phone: '',
                email: '',
                password: '',
                confirmPassword: '',
              }}
              validationSchema={superAdminValidationSchema}
              onSubmit={handleSuperAdminSubmit}
            >
              {({ errors, touched, handleSubmit }) => (
                <form onSubmit={handleSubmit} className='space-y-4 sm:space-y-6'>
                  {/* Name Field */}
                  <div>
                    <label
                      htmlFor='name'
                      className='block text-sm font-medium text-gray-700 mb-1 sm:mb-2'
                    >
                      নাম
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <User className='h-5 w-5 text-gray-400' />
                      </div>
                      <Field
                        id='name'
                        name='name'
                        type='text'
                        placeholder='আপনার নাম'
                        className={`w-full pl-10 pr-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.name && touched.name
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white'
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    <ErrorMessage
                      name='name'
                      component='div'
                      className='mt-1 text-sm text-red-600 flex items-center'
                    />
                  </div>

                  {/* Phone Number Field */}
                  <div>
                    <label
                      htmlFor='phone'
                      className='block text-sm font-medium text-gray-700 mb-1 sm:mb-2'
                    >
                      মোবাইল নম্বর
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <Phone className='h-5 w-5 text-gray-400' />
                      </div>
                      <Field
                        id='phone'
                        name='phone'
                        type='tel'
                        placeholder='01712345678'
                        className={`w-full pl-10 pr-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.phone && touched.phone
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white'
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    <ErrorMessage
                      name='phone'
                      component='div'
                      className='mt-1 text-sm text-red-600 flex items-center'
                    />
                  </div>

                  {/* Email Field (Optional) */}
                  <div>
                    <label
                      htmlFor='email'
                      className='block text-sm font-medium text-gray-700 mb-1 sm:mb-2'
                    >
                      ইমেইল (ঐচ্ছিক)
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <Mail className='h-5 w-5 text-gray-400' />
                      </div>
                      <Field
                        id='email'
                        name='email'
                        type='email'
                        placeholder='আপনার ইমেইল'
                        className={`w-full pl-10 pr-4 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.email && touched.email
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white'
                        }`}
                        disabled={isLoading}
                      />
                    </div>
                    <ErrorMessage
                      name='email'
                      component='div'
                      className='mt-1 text-sm text-red-600 flex items-center'
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label
                      htmlFor='password'
                      className='block text-sm font-medium text-gray-700 mb-1 sm:mb-2'
                    >
                      পাসওয়ার্ড
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <Lock className='h-5 w-5 text-gray-400' />
                      </div>
                      <Field
                        id='password'
                        name='password'
                        type={showPassword ? 'text' : 'password'}
                        placeholder='পাসওয়ার্ড (৬-১৬ অক্ষর)'
                        className={`w-full pl-10 pr-12 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.password && touched.password
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white'
                        }`}
                        disabled={isLoading}
                      />
                      <button
                        type='button'
                        className='absolute inset-y-0 right-0 pr-3 flex items-center'
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                        ) : (
                          <Eye className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                        )}
                      </button>
                    </div>
                    <ErrorMessage
                      name='password'
                      component='div'
                      className='mt-1 text-sm text-red-600 flex items-center'
                    />
                  </div>

                  {/* Confirm Password Field */}
                  <div>
                    <label
                      htmlFor='confirmPassword'
                      className='block text-sm font-medium text-gray-700 mb-1 sm:mb-2'
                    >
                      পাসওয়ার্ড নিশ্চিত করুন
                    </label>
                    <div className='relative'>
                      <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                        <Lock className='h-5 w-5 text-gray-400' />
                      </div>
                      <Field
                        id='confirmPassword'
                        name='confirmPassword'
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder='পাসওয়ার্ড নিশ্চিত করুন'
                        className={`w-full pl-10 pr-12 py-2 sm:py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.confirmPassword && touched.confirmPassword
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-300 bg-white'
                        }`}
                        disabled={isLoading}
                      />
                      <button
                        type='button'
                        className='absolute inset-y-0 right-0 pr-3 flex items-center'
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                        ) : (
                          <Eye className='h-5 w-5 text-gray-400 hover:text-gray-600' />
                        )}
                      </button>
                    </div>
                    <ErrorMessage
                      name='confirmPassword'
                      component='div'
                      className='mt-1 text-sm text-red-600 flex items-center'
                    />
                  </div>

                  {/* Error Message */}
                  {loginError && (
                    <div className='bg-red-50 border border-red-200 rounded-lg p-3'>
                      <div className='flex'>
                        <div className='text-sm text-red-800'>{loginError}</div>
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type='submit'
                    disabled={isLoading}
                    className='w-full flex justify-center items-center py-2 sm:py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className='animate-spin -ml-1 mr-3 h-5 w-5' />
                        তৈরি করা হচ্ছে...
                      </>
                    ) : (
                      <>
                        <User className='w-5 h-5 mr-2' />
                        সুপার অ্যাডমিন তৈরি করুন
                      </>
                    )}
                  </button>
                </form>
              )}
            </Formik>
          )}
        </div>

        {/* Footer */}
        <div className='text-center mt-6'>
          <p className='text-xs sm:text-sm text-gray-500'>
            © ২০২৫ অ্যাডমিন প্যানেল। সকল অধিকার সংরক্ষিত।
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
