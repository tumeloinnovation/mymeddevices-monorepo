import Link from "next/link"

export default function PrivacyPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2">
          <Link href="/login" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            &larr; Back to login
          </Link>
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 11, 2026</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Information We Collect</h2>
            <p>
              We collect information you provide directly, such as your name, email address, phone number,
              and company details when you register for an account or use our services.
            </p>
            <p>
              We also automatically collect certain information about your device and usage patterns,
              including IP address, browser type, and pages visited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services;
              to process transactions; to send you technical notices and support messages;
              and to communicate with you about our services.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. Data Sharing and Disclosure</h2>
            <p>
              We do not sell your personal information. We may share your information with service
              providers who help us operate our platform, comply with legal obligations, or
              protect our rights.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Data Security</h2>
            <p>
              We implement appropriate technical and organisational measures to protect your
              personal information against unauthorised access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information. You may
              also object to or restrict certain processing of your data. To exercise these rights,
              please contact us through the settings page or email us.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at
              privacy@mymeddevices.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
