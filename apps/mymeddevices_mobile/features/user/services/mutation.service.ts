import { customerApi, UpdateCustomerData } from "./customer.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner-native";
import { queryKeys } from "@/services/queryKeys";

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["update-customer"],
    mutationFn: (data: UpdateCustomerData) => customerApi.updateCustomer(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.customer.detail(variables.customerId || "me"),
      });
      toast.success("Profile updated", {
        description: "Your contact details have been saved.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to update profile", {
        description: error?.message || "Please try again.",
      });
    },
  });
};

// Keep old export name for backward compatibility
export const updateCustomerMutation = useUpdateCustomer;
