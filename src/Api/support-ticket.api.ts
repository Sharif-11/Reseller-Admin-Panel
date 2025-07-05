// Api/support-ticket.api.ts
import { apiClient, type ApiResponse } from './ApiClient'
import { ftpService } from './ftp.api'

export type SupportTicket = {
  ticketId: string
  subject: string
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_RESPONSE' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  category: 'ACCOUNT' | 'PAYMENT' | 'ORDER' | 'PRODUCT' | 'WITHDRAWAL' | 'TECHNICAL' | 'OTHER'
  userId: string
  userType: 'SELLER' | 'SYSTEM'
  userName: string
  userPhone: string
  userEmail?: string
  shopName?: string
  orderId?: string
  paymentId?: string
  productId?: string
  createdAt: Date
  updatedAt: Date
  closedAt?: Date
  closedBy?: string
}

export type TicketMessage = {
  messageId: string
  ticketId: string
  senderId: string
  senderType: 'SELLER' | 'ADMIN' | 'SYSTEM'
  senderName: string
  senderEmail?: string
  content: string
  attachments: string[]
  isRead: boolean
  createdAt: Date
  parentId?: string
}

export type PaginatedTickets = {
  tickets: SupportTicket[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type TicketWithMessages = SupportTicket & {
  messages: TicketMessage[]
}

class SupportTicketApi {
  public async createTicket(
    data: {
      subject: string
      category: string
      priority?: string
      message: string
      orderId?: string
      paymentId?: string
      productId?: string
    },
    files: File[] = []
  ): Promise<ApiResponse<SupportTicket>> {
    try {
      // First upload all files if any
      let attachmentUrls: string[] = []

      if (files.length > 0) {
        const uploadResponse = await this.uploadAttachments(files)
        if (!uploadResponse.success) {
          return {
            success: false,
            error: uploadResponse.error || 'Failed to upload attachments',
            statusCode: uploadResponse.statusCode || 500,
          }
        }
        attachmentUrls = uploadResponse.data || []
      }

      // Then create the ticket with the attachment URLs
      return apiClient.post<SupportTicket>('support-tickets', {
        ...data,
        attachmentUrls,
      })
    } catch (error) {
      console.error('Error creating ticket:', error)
      return {
        success: false,
        error: 'Failed to create ticket',
        statusCode: 500,
      }
    }
  }

  private async uploadAttachments(files: File[]): Promise<ApiResponse<string[]>> {
    try {
      const uploadPromises = files.map(file =>
        ftpService.uploadFile(file, {
          fieldName: 'supportAttachment',
          additionalData: { type: 'SUPPORT_TICKET' },
        })
      )

      const results = await Promise.all(uploadPromises)
      const failedUpload = results.find(result => !result.success)

      if (failedUpload) {
        return {
          success: false,
          error: failedUpload.error || 'One or more files failed to upload',
          statusCode: failedUpload.statusCode || 500,
        }
      }

      const urls = results
        .filter(result => result.success && result.data)
        .map(result => result.data!.publicUrl)

      return {
        success: true,
        data: urls,
        statusCode: 200,
      }
    } catch (error) {
      console.error('Error uploading attachments:', error)
      return {
        success: false,
        error: 'Error uploading attachments',
        statusCode: 500,
      }
    }
  }

  public async replyToTicket(
    ticketId: string,
    message: string,
    files: File[] = [],
    isAdmin: boolean = false
  ) {
    try {
      let attachmentUrls: string[] = []

      if (files.length > 0) {
        const uploadResponse = await this.uploadAttachments(files)
        if (!uploadResponse.success) {
          return {
            success: false,
            error: uploadResponse.error || 'Failed to upload attachments',
            statusCode: uploadResponse.statusCode || 500,
          }
        }
        attachmentUrls = uploadResponse.data || []
      }

      const endpoint = isAdmin ? 'support-tickets/admin/reply' : 'support-tickets/reply'
      return apiClient.post(endpoint, {
        ticketId,
        message,
        attachmentUrls,
      })
    } catch (error) {
      console.error('Error replying to ticket:', error)
      return {
        success: false,
        error: 'Failed to reply to ticket',
        statusCode: 500,
      }
    }
  }

  public async closeTicket(ticketId: string): Promise<ApiResponse<SupportTicket>> {
    return apiClient.post<SupportTicket>(`support-tickets/admin/close/${ticketId}`)
  }

  public async getTicketDetails(ticketId: string) {
    return apiClient.get(`support-tickets/${ticketId}`)
  }

  public async getUserTickets(params?: {
    status?: string | string[]
    page?: number
    limit?: number
    search?: string
  }): Promise<ApiResponse<PaginatedTickets>> {
    return apiClient.get<PaginatedTickets>('support-tickets/user', { params })
  }

  public async getAllTickets(params?: {
    status?: string | string[]
    page?: number
    limit?: number
    search?: string
    priority?: string | string[]
    category?: string | string[]
  }): Promise<ApiResponse<PaginatedTickets>> {
    return apiClient.get<PaginatedTickets>('support-tickets/admin/all', { params })
  }
}

export default new SupportTicketApi()
