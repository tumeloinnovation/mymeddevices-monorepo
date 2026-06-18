import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Shipping Policy — MyMedDevices',
  description:
    'Learn about MyMedDevices shipping and delivery process. We provide fast, reliable delivery across Kenya with same-day delivery in Nairobi.',
};

export default function ShippingPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16 space-y-20">
      {/* HEADER */}
      <header className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
          Shipping & Delivery Policy
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          At My Med Device Limited, we are committed to providing fast, reliable, and secure delivery services for all orders placed on our website. This policy outlines our shipping process, delivery timelines, and important customer guidelines.
        </p>
      </header>

      {/* SECTION 1 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">
          1. Order Processing & Dispatch
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          We process orders daily between 8:00 AM and 8:00 PM. Orders placed after 8:00 PM will be processed the next day.
        </p>

        <h3 className="text-lg font-semibold mb-3 text-foreground">Same-Day Delivery for Nairobi & Greater Nairobi</h3>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Nairobi County: Within 4 hours</li>
          <li>Greater Nairobi Metropolitan Area: Within 6 hours (Orders placed past 6:00 PM will be delivered by midday the next day).</li>
        </ul>

        <h3 className="text-lg font-semibold mb-3 text-foreground">Delivery to Other Regions in Kenya</h3>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Rest of Kenya: Within 24 hours (Orders placed after 8:00 PM will be delivered within 36 hours).</li>
        </ul>

        <p className="text-sm text-muted-foreground">
          We currently do NOT ship outside Kenya.
        </p>
      </section>

      {/* SECTION 2 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">2. Shipping Charges</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Shipping costs depend on the delivery location and will be calculated at checkout.
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Nairobi County: Standard delivery rates apply.</li>
          <li>Greater Nairobi Metropolitan Area: Additional fees may apply based on distance.</li>
          <li>Rest of Kenya: Charges vary depending on the courier service and location.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          Final shipping costs will be displayed before you confirm your order.
        </p>
      </section>

      {/* SECTION 3 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">3. Order Confirmation & Tracking</h2>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>After placing an order, you will receive a confirmation SMS or email with your order number.</li>
          <li>If you do not receive a confirmation message, contact us immediately.</li>
          <li>You will receive a notification when your order has been dispatched.</li>
          <li>The delivery agent will contact you when they arrive at your location.</li>
        </ul>
      </section>

      {/* SECTION 4 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">4. Pay-on-Delivery (Nairobi Only)</h2>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Available within Nairobi County ONLY.</li>
          <li>Payment must be made via MPESA before the package is handed over.</li>
          <li>Sealed items CANNOT be opened before payment.</li>
          <li>The delivery agent can only wait for 5 minutes before moving to the next order.</li>
        </ul>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-medium mb-2">Important:</p>
          <p className="text-sm text-yellow-700">
            For locations outside Nairobi, payment must be completed before dispatch.
          </p>
        </div>
      </section>

      {/* SECTION 5 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">5. Delivery Guidelines</h2>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Ensure someone is available to receive your order at the specified address.</li>
          <li>If you are not available, kindly inform our support team in advance.</li>
          <li>If delivery fails due to incorrect details, the package may be returned, and additional charges may apply.</li>
        </ul>
      </section>

      {/* SECTION 6 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">6. Contact Information</h2>
        <p className="text-sm text-muted-foreground mb-3">
          For any inquiries regarding your delivery, please reach out to us:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 mb-4">
          <li>
            📞 Phone:{' '}
                            <a href="tel:+254734585958" className="text-primary underline hover:opacity-90">+254 707 757 088</a>
          </li>
          <li>
            📧 Email:{' '}
            <Link
              href="mailto:support@mymeddevices.com"
              className="text-primary underline hover:opacity-90"
            >
              support@mymeddevices.com
            </Link>
          </li>
        </ul>
      </section>

      {/* FOOTER CTA */}
      <section className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-border rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold mb-2 text-foreground">
          Need help with your delivery?
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Our customer care team is always ready to assist you quickly and professionally.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/contact-us"
            className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:opacity-95 transition"
          >
            Contact Support
          </Link>
          <Link
            href="/shop"
            className="border border-border px-6 py-3 rounded-lg font-medium hover:bg-muted transition"
          >
            Continue Shopping
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-sm text-muted-foreground mt-8 space-y-2">
        <p>
          MyMedDevices — Kenya's trusted source for affordable, genuine home-based medical devices.
        </p>
        <p>
          <Link href="/" className="hover:underline">
            Home
          </Link>{' '}
          |{' '}
          <Link href="/shop" className="hover:underline">
            Shop
          </Link>{' '}
          |{' '}
          <Link href="/contact-us" className="hover:underline">
            Contact Us
          </Link>
        </p>
      </footer>
    </div>
  );
}