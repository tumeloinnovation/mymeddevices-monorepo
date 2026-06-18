import { apiClient } from '@/lib/services/api-client';

export interface CustomerTicket {
  id: string;
  ticket_number: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  created_at: string;
  updated_at: string;
  last_reply_at: string | null;
}

export interface TicketMessage {
  id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

export interface TicketDetail {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  replies: TicketMessage[];
  attachments: { id: string; file_name: string; file_url: string; file_size: number }[];
}

export interface TicketStats {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
}

export const customerTicketsApi = {
  getMyTickets: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ items: CustomerTicket[]; total: number; page: number; limit: number }>('/tickets/my', { params }),

  getTicket: (id: string) =>
    apiClient.get<TicketDetail>(`/tickets/${id}`),

  create: (data: { subject: string; category: string; description: string; priority?: string }) =>
    apiClient.post<CustomerTicket>('/tickets', data),

  addReply: (ticketId: string, content: string) =>
    apiClient.post<TicketMessage>(`/tickets/${ticketId}/replies`, { content }),

  closeTicket: (ticketId: string) =>
    apiClient.post<{ message: string }>(`/tickets/${ticketId}/close`, {}),

  getStats: () =>
    apiClient.get<TicketStats>('/tickets/stats'),
};
