import { api } from "@/services/api.client";

export interface TicketMessage {
  id: string;
  sender_id: string;
  sender_name?: string;
  sender_role?: string;
  message: string;
  attachments?: string[];
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number?: string;
  subject: string;
  category?: string;
  priority: "low" | "medium" | "high" | "urgent" | string;
  status: "open" | "in_progress" | "resolved" | "closed" | string;
  customer_id: string;
  customer_name?: string;
  created_at: string;
  updated_at: string;
  messages?: TicketMessage[];
}

export interface CreateTicketParams {
  subject: string;
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent" | string;
  message: string;
  order_id?: string;
}

export interface ReplyTicketParams {
  message: string;
  attachments?: string[];
}

export const ticketsApi = {
  /**
   * List customer's support tickets
   */
  getTickets: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<SupportTicket[]> => {
    try {
      const response = await api.get<{ data: any }>("/tickets", { params });
      const data = response.data?.data || response.data;
      return data?.items || (Array.isArray(data) ? data : []);
    } catch {
      return [];
    }
  },

  /**
   * Create a new support ticket
   */
  createTicket: async (params: CreateTicketParams): Promise<SupportTicket> => {
    const response = await api.post("/tickets", params);
    return response.data?.data || response.data;
  },

  /**
   * View ticket thread and staff responses
   */
  getTicket: async (ticketId: string): Promise<SupportTicket> => {
    const response = await api.get(`/tickets/${ticketId}`);
    return response.data?.data || response.data;
  },

  /**
   * Reply to an ongoing support ticket
   */
  replyTicket: async (
    ticketId: string,
    params: ReplyTicketParams
  ): Promise<TicketMessage> => {
    const response = await api.post(`/tickets/${ticketId}/replies`, params);
    return response.data?.data || response.data;
  },
};

export default ticketsApi;
