import { orderApi } from "./order.api";
import { OrderQueryParams } from "@/types/api";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { queryKeys, CACHE_TIMES } from "@/services/queryKeys";

interface HistoryOrderOptions {
  enabled?: boolean;
}

export const useHistoryOrder = (
  params: OrderQueryParams,
  options?: HistoryOrderOptions
) => {
  const baseEnabled = options?.enabled ?? true;
  const isReady = Boolean(params.customer);

  return useInfiniteQuery({
    queryKey: queryKeys.orders.list(params),
    enabled: baseEnabled && isReady,
    queryFn: ({ pageParam = 1 }) =>
      orderApi.getOrders({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, pages) =>
      Array.isArray(lastPage) && lastPage.length ? pages.length + 1 : undefined,
    select: (data) => {
      const orders = Array.isArray(data?.pages) ? data.pages.flat() : [];
      const filteredOrders = params.status
        ? orders.filter((order) => {
            const requestedStatuses = params.status!.split(",").map((s) => s.trim().toLowerCase());
            const currentStatus = (order?.status || "").toLowerCase();
            return requestedStatuses.includes(currentStatus);
          })
        : orders;

      const parentOrders = filteredOrders.filter((order) => !order?.parent_id || order.parent_id === 0);
      const childOrders = filteredOrders.filter((order) => order?.parent_id && order.parent_id !== 0);

      return parentOrders.map((parent) => ({
        ...parent,
        children: childOrders.filter((child) => child.parent_id === parent.id),
      }));
    },
    ...CACHE_TIMES.DYNAMIC,
  });
};

export const useGuestOrderHistory = (params: { phone: string }) => {
  return useQuery({
    queryKey: queryKeys.orders.guest(params.phone),
    enabled: !!params.phone,
    queryFn: () => orderApi.getGuestOrders(params.phone),
    ...CACHE_TIMES.DYNAMIC,
  });
};

export const useMyAllOrders = (
  userId?: string | number,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ["orders", "my-all-orders", userId],
    enabled: Boolean(userId) && (options?.enabled ?? true),
    queryFn: () => orderApi.getOrders({ per_page: 100 }),
    ...CACHE_TIMES.DYNAMIC,
  });
};
