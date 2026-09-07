import { useGuestOrderHistoryStore } from "@/features/order/stores/useGuestOrderHistoryStore";
import useSearchHistoryStore from "@/features/search/stores/useSearchStore";
import { useUserStore } from "@/features/user/stores/useUserStore";
import { useNotificationStore } from "@/stores/useNotificationStore";
import { asyncStoragePersister, queryClient } from "@/services/reactQueryClient";
import Storage from "@/services/storage.service";

export const clearLocalAppCache = async (): Promise<void> => {
  try {
    useUserStore.getState().clearUser();
  } catch (error) {
    console.warn("Failed to clear user store:", error);
  }

  try {
    useNotificationStore.getState().clearNotifications();
  } catch (error) {
    console.warn("Failed to clear notification store:", error);
  }

  try {
    useGuestOrderHistoryStore.getState().clearOrders();
  } catch (error) {
    console.warn("Failed to clear guest order history:", error);
  }

  try {
    await useSearchHistoryStore.getState().clearSearchHistory();
  } catch (error) {
    console.warn("Failed to clear search history:", error);
  }

  try {
    queryClient.clear();
  } catch (error) {
    console.warn("Failed to clear query cache:", error);
  }

  try {
    await asyncStoragePersister.removeClient();
  } catch (error) {
    console.warn("Failed to remove persisted query cache:", error);
  }

  try {
    await Storage.clear();
  } catch (error) {
    console.warn("Failed to clear AsyncStorage:", error);
  }
};
