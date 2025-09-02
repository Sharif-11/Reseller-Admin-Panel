import type {
  AxiosError,
  AxiosInstance,
  AxiosProgressEvent,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import axios from 'axios'
import { baseURL, localStorageAvailable } from '../Axios/baseUrl'

export type ApiResponse<T = any> = {
  success: boolean
  message?: string
  statusCode?: number
  data?: T
  error?: any
  response?: any
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export type UploadProgressHandler = (progressEvent: AxiosProgressEvent) => void

class ApiClient {
  private instance: AxiosInstance
  private static _instance: ApiClient

  private constructor(baseURL: string, config?: AxiosRequestConfig) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
      withCredentials: true,
      headers: {
        Accept: 'application/json',
      },
      ...config,
    })
    this.instance.interceptors.request.use(config => {
      const token = localStorageAvailable ? localStorage.getItem('token') : null
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // this.setupInterceptors()
  }

  public static getInstance(baseURL: string, config?: AxiosRequestConfig): ApiClient {
    if (!ApiClient._instance) {
      ApiClient._instance = new ApiClient(baseURL, config)
    }
    return ApiClient._instance
  }

  // Standard HTTP methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('get', url, undefined, config)
  }

  public async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('post', url, data, config)
  }

  public async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('put', url, data, config)
  }

  public async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>('patch', url, data, config)
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>('delete', url, undefined, config)
  }

  // File upload specific method
  public async uploadFile<T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: UploadProgressHandler | undefined,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const uploadConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    }

    return this.request<T>('post', url, formData, uploadConfig)
  }

  // Alternative: Post method that automatically handles FormData
  public async postWithFileSupport<T = any>(
    url: string,
    data?: any,
    onUploadProgress?: UploadProgressHandler,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    const finalConfig: AxiosRequestConfig = {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json',
      },
    }

    if (data instanceof FormData && onUploadProgress) {
      finalConfig.onUploadProgress = onUploadProgress
    }

    return this.request<T>('post', url, data, finalConfig)
  }

  private async request<T = any>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.request<T>({
        method,
        url,
        data,
        ...config,
      })

      return this.formatSuccessResponse<T>(response)
    } catch (error) {
      return this.formatErrorResponse<T>(error as AxiosError)
    }
  }

  private formatSuccessResponse<T = any>(response: AxiosResponse): ApiResponse<T> {
    const responseData = response.data
    const directData = responseData?.data !== undefined ? responseData.data : responseData

    return {
      success: true,
      statusCode: response.status,
      message: responseData?.message,
      data: directData as T,
      response: responseData,
    }
  }

  private formatErrorResponse<T = any>(error: AxiosError): ApiResponse<T> {
    if (error.response) {
      const responseData = error.response.data as any
      const errorData = responseData?.data !== undefined ? responseData.data : responseData

      return {
        success: false,
        statusCode: error.response.status,
        message: responseData?.message || error.message,
        data: errorData,
        error: responseData?.error || responseData,
        response: responseData,
      }
    } else if (error.request) {
      return {
        success: false,
        statusCode: 503,
        message: 'No response received from server',
        error: error.request,
      }
    } else {
      return {
        success: false,
        statusCode: 500,
        message: error.message,
        error: error,
      }
    }
  }
}

const apiClient = ApiClient.getInstance(baseURL)

export { ApiClient, apiClient }
