import { api } from "@/services/api.client";

export type BackendNotification = {
  id: string;
  notification_type: string;
  title: string;
  body: string;
  data: {
    order_id?: string;
    order_number?: number | string;
    status?: string;
    tracking_number?: string | null;
  };
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

export const backendNotificationApi = {
  list: async (unreadOnly = false): Promise<BackendNotification[]> => {
    try {
      const response = await api.get<{
        success: boolean;
        data: BackendNotification[];
      }>("/notifications/my", {
        params: { unread_only: unreadOnly },
      });
      return response.data.data ?? [];
    } catch {
      try {
        const fallback = await api.get<{
          success: boolean;
          data: BackendNotification[];
        }>("/notifications", {
          params: { unread_only: unreadOnly },
        });
        return fallback.data.data ?? [];
      } catch {
        return [];
      }
    }
  },
  unreadCount: async (): Promise<number> => {
    try {
      const response = await api.get<{
        success: boolean;
        data: { count: number };
      }>("/notifications/unread-count");
      return response.data.data?.count ?? 0;
    } catch {
      return 0;
    }
  },
  markRead: async (ids?: string[]): Promise<void> => {
    try {
      await api.post("/notifications/read", ids ?? null);
    } catch {
      // Fallback
    }
  },
  markSingleRead: async (id: string): Promise<void> => {
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {
      await api.post("/notifications/read", [id]);
    }
  },
};

export default backendNotificationApi;

