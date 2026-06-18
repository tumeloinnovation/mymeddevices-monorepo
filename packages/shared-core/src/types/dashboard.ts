import type { LucideIcon } from 'lucide-react';

export interface DashboardStats {
    totalOrders: number;
    totalSpent: number;
    wishlistCount: number;
    savedAddresses: number;
    memberSince: string;
}

export interface OrderHistoryItem {
    id: number;
    orderNumber: string;
    date: string;
    status: string;
    total: string;
    itemCount: number;
    paymentMethod: string;
}

export interface NavigationItem {
    label: string;
    href: string;
    icon: LucideIcon;
    badge?: number;
    isActive?: boolean;
}

export interface AddressWithMap {
    formatted_address: string;
    address_1: string;
    address_2?: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    lat?: number;
    lng?: number;
    place_id?: string;
}

export interface ProfileUpdateData {
    firstName: string;
    lastName: string;
    displayName: string;
    phone: string;
}

export interface PasswordUpdateData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}
