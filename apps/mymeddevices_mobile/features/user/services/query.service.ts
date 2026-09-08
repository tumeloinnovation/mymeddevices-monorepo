import { customerApi } from "./customer.api";
import { useQuery } from "@tanstack/react-query";
import { queryKeys, CACHE_TIMES } from "@/services/queryKeys";

export const useCustomer = (id: number | string | undefined) => {
  return useQuery({
    queryKey: queryKeys.customer.detail(id!),
    enabled: !!id,
    queryFn: () => customerApi.getCustomer(id),
    ...CACHE_TIMES.DYNAMIC,
  });
};
