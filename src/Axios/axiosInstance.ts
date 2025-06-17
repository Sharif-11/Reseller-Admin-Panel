import axios from 'axios'
import { baseURL } from './baseUrl'

const axiosInstance = axios.create({
  baseURL: baseURL, // Replace with your API's base URL
  timeout: 10000, // Optional: Timeout in milliseconds
  headers: {
    'Content-Type': 'application/json', // Default headers
    Authorization: `Bearer ${localStorage.getItem('token')}`, // Example: Attach token from localStorage
  },
})

// Optional: Adding request interceptors
axiosInstance.interceptors.request.use(
  config => {
    // Modify the request (e.g., add authorization header dynamically)
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    // Handle request error
    return Promise.reject(error)
  }
)

// Optional: Adding response interceptors
// axiosInstance.interceptors.response.use(
//   (response) => {
//     // Handle response data
//     return response;
//   },
//   (error) => {
//     // Handle response error
//     if (error.response && error.response.status === 401) {
//       // Example: Redirect to login on unauthorized access
//       console.error("Unauthorized! Redirecting to login...");
//     }
//     return Promise.reject(error);
//   }
// );

export default axiosInstance
