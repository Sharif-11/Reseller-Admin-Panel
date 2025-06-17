import { ErrorMessage, Field, Form, Formik } from 'formik'
import { useState } from 'react'
import { BeatLoader } from 'react-spinners'
import * as Yup from 'yup'
import { authService } from '../Api/auth.api'

const ChangePassword = () => {
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  const validationSchema = Yup.object().shape({
    currentPassword: Yup.string().required('বর্তমান পাসওয়ার্ড প্রয়োজন'),
    newPassword: Yup.string()
      .required('নতুন পাসওয়ার্ড প্রয়োজন')
      .min(6, 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে')
      .notOneOf(
        [Yup.ref('currentPassword')],
        'নতুন পাসওয়ার্ড বর্তমান পাসওয়ার্ডের মতো হতে পারবে না'
      ),
    confirmPassword: Yup.string()
      .required('পাসওয়ার্ড নিশ্চিত করুন')
      .oneOf([Yup.ref('newPassword')], 'পাসওয়ার্ড মেলেনি'),
  })

  const handleSubmit = async (values: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
    try {
      setIsSubmitting(true)
      setSubmitError('')
      setSubmitSuccess('')

      const { success, message } = await authService.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })

      if (success) {
        setSubmitSuccess(message!)
      } else {
        setSubmitError(message || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
      }
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে')
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePasswordVisibility = (field: keyof typeof showPassword) => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  return (
    <div className='max-w-md mx-auto bg-white p-6 rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold text-gray-800 mb-6 text-center'>পাসওয়ার্ড পরিবর্তন</h2>

      {/* Success message */}
      {submitSuccess && (
        <div className='mb-4 p-3 bg-green-100 text-green-700 rounded-md'>{submitSuccess}</div>
      )}

      {/* Error message */}
      {submitError && (
        <div className='mb-4 p-3 bg-red-100 text-red-700 rounded-md'>{submitError}</div>
      )}

      <Formik
        initialValues={{
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {() => (
          <Form className='space-y-4'>
            {/* Current Password */}
            <div>
              <label
                htmlFor='currentPassword'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                বর্তমান পাসওয়ার্ড
              </label>
              <div className='relative'>
                <Field
                  type={showPassword.current ? 'text' : 'password'}
                  name='currentPassword'
                  id='currentPassword'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
                <button
                  type='button'
                  onClick={() => togglePasswordVisibility('current')}
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600'
                >
                  {showPassword.current ? (
                    <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                      />
                    </svg>
                  ) : (
                    <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                      />
                    </svg>
                  )}
                </button>
              </div>
              <ErrorMessage
                name='currentPassword'
                component='div'
                className='text-red-500 text-xs mt-1'
              />
            </div>

            {/* New Password */}
            <div>
              <label htmlFor='newPassword' className='block text-sm font-medium text-gray-700 mb-1'>
                নতুন পাসওয়ার্ড
              </label>
              <div className='relative'>
                <Field
                  type={showPassword.new ? 'text' : 'password'}
                  name='newPassword'
                  id='newPassword'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
                <button
                  type='button'
                  onClick={() => togglePasswordVisibility('new')}
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600'
                >
                  {showPassword.new ? (
                    <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                      />
                    </svg>
                  ) : (
                    <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                      />
                    </svg>
                  )}
                </button>
              </div>
              <ErrorMessage
                name='newPassword'
                component='div'
                className='text-red-500 text-xs mt-1'
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                পাসওয়ার্ড নিশ্চিত করুন
              </label>
              <div className='relative'>
                <Field
                  type={showPassword.confirm ? 'text' : 'password'}
                  name='confirmPassword'
                  id='confirmPassword'
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
                />
                <button
                  type='button'
                  onClick={() => togglePasswordVisibility('confirm')}
                  className='absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600'
                >
                  {showPassword.confirm ? (
                    <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21'
                      />
                    </svg>
                  ) : (
                    <svg className='h-5 w-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                      />
                    </svg>
                  )}
                </button>
              </div>
              <ErrorMessage
                name='confirmPassword'
                component='div'
                className='text-red-500 text-xs mt-1'
              />
            </div>

            {/* Submit Button */}
            <div className='pt-2'>
              <button
                type='submit'
                disabled={isSubmitting}
                className={`w-full py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  isSubmitting
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                } text-white`}
              >
                {isSubmitting ? (
                  <div className='flex items-center justify-center'>
                    <BeatLoader size={8} color='white' className='mr-2' />
                    <span>প্রসেসিং...</span>
                  </div>
                ) : (
                  'পাসওয়ার্ড পরিবর্তন করুন'
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}

export default ChangePassword
