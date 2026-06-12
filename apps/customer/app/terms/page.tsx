import Link from "next/link"

export default function TermsPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-2">
          <Link href="/login" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            &larr; Back to login
          </Link>
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: June 11, 2026</p>
        </div>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>
              By accessing or using MyMedDevices, you agree to be bound by these Terms of Service.
              If you do not agree, you may not use the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">2. Description of Service</h2>
            <p>
              MyMedDevices provides a platform for managing medical device compliance, documentation,
              and vendor relationships. The specific features available depend on your account type.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">3. User Responsibilities</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activities that occur under your account. You agree to notify us
              immediately of any unauthorised use.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">4. Intellectual Property</h2>
            <p>
              All content, features, and functionality of the platform are owned by MyMedDevices
              and are protected by applicable intellectual property laws.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">5. Limitation of Liability</h2>
            <p>
              MyMedDevices shall not be liable for any indirect, incidental, special, or consequential
              damages arising from your use of the platform, to the maximum extent permitted by law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">6. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violations
              of these terms or for any other reason consistent with applicable law.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-semibold text-foreground">7. Contact</h2>
            <p>
              For questions about these terms, please contact us at support@mymeddevices.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
