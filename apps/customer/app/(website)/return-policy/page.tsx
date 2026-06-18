import Link from 'next/link';

export const metadata = {
  title: 'Refunds & Returns — MyMedDevices',
  description:
    'Learn about MyMedDevices refund, returns, and exchange policy. We accept returns under specific conditions and process refunds within 14 days upon approval.',
};

export default function RefundsReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-16 space-y-20">
      {/* HEADER */}
      <header className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
          Refunds & Returns Policy
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          We value your trust. Please read our policy below to understand when and how you can
          request returns, exchanges, or refunds.
        </p>
      </header>

      {/* SECTION 1 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">
          1. Eligibility for Returns & Refunds
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          We accept return requests <strong>within 24 hours of delivery</strong> under the following
          conditions:
        </p>

        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Damaged or compromised packaging.</li>
          <li>Incorrect or incomplete order (wrong item, model, or missing accessories).</li>
          <li>Defective, used, or expired products upon delivery.</li>
        </ul>

        <p className="text-sm text-muted-foreground mb-2">
          <strong>Returns must:</strong> be in original packaging, unused (unless defective), and
          accompanied by the original receipt.
        </p>

        <div className="mt-3">
          <p className="font-semibold text-foreground mb-1 text-sm">
            Items NOT eligible for return:
          </p>
          <ul className="list-inside list-disc text-sm text-muted-foreground space-y-1">
            <li>Items damaged after delivery by the customer.</li>
            <li>Products opened or used (unless they are defective).</li>
            <li>Items returned due to a change of mind.</li>
          </ul>
        </div>
      </section>

      {/* SECTION 2 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">2. Refund Process</h2>
        <p className="text-sm text-muted-foreground mb-3">
          Once your return is received and approved, here’s what happens next:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>
            <strong>Inspection & Confirmation:</strong> Your returned item will be checked before
            approval.
          </li>
          <li>
            <strong>Refund Method:</strong> Refunds are processed through <strong>MPESA</strong> or
            issued as <strong>store credit</strong>.
          </li>
          <li>
            <strong>Processing Time:</strong> Completed within <strong>14 days</strong> after
            approval.
          </li>
        </ul>
        <p className="text-sm text-muted-foreground">
          <em>Note:</em> Sealed medical items must remain unopened for a refund to be approved.
        </p>
      </section>

      {/* SECTION 3 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">3. Exchange Policy</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If your product is defective or incorrect, you can request an exchange instead of a
          refund. Please contact us within 24 hours of delivery for assistance. We’ll replace the
          item once verified and approved.
        </p>
      </section>

      {/* SECTION 4 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">
          4. How to Request a Return or Refund
        </h2>
        <p className="text-sm text-muted-foreground mb-3">To start a return or refund request:</p>
        <ol className="list-inside list-decimal text-sm text-muted-foreground space-y-2 mb-4">
          <li>
            Email us at{' '}
            <Link
              href="mailto:support@mymeddevices.com"
              className="text-primary underline hover:opacity-90"
            >
              support@mymeddevices.com
            </Link>{' '}
            with your order details and reason for return.
          </li>
          <li>
            WhatsApp us at{' '}
                            <a href="tel:+254734585958" className="text-primary underline hover:opacity-90">+254 707 757 088</a>{' '}
            for quick assistance.
          </li>
          <li>
            Provide your <strong>Order Confirmation Number</strong> for faster verification.
          </li>
        </ol>
        <p className="text-sm text-muted-foreground">
          Our support team will guide you through the process once your request is received.
        </p>
      </section>

      {/* SECTION 5 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">5. Contact Us for Support</h2>
        <p className="text-sm text-muted-foreground mb-2">
          Have a question about your order or refund? We’re here to help:
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
            📞 Phone :{' '}
            <Link href="tel:+254734585958" className="text-primary underline hover:opacity-90">
              (+254) 734 585 958
            </Link>
          </li>
        </ul>
        <p className="text-sm text-muted-foreground mt-3">
          We aim to respond within business hours, Monday–Saturday, 9 AM–6 PM.
        </p>
      </section>

      {/* FOOTER CTA */}
      <section className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-border rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold mb-2 text-foreground">
          Need a replacement or refund assistance?
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
          MyMedDevices — Kenya’s trusted source for affordable, genuine home-based medical devices.
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
