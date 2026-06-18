import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions — MyMedDevices',
  description:
    'Read MyMedDevices Terms & Conditions. By using our website, you agree to comply with these terms regarding eligibility, payments, shipping, and more.',
};

export default function TermsAndConditionsPage() {
  return (
    <div className="container mx-auto px-4 py-16 space-y-20">
      {/* HEADER */}
      <header className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
          Terms & Conditions
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          Welcome to My Med Device Limited! By using our website, you agree to comply with the following Terms and Conditions. If you disagree with any part of these terms, kindly refrain from using our services.
        </p>
      </header>

      {/* SECTION 1 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">
          1. Eligibility
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          To use our services, you must:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Be at least 18 years old.</li>
          <li>Have the legal capacity to enter into a contract under Kenyan law.</li>
          <li>Agree to these Terms and Conditions in full.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          We rely on the accuracy of the information you provide. If an unauthorized
          person uses your account, we are not liable for any losses incurred.
        </p>
      </section>

      {/* SECTION 2 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">2. Registration & Account Security</h2>
        <p className="text-sm text-muted-foreground mb-3">
          To access certain features, you may need to create an account and provide
          details such as:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Full Name</li>
          <li>Date of Birth</li>
          <li>Phone Number</li>
          <li>Email Address</li>
          <li>Physical Address</li>
          <li>Password</li>
        </ul>
        <p className="text-sm text-muted-foreground mb-3">
          By registering, you agree to:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Keep your login details confidential.</li>
          <li>Notify us immediately if you suspect unauthorized access.</li>
          <li>Be responsible for all activities under your account.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          You may cancel your account at any time by contacting our support team.
        </p>
      </section>

      {/* SECTION 3 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">3. Terms of Sale</h2>
        <p className="text-sm text-muted-foreground mb-3">
          When purchasing from My Med Device Limited, you acknowledge that:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>We facilitate transactions but are not a party to the sale between the seller and purchaser.</li>
          <li>Sellers must provide accurate product descriptions and disclose any applicable warranties.</li>
          <li>Prices include all applicable taxes under Kenyan law.</li>
          <li>Additional charges (if any) must be explicitly stated before purchase.</li>
        </ul>
      </section>

      {/* SECTION 4 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">4. Payment Methods</h2>
        <p className="text-sm text-muted-foreground mb-3">
          We currently only accept MPESA as our payment method.
        </p>
        <h3 className="text-lg font-semibold mb-3 text-foreground">Pay-on-Delivery (Nairobi Only)</h3>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Available for deliveries within Nairobi County.</li>
          <li>Payment must be made via MPESA upon delivery.</li>
          <li>The delivery agent will wait 5 minutes before moving on to the next order.</li>
        </ul>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 font-medium mb-2">Important:</p>
          <ul className="list-inside list-disc text-sm text-yellow-700 space-y-1">
            <li>Ensure your MPESA account has sufficient funds before the delivery arrives.</li>
            <li>Sealed items cannot be unsealed before payment.</li>
          </ul>
        </div>
        <p className="text-sm text-muted-foreground mt-3">
          For orders outside Nairobi, payment must be completed before dispatch.
        </p>
      </section>

      {/* SECTION 5 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">5. Shipping & Delivery Policy</h2>
        <p className="text-sm text-muted-foreground mb-3">
          We prioritize fast and efficient delivery.
        </p>
        <h3 className="text-lg font-semibold mb-3 text-foreground">A. Order Processing & Dispatch</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Orders placed between 8:00 AM and 8:00 PM will be delivered as follows:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Nairobi County: Within 4 hours</li>
          <li>Greater Nairobi Metropolitan Area: Within 6 hours (Orders after 6:00 PM will be delivered the next day by midday)</li>
          <li>Rest of Kenya: Within 24 hours</li>
        </ul>
        <p className="text-sm text-muted-foreground mb-3">
          Orders placed after 8:00 PM will be delivered as follows:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Nairobi County: By 10:00 AM the next day</li>
          <li>Greater Nairobi Metropolitan Area: By midday the next day</li>
          <li>Rest of Kenya: Within 36 hours</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          We currently do NOT ship outside Kenya.
        </p>
      </section>

      {/* SECTION 6 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">6. Order Confirmation & Tracking</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Once you place an order:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>You'll receive a confirmation SMS or email with your order number.</li>
          <li>If you don't receive a confirmation, contact us immediately.</li>
          <li>You'll be notified when your order is dispatched.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          The delivery agent will call you upon arrival to confirm delivery.
        </p>
      </section>

      {/* SECTION 7 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">7. Returns & Refunds</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Returns are accepted within 24 hours if:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>The item was damaged upon arrival.</li>
          <li>You received the wrong product.</li>
          <li>The product is expired or defective.</li>
          <li>The item has missing accessories.</li>
        </ul>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-800 font-medium mb-2">Returns are NOT accepted if:</p>
          <ul className="list-inside list-disc text-sm text-red-700 space-y-1">
            <li>You changed your mind after purchase.</li>
            <li>The product was damaged after delivery.</li>
            <li>The item has been opened or used unless it is defective.</li>
          </ul>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Refunds are processed within 14 days after the returned product is inspected.
        </p>
        <p className="text-sm text-muted-foreground mb-3">
          For returns, contact us immediately at:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            📧 Email:{' '}
            <Link
              href="mailto:support@mymeddevices.com"
              className="text-primary underline hover:opacity-90"
            >
              support@mymeddevices.com
            </Link>
          </li>
          <li>
            📞 Phone:{' '}
                            <a href="tel:+254734585958" className="text-primary underline hover:opacity-90">+254 707 757 088</a>
          </li>
        </ul>
      </section>

      {/* SECTION 8 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">8. Liability & Disclaimers</h2>
        <p className="text-sm text-muted-foreground mb-3">
          We strive for accuracy, but:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Product images are for illustration purposes – actual items may differ slightly.</li>
          <li>We are not responsible for third-party seller descriptions or misleading information.</li>
          <li>We do not guarantee uninterrupted website access due to technical issues beyond our control.</li>
        </ul>
      </section>

      {/* SECTION 9 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">9. Intellectual Property Rights</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          All website content (logos, text, images, trademarks) belongs to My Med Device Limited and cannot be copied, modified, or distributed without permission.
        </p>
      </section>

      {/* SECTION 10 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">10. Governing Law</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          These Terms & Conditions are governed by the laws of Kenya. Any disputes will be resolved under Kenyan jurisdiction.
        </p>
      </section>

      {/* SECTION 11 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">11. Changes to Terms & Conditions</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We may update these terms at any time. Changes will be posted on our website with an "Effective Date."
        </p>
      </section>

      {/* SECTION 12 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">12. Contact Information</h2>
        <p className="text-sm text-muted-foreground mb-3">
          For inquiries, reach us via:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 mb-4">
          <li>
            📧 Email:{' '}
            <Link
              href="mailto:support@mymeddevices.com"
              className="text-primary underline hover:opacity-90"
            >
              support@mymeddevices.com
            </Link>
          </li>
          <li>
            📞 Phone:{' '}
                            <a href="tel:+254734585958" className="text-primary underline hover:opacity-90">+254 707 757 088</a>
          </li>
          <li>
            🌐 Website:{' '}
            <Link
              href="https://mymeddevices.com"
              className="text-primary underline hover:opacity-90"
              target="_blank"
              rel="noopener noreferrer"
            >
              https://mymeddevices.com
            </Link>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          By continuing to use our website, you agree to these terms.
        </p>
      </section>

      {/* FOOTER CTA */}
      <section className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-border rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold mb-2 text-foreground">
          Have questions about our terms?
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