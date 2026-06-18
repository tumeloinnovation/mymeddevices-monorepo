import { apiClient } from '@mymeddevices/core/lib/services/api-client';
import { toast } from 'sonner';

// ============================================================================
// Types
// ============================================================================

export interface Ticket {
  id: string;
  ticket_number: string;
  customer_id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assigned_to?: string;
  assignee_name?: string;
  resolution?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
  last_reply_at?: string;
  reply_count: number;
}

export interface TicketDetail extends Ticket {
  replies: TicketReply[];
}

export interface TicketReply {
  id: string;
  user_id: string;
  content: string;
  is_internal: string;
  created_at: string;
  user_name?: string;
  user_role?: string;
}

export interface TicketListResponse {
  items: Ticket[];
  total: number;
  page: number;
  limit: number;
}

export interface TicketCreate {
  subject: string;
  description: string;
  category?: string;
  priority?: string;
}

export interface TicketReplyCreate {
  content: string;
}

// ============================================================================
// Tickets API
// ============================================================================

export const customerTicketsApi = {
  /**
   * Get my tickets
   */
  async getMyTickets(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  } = {}): Promise<TicketListResponse> {
    try {
      const response = await apiClient.get<any>('/tickets', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          status: params.status,
          search: params.search,
        },
      });

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
      throw error;
    }
  },

  /**
   * Get ticket details
   */
  async getTicket(ticketId: string): Promise<TicketDetail> {
    try {
      const response = await apiClient.get<any>(`/tickets/${ticketId}`);

      if (response && response.data) {
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to fetch ticket ${ticketId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new ticket
   */
  async create(ticket: TicketCreate): Promise<Ticket> {
    try {
      const response = await apiClient.post<any>('/tickets', ticket);

      if (response && response.data) {
        toast.success('Support ticket created successfully');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error('Failed to create ticket:', error);
      toast.error('Failed to create support ticket');
      throw error;
    }
  },

  /**
   * Add reply to ticket
   */
  async addReply(ticketId: string, content: string): Promise<TicketReply> {
    try {
      const response = await apiClient.post<any>(`/tickets/${ticketId}/replies`, {
        content,
        is_internal: 'no',
      });

      if (response && response.data) {
        toast.success('Reply added successfully');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to add reply to ticket ${ticketId}:`, error);
      toast.error('Failed to add reply');
      throw error;
    }
  },

  /**
   * Close ticket
   */
  async closeTicket(ticketId: string): Promise<Ticket> {
    try {
      const response = await apiClient.post<any>(`/tickets/${ticketId}/close`);

      if (response && response.data) {
        toast.success('Ticket closed successfully');
        return response.data;
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to close ticket ${ticketId}:`, error);
      toast.error('Failed to close ticket');
      throw error;
    }
  },
};
