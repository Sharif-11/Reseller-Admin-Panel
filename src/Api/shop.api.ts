export interface Shop {
  shopId: number
  shopName: string
  shopLocation: string
  deliveryChargeInside: number
  deliveryChargeOutside: number
  shopDescription?: string
  shopIcon?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  categoryId: number
  name: string
  description?: string
  categoryIcon?: string
  parentId?: number
  subCategories?: Category[]

  createdAt: Date
  updatedAt: Date
}

export interface ShopCategoryAssignment {
  assignmentId: number
  shopId: number
  categoryId: number
  assignedAt: Date
}
import { apiClient, type ApiResponse } from './ApiClient'

class ShopApiService {
  // ==========================================
  // SHOP MANAGEMENT METHODS
  // ==========================================

  // Create a new shop
  async createShop(shopData: {
    shopName: string
    shopLocation: string
    deliveryChargeInside: number
    deliveryChargeOutside: number
    shopDescription?: string
    shopIcon?: string
    isActive?: boolean
  }): Promise<ApiResponse<Shop>> {
    return apiClient.post<Shop>('shops', shopData)
  }

  // Get all shops for admin (with pagination)
  async getAllShopsForAdmin(
    page: number = 1,
    limit: number = 10,
    searchTerm: string = ''
  ): Promise<ApiResponse<{ shops: Shop[]; totalPages: number }>> {
    return apiClient.get<{ shops: Shop[]; totalPages: number }>(
      `shops/admin?page=${page}&limit=${limit}&shopName=${searchTerm}`
    )
  }

  // Get a specific shop by ID
  async getShop(shopId: number): Promise<ApiResponse<Shop>> {
    return apiClient.get<Shop>(`shops/${shopId}`)
  }

  // Get all shops (public endpoint)
  async getAllShops(): Promise<ApiResponse<Shop[]>> {
    return apiClient.get<Shop[]>('shops')
  }

  // Update a shop
  async updateShop(
    shopId: number,
    updateData: {
      shopName?: string
      shopLocation?: string
      deliveryChargeInside?: number
      deliveryChargeOutside?: number
      shopDescription?: string
      shopIcon?: string
      isActive?: boolean
    }
  ): Promise<ApiResponse<Shop>> {
    return apiClient.put<Shop>(`shops/${shopId}`, updateData)
  }
  async openOrCloseShop(shopId: number, isActive: boolean): Promise<ApiResponse<Shop>> {
    return apiClient.patch<Shop>(`shops/${shopId}/status`, { isActive })
  }

  // Get categories for a specific shop
  async getShopCategories(shopId: number): Promise<ApiResponse<Category[]>> {
    return apiClient.get<Category[]>(`shops/${shopId}/categories`)
  }

  // ==========================================
  // CATEGORY MANAGEMENT METHODS
  // ==========================================

  // Create a new category
  async createCategory(categoryData: {
    name: string
    description?: string
    categoryIcon?: string
    isActive?: boolean
    parentId?: number
  }): Promise<ApiResponse<Category>> {
    return apiClient.post<Category>('categories', {
      name: categoryData.name,
      description: categoryData.description,
      categoryIcon: categoryData.categoryIcon,
      isActive: categoryData.isActive,
      parentId: categoryData.parentId,
    })
  }

  // Get a specific category by ID
  async getCategory(categoryId: number): Promise<ApiResponse<Category>> {
    return apiClient.get<Category>(`categories/${categoryId}`)
  }

  // Get all categories
  async getAllCategories({
    page = 1,
    limit = 10,
    searchTerm = '',
    subCategories = false,
  }: {
    page?: number
    limit?: number
    searchTerm?: string
    subCategories?: boolean
  }) {
    return apiClient.get<{
      categories: Category[]
      totalPages: number
      page: number
      total: number
    }>('categories', {
      params: {
        page,
        limit,
        name: searchTerm,
        subCategories,
      },
    })
  }

  // Update a category
  async updateCategory(
    categoryId: number,
    values: {
      name?: string
      description?: string
      categoryIcon?: string
      parentId?: number
    }
  ): Promise<ApiResponse<Category>> {
    return apiClient.put<Category>(`categories/${categoryId}`, values)
  }

  // Delete a category
  async deleteCategory(categoryId: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`categories/${categoryId}`)
  }

  // Get shops by category
  async getShopsByCategory(categoryId: number): Promise<ApiResponse<Shop[]>> {
    return apiClient.get<Shop[]>(`categories/${categoryId}/shops`)
  }

  // ==========================================
  // SHOP-CATEGORY ASSIGNMENT METHODS
  // ==========================================

  // Assign category to a shop
  async assignCategoryToShop(data: {
    shopId: number
    categoryId: number
  }): Promise<ApiResponse<ShopCategoryAssignment>> {
    return apiClient.post<ShopCategoryAssignment>('shop-category', data)
  }

  // Remove category from a shop
  async removeCategoryFromShop(shopId: number, categoryId: number): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(`shop-category/${shopId}/categories/${categoryId}`)
  }
}

// Export a singleton instance
export const shopApiService = new ShopApiService()
