import { apiClient, type ApiResponse } from './ApiClient'

export interface UploadResponse {
  filePath: string
  fileName: string
  originalName: string
  size: number
  mimeType: string
  publicUrl: string
  uploadedAt: Date
}

export interface UploadOptions {
  onUploadProgress?: (progressEvent: ProgressEvent) => void
  fieldName?: string
  additionalData?: Record<string, any>
}

class FtpService {
  /**
   * Upload a single file to the FTP server
   * @param file The file to upload
   * @param options Upload options including progress callback and additional data
   * @returns Promise with upload response
   */
  async uploadFile(file: File, options: UploadOptions = {}): Promise<ApiResponse<UploadResponse>> {
    const formData = new FormData()
    const fieldName = options.fieldName || 'image'

    formData.append(fieldName, file)

    // Append additional data if provided
    if (options.additionalData) {
      Object.entries(options.additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'object' ? JSON.stringify(value) : value)
      })
    }

    return apiClient.uploadFile<UploadResponse>('ftp/upload', formData)
  }

  /**
   * Upload multiple files sequentially using the single file endpoint
   * @param files Array of files to upload
   * @param options Upload options including progress callback and additional data
   * @returns Promise with array of upload responses
   */
  async uploadMultipleFiles(
    files: File[],
    options: UploadOptions = {}
  ): Promise<ApiResponse<UploadResponse[]>> {
    const results: UploadResponse[] = []

    for (const file of files) {
      const response = await this.uploadFile(file, options)

      if (!response.success) {
        // Return the failed response if any upload fails
        return {
          ...response,
          data: undefined,
          error: response.error || `Failed to upload ${file.name}`,
        }
      }

      if (response.data) {
        results.push(response.data)
      }
    }

    return {
      success: true,
      data: results,
      statusCode: 200,
    }
  }

  /**
   * Delete a file from the FTP server
   * @param filePath The path of the file to delete
   * @returns Promise with deletion result
   */
  async deleteFile(filePath: string): Promise<ApiResponse<void>> {
    return apiClient.delete('ftp/delete', {
      data: { filePath },
    })
  }

  /**
   * Helper method to upload shop icon with progress tracking
   */
  async uploadShopIcon(
    shopId: number,
    file: File,
    onProgress?: (progress: ProgressEvent) => void
  ): Promise<ApiResponse<UploadResponse>> {
    return this.uploadFile(file, {
      fieldName: 'shopIcon',
      additionalData: { shopId },
      onUploadProgress: onProgress,
    })
  }

  /**
   * Helper method to upload category icon with progress tracking
   */
  async uploadCategoryIcon(
    categoryId: number,
    file: File,
    onProgress?: (progress: ProgressEvent) => void
  ): Promise<ApiResponse<UploadResponse>> {
    return this.uploadFile(file, {
      fieldName: 'categoryIcon',
      additionalData: { categoryId },
      onUploadProgress: onProgress,
    })
  }
}

// Export a singleton instance
export const ftpService = new FtpService()
