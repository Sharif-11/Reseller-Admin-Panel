import { ErrorMessage, Field, Form, Formik } from 'formik'
import { useEffect, useState } from 'react'
import { FiEdit2, FiUnlock } from 'react-icons/fi' // Import icons from react-icons
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
  const [isPhoneEditable, setIsPhoneEditable] = useState(false)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [userRole, setUserRole] = useState<string>('')

  const validationSchema = Yup.object().shape({
    name: Yup.string().required('নাম প্রয়োজন'),
    email: Yup.string().email('সঠিক ইমেইল ঠিকানা দিন'),
    phone: isPhoneEditable
      ? Yup.string()
          .matches(/^[0-9]+$/, 'ফোন নাম্বার শুধুমাত্র সংখ্যা হতে পারে')
          .min(11, 'ফোন নাম্বার অবশ্যই ১১ ডিজিটের হতে হবে')
          .max(11, 'ফোন নাম্বার অবশ্যই ১১ ডিজিটের হতে হবে')
      : Yup.string(),
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
          setUserRole(data.role)
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
        email: values.email.length === 0 ? null : values.email, // Send null if email is empty
        phoneNo: isPhoneEditable ? values.phone : undefined, // Only send phone if editable
      })

      if (success) {
        setSubmitSuccess(message!)
        setInitialValues({
          ...initialValues,
          name: values.name,
          email: values.email,
          phone: values.phone,
        })
        if (isPhoneEditable) {
          setIsPhoneEditable(false)
        }
      } else {
        setSubmitError(message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।')
      }
    } catch (error: any) {
      setSubmitError(error.response?.data?.message || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে')
    } finally {
      setIsSubmitting(false)
    }
  }

  const togglePhoneEdit = () => {
    if (isPhoneEditable) {
      setIsPhoneEditable(false)
    } else {
      setShowConfirmationModal(true)
    }
  }

  const confirmPhoneEdit = () => {
    setIsPhoneEditable(true)
    setShowConfirmationModal(false)
  }

  const cancelPhoneEdit = () => {
    setShowConfirmationModal(false)
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

      {submitSuccess && (
        <div className='mb-4 p-3 bg-green-100 text-green-700 rounded-md'>{submitSuccess}</div>
      )}

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

            {/* Phone */}
            <div>
              <label htmlFor='phone' className='block text-sm font-medium text-gray-700 mb-1'>
                ফোন নাম্বার
              </label>
              <div className='relative'>
                <Field
                  type='text'
                  name='phone'
                  id='phone'
                  readOnly={!isPhoneEditable}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                    !isPhoneEditable ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                />
                {userRole === 'SuperAdmin' && (
                  <button
                    type='button'
                    onClick={togglePhoneEdit}
                    className={`absolute inset-y-0 right-0 flex items-center pr-3 ${
                      isPhoneEditable ? 'text-indigo-600' : 'text-gray-500'
                    }`}
                  >
                    {isPhoneEditable ? (
                      <FiUnlock className='h-5 w-5' />
                    ) : (
                      <FiEdit2 className='h-5 w-5' />
                    )}
                  </button>
                )}
              </div>
              <ErrorMessage name='phone' component='div' className='text-red-500 text-xs mt-1' />
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

      {/* Confirmation Modal */}
      {showConfirmationModal && (
        <>
          {/* Overlay */}
          <div className='fixed inset-0 bg-black bg-opacity-50 z-40'></div>

          {/* Modal Container */}
          <div className='fixed inset-0 flex items-center justify-center p-4 z-50'>
            <div className='bg-white rounded-lg max-w-sm w-full mx-auto shadow-xl'>
              {/* Modal Content */}
              <div className='p-6'>
                <h3 className='text-lg font-medium text-gray-900 mb-4'>ফোন নাম্বার এডিট করুন?</h3>
                <p className='text-sm text-gray-500 mb-6'>
                  আপনি কি নিশ্চিত যে আপনি ফোন নাম্বার পরিবর্তন করতে চান?
                </p>
                <div className='flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 sm:justify-end'>
                  <button
                    type='button'
                    onClick={cancelPhoneEdit}
                    className='px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  >
                    বাতিল
                  </button>
                  <button
                    type='button'
                    onClick={confirmPhoneEdit}
                    className='px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  >
                    এডিট চালু করুন
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminProfile
