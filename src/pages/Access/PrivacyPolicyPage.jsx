import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { PublicHeader, Footer } from '../../components';

export default function PrivacyPolicyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)] transition-colors">
      <PublicHeader />

      <main className="flex-1 py-12 sm:py-16">
        <article className="mx-auto w-full max-w-[760px] px-4 sm:px-6">
          <header className="mb-8 border-b border-[var(--border)] pb-6">
            <h1 className="font-['Outfit',sans-serif] text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
              Privacy Policy
            </h1>
            <p className="mt-2 text-xs font-medium text-[var(--muted)]">
              Last updated: November 15, 2026
            </p>
          </header>

          <div className="space-y-8 text-sm sm:text-base leading-relaxed text-[var(--muted-2)]">
            <p>
              MonitorMyHost provides website uptime monitoring and performance diagnostics. This policy explains what information we collect, how it is used, and your choices regarding your data.
            </p>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                1. Information We Collect
              </h2>
              <p>
                We only collect data necessary to provide our monitoring and diagnostic services:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[var(--muted-2)]">
                <li><strong>Account details:</strong> Your name and email address when you create an account.</li>
                <li><strong>Authentication data:</strong> Passwords stored via secure cryptographic hashing, or basic profile details (name, email) if you log in through Google OAuth.</li>
                <li><strong>Monitoring targets:</strong> The website URLs and hostnames you submit for uptime checks, TTFB tests, or audits.</li>
                <li><strong>Usage and telemetry:</strong> Server response codes, response latency, uptime history, IP addresses, and basic server access logs.</li>
                <li><strong>Support messages:</strong> Inquiries and contact details submitted through our contact form.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                2. How We Use Your Information
              </h2>
              <p>
                We use the collected information to:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-[var(--muted-2)]">
                <li>Create and manage your user account.</li>
                <li>Run synthetic uptime checks and performance diagnostics from global probe nodes.</li>
                <li>Deliver downtime alerts, verification OTPs, and essential service updates.</li>
                <li>Respond to customer support requests and troubleshoot platform issues.</li>
                <li>Prevent abuse, protect account security, and maintain service reliability.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                3. Data Sharing
              </h2>
              <p>
                We do not sell, rent, or trade your personal data. We only share information with trusted third-party 
                service providers who help us operate the platform 
                (such as cloud hosting), or when legally required by law.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                4. Data Security and Retention
              </h2>
              <p>
                All web traffic is encrypted in transit using HTTPS/TLS, and credentials are protected with one-way password hashing and restricted database access. While we employ standard industry safeguards, no method of electronic transmission over the Internet is 100% impenetrable.
              </p>
              <p>
                We retain your account details and monitoring logs for as long as your account remains active or as needed to provide historical metrics. If you delete your account, your personal data and configured monitors are removed or permanently anonymized.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                5. Your Rights
              </h2>
              <p>
                You have the right to access, update, or request deletion of your personal data at any time. You can manage your account settings directly within the dashboard or contact us to request data removal or copies of your information.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                6. Cookies and Sessions
              </h2>
              <p>
                We use essential session cookies  (such as authentication tokens ) 
                strictly to keep you logged in and preserve display preferences. We do not use third-party advertising or 
                cross-site tracking cookies. You can disable cookies in your browser, but essential features like logging 
                in will not function without them.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="font-['Outfit',sans-serif] text-lg sm:text-xl font-semibold text-[var(--text)]">
                7. Contact
              </h2>
              <p>
                If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at{' '}
                <a href="mailto:support@monitormyhost.com" className="font-medium text-[var(--cyan)] hover:underline">
                  support@monitormyhost.com
                </a>{' '}
                or reach out through our{' '}
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
