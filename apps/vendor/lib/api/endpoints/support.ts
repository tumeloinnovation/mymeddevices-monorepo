import { apiClient } from '../client';
import type { 
  SupportTicket, 
  SupportTicketDetail, 
  TicketListParams, 
  PaginatedResponse, 
  NotificationSettings 
} from '../types';

export const supportApi = {
  getTickets: async (params: TicketListParams) => {
    return await apiClient.get<PaginatedResponse<SupportTicket>>('/vendor/support/tickets', { params: params as any });
  },

  getTicket: async (id: string) => {
    return await apiClient.get<SupportTicketDetail>(`/vendor/support/tickets/${id}`);
  },

  createTicket: async (data: { subject: string; category: string; message: string }) => {
    return await apiClient.post<SupportTicket>('/vendor/support/tickets', data);
  },

  replyToTicket: async (id: string, message: string) => {
    const response = await apiClient.post(`/vendor/orders/${id}/replies`, { message }) as any;
    return response.success;
  },

  getNotificationSettings: async () => {
    return await apiClient.get<NotificationSettings>('/vendor/settings/notifications');
  },

  updateNotificationSettings: async (settings: NotificationSettings) => {
    return await apiClient.patch<NotificationSettings>('/vendor/settings/notifications', settings);
  },
};
