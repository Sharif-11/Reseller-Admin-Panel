import { apiClient, type ApiResponse } from './ApiClient'

export interface Config {
  id: string
  type: string
  content: Record<string, any>
  version: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface FeatureCheckResponse {
  enabled: boolean
}

class ConfigApiService {
  /**
   * Create or update a config
   */
  async upsertConfig(type: string, content: Record<string, any>): Promise<ApiResponse<Config>> {
    return apiClient.post<Config>('configs', { type, content })
  }

  /**
   * Toggle config active status
   */
  async toggleConfig(type: string): Promise<ApiResponse<Config>> {
    return apiClient.patch<Config>(`configs/toggle/${type}`)
  }

  /**
   * Check if a feature is enabled
   */
  async checkFeature(type: string, feature: string): Promise<ApiResponse<FeatureCheckResponse>> {
    return apiClient.get<FeatureCheckResponse>(`configs/feature/${type}/${feature}`)
  }

  /**
   * Get all configs
   */
  async getAllConfigs(): Promise<ApiResponse<Config[]>> {
    return apiClient.get<Config[]>('configs')
  }

  /**
   * Get specific config by type
   */
  async getConfig(type: string): Promise<ApiResponse<Config>> {
    return apiClient.get<Config>(`configs/${type}`)
  }
}

// Export a singleton instance
export const configApiService = new ConfigApiService()
