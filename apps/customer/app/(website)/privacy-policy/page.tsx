import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy — MyMedDevices',
  description:
    'Learn about how MyMedDevices collects, uses, and protects your personal information. We are committed to safeguarding your privacy and ensuring a secure online experience.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16 space-y-20">
      {/* HEADER */}
      <header className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
          Privacy Policy
        </h1>
        <p className="text-muted-foreground leading-relaxed">
          At My Med Device Limited, we are committed to protecting your privacy and ensuring that your personal
          data is handled securely. This Privacy Policy outlines how we collect, use, store,
          and safeguard your information when you interact with our website and services.
        </p>
      </header>

      {/* SECTION 1 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">
          1. Information We Collect
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          We collect personal and non-personal data to enhance your experience and
          facilitate transactions.
        </p>

        <h3 className="text-lg font-semibold mb-3 text-foreground">A. Personal Information</h3>
        <p className="text-sm text-muted-foreground mb-3">
          When you interact with our website, we may collect:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Account Information – Name, phone number, email, physical address, and password.</li>
          <li>Order & Payment Details – Transaction history and payment method (MPESA).</li>
          <li>Communication Data – Information shared via calls, emails, or chat support.</li>
        </ul>

        <h3 className="text-lg font-semibold mb-3 text-foreground">B. Non-Personal Information</h3>
        <p className="text-sm text-muted-foreground mb-3">
          We may collect:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2">
          <li>Device & Browser Data – IP address, operating system, browser type, and device model.</li>
          <li>Website Usage Data – Pages visited, time spent on our site, and interaction patterns.</li>
        </ul>
      </section>

      {/* SECTION 2 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">2. How We Use Your Information</h2>
        <p className="text-sm text-muted-foreground mb-3">
          We use your data for:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Processing Orders & Payments – To confirm, process, and deliver your purchases.</li>
          <li>Customer Support – To respond to inquiries, returns, and complaints.</li>
          <li>Marketing & Promotions – To send exclusive deals (you can opt out anytime).</li>
          <li>Security & Fraud Prevention – To detect and prevent fraudulent activities.</li>
          <li>Service Improvement – To enhance user experience and optimize our website.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          <em>We do not sell, rent, or trade your personal data.</em>
        </p>
      </section>

      {/* SECTION 3 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">3. Data Protection & Security</h2>
        <p className="text-sm text-muted-foreground mb-3">
          We implement strong security measures, including:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Encrypted Transactions: MPESA payments are processed securely.</li>
          <li>Restricted Access: Only authorized personnel can access personal data.</li>
          <li>Secure Storage: Your information is stored with advanced protection.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          However, while we strive to protect your data, we encourage you to use strong passwords and avoid sharing sensitive details.
        </p>
      </section>

      {/* SECTION 4 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">4. Sharing Your Information</h2>
        <p className="text-sm text-muted-foreground mb-3">
          We only share your data in the following cases:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Trusted Service Providers – Courier partners for delivery, payment processors for transactions.</li>
          <li>Legal Requirements – When required by law enforcement or regulatory authorities.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          We do not share your data for marketing by third parties.
        </p>
      </section>

      {/* SECTION 5 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">5. Cookies & Tracking</h2>
        <p className="text-sm text-muted-foreground mb-3">
          We use cookies to enhance functionality and analyze website traffic.
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>To remember login details and shopping preferences.</li>
          <li>To provide targeted promotions and offers.</li>
          <li>To improve website performance and usability.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          You can manage or disable cookies in your browser settings, but doing so may affect site functionality.
        </p>
      </section>

      {/* SECTION 6 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">6. Your Rights & Choices</h2>
        <p className="text-sm text-muted-foreground mb-3">
          You have the right to:
        </p>
        <ul className="list-inside list-disc text-sm text-muted-foreground space-y-2 mb-4">
          <li>Access & Update Your Information – Modify your account details.</li>
          <li>Request Data Deletion – Ask us to delete your account and personal data.</li>
          <li>Opt-Out of Marketing – Unsubscribe from promotional emails.</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          To exercise your rights, contact us at{' '}
          <Link
            href="mailto:support@mymeddevices.com"
            className="text-primary underline hover:opacity-90"
          >
            support@mymeddevices.com
          </Link>.
        </p>
      </section>

      {/* SECTION 7 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">7. Changes to This Policy</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We may update this policy to reflect changes in business practices or legal
          requirements. Updates will be posted with a "Last Updated" date.
        </p>
      </section>

      {/* SECTION 8 */}
      <section className="bg-card p-8 rounded-2xl border border-border shadow-sm hover:shadow-md transition">
        <h2 className="text-2xl font-bold mb-4 text-foreground">8. Contact Us</h2>
        <p className="text-sm text-muted-foreground mb-3">
          For any privacy-related questions, reach out to us:
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
        </ul>
        <p className="text-sm text-muted-foreground">
          We are committed to safeguarding your privacy and ensuring a secure online experience.
        </p>
      </section>

      {/* FOOTER CTA */}
      <section className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border border-border rounded-2xl p-8 text-center">
        <h3 className="text-xl font-bold mb-2 text-foreground">
          Have questions about your privacy?
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