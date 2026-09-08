import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 5 * 60 * 1000, // 5 minutes in milliseconds
      staleTime: 1 * 60 * 1000, // 1 minute in milliseconds
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

export const persistOptions = {
  persister: asyncStoragePersister,
  dehydrateOptions: {
    shouldDehydrateQuery: (query: any) => {
      // Only dehydrate queries that have successfully finished fetching
      // and are currently idle. This prevents the "dehydrated as pending"
      // error which occurs when a query is persisted while in flight.
      return query.state.status === "success" && query.state.fetchStatus === "idle";
    },
    // Also avoid dehydrating pending mutations
    shouldDehydrateMutation: (mutation: any) => {
      return mutation.state.status === "success";
    },
  },
};
