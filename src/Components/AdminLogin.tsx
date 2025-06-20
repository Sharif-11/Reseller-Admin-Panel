import { ErrorMessage, Field, Formik } from 'formik'
import { Eye, EyeOff, Loader2, Lock, LogIn, Phone } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import { authService } from '../Api/auth.api'
import logo from '../assets/shopbd_logo.png'
import { useAuth } from '../Hooks/useAuth'

// Validation Schema
const validationSchema = Yup.object({
  phone: Yup.string()
    .matches(/^01[3-9]\d{8}$/, 'বৈধ বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01712345678)')
    .required('মোবাইল নম্বর আবশ্যক'),
  password: Yup.string()
    .min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
    .required('পাসওয়ার্ড আবশ্যক'),
})

const AdminLogin = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const location = useLocation()
  const { user, setUser, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Handle form submission
  const handleSubmit = async (values: { phone: string; password: string }) => {
    setIsLoading(true)
    setLoginError('')

    try {
      const { success, message, data } = await authService.login({
        phoneNo: values.phone,
        password: values.password,
      })

      if (success && data?.token && data?.user) {
        // Store token and update user state
        localStorage.setItem('token', data.token)
        setUser(data.user)

        // Redirect to dashboard
        navigate('/dashboard', { replace: true })
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

  // Redirect if already logged in
  useEffect(() => {
    const f = async () => {
      try {
        const { data, success } = await authService.verifyLogin()
        console.log('Verifying login:', { data, success })
        if (success) {
          setUser(data)

          // Get the previous location from navigation state or default to '/dashboard'
          const from = location.state?.from?.pathname || '/dashboard'
          navigate(from, { replace: true })
        }
      } catch (error) {
        console.error('Error reloading user:', error)
      }
    }
    f()
  }, [user, authLoading, navigate])

  // Show loading state while checking auth status
  if (authLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Loader2 className='animate-spin h-12 w-12 text-indigo-600' />
      </div>
    )
  }
  console.log({ user })
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8'>
      <div className='w-full max-w-md'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='inline-block mb-6'>
            <img src={logo} alt='Logo' className='h-16 w-16 mx-auto rounded-full shadow-lg' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>অ্যাডমিন প্যানেল</h1>
          <p className='text-gray-600'>আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
        </div>

        {/* Login Form */}
        <div className='bg-white rounded-2xl shadow-xl p-8'>
          <Formik
            initialValues={{ phone: '', password: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, handleSubmit }) => (
              <form onSubmit={handleSubmit} className='space-y-6'>
                {/* Phone Number Field */}
                <div>
                  <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-2'>
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
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
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
                    className='mt-2 text-sm text-red-600 flex items-center'
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor='password'
                    className='block text-sm font-medium text-gray-700 mb-2'
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
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
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
                    className='mt-2 text-sm text-red-600 flex items-center'
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
                  <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                    <div className='flex'>
                      <div className='text-sm text-red-800'>{loginError}</div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type='submit'
                  disabled={isLoading}
                  className='w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
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
        </div>

        {/* Footer */}
        <div className='text-center mt-8'>
          <p className='text-sm text-gray-500'>© ২০২৫ অ্যাডমিন প্যানেল। সকল অধিকার সংরক্ষিত।</p>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
