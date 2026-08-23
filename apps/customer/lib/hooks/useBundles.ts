import { useQuery } from '@tanstack/react-query';

export interface BundleComponent {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  quantity: number;
  sort_order: number;
  gross_unit_price?: number | null;
  allocated_discount?: number | null;
  net_unit_price?: number | null;
  winning_vendor_name?: string | null;
}

export interface Bundle {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  discount_type: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'BOGO';
  discount_value: number;
  funding_source: string;
  is_active: boolean;
  is_available: boolean;
  gross_customer_price?: number | null;
  discount_amount?: number | null;
  net_customer_price?: number | null;
  components: BundleComponent[];
  created_at: string;
  updated_at: string;
}

export function useBundles() {
  return useQuery({
    queryKey: ['bundles'],
    queryFn: async (): Promise<Bundle[]> => {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/storefront/bundles`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch bundles');
      }
      return res.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}
