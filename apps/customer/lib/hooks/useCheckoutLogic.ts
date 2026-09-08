'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuthStore, useCartStore } from '@mymeddevices/shared-core';
import { useAddressStore } from '@/lib/store/useAddressStore';
import { formatCurrency } from '@/lib/utils/utils';
import { PACKAGING_FEE, SERVICES_FEE } from '@/lib/config/fees';
import { Product } from '@/lib/data/types';
import { orderService } from '../services/order-service';
import { shoppingService } from '@mymeddevices/shared-core';

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
    const { items, getTotal, clearLocalOnly, hydrated, mergeCart, syncLocalItemsToBackend, cart } = useCartStore();
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
    const [tax, setTax] = useState(0);
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
    const [orderNotes, setOrderNotes] = useState('');
    const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
    const [successfulOrder, setSuccessfulOrder] = useState<{ id: string; orderNumber?: string | number } | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Coupon state
    const [couponCode, setCouponCode] = useState('');
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

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

    // Fetch shipping rates from backend API
    const fetchShippingRates = useCallback(async (region: string, subtotal: number) => {
        setShippingLoading(true);
        setCalculateRequested(false);

        try {
            // Get cart from store
            const currentCart = useCartStore.getState().cart;
            if (!currentCart || !currentCart.id) {
                // Fallback to default values if cart is not available
                console.warn('[Checkout] No cart available for shipping calculation');
                setShipping(0);
                setShippingMethod({
                    methodId: 'flat_rate',
                    methodName: 'Flat Rate',
                    zoneId: 1,
                    zoneName: 'Default Zone',
                });
                setCalculateRequested(true);
                setShippingLoading(false);
                return;
            }

            // Get delivery coordinates
            const lat = delivery?.lat;
            const lon = delivery?.lon;

            if (!lat || !lon) {
                console.warn('[Checkout] No delivery coordinates available');
                setShipping(0);
                setCalculateRequested(true);
                setShippingLoading(false);
                return;
            }

            // Call backend API to calculate shipping
            const { apiClient } = await import('@mymeddevices/core/lib/services/api-client');
            const response = await apiClient.get<any>(`/shopping/cart/totals?cart_id=${currentCart.id}&lat=${lat}&lon=${lon}`);

            if (response && response.data) {
                const shippingAmount = response.data.shipping_amount || 0;
                const taxAmount = response.data.tax_amount || 0;
                setShipping(shippingAmount);
                setTax(taxAmount);
                setShippingMethod({
                    methodId: 'calculated',
                    methodName: 'Calculated Shipping',
                    zoneId: 1,
                    zoneName: region || 'Default Zone',
                });
                console.log('[Checkout] Shipping calculated:', shippingAmount, 'Tax:', taxAmount);
            } else {
                throw new Error('Invalid response from shipping API');
            }
        } catch (error) {
            console.error('[Checkout] Shipping calculation error:', error);
            // Fallback to default values on error
            const cost = region.toLowerCase().includes('nairobi') ? 250 : 500;
            setShipping(cost);
            setShippingMethod({
                methodId: 'flat_rate',
                methodName: 'Flat Rate',
                zoneId: 1,
                zoneName: 'Default Zone',
            });
        } finally {
            setCalculateRequested(true);
            setShippingLoading(false);
        }
    }, [delivery]);

    const subtotal = getTotal();

    // Coupon Handlers
    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;

        setIsApplyingCoupon(true);
        try {
            // Get cart ID from the cart store
            const cartId = cart?.id || 'default-cart';
            const result = await shoppingService.applyCoupon(cartId, couponCode);
            const data = (result as any)?.data ?? result;
            
            if (data && data.is_valid) {
                setAppliedCoupon(data);
                toast.success(data.message || 'Coupon applied successfully!');
                if (delivery && delivery.region) {
                    fetchShippingRates(delivery.region, subtotal);
                }
            } else {
                toast.error(data?.message || 'Invalid coupon code');
            }
        } catch (error: any) {
            console.error('Coupon error:', error);
            toast.error(error?.message || 'Failed to apply coupon');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = async () => {
        try {
            const cartId = cart?.id || 'default-cart';
            await shoppingService.removeCoupon(cartId);
            setAppliedCoupon(null);
            setCouponCode('');
            toast.success('Coupon removed');
            if (delivery && delivery.region) {
                fetchShippingRates(delivery.region, subtotal);
            }
        } catch (error) {
            toast.error('Failed to remove coupon');
        }
    };

    useEffect(() => {
        if (hydrated && cart?.id && delivery && delivery.region && subtotal > 0) {
            fetchShippingRates(delivery.region, subtotal);
        }
    }, [hydrated, cart?.id, subtotal, delivery, fetchShippingRates]);

    // Handlers
    const handleAuthComplete = async () => {
        setShowAuthModal(false);

        try {
            // Check if there's a guest cart to merge
            const guestToken = typeof window !== 'undefined'
                ? localStorage.getItem('guest_cart_token')
                : null;

            if (guestToken) {
                console.log('[AuthComplete] Merging guest cart into user cart');
                await mergeCart();
                toast.success('Welcome! Your cart has been updated.');
            } else {
                console.log('[AuthComplete] No guest cart to merge, syncing user cart');
                await syncLocalItemsToBackend();
                toast.success('Welcome!');
            }
        } catch (error) {
            console.error('Failed to sync cart:', error);
            toast.error('Failed to sync your cart. Please check your items.');
        }

        setActiveStep(1);
        setTimeout(() => scrollToStep(1), 300);
    };

    const handleCheckout = async () => {
        console.log('[Checkout] handleCheckout called');
        try {
            const total = subtotal + shipping + PACKAGING_FEE + SERVICES_FEE;
            const customerData = getCustomerData();
            const formattedPhone = formatPhoneNumber(customerData.phone);

            console.log('[Checkout] Validation check:', {
                customerData,
                delivery,
                items: items.length,
            });

            if (!customerData.name || !customerData.phone || !customerData.email || !delivery) {
                console.log('[Checkout] Validation failed:', {
                    hasName: !!customerData.name,
                    hasPhone: !!customerData.phone,
                    hasEmail: !!customerData.email,
                    hasDelivery: !!delivery,
                });
                if (!delivery) setActiveStep(0);
                else if (!customerData.name || !customerData.phone || !customerData.email) setActiveStep(1);
                toast.error('Please complete all required fields');
                return;
            }

            if (items.length === 0) {
                console.log('[Checkout] Cart is empty');
                toast.error('Your cart is empty.');
                return;
            }

            console.log('[Checkout] All validations passed, starting checkout process');
            setIsPending(true);

            try {
                // First, sync any local items to backend cart
                console.log('[Checkout] Starting checkout, local items:', items.length);
                console.log('[Checkout] Customer data:', customerData);
                console.log('[Checkout] Delivery:', delivery);
                toast.loading('Preparing your order...', { id: 'checkout-prepare' });

            // Only attempt merge if authenticated user has a guest token to merge
            const activeCartToken = useCartStore.getState().cartToken;

            if (isAuthenticated && activeCartToken) {
                console.log('[Checkout] Guest cart token found, merging into user cart');
                await mergeCart();
            } else {
                console.log('[Checkout] Syncing local items with backend');
                await syncLocalItemsToBackend();
            }

            // Get cart from store (mergeCart already synced)
            let cart = useCartStore.getState().cart;
            console.log('[Checkout] Backend cart:', cart ? `${cart.id} (active: ${cart.is_active}, items: ${cart.items?.length || 0})` : 'null');

            // Check if cart is valid and active
            if (!cart || !cart.id || !cart.is_active) {
                // Cart is invalid or inactive, we need to get a fresh cart
                console.warn('[Checkout] Cart is invalid or inactive, getting fresh cart');
                toast.loading('Getting fresh cart...', { id: 'cart-refresh' });

                // Clear the cart token in the store
                const { setCartToken: clearToken, syncWithBackend } = useCartStore.getState();
                clearToken(null);

                // Sync with backend (this will create a new guest cart if needed)
                await syncWithBackend({ force: true });

                // Get the fresh cart from store
                cart = useCartStore.getState().cart;

                console.log('[Checkout] Fresh cart:', cart ? `${cart.id} (active: ${cart.is_active}, items: ${cart.items?.length || 0})` : 'null');

                if (!cart || !cart.is_active) {
                    throw new Error('Unable to create an active cart. Please try again.');
                }

                toast.success('Fresh cart ready', { id: 'cart-refresh' });
            }

            // Now sync local items to the valid/active cart
            console.log('[Checkout] Syncing local items to backend...');
            await syncLocalItemsToBackend();

            // Get the updated cart from the store (syncLocalItemsToBackend already synced)
            const syncedCart = useCartStore.getState().cart;
            if (syncedCart) {
                cart = syncedCart;
            }
            console.log('[Checkout] Cart after sync:', cart ? `${cart.id} (active: ${cart.is_active}, items: ${cart.items?.length || 0})` : 'null');
            toast.success('Cart ready', { id: 'checkout-prepare' });

            if (!cart.items || cart.items.length === 0) {
                throw new Error('Your cart is empty. Please add items before checkout.');
            }

            // Create order via API
            const shippingAddress = {
                first_name: guestCustomer.firstName || customerData.name.split(' ')[0] || 'Guest',
                last_name: guestCustomer.lastName || customerData.name.split(' ').slice(1).join(' ') || '',
                full_name: customerData.name,
                street: delivery.address, // For compatibility with backend schema
                address_line1: delivery.address,
                address_line2: delivery.address_2 || '',
                city: delivery.city || 'Nairobi',
                state: delivery.region || 'Nairobi',
                postal_code: delivery.postcode || '',
                country: delivery.country || 'Kenya',
                phone: formattedPhone,
                latitude: delivery.lat,
                longitude: delivery.lon,
                payment_method: paymentMethod,
            };

            // Get guest token for non-authenticated users
            const orderGuestToken = !isAuthenticated ? useCartStore.getState().cartToken : null;

            const order = await orderService.createOrderFromCart(
                cart,
                shippingAddress,
                shippingAddress, // billing same as shipping
                orderNotes || undefined, // notes from customer input
                orderGuestToken || undefined,
                pointsToRedeem
            );

            const orderId = order.id;
            const orderNumber = order.order_number || orderId;

            // Handle M-Pesa payment if selected
            if (paymentMethod === 'mpesa' && orderId) {
                setIsProcessingMpesa(true);
                toast.loading('Initializing M-Pesa payment...', { id: 'mpesa-init' });
                const mpesaPhone = customerData.mpesaPhone
                    ? formatPhoneNumber(customerData.mpesaPhone)
                    : formattedPhone;

                try {
                    await orderService.initializeMpesaPayment(orderId, mpesaPhone);
                    toast.success('M-Pesa STK push sent! Please complete payment on your phone.', { id: 'mpesa-init' });
                } catch (mpesaError) {
                    toast.error('Failed to initiate M-Pesa payment. Please try again or use Cash on Delivery.', { id: 'mpesa-init' });
                    console.error('M-Pesa error:', mpesaError);
                    setIsProcessingMpesa(false);
                    setIsPending(false);
                    return;
                }
            }

            toast.success(`Order #${orderNumber} placed successfully!`);

            // Store successful order info for fallback UI
            setSuccessfulOrder({ id: orderId, orderNumber });

            // Clear cart locally
            clearLocalOnly();

            const guestParam = orderGuestToken ? `?guest_token=${encodeURIComponent(orderGuestToken)}` : '';
            const redirectUrl = `/orders/${orderId}${guestParam}`;

            // Set redirecting state to prevent UI interference
            setIsRedirecting(true);

            // Redirect using Next.js router
            await router.push(redirectUrl);
        } catch (error: any) {
            console.error('Checkout error:', error);
            let errorMessage = error?.message || 'Failed to place order. Please try again.';
            console.error('Checkout error details:', {
                message: error?.message,
                response: error?.response?.data,
                status: error?.response?.status,
                name: error?.name,
                stack: error?.stack,
            });

            // Log the full error for debugging
            console.error('Full error object:', error);

            // Handle duplicate checkout attempts more gracefully
            if (errorMessage.includes('no longer active') || errorMessage.includes('already been checked out')) {
                toast.info('This order has already been processed. Redirecting to your orders...');
                // Redirect to orders page
                await router.push('/dashboard/orders');
                return; // Return early to avoid showing error toast
            }

            // Handle network errors
            if (error?.code === 'ECONNREFUSED' || error?.code === 'ERR_NETWORK') {
                errorMessage = 'Network error. Please check your connection and try again.';
            }

            // Handle validation errors
            if (error?.response?.status === 400 || error?.status === 400) {
                const detail = error?.response?.data?.detail || error?.detail;
                if (detail) {
                    errorMessage = Array.isArray(detail) ? detail.join(', ') : detail;
                }
            }

            // Handle 401/403 errors
            if (error?.response?.status === 401 || error?.status === 401) {
                errorMessage = 'Your session has expired. Please login again.';
            }

            if (error?.response?.status === 403 || error?.status === 403) {
                errorMessage = 'You do not have permission to complete this action.';
            }

            // Handle 500 errors
            if (error?.response?.status === 500 || error?.status === 500) {
                errorMessage = 'Server error. Please try again later.';
            }

            toast.error(errorMessage, { duration: 5000 });
        } finally {
            // Don't clear pending state if redirecting to avoid UI interference
            if (!isRedirecting) {
                setIsPending(false);
            }
            setIsProcessingMpesa(false);
        }
        } catch (unexpectedError: any) {
            console.error('Unexpected error in handleCheckout:', unexpectedError);
            toast.error('An unexpected error occurred. Please try again.');
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
        tax,
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
        handleApplyCoupon,
        handleRemoveCoupon,
        scrollToStep,
        subtotal,
        isPending,
        couponCode,
        setCouponCode,
        isApplyingCoupon,
        appliedCoupon,
        orderNotes,
        setOrderNotes,
        pointsToRedeem,
        setPointsToRedeem,
        successfulOrder,
        isRedirecting,
    };
}
