import axiosInstance from '../Axios/axiosInstance'

export const getAllAnnouncements = async () => {
  try {
    const { data } = await axiosInstance.get('announcements')
    const { success, message, statusCode } = data
    const responseData = data?.data
    return {
      success,
      message,
      data: responseData,
      statusCode,
    }
  } catch (error: any) {
    const data = error.response?.data
    const { success, message, statusCode } = data
    const responseData = data?.data
    return {
      success,
      message,
      statusCode,
      data: responseData,
    }
  }
}
export const updateAnnouncements = async (announcements: string[]) => {
  try {
    const { data } = await axiosInstance.put('announcements', { announcements })
    const { success, message, statusCode } = data
    const responseData = data?.data
    return {
      success,
      message,
      data: responseData,
      statusCode,
    }
  } catch (error: any) {
    const data = error.response?.data
    const { success, message, statusCode } = data
    const responseData = data?.data
    return {
      success,
      message,
      statusCode,
      data: responseData,
    }
  }
}
