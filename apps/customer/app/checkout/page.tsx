'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import Link from 'next/link';
import { useCheckoutLogic, Address } from '@/lib/hooks/useCheckoutLogic';
import { formatCurrency } from '@/lib/utils/utils';
import { PACKAGING_FEE, SERVICES_FEE } from '@/lib/config/fees';

import CustomerSection from './_components/CustomerSection';
import DeliverySection from './_components/DeliverySection';
import ReviewSection from './_components/ReviewSection';
import Section from './_components/Section';
import SummaryPanel from './_components/SummaryPanel';
import MobileBottomSummary from './_components/MobileBottomSummary';
import { CustomerAuthModal } from '@mymeddevices/shared-ui';

export default function HybridCheckout() {
  const {
    items,
    hydrated,
    isAuthenticated,
    activeStep,
    setActiveStep,
    delivery,
    setDelivery,
    showAuthModal,
    setShowAuthModal,
    customer,
    setCustomer,
    shipping,
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
    couponCode,
    setCouponCode,
    handleApplyCoupon,
    handleRemoveCoupon,
    isApplyingCoupon,
    appliedCoupon,
  } = useCheckoutLogic();


  const total = subtotal + shipping + PACKAGING_FEE + SERVICES_FEE;

  // Wait for cart to hydrate before rendering
  if (!hydrated) {
    return (
      <div className="px-4 py-12 max-w-4xl mx-auto text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-48 mx-auto mb-3"></div>
          <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
        </div>
      </div>
    );
  }

  // If cart empty, show simple empty state
  if (items.length === 0) {
    return (
      <div className="px-4 py-16 max-w-4xl mx-auto text-center">
        {/* Empty Cart SVG Illustration */}
        <div className="max-w-md mx-auto mb-8">
          <svg
            viewBox="0 0 400 300"
            className="w-full h-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Background decorative elements */}
            <circle cx="200" cy="150" r="120" fill="#FFF5F0" opacity="0.5" />
            <circle cx="280" cy="80" r="30" fill="#FFE8DD" opacity="0.4" />
            <circle cx="120" cy="220" r="20" fill="#FFE8DD" opacity="0.4" />

            {/* Shopping Cart */}
            <g transform="translate(130, 80)">
              {/* Cart body */}
              <path
                d="M20 40 L35 40 L45 100 L115 100 L125 60 L40 60 L35 35 L20 35 Z"
                fill="none"
                stroke="#E67E22"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Cart handle */}
              <path
                d="M20 40 C5 40, 5 20, 15 15"
                fill="none"
                stroke="#E67E22"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Cart wheel left */}
              <circle cx="50" cy="115" r="8" fill="#1A1F2E" />
              <circle cx="50" cy="115" r="4" fill="#E67E22" />

              {/* Cart wheel right */}
              <circle cx="100" cy="115" r="8" fill="#1A1F2E" />
              <circle cx="100" cy="115" r="4" fill="#E67E22" />

              {/* Cart grid lines */}
              <line x1="45" y1="75" x2="110" y2="75" stroke="#E67E22" strokeWidth="2" opacity="0.3" />
              <line x1="50" y1="90" x2="105" y2="90" stroke="#E67E22" strokeWidth="2" opacity="0.3" />
            </g>

            {/* Floating items (small product boxes) */}
            <g transform="translate(250, 70)">
              <rect x="0" y="0" width="25" height="30" rx="2" fill="#E67E22" opacity="0.2" />
              <rect x="5" y="5" width="15" height="20" rx="1" fill="#E67E22" opacity="0.4" />
            </g>

            <g transform="translate(100, 200)">
              <rect x="0" y="0" width="20" height="25" rx="2" fill="#1A1F2E" opacity="0.15" />
            </g>

            {/* Magnifying glass (search icon) */}
            <g transform="translate(280, 180) rotate(-15)">
              <circle cx="15" cy="15" r="12" fill="none" stroke="#1A1F2E" strokeWidth="2.5" opacity="0.3" />
              <line x1="24" y1="24" x2="32" y2="32" stroke="#1A1F2E" strokeWidth="2.5" opacity="0.3" strokeLinecap="round" />
            </g>

            {/* Dotted path lines suggesting browsing */}
            <path
              d="M90 120 Q60 140, 80 180"
              fill="none"
              stroke="#E67E22"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.3"
              strokeLinecap="round"
            />
            <path
              d="M310 100 Q330 130, 300 160"
              fill="none"
              stroke="#E67E22"
              strokeWidth="2"
              strokeDasharray="4 4"
              opacity="0.3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold mb-3">Your cart is empty</h2>
        <p className="text-muted-foreground mb-6">Add items to place an order.</p>
        <Button asChild className="bg-[#E67E22] hover:bg-[#d36f1f]">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  const customerData = getCustomerData();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start gap-8 lg:gap-12">
        <div className="flex-1" ref={containerRef}>
          <h1 className="text-3xl font-bold mb-4">Checkout</h1>

          {/* --- Accordion Step: Delivery --- */}
          <Section
            index={0}
            activeIndex={activeStep}
            title="Delivery Address"
            subtitle={delivery?.address || 'Choose or search your delivery location'}
            onEdit={() => scrollToStep(0)}
          >
            <DeliverySection
              delivery={delivery}
              onSelect={(a: Address) => {
                setDelivery(a);
                // reset calculateRequested when address changes
                setCalculateRequested(false);
                // Fetch shipping rates only after address is confirmed and set
                if (a && a.region) {
                  fetchShippingRates(a.region, subtotal);
                } else {
                  // setShipping(0); // Handled in hook
                  // setShippingMethod({}); // Handled in hook
                }
                // auto-advance to customer
                setActiveStep(1);
                setTimeout(() => scrollToStep(1), 300);
              }}
              shippingLoading={shippingLoading}
              onCalculateShipping={() => {
                if (delivery && delivery.region) {
                  // call fetch and only mark requested true when it completes (fetch sets it)
                  fetchShippingRates(delivery.region, subtotal);
                } else {
                  // toast.error('Please select an address to calculate shipping.'); // Handled in UI or hook?
                  // Logic moved to hook but UI trigger is here. 
                  // Let's keep the toast here if it was here, or rely on hook.
                  // The hook has fetchShippingRates which handles errors.
                  // But the "Please select an address" check was in the UI.
                  // We can add it back here if needed, but DeliverySection calls onCalculateShipping.
                }
              }}
              calculateRequested={calculateRequested}
            />
          </Section>

          <Separator className="my-6" />

          {/* --- Accordion Step: Customer Information --- */}
          <Section
            index={1}
            activeIndex={activeStep}
            title="Customer Information"
            subtitle={customer.name || 'Your name, email and phone number'}
            onEdit={() => scrollToStep(1)}
          >
            <CustomerSection
              customer={customer}
              setCustomer={setCustomer}
              onSignIn={() => setShowAuthModal(true)}
              onNext={() => {
                setActiveStep(2);
                setTimeout(() => scrollToStep(2), 300);
              }}
            />
          </Section>

          <Separator className="my-6" />

          {/* --- Accordion Step: Review --- */}
          <Section
            index={2}
            activeIndex={activeStep}
            title="Review"
            subtitle={`Items: ${items.length} — Total: Ksh. ${formatCurrency(total)}`}
            onEdit={() => scrollToStep(2)}
          >
            <ReviewSection
              items={
                Array.isArray(items) && items.length > 0
                  ? items
                    .filter((item) => item && item.id && item.name && item.price !== undefined)
                    .map((item) => ({
                      id: item.id!,
                      name: item.name!,
                      price: Number(item.price) || 0,
                      quantity: Number(item.quantity) || 1,
                      images: item.images || [],
                    })) as any[]
                  : []
              }
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              customerInfo={customerData}
              deliveryInfo={delivery}
              isAuthenticated={isAuthenticated}
              onOpenSummary={() => {
                setShowSummaryModal(true);
              }}
              onUpdateMpesaPhone={(phone) => setCustomer((prev) => ({ ...prev, mpesaPhone: phone }))}
            />
          </Section>
        </div>

        {/* --- Summary Panel (sticky on desktop) --- */}
        <div className="w-full md:w-96 sticky top-24 h-fit hidden lg:block">
          <SummaryPanel
            subtotal={subtotal}
            shipping={shipping}
            packagingFee={PACKAGING_FEE}
            servicesFee={SERVICES_FEE}
            total={total}
            isPending={isPending || isProcessingMpesa || isAddingNotes}
            onCheckout={handleCheckout}
            disabled={
              !customerData.name ||
              !customerData.phone ||
              !customerData.email ||
              !delivery ||
              shippingLoading ||
              !calculateRequested ||
              isProcessingMpesa ||
              isAddingNotes
            } 
            isShippingCalculating={shippingLoading}
            shippingCalculated={calculateRequested}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            handleApplyCoupon={handleApplyCoupon}
            handleRemoveCoupon={handleRemoveCoupon}
            isApplyingCoupon={isApplyingCoupon}
            appliedCoupon={appliedCoupon}
          />
        </div>
      </div>

      {/* Mobile bottom summary / CTA */}
      <MobileBottomSummary
        subtotal={subtotal}
        shipping={shipping}
        total={total}
        onOpenSummary={() => setShowSummaryModal(true)}
        onCheckout={handleCheckout}
        isPending={isPending || isProcessingMpesa || isAddingNotes}
        disabled={
          !customerData.name ||
          !customerData.phone ||
          !customerData.email ||
          !delivery ||
          shippingLoading ||
          !calculateRequested ||
          isProcessingMpesa ||
          isAddingNotes
        }
        isShippingCalculating={shippingLoading}
      />

      {showSummaryModal && (
        <Sheet open={showSummaryModal} onOpenChange={setShowSummaryModal}>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Order Summary</SheetTitle>
            </SheetHeader>
            <SummaryPanel
              subtotal={subtotal}
              shipping={shipping}
              packagingFee={PACKAGING_FEE}
              servicesFee={SERVICES_FEE}
              total={total}
              isPending={isPending || isProcessingMpesa || isAddingNotes}
              onCheckout={handleCheckout}
              disabled={
                !customerData.name ||
                !customerData.phone ||
                !customerData.email ||
                !delivery ||
                shippingLoading ||
                !calculateRequested ||
                isProcessingMpesa ||
                isAddingNotes
              } 
              isShippingCalculating={shippingLoading}
              shippingCalculated={calculateRequested}
              couponCode={couponCode}
              setCouponCode={setCouponCode}
              handleApplyCoupon={handleApplyCoupon}
              handleRemoveCoupon={handleRemoveCoupon}
              isApplyingCoupon={isApplyingCoupon}
              appliedCoupon={appliedCoupon}
            />
          </SheetContent>
        </Sheet>
      )}

      {showAuthModal && (
        <CustomerAuthModal
          open={showAuthModal}
          onOpenChange={setShowAuthModal}
          onComplete={handleAuthComplete}
          context="checkout"
          allowGuestCheckout={true}
          delivery={delivery}
          customer={customerData}
        />
      )}
    </div>
  );
}
