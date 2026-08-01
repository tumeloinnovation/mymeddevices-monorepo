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
                setShipping(shippingAmount);
                setShippingMethod({
                    methodId: 'calculated',
                    methodName: 'Calculated Shipping',
                    zoneId: 1,
                    zoneName: region || 'Default Zone',
                });
                console.log('[Checkout] Shipping calculated:', shippingAmount);
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
            
            if (result.success && result.data.is_valid) {
                setAppliedCoupon(result.data);
                toast.success('Coupon applied successfully!');
            } else {
                toast.error(result.data?.message || 'Invalid coupon code');
            }
        } catch (error) {
            console.error('Coupon error:', error);
            toast.error('Failed to apply coupon');
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
            await mergeCart();
            toast.success('Welcome! Your cart has been updated.');
        } catch (error) {
            console.error('Failed to merge cart:', error);
            toast.error('Failed to sync your cart. Please check your items.');
        }

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
            toast.error('Please complete all required fields');
            return;
        }

        if (items.length === 0) {
            toast.error('Your cart is empty.');
            return;
        }

        setIsPending(true);

        try {
            // First, sync any local items to backend cart
            console.log('[Checkout] Starting checkout, local items:', items.length);
            toast.loading('Syncing cart...', { id: 'cart-sync' });
            await mergeCart();

            // Get cart from store (mergeCart already synced)
            let cart = useCartStore.getState().cart;
            console.log('[Checkout] Backend cart:', cart ? `${cart.id} (active: ${cart.is_active}, items: ${cart.items?.length || 0})` : 'null');

            // Check if cart is valid and active
            if (!cart || !cart.id || !cart.is_active) {
                // Cart is invalid or inactive, we need to get a fresh cart
                console.warn('[Checkout] Cart is invalid or inactive, getting fresh cart');
                toast.loading('Getting fresh cart...', { id: 'cart-refresh' });

                // Clear the cart token to force creation of new cart
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('cart_token');
                    localStorage.removeItem('guest_token');
                }

                // Clear the cart token in the store
                const { setCartToken: clearToken, syncWithBackend } = useCartStore.getState();
                clearToken('');

                // Sync with backend (this will create a new guest cart if needed)
                await syncWithBackend({ force: true });

                // Get the fresh cart from store
                cart = useCartStore.getState().cart;

                // Save the new cart token
                if (cart?.cart_token) {
                    useCartStore.getState().setCartToken(cart.cart_token);
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('cart_token', cart.cart_token);
                        localStorage.setItem('guest_token', cart.cart_token);
                    }
                }

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
            toast.success('Cart synced', { id: 'cart-sync' });

            if (!cart.items || cart.items.length === 0) {
                throw new Error('Your cart is empty. Please add items before checkout.');
            }

            // Create order via API
            const shippingAddress = {
                first_name: guestCustomer.firstName || customerData.name.split(' ')[0] || 'Guest',
                last_name: guestCustomer.lastName || customerData.name.split(' ').slice(1).join(' ') || '',
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
            const guestToken = !isAuthenticated ? (typeof window !== 'undefined' ? localStorage.getItem('guest_token') : null) : null;

            const order = await orderService.createOrderFromCart(
                cart,
                shippingAddress,
                shippingAddress, // billing same as shipping
                orderNotes || undefined, // notes from customer input
                guestToken || undefined
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

            // Clear cart locally and redirect
            clearLocalOnly();
            router.push(`/orders/${orderId}`);
        } catch (error: any) {
            console.error('Checkout error:', error);
            let errorMessage = error?.message || 'Failed to place order. Please try again.';

            // Handle duplicate checkout attempts more gracefully
            if (errorMessage.includes('no longer active') || errorMessage.includes('already been checked out')) {
                errorMessage = 'This order has already been processed. Redirecting to your orders...';
                // Redirect to orders page after a short delay
                setTimeout(() => {
                    router.push('/dashboard/orders');
                }, 2000);
            }

            toast.error(errorMessage);
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
    };
}
