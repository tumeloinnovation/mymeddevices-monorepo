'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  customerPaymentMethodsApi,
  type PaymentMethod,
  type MpesaPaymentMethodCreate,
  type CardPaymentMethodCreate,
  type BankPaymentMethodCreate,
} from '@/lib/api/endpoints/payment-methods';

export const paymentMethodsKeys = {
  all: ['payment-methods'] as const,
  lists: () => [...paymentMethodsKeys.all, 'list'] as const,
  list: (filters: any) => [...paymentMethodsKeys.lists(), filters] as const,
  details: () => [...paymentMethodsKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentMethodsKeys.details(), id] as const,
  default: () => [...paymentMethodsKeys.all, 'default'] as const,
};

/**
 * Hook to fetch all payment methods
 */
export function usePaymentMethods() {
  return useQuery({
    queryKey: paymentMethodsKeys.lists(),
    queryFn: () => customerPaymentMethodsApi.getPaymentMethods(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch default payment method
 */
export function useDefaultPaymentMethod() {
  return useQuery({
    queryKey: paymentMethodsKeys.default(),
    queryFn: () => customerPaymentMethodsApi.getDefaultPaymentMethod(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create M-Pesa payment method
 */
export function useCreateMpesaMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MpesaPaymentMethodCreate) =>
      customerPaymentMethodsApi.createMpesaMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.default() });
    },
  });
}

/**
 * Hook to create card payment method
 */
export function useCreateCardMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CardPaymentMethodCreate) =>
      customerPaymentMethodsApi.createCardMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.default() });
    },
  });
}

/**
 * Hook to create bank payment method
 */
export function useCreateBankMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BankPaymentMethodCreate) =>
      customerPaymentMethodsApi.createBankMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.default() });
    },
  });
}

/**
 * Hook to update payment method
 */
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ methodId, data }: { methodId: string; data: any }) =>
      customerPaymentMethodsApi.updatePaymentMethod(methodId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.default() });
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.detail(variables.methodId) });
    },
  });
}

/**
 * Hook to set default payment method
 */
export function useSetDefaultPaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (methodId: string) =>
      customerPaymentMethodsApi.setDefault(methodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.default() });
    },
  });
}

/**
 * Hook to delete payment method
 */
export function useDeletePaymentMethod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (methodId: string) =>
      customerPaymentMethodsApi.deletePaymentMethod(methodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentMethodsKeys.default() });
    },
  });
}
