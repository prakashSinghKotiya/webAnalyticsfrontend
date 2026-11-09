import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { getAppUrl } from '../../utils/subdomainNav';
import { useTheme, useToast } from '../../context';
import { Logo, Footer } from '../../components';
import { submitContactMessage, ENQUIRY_TOPICS } from '../../api';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--cyan)] transition hover:border-[var(--border-bright)]"
    >
      {theme === 'dark' ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export default function ContactPage() {
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    enquiryTopic: 'support',
    message: '',
  });

  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [copiedRefId, setCopiedRefId] = useState(false);

  const messageLength = formData.message.length;
  const maxMessageLength = 5000;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setGeneralError('');
    setIsRateLimited(false);

    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    const trimmedName = formData.name.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedMessage = formData.message.trim();

    if (!trimmedName) {
      errors.name = 'Please enter your name.';
    } else if (trimmedName.length > 100) {
      errors.name = 'Name cannot exceed 100 characters.';
    }

    if (!trimmedEmail) {
      errors.email = 'Please enter your email address.';
    } else if (!EMAIL_REGEX.test(trimmedEmail) || trimmedEmail.length > 320) {
      errors.email = 'Please provide a valid email address (e.g. name@company.com).';
    }

    const validTopics = ENQUIRY_TOPICS.map((t) => t.value);
    if (!validTopics.includes(formData.enquiryTopic)) {
      errors.enquiryTopic = 'Please select a valid enquiry topic.';
    }

    if (!trimmedMessage) {
      errors.message = 'Please enter your message or infrastructure question.';
    } else if (trimmedMessage.length > maxMessageLength) {
      errors.message = `Message cannot exceed ${maxMessageLength.toLocaleString()} characters.`;
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError('');
    setIsRateLimited(false);

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setGeneralError('Please review the highlighted fields below.');
      return;
    }

    setLoading(true);

    try {
      const response = await submitContactMessage({
        name: formData.name,
        email: formData.email,
        enquiryTopic: formData.enquiryTopic,
        message: formData.message,
      });

      setSubmissionResult({
        id: response?.data?.id || null,
        message: response?.message || 'Your message has been received successfully. Our team will get back to you shortly.',
        senderName: formData.name.trim(),
        senderEmail: formData.email.trim(),
        enquiryTopic: formData.enquiryTopic,
      });
      setSubmitted(true);
      toast?.success(response?.message || 'Inquiry submitted successfully!');
    } catch (err) {
      const status = err.status || err.response?.status;
      if (status === 429) {
        setIsRateLimited(true);
        setGeneralError('Rate limit exceeded: You have submitted 5 inquiries in the last 15 minutes. Please wait before submitting another inquiry.');
      } else if (status === 400 && Array.isArray(err.errors) && err.errors.length > 0) {
        const mappedErrors = {};
        err.errors.forEach((issue) => {
          if (issue.field) {
            mappedErrors[issue.field] = issue.message;
          }
        });
        setFieldErrors(mappedErrors);
        setGeneralError(err.message || 'Validation failed. Please correct your inputs.');
      } else {
        setGeneralError(err.message || 'Unable to submit your inquiry at this moment. Please try again later or email us directly.');
      }
      toast?.error(err.message || 'Failed to submit inquiry.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      enquiryTopic: 'support',
      message: '',
    });
    setFieldErrors({});
    setGeneralError('');
    setIsRateLimited(false);
    setSubmitted(false);
    setSubmissionResult(null);
    setCopiedRefId(false);
  };

  const handleCopyRefId = async () => {
    if (!submissionResult?.id) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(submissionResult.id);
      }
      setCopiedRefId(true);
      setTimeout(() => setCopiedRefId(false), 2000);
    } catch {
      // Fallback
    }
  };

  const selectedTopicMeta = ENQUIRY_TOPICS.find((t) => t.value === formData.enquiryTopic) || ENQUIRY_TOPICS[0];

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[var(--text)] transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo to={ROUTES.PUBLIC_HOME} />
          {/* Desktop Nav */}
          <nav aria-label="Contact page navigation" className="hidden lg:flex items-center gap-7">
            <Link to={ROUTES.PUBLIC_HOME} className="text-sm font-medium text-[var(--muted-2)] transition hover:text-[var(--text)]">
              Home
            </Link>
            <Link to="/ttfb-test" className="text-sm font-medium text-[var(--muted-2)] transition hover:text-[var(--text)]">
              Tools
            </Link>
            <Link to={ROUTES.ABOUT} className="text-sm font-medium text-[var(--muted-2)] transition hover:text-[var(--text)]">
              About
            </Link>
            <a href="/#pricing" className="text-sm font-medium text-[var(--muted-2)] transition hover:text-[var(--text)]">
              Pricing
            </a>
            <Link to={ROUTES.CONTACT} className="text-sm font-semibold text-[var(--cyan)]">
              Contact
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={getAppUrl(ROUTES.LOGIN)}
              className="hidden sm:inline-flex text-xs sm:text-sm font-semibold text-[var(--text-2)] hover:text-[var(--cyan)] transition"
            >
              Sign In
            </a>
            <a
              href={getAppUrl(ROUTES.REGISTER)}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition"
            >
              Get Started Free
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {/* Hero Banner */}
        <section className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface-2)]/30 py-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--glow-bg),transparent_70%)]" />
          <div className="relative mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8 text-center">
            <span className="font-['JetBrains_Mono',monospace] inline-flex items-center gap-2 rounded-full border border-[var(--cyan-mid)] bg-[var(--cyan-dim)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--cyan)]">
              Support &amp; Inquiries
            </span>
            <h1 className="font-['Outfit',sans-serif] mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Get in Touch with{' '}
              <span className="bg-gradient-to-r from-[var(--cyan)] to-[var(--green)] bg-clip-text text-transparent">
                MonitorMyHost
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[var(--muted-2)] sm:text-base">
              Need assistance with website monitoring, custom probe deployment, or enterprise SLA plans? Our infrastructure engineering team is here to help.
            </p>
          </div>
        </section>

        {/* Content Section: Support Channels (Left) & Contact Form (Right) */}
        <section className="mx-auto w-full max-w-[1200px] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Left Column: Direct Channels & Help (5 Cols) */}
            <div className="space-y-6 lg:col-span-5">
              <div>
                <h2 className="font-['Outfit',sans-serif] text-xl font-bold tracking-tight">
                  Support Channels
                </h2>
                <p className="mt-2 text-xs leading-6 text-[var(--muted-2)]">
                  Reach out through our direct engineering channels for rapid resolution.
                </p>
              </div>

              {/* Technical Support Card */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--border-bright)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--cyan-mid)] bg-[var(--cyan-dim)] text-[var(--cyan)]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[var(--text)]">Technical Support</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">Uptime alert diagnostics &amp; API assistance.</p>
                    <a
                      href="mailto:support@monitormyhost.com"
                      className="font-['JetBrains_Mono',monospace] mt-2.5 inline-block text-xs font-semibold text-[var(--cyan)] hover:underline"
                    >
                      support@monitormyhost.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Sales & Enterprise Card */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-[var(--border-bright)]">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--green)]/30 bg-[var(--green-dim)] text-[var(--green)]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[var(--text)]">Sales &amp; Enterprise</h3>
                    <p className="mt-1 text-xs text-[var(--muted)]">Dedicated probe nodes, SAML/SSO &amp; volume tiers.</p>
                    <a
                      href="mailto:sales@monitormyhost.com"
                      className="font-['JetBrains_Mono',monospace] mt-2.5 inline-block text-xs font-semibold text-[var(--green)] hover:underline"
                    >
                      sales@monitormyhost.com
                    </a>
                  </div>
                </div>
              </div>

              {/* Live Status & SLA Card */}
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
                <div className="flex items-center justify-between">
                  <span className="font-['JetBrains_Mono',monospace] text-xs font-bold uppercase tracking-wider text-[var(--muted-2)]">
                    Network Health
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--green)]">
                    <span className="h-2 w-2 rounded-full bg-[var(--green)] motion-safe:animate-pulse"></span>
                    Operational
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                  All global probe clusters in North America, Europe, and Asia-Pacific are operating at sub-second response times.
                </p>
                <div className="font-['JetBrains_Mono',monospace] mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3 text-[11px] text-[var(--muted-2)]">
                  <span>Support SLA: &lt; 2 hrs</span>
                  <span>Availability: 99.99%</span>
                </div>
              </div>
            </div>

            {/* Right Column: Contact Form (7 Cols) */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8 md:p-10 shadow-[var(--shadow-card)]">
                <div className="mb-6">
                  <h2 className="font-['Outfit',sans-serif] text-xl font-bold tracking-tight">
                    Send Us a Message
                  </h2>
                  <p className="mt-1.5 text-xs text-[var(--muted)]">
                    Fill out the form below. We typically respond within two hours during business operations.
                  </p>
                </div>

                {submitted && submissionResult ? (
                  <div className="rounded-2xl border border-[var(--green)]/30 bg-[var(--green-dim)] p-8 text-center animate-fade-in">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--green)] text-white shadow-lg">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <h3 className="font-['Outfit',sans-serif] mt-5 text-xl font-bold text-[var(--text)]">
                      Message Sent Successfully!
                    </h3>
                    <p className="mx-auto mt-2.5 max-w-md text-xs leading-6 text-[var(--muted-2)]">
                      Thank you, <strong className="text-[var(--text)]">{submissionResult.senderName}</strong>. {submissionResult.message}
                    </p>

                    {submissionResult.id && (
                      <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--border-mid)] bg-[var(--surface)] px-3.5 py-1.5 text-xs text-[var(--text-2)] font-['JetBrains_Mono',monospace]">
                        <span className="text-[var(--muted)] text-[11px]">Ticket ID:</span>
                        <span className="font-semibold text-[var(--cyan)]">{submissionResult.id}</span>
                        <button
                          type="button"
                          onClick={handleCopyRefId}
                          className="cursor-pointer ml-1 text-[var(--muted)] hover:text-[var(--text)] transition border-none bg-transparent"
                          title="Copy ticket reference ID"
                        >
                          {copiedRefId ? (
                            <span className="text-[10px] font-bold text-[var(--green)]">Copied!</span>
                          ) : (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                            </svg>
                          )}
                        </button>
                      </div>
                    )}

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={handleReset}
                        className="cursor-pointer rounded-xl border border-[var(--border-bright)] bg-[var(--surface-2)] px-5 py-2.5 text-xs font-semibold text-[var(--text)] transition hover:bg-[var(--surface)] active:scale-95"
                      >
                        Send Another Inquiry
                      </button>
                      <Link
                        to={ROUTES.PUBLIC_HOME}
                        className="cursor-pointer rounded-xl bg-[var(--cyan-dim)] border border-[var(--cyan)]/30 px-5 py-2.5 text-xs font-semibold text-[var(--cyan)] transition hover:bg-[var(--cyan-dim)]/80"
                      >
                        Return to Home
                      </Link>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    {/* General Error / Rate Limit Alert */}
                    {generalError && (
                      <div
                        role="alert"
                        className={`rounded-xl border p-4 text-xs transition ${
                          isRateLimited
                            ? 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300'
                            : 'border-[var(--red)]/40 bg-[var(--red-dim,rgba(239,68,68,0.1))] text-[var(--red)]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {isRateLimited ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5">
                              <circle cx="12" cy="12" r="10" />
                              <line x1="12" y1="8" x2="12" y2="12" />
                              <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                          )}
                          <div className="flex-1 leading-5 font-medium">
                            {generalError}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Name & Email Row */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="contact-name" className="block text-xs font-semibold text-[var(--text-2)] mb-2">
                          Your Name <span className="text-[var(--cyan)]">*</span>
                        </label>
                        <input
                          id="contact-name"
                          name="name"
                          type="text"
                          required
                          maxLength={100}
                          autoComplete="name"
                          placeholder="e.g. Alex Morgan"
                          value={formData.name}
                          onChange={handleChange}
                          disabled={loading}
                          aria-invalid={Boolean(fieldErrors.name)}
                          className={`w-full rounded-xl border bg-[var(--surface-2)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)] disabled:opacity-50 ${
                            fieldErrors.name ? 'border-[var(--red)] ring-1 ring-[var(--red)]' : 'border-[var(--border)]'
                          }`}
                        />
                        {fieldErrors.name && (
                          <p className="mt-1.5 text-[11px] font-medium text-[var(--red)]">{fieldErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="contact-email" className="block text-xs font-semibold text-[var(--text-2)] mb-2">
                          Your Email <span className="text-[var(--cyan)]">*</span>
                        </label>
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          required
                          maxLength={320}
                          autoComplete="email"
                          placeholder="alex@company.com"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={loading}
                          aria-invalid={Boolean(fieldErrors.email)}
                          className={`w-full rounded-xl border bg-[var(--surface-2)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)] disabled:opacity-50 ${
                            fieldErrors.email ? 'border-[var(--red)] ring-1 ring-[var(--red)]' : 'border-[var(--border)]'
                          }`}
                        />
                        {fieldErrors.email && (
                          <p className="mt-1.5 text-[11px] font-medium text-[var(--red)]">{fieldErrors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Inquiry Topic Dropdown */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="contact-enquiryTopic" className="block text-xs font-semibold text-[var(--text-2)]">
                          Inquiry Topic <span className="text-[var(--cyan)]">*</span>
                        </label>
                        <span className="text-[11px] text-[var(--muted)] font-['JetBrains_Mono',monospace]">
                          {selectedTopicMeta.shortLabel}
                        </span>
                      </div>
                      <select
                        id="contact-enquiryTopic"
                        name="enquiryTopic"
                        value={formData.enquiryTopic}
                        onChange={handleChange}
                        disabled={loading}
                        aria-invalid={Boolean(fieldErrors.enquiryTopic)}
                        className={`w-full rounded-xl border bg-[var(--surface-2)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] outline-none transition focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)] cursor-pointer disabled:opacity-50 ${
                          fieldErrors.enquiryTopic ? 'border-[var(--red)]' : 'border-[var(--border)]'
                        }`}
                      >
                        {ENQUIRY_TOPICS.map((topic) => (
                          <option key={topic.value} value={topic.value}>
                            {topic.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[11px] text-[var(--muted)]">
                        {selectedTopicMeta.description}
                      </p>
                      {fieldErrors.enquiryTopic && (
                        <p className="mt-1 text-[11px] font-medium text-[var(--red)]">{fieldErrors.enquiryTopic}</p>
                      )}
                    </div>

                    {/* Message Area */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label htmlFor="contact-message" className="block text-xs font-semibold text-[var(--text-2)]">
                          Message <span className="text-[var(--cyan)]">*</span>
                        </label>
                        <span
                          className={`font-['JetBrains_Mono',monospace] text-[11px] ${
                            messageLength > 4800
                              ? 'text-[var(--red)] font-bold'
                              : messageLength > 4000
                              ? 'text-amber-500 font-semibold'
                              : 'text-[var(--muted)]'
                          }`}
                        >
                          {messageLength.toLocaleString()} / {maxMessageLength.toLocaleString()}
                        </span>
                      </div>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows="5"
                        required
                        maxLength={maxMessageLength}
                        placeholder="Describe your question or infrastructure requirements in detail..."
                        value={formData.message}
                        onChange={handleChange}
                        disabled={loading}
                        aria-invalid={Boolean(fieldErrors.message)}
                        className={`w-full rounded-xl border bg-[var(--surface-2)] px-3.5 py-2.5 text-xs sm:text-sm text-[var(--text)] placeholder:text-[var(--muted)] outline-none transition focus:border-[var(--cyan)] focus:ring-1 focus:ring-[var(--cyan)] resize-y min-h-[130px] disabled:opacity-50 ${
                          fieldErrors.message ? 'border-[var(--red)] ring-1 ring-[var(--red)]' : 'border-[var(--border)]'
                        }`}
                      />
                      {fieldErrors.message && (
                        <p className="mt-1.5 text-[11px] font-medium text-[var(--red)]">{fieldErrors.message}</p>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="font-['Outfit',sans-serif] flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--cyan)] to-[var(--action-end,var(--cyan))] px-7 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                            </svg>
                            Sending Inquiry...
                          </>
                        ) : (
                          <>
                            Submit Inquiry
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="22" y1="2" x2="11" y2="13" />
                              <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-[11px] text-[var(--muted)]">
                      We value your privacy. Submissions are encrypted in transit and never shared with third parties.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Shared Responsive Footer */}
      <Footer />
    </div>
  );
}
