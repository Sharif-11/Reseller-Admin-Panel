import axios from 'axios'
import { baseURL } from './baseUrl'

const axiosInstance = axios.create({
  baseURL: baseURL, // Replace with your API's base URL
  timeout: 10000, // Optional: Timeout in milliseconds
  withCredentials: true, // Optional: Include credentials in requests (e.g., cookies)
  headers: {
    'Content-Type': 'application/json', // Default headers
  },
})

export default axiosInstance
