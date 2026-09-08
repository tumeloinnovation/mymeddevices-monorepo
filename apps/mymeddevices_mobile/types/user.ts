export interface BackendAddress {
  id: string;
  customer_id: string;
  type: "shipping" | "billing";
  first_name: string;
  last_name: string;
  address_line1: string;
  address_line2?: string | null;
  city: string;
  state?: string | null;
  postal_code?: string | null;
  country: string;
  phone?: string | null;
  is_default: boolean;
  latitude?: number | null;
  longitude?: number | null;
  place_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendCustomer {
  id: string;
  user_id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  loyalty_tier?: string;
  loyalty_points?: number;
  marketing_enabled?: boolean;
  email_order_updates?: boolean;
  email_promotions?: boolean;
  email_newsletter?: boolean;
  email_security?: boolean;
  sms_order_updates?: boolean;
  sms_promotions?: boolean;
  sms_security?: boolean;
  email_frequency?: string;
  language?: string;
  timezone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Billing {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  email?: string;
  phone?: string;
}

export interface Shipping {
  first_name?: string;
  last_name?: string;
  company?: string;
  address_1?: string;
  address_2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  phone?: string;
}

export interface MetaData {
  id?: number;
  key: string;
  value: string;
  display_key?: string;
  display_value?: string;
}

export interface Customer {
  id: number | string;
  date_created?: string;
  date_created_gmt?: string;
  date_modified?: string;
  date_modified_gmt?: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: string;
  username: string;
  billing: Billing;
  shipping: Shipping;
  is_paying_customer?: boolean;
  avatar_url: string;
  loyalty_points?: number;
  loyalty_tier?: string;
  meta_data?: MetaData[];
}

export interface UpdateCustomerParams {
  email?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  username?: string;
  password?: string;
  avatar_url?: string;
  billing?: Billing;
  shipping?: Shipping;
  meta_data?: MetaData[];
}

export interface User {
  token: string;
  id: number;
  email: string;
  nicename: string;
  firstName: string;
  lastName: string;
  displayName: string;
}
