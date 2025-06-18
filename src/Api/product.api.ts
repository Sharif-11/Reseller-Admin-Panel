import { apiClient, type ApiResponse } from './ApiClient'
type Product = {
  name: string
  shopId: number
  description: string
  categoryId: number
  createdAt: Date
  updatedAt: Date
  basePrice: number
  suggestedMaxPrice: number
  productId: number
  published: boolean
  videoUrl: string | null
}
type ProductImage = {
  createdAt: Date
  updatedAt: Date
  productId: number
  imageId: number
  isPrimary: boolean
  hidden: boolean
  imageUrl: string
  featureVector: string | null
}
interface ProductCreateData {
  shopId: number
  categoryId: number
  name: string
  description: string
  basePrice: number
  suggestedMaxPrice: number
}

interface ProductUpdateData {
  shopId?: number
  categoryId?: number
  name?: string
  description?: string
  basePrice?: number
  suggestedMaxPrice?: number
}

interface Variant {
  name: string
  value: string
}

interface ImageData {
  url: string
  isPrimary?: boolean
  hidden?: boolean
}

interface ProductFiltersAdmin {
  search?: string
  minPrice?: number
  maxPrice?: number
  shopId?: number
  categoryId?: number
  published?: boolean
}

interface ProductFiltersCustomer {
  search?: string
  minPrice?: number
  maxPrice?: number
  categoryId: number
}

interface ProductFiltersSeller {
  search?: string
  minPrice?: number
  maxPrice?: number
  categoryId: number
  shopId: number
}

interface Pagination {
  page: number
  limit: number
}

class ProductService {
  // ==========================================
  // PRODUCT CRUD OPERATIONS
  // ==========================================

  async createProduct(data: ProductCreateData): Promise<ApiResponse<Product>> {
    return apiClient.post<Product>('products', data)
  }

  async getProductDetailForAdmin(productId: number): Promise<
    ApiResponse<
      Product & {
        shop: { shopName: string }
        category: { name: string }
        variants: Record<string, string[]>
        images: { imageUrl: string; isPrimary: boolean }[]
      }
    >
  > {
    return apiClient.get(`products/admin/${productId}`)
  }

  async updateProduct(productId: number, data: ProductUpdateData): Promise<ApiResponse<Product>> {
    return apiClient.put(`products/${productId}`, data)
  }

  async togglePublishStatus(productId: number, publish: boolean): Promise<ApiResponse<Product>> {
    return apiClient.patch(`products/${productId}/publish`, { publish })
  }

  // ==========================================
  // VARIANT MANAGEMENT
  // ==========================================

  async getProductVariants(productId: number): Promise<ApiResponse<Record<string, string[]>>> {
    return apiClient.get(`products/${productId}/variants`)
  }

  async replaceVariants(
    productId: number,
    variants: Variant[]
  ): Promise<ApiResponse<{ productId: number; variants: Variant[] }>> {
    return apiClient.put(`products/${productId}/variants`, { variants })
  }

  // ==========================================
  // IMAGE MANAGEMENT
  // ==========================================

  async addImages(productId: number, images: ImageData[]): Promise<ApiResponse<{ count: number }>> {
    return apiClient.post(`products/${productId}/images`, { images })
  }

  async getImages(productId: number): Promise<ApiResponse<ProductImage[]>> {
    return apiClient.get(`products/${productId}/images`)
  }

  async updateImage(
    imageId: number,
    data: { isPrimary?: boolean; hidden?: boolean }
  ): Promise<ApiResponse<ProductImage>> {
    return apiClient.patch(`products/images/${imageId}`, data)
  }

  async deleteImage(imageId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`products/images/${imageId}`)
  }

  async deleteAllImages(productId: number): Promise<ApiResponse<void>> {
    return apiClient.delete(`products/${productId}/images`)
  }

  // ==========================================
  // PRODUCT VIEWS
  // ==========================================

  async getProductDetailForCustomer(productId: number): Promise<
    ApiResponse<{
      product: Omit<Product, 'basePrice' | 'published'> & {
        price: number
        shop: { shopName: string }
        category: { name: string }
        variants: Record<string, string[]>
        images: { imageUrl: string }[]
      }
    }>
  > {
    return apiClient.get(`products/customer/${productId}`)
  }

  async getProductDetailForSeller(productId: number): Promise<
    ApiResponse<{
      product: Product & {
        shop: { shopName: string }
        category: { name: string }
        variants: Record<string, string[]>
        images: { imageUrl: string }[]
      }
    }>
  > {
    return apiClient.get(`products/seller/${productId}`)
  }

  // ==========================================
  // PRODUCT LISTING
  // ==========================================

  async getAllProductsForAdmin(filters: ProductFiltersAdmin, pagination: Pagination) {
    return apiClient.get('products/admin', {
      params: { ...filters, ...pagination },
    })
  }

  async getAllProductsForCustomer(
    filters: ProductFiltersCustomer,
    pagination: Pagination
  ): Promise<
    ApiResponse<{
      data: {
        productId: number
        name: string
        description: string
        price: number
        shop: { shopName: string }
        category: { name: string }
        ProductImage: { imageUrl: string }[]
      }[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>
  > {
    return apiClient.get('products/customer', {
      params: { ...filters, ...pagination },
    })
  }

  async getAllProductsForSeller(
    filters: ProductFiltersSeller,
    pagination: Pagination
  ): Promise<
    ApiResponse<{
      data: (Product & {
        category: { name: string }
        ProductImage: { imageUrl: string }[]
      })[]
      pagination: {
        page: number
        limit: number
        totalCount: number
        totalPages: number
      }
    }>
  > {
    return apiClient.get('products/seller', {
      params: { ...filters, ...pagination },
    })
  }
}

// Export a singleton instance
export const productService = new ProductService()
