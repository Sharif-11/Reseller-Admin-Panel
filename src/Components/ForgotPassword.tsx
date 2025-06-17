import { ErrorMessage, Field, Formik } from 'formik'
import { CheckCircle2, Loader2, Phone } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Yup from 'yup'
import { authService } from '../Api/auth.api'

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const validationSchema = Yup.object({
    phone: Yup.string()
      .matches(/^01[3-9]\d{8}$/, 'বৈধ বাংলাদেশী মোবাইল নম্বর দিন (যেমন: 01712345678)')
      .required('মোবাইল নম্বর আবশ্যক'),
  })

  const handleSubmit = async (values: { phone: string }) => {
    setIsLoading(true)
    setError('')
    setSuccess(false)

    try {
      // Call your API endpoint for forgot password
      const { success, message } = await authService.forgotPassword(values.phone)

      if (success) {
        setSuccess(true)
      } else {
        setError(message || 'পাসওয়ার্ড রিসেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
      }
    } catch (err) {
      setError('একটি সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8'>
      <div className='w-full max-w-md bg-white rounded-2xl shadow-xl p-8'>
        <div className='text-center mb-8'>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>পাসওয়ার্ড রিসেট করুন</h1>
          <p className='text-gray-600'>
            আপনার রেজিস্টার্ড মোবাইল নম্বর দিন। আমরা আপনাকে একটি পাসওয়ার্ড রিসেট লিঙ্ক পাঠাবো।
          </p>
        </div>

        {success ? (
          <div className='text-center'>
            <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4'>
              <CheckCircle2 className='h-6 w-6 text-green-600' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>সফলভাবে পাঠানো হয়েছে!</h3>
            <p className='text-sm text-gray-500 mb-6'>
              আপনার মোবাইল নম্বরে একটি পাসওয়ার্ড রিসেট লিঙ্ক পাঠানো হয়েছে। অনুগ্রহ করে চেক করুন।
            </p>
            <button
              onClick={() => navigate('/login')}
              className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
            >
              লগইন পেজে ফিরে যান
            </button>
          </div>
        ) : (
          <Formik
            initialValues={{ phone: '' }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ errors, touched, handleSubmit }) => (
              <form onSubmit={handleSubmit} className='space-y-6'>
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
                    className='mt-2 text-sm text-red-600'
                  />
                </div>

                {error && (
                  <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                    <div className='text-sm text-red-800'>{error}</div>
                  </div>
                )}

                <div className='flex items-center justify-between'>
                  <button
                    type='button'
                    onClick={() => navigate('/login')}
                    className='text-sm text-indigo-600 hover:text-indigo-800 hover:underline focus:outline-none'
                    disabled={isLoading}
                  >
                    লগইন পেজে ফিরে যান
                  </button>

                  <button
                    type='submit'
                    disabled={isLoading}
                    className='flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className='animate-spin -ml-1 mr-3 h-5 w-5' />
                        পাঠানো হচ্ছে...
                      </>
                    ) : (
                      'পাসওয়ার্ড রিসেট করুন'
                    )}
                  </button>
                </div>
              </form>
            )}
          </Formik>
        )}
      </div>
    </div>
  )
}

export default ForgotPassword
