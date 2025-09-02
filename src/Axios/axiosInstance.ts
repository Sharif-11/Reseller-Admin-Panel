import axios from 'axios'
import { baseURL, localStorageAvailable } from './baseUrl'

const axiosInstance = axios.create({
  baseURL: baseURL, // Replace with your API's base URL
  timeout: 10000, // Optional: Timeout in milliseconds
  withCredentials: true, // Optional: Include credentials in requests (e.g., cookies)
  headers: {
    'Content-Type': 'application/json', // Default headers
  },
})
// request interceptor to inject Authorization header
axiosInstance.interceptors.request.use(config => {
  const token = localStorageAvailable ? localStorage.getItem('token') : null
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default axiosInstance
