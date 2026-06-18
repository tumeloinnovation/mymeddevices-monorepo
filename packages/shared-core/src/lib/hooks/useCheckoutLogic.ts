'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import useCartStore from '@/lib/store/useCartStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useAddressStore } from '@/lib/store/useAddressStore';
import { formatCurrency } from '@/lib/utils/utils';
import { PACKAGING_FEE, SERVICES_FEE } from '@/lib/config/fees';
import { Product } from '@/lib/data/types';
import { orderService } from '../services/order-service';

// Types
export type Address = {
    address: string;
    lat?: number;
    lon?: number;
    region?: string;
    city?: string;
    country?: string;
    postcode?: string;
    address_2?: string;
};

export function useCheckoutLogic() {
    const router = useRouter();
    const { items, getTotal, clear, hydrated } = useCartStore();
    const { isAuthenticated, user, hydrated: authHydrated } = useAuthStore();
    const { getDefaultAddress, hydrated: addressHydrated } = useAddressStore();

    // State
    const [activeStep, setActiveStep] = useState<number>(0);
    const [delivery, setDelivery] = useState<Address | null>(null);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [guestCustomer, setGuestCustomer] = useState<{
        name: string;
        phone: string;
        email: string;
        firstName?: string;
        lastName?: string;
        mpesaPhone?: string;
    }>({
        name: '',
        phone: '',
        email: '',
        firstName: '',
        lastName: '',
        mpesaPhone: '',
    });
    const [shipping, setShipping] = useState(0);
    const [shippingMethod, setShippingMethod] = useState<{
        methodId?: string;
        methodName?: string;
        zoneId?: number;
        zoneName?: string;
    }>({});
    const [shippingLoading, setShippingLoading] = useState(false);
    const [calculateRequested, setCalculateRequested] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cod');
    const [isProcessingMpesa, setIsProcessingMpesa] = useState(false);
    const [isAddingNotes, setIsAddingNotes] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [isPending, setIsPending] = useState(false);

    const containerRef = useRef<HTMLDivElement | null>(null);

    // Helper: Get customer name
    const getCustomerName = (authUser: any) => {
        if (!authUser) return '';
        const nameFromNames = `${authUser.firstName || ''} ${authUser.lastName || ''}`.trim();
        return nameFromNames || authUser.displayName || authUser.email?.split('@')[0] || '';
    };

    // Helper: Format phone number to 254 format
    const formatPhoneNumber = (phone: string): string => {
        let formattedPhone = phone;
        if (formattedPhone) {
            formattedPhone = formattedPhone.replace(/\D/g, "");
            if (formattedPhone.startsWith("0")) {
                formattedPhone = `254${formattedPhone.substring(1)}`;
            } else if (formattedPhone.startsWith("7") || formattedPhone.startsWith("1")) {
                formattedPhone = `254${formattedPhone}`;
            }
        }
        return formattedPhone;
    };

    // Helper: Get customer data
    const getCustomerData = useCallback(() => {
        if (isAuthenticated && user && authHydrated) {
            return {
                name: getCustomerName(user),
                phone: guestCustomer.phone || user.phone || '',
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                mpesaPhone: guestCustomer.mpesaPhone || '',
            };
        }
        return guestCustomer;
    }, [isAuthenticated, user, authHydrated, guestCustomer]);

    // Sync user data to guest customer state when authenticated
    useEffect(() => {
        if (isAuthenticated && user && authHydrated) {
            setGuestCustomer(prev => ({
                ...prev,
                name: getCustomerName(user),
                phone: user.phone || '',
                email: user.email || '',
                firstName: user.firstName || '',
                lastName: user.lastName || '',
            }));
        }
    }, [isAuthenticated, user, authHydrated]);

    // Pre-fill default shipping address
    useEffect(() => {
        if (addressHydrated && !delivery) {
            const defaultAddress = getDefaultAddress();
            if (defaultAddress) {
                setDelivery({
                    address: defaultAddress.address,
                    lat: defaultAddress.lat ? parseFloat(defaultAddress.lat) : undefined,
                    lon: defaultAddress.lon ? parseFloat(defaultAddress.lon) : undefined,
                    region: defaultAddress.region || defaultAddress.state || 'Kenya',
                    city: defaultAddress.city,
                    country: defaultAddress.country,
                    postcode: defaultAddress.postcode,
                    address_2: defaultAddress.address_2,
                });
            }
        }
    }, [addressHydrated, delivery, getDefaultAddress]);

    // Scroll to step
    const scrollToStep = useCallback((index: number) => {
        setActiveStep(index);
        setTimeout(() => {
            const el = containerRef.current?.querySelector(`[data-step-index="${index}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
    }, []);

    // Mock Fetch shipping rates
    const fetchShippingRates = useCallback(async (region: string, subtotal: number) => {
        setShippingLoading(true);
        setCalculateRequested(false);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const cost = region.toLowerCase().includes('nairobi') ? 250 : 500;
        setShipping(cost);
        setShippingMethod({
            methodId: 'flat_rate',
            methodName: 'Flat Rate',
            zoneId: 1,
            zoneName: 'Default Zone',
        });
        setCalculateRequested(true);
        setShippingLoading(false);
    }, []);

    const subtotal = getTotal();
    useEffect(() => {
        if (delivery && delivery.region && subtotal > 0) {
            fetchShippingRates(delivery.region, subtotal);
        }
    }, [subtotal, delivery, fetchShippingRates]);

    // Handlers
    const handleAuthComplete = async () => {
        setShowAuthModal(false);
        toast.success('Welcome! Your information has been verified.');
        setActiveStep(1);
        setTimeout(() => scrollToStep(1), 300);
    };

    const handleCheckout = async () => {
        const total = subtotal + shipping + PACKAGING_FEE + SERVICES_FEE;
        const customerData = getCustomerData();
        const formattedPhone = formatPhoneNumber(customerData.phone);

        if (!customerData.name || !customerData.phone || !customerData.email || !delivery) {
            if (!delivery) setActiveStep(0);
            else if (!isAuthenticated) setActiveStep(1);
            return;
        }

        if (items.length === 0) {
            toast.error('Your cart is empty.');
            return;
        }

        setIsPending(true);

        try {
            // Prepare line items from cart
            const lineItems = items.map(item => ({
                product_id: Number(item.id),
                quantity: item.quantity || 1,
            }));

            // Prepare shipping address
            const shippingAddress = {
                first_name: customerData.firstName || customerData.name?.split(' ')[0] || '',
                last_name: customerData.lastName || customerData.name?.split(' ').slice(1).join(' ') || '',
                address_line1: delivery.address,
                address_line2: delivery.address_2 || '',
                city: delivery.city || '',
                state: delivery.region || '',
                postal_code: delivery.postcode || '',
                country: delivery.country || 'Kenya',
                phone: formattedPhone,
            };

            // Create order request
            const orderRequest = {
                payment_method: paymentMethod === 'mpesa' ? 'mpesa' : 'cod',
                payment_method_title: paymentMethod === 'mpesa' ? 'M-Pesa' : 'Cash on Delivery',
                set_paid: paymentMethod === 'mpesa', // Will be set to true after M-Pesa payment
                billing: shippingAddress,
                shipping: shippingAddress,
                line_items: lineItems,
                shipping_lines: {
                    method_id: 'flat_rate',
                    method_title: 'Flat Rate',
                    total: shipping.toString(),
                },
                meta_data: [
                    { key: 'packaging_fee', value: PACKAGING_FEE.toString() },
                    { key: 'services_fee', value: SERVICES_FEE.toString() },
                    { key: 'delivery_lat', value: delivery.lat?.toString() || '' },
                    { key: 'delivery_lon', value: delivery.lon?.toString() || '' },
                ],
            };

            // Create order via API
            const order = await orderService.createOrderFromCart(
                'cart',
                shippingAddress,
                shippingAddress
            );

            const orderId = order.id;
            const orderNumber = order.order_number;

            // Handle M-Pesa payment if selected
            if (paymentMethod === 'mpesa' && orderNumber) {
                setIsProcessingMpesa(true);
                const mpesaPhone = customerData.mpesaPhone
                    ? formatPhoneNumber(customerData.mpesaPhone)
                    : formattedPhone;

                try {
                    await orderService.initializeMpesaPayment(orderId, mpesaPhone);
                    toast.success('M-Pesa STK push sent! Please complete payment on your phone.');
                } catch (mpesaError) {
                    toast.error('Failed to initiate M-Pesa payment. Please try again or use Cash on Delivery.');
                    console.error('M-Pesa error:', mpesaError);
                }
            }

            toast.success(`Order #${orderNumber || orderId} placed successfully!`);

            // Clear cart and redirect
            clear();
            router.push(`/orders/${orderId}`);
        } catch (error) {
            console.error('Checkout error:', error);
            toast.error('Failed to place order. Please try again.');

            // Fallback to demo mode if API fails
            const fallbackOrderId = Math.floor(100000 + Math.random() * 900000);
            toast.success(`Demo Order #${fallbackOrderId} placed successfully!`);

            clear();
            router.push(`/orders/${fallbackOrderId}`);
        } finally {
            setIsPending(false);
            setIsProcessingMpesa(false);
        }
    };

    return {
        items,
        hydrated,
        isAuthenticated,
        activeStep,
        setActiveStep,
        delivery,
        setDelivery,
        showAuthModal,
        setShowAuthModal,
        customer: guestCustomer,
        setCustomer: setGuestCustomer,
        shipping,
        shippingMethod,
        shippingLoading,
        calculateRequested,
        setCalculateRequested,
        paymentMethod,
        setPaymentMethod,
        isProcessingMpesa,
        isAddingNotes,
        showSummaryModal,
        setShowSummaryModal,
        containerRef,
        getCustomerData,
        fetchShippingRates,
        handleAuthComplete,
        handleCheckout,
        scrollToStep,
        subtotal,
        isPending,
    };
}
