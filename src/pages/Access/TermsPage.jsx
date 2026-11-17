import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { PublicHeader, Footer } from '../../components';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)] transition-colors">
      <PublicHeader />

      <main className="flex-1 py-12 sm:py-16">
        <article className="mx-auto w-full max-w-[760px] px-4 sm:px-6">
          <header className="mb-8 border-b border-[var(--border)] pb-6">
            <h1 className="font-['Outfit',sans-serif] text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
              Terms of Use
            </h1>
            <p className="mt-2 text-xs font-medium text-[var(--muted)]">
              Last updated: November 15, 2026
            </p>
          </header>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-[var(--muted-2)]">
            <p>
              These Terms of Use govern your access to and use of MonitorMyHost, our synthetic uptime monitoring tools, and diagnostic services.
            </p>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using MonitorMyHost, you agree to be bound by these Terms of Use and our{' '}
                <Link to={ROUTES.PRIVACY} className="text-[var(--cyan)] hover:underline">
                  Privacy Policy
                </Link>
                . If you do not agree, please do not use our services.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                2. Eligibility and Accounts
              </h2>
              <p>
                You must provide accurate information when creating an account. You are responsible for safeguarding your login credentials and OTP codes, and for all activity that occurs under your account.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                3. Acceptable Use
              </h2>
              <p>
                You agree not to use the service for unlawful acts, harassment, spam, or impersonation. You may not attempt to probe, hack, disrupt, or overload our platform, probe nodes, or any target without proper authorization.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                4. User Content and Monitored Targets
              </h2>
              <p>
                You retain ownership of the URLs and data you submit, but grant us permission to store, query, and display them as needed to run the service. You must not submit unlawful or harmful content.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                5. Account Suspension or Termination
              </h2>
              <p>
                We reserve the right to suspend or delete your account and restrict access to the service at any time if you violate these terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                6. Service Availability
              </h2>
              <p>
                MonitorMyHost is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. The service may change or experience temporary interruptions without notice or liability.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                7. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, MonitorMyHost is not liable for any indirect, incidental, or consequential damages resulting from your use of the service.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                8. Changes to Terms
              </h2>
              <p>
                We may update these terms periodically. Continued use of the platform after changes are posted constitutes your acceptance of the revised terms.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                9. Contact
              </h2>
              <p>
                If you have questions about these Terms of Use, please contact us at{' '}
                <a href="mailto:support@monitormyhost.com" className="font-medium text-[var(--cyan)] hover:underline">
                  support@monitormyhost.com
                </a>{' '}
                or through our{' '}
                <Link to={ROUTES.CONTACT} className="font-medium text-[var(--cyan)] hover:underline">
                  Contact page
                </Link>.
              </p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
