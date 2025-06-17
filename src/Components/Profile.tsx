import { ErrorMessage, Field, Form, Formik } from 'formik'
import { useEffect, useState } from 'react'
import { BeatLoader } from 'react-spinners'
import * as Yup from 'yup'
import { authService } from '../Api/auth.api'

interface ProfileData {
  name: string
  email: string
  phone: string
}

const AdminProfile = () => {
  const [initialValues, setInitialValues] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('নাম প্রয়োজন'),
    email: Yup.string().required('ইমেইল প্রয়োজন').email('সঠিক ইমেইল ঠিকানা দিন'),
  })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true)
        const { success, data } = await authService.profile()

        if (success && data) {
          setInitialValues({
            name: data.name,
            email: data?.email || '',
            phone: data?.phoneNo || '',
          })
        }
      } catch (error) {
        setSubmitError('প্রোফাইল লোড করতে সমস্যা হয়েছে')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSubmit = async (values: ProfileData) => {
    try {
      setIsSubmitting(true)
      setSubmitError('')
      setSubmitSuccess('')

      const { success, message } = await authService.updateProfile({
        name: values.name,
        email: values.email,
      })

      if (success) {
        setSubmitSuccess(message!)
        // Update initial values to reflect changes
        setInitialValues({
          ...initialValues,
          name: values.name,
          email: values.email,
        })
      } else {
        setSubmitError(message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
      }
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className='max-w-md mx-auto bg-white p-6 rounded-lg shadow-md text-center'>
        <BeatLoader size={10} color='#3b82f6' />
        <p className='mt-2 text-gray-600'>প্রোফাইল লোড হচ্ছে...</p>
      </div>
    )
  }

  return (
    <div className='max-w-md mx-auto bg-white p-6 rounded-lg shadow-md'>
      <h2 className='text-2xl font-bold text-gray-800 mb-6 text-center'>প্রোফাইল আপডেট</h2>

      {/* Success message */}
      {submitSuccess && (
        <div className='mb-4 p-3 bg-green-100 text-green-700 rounded-md'>{submitSuccess}</div>
      )}

      {/* Error message */}
      {submitError && (
        <div className='mb-4 p-3 bg-red-100 text-red-700 rounded-md'>{submitError}</div>
      )}

      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {() => (
          <Form className='space-y-4'>
            {/* Name */}
            <div>
              <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-1'>
                নাম
              </label>
              <Field
                type='text'
                name='name'
                id='name'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
              <ErrorMessage name='name' component='div' className='text-red-500 text-xs mt-1' />
            </div>

            {/* Email */}
            <div>
              <label htmlFor='email' className='block text-sm font-medium text-gray-700 mb-1'>
                ইমেইল
              </label>
              <Field
                type='email'
                name='email'
                id='email'
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500'
              />
              <ErrorMessage name='email' component='div' className='text-red-500 text-xs mt-1' />
            </div>

            {/* Phone (read-only) */}
            <div>
              <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-1'>
                ফোন নাম্বার
              </label>
              <Field
                type='text'
                name='phone'
                id='phone'
                readOnly
                className='w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed'
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
                  'প্রোফাইল আপডেট করুন'
                )}
              </button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}

export default AdminProfile
