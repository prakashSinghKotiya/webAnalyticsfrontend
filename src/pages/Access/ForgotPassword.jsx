import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useToast, useTheme } from '../../context'
import { ROUTES } from '../../constants'
import { getLandingUrl } from '../../utils/subdomainNav'

const display = "font-['Outfit',sans-serif]"
const mono = "font-['JetBrains_Mono',monospace]"

function Logo() {
  return (
    <a href={getLandingUrl('/')} className="inline-flex items-center gap-2.5 no-underline">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--cyan)] to-[var(--green)] shadow-[0_0_16px_var(--cyan-mid)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </span>
      <span className={`${display} text-lg font-bold tracking-tight text-[var(--text)]`}>
        Monitor<span className="text-[var(--cyan)]">MyHost</span>
      </span>
    </a>
  )
}

function ThemeButton() {
  const { isDark, toggleTheme } = useTheme()
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-[var(--border-mid)] bg-[var(--surface)] text-[var(--muted-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)]"
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      )}
    </button>
  )
}

function Field({ label, id, error, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className={`${mono} text-[11px] font-medium uppercase tracking-[0.1em] text-[var(--muted-2)]`}>
          {label}
        </label>
      </div>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-[var(--red)]">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--muted)]">{hint}</p>
      ) : null}
    </div>
  )
}

const inputCls = (err) =>
  `w-full rounded-[10px] border bg-[var(--surface)] px-3.5 py-3 text-sm text-[var(--text)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--cyan)] focus:shadow-[0_0_0_3px_var(--cyan-dim)] ${
    err ? 'border-[var(--red)]' : 'border-[var(--border-mid)]'
  }`

function PasswordInput({ id, value, onChange, error, placeholder, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`${inputCls(error)} pr-16`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className={`${mono} absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md border-none bg-transparent px-2 py-1 text-[11px] uppercase tracking-wider text-[var(--muted-2)] transition hover:text-[var(--cyan)]`}
      >
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  )
}

function strength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 14) s++
  return s
}

const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

// Step 1: Enter email and trigger OTP dispatch
function StepEmail({ onNext, defaultEmail = '' }) {
  const { sendForgotPasswordOtp } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState(defaultEmail)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    const trimmed = email.trim().toLowerCase()
    if (!emailOk(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setLoading(true)

    try {
      await sendForgotPasswordOtp(trimmed)
      toast.success(`Verification code sent to ${trimmed}`)
      onNext(trimmed)
    } catch (err) {
      const errMsg = err?.response?.data?.error || err?.error || err?.message || 'Failed to send OTP code.'
      setError(errMsg)
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field label="Registered Account Email" id="email" error={error}>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className={inputCls(error)}
          autoFocus
        />
      </Field>

      <button
        type="submit"
        disabled={loading}
        className={`${display} flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-none bg-gradient-to-br from-[var(--cyan)] to-[#0099ff] px-5 py-3 text-[15px] font-bold text-white shadow-[0_0_24px_var(--cyan-mid)] transition hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-white/30 border-t-white" />
            <span>Sending code…</span>
          </>
        ) : (
          'Send Verification Code'
        )}
      </button>
    </form>
  )
}

// Step 2: Enter OTP code and New Password
function StepReset({ email, onBack }) {
  const { forgotPassword, sendForgotPasswordOtp } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const score = strength(newPassword)
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['var(--red)', 'var(--red)', 'var(--orange)', 'var(--green)', 'var(--green)']

  const handleResend = async () => {
    setResending(true)
    try {
      await sendForgotPasswordOtp(email)
      toast.success(`New code sent to ${email}`)
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.error || 'Failed to resend code.')
    } finally {
      setResending(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (otp.trim().length !== 4) {
      errs.otp = 'Enter the 4-digit code.'
    }
    if (score < 2) {
      errs.newPassword = 'Use 8+ characters with a mix of letters and numbers.'
    }
    if (newPassword !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.'
    }
    setErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    try {
      await forgotPassword({
        email,
        otp: otp.trim(),
        password: newPassword,
      })
      toast.success('Password reset successfully! Please sign in with your new password.')
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (err) {
      const errMsg = err?.response?.data?.error || err?.error || err?.message || 'Password reset failed.'
      setErrors({ form: errMsg })
      toast.error(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-sm">
        <span className="truncate text-[var(--muted-2)]">
          Code sent to: <strong className="text-[var(--text)]">{email}</strong>
        </span>
        <button
          type="button"
          onClick={onBack}
          className={`${mono} text-xs text-[var(--cyan)] hover:underline cursor-pointer`}
        >
          Change
        </button>
      </div>

      <Field label="4-Digit Code" id="otp" error={errors.otp}>
        <div className="flex items-center gap-2">
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="1234"
            className={`${inputCls(errors.otp)} ${mono} text-center tracking-[0.5em] text-lg font-bold`}
            autoFocus
          />
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className={`${mono} h-[46px] shrink-0 rounded-[10px] border border-[var(--border-mid)] bg-[var(--surface)] px-3 text-xs text-[var(--muted-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)] disabled:opacity-50`}
          >
            {resending ? 'Sending…' : 'Resend'}
          </button>
        </div>
      </Field>

      <Field label="New Password" id="newPassword" error={errors.newPassword}>
        <PasswordInput
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          error={errors.newPassword}
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
        <div className="mt-2.5 flex items-center gap-3">
          <div className="flex flex-1 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-1 flex-1 rounded-full transition-colors duration-300"
                style={{ background: i < score ? colors[score] : 'var(--bar-track)' }}
              />
            ))}
          </div>
          <span className={`${mono} w-16 text-right text-[11px] text-[var(--muted-2)]`}>
            {newPassword ? labels[score] : ''}
          </span>
        </div>
      </Field>

      <Field label="Confirm New Password" id="confirmPassword" error={errors.confirmPassword}>
        <PasswordInput
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          placeholder="Re-enter your new password"
          autoComplete="new-password"
        />
      </Field>

      {errors.form && (
        <p role="alert" className="text-center text-xs text-[var(--red)]">
          {errors.form}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className={`${display} flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-none bg-gradient-to-br from-[var(--cyan)] to-[#0099ff] px-5 py-3 text-[15px] font-bold text-white shadow-[0_0_24px_var(--cyan-mid)] transition hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-white/30 border-t-white" />
            <span>Resetting password…</span>
          </>
        ) : (
          'Set New Password'
        )}
      </button>
    </form>
  )
}

function ShowcasePanel() {
  return (
    <aside className="grid-bg relative hidden overflow-hidden border-l border-[var(--border)] bg-[var(--bg-deep)] p-12 lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[var(--glow-bg)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[var(--green-dim)] blur-3xl" />
      <div className="relative">
        <span className={`${mono} inline-flex items-center gap-2 rounded-full border border-[var(--border-bright)] bg-[var(--cyan-dim)] px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-[var(--cyan)]`}>
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--green)]" /> ACCOUNT SECURITY
        </span>
        <h2 className={`${display} mt-6 max-w-md text-4xl font-extrabold leading-[1.08] tracking-tight text-[var(--text)]`}>
          Secure, effortless account recovery.
        </h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--muted-2)]">
          Password updates immediately revoke all stale sessions across all connected devices and browsers.
        </p>
      </div>
      <div className="relative my-10 rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--hero-shadow)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--green-dim)] text-[var(--green)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <h4 className={`${display} text-sm font-bold text-[var(--text)]`}>Bank-Grade Session Invalidation</h4>
            <p className="text-xs text-[var(--muted-2)]">Zero lingering sessions upon reset.</p>
          </div>
        </div>
      </div>
      <footer className={`${mono} text-xs text-[var(--muted)]`}>MonitorMyHost · High-performance observability</footer>
    </aside>
  )
}

export default function ForgotPassword() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', localStorage.getItem('wp-theme') ?? 'dark')
  }, [])

  return (
    <div className="grid min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <main className="flex flex-col px-6 py-6 sm:px-12">
        <header className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <a href={getLandingUrl('/')} className="hidden text-sm text-[var(--muted-2)] no-underline transition hover:text-[var(--text)] sm:inline">← Back to site</a>
            <ThemeButton />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          {step === 1 ? (
            <>
              <h1 className={`${display} text-[32px] font-extrabold leading-tight tracking-tight`}>
                Forgot password?
              </h1>
              <p className="mb-8 mt-2 text-sm text-[var(--muted-2)]">
                Enter your email address and we'll send a 4-digit code to verify your identity.
              </p>
              <StepEmail
                defaultEmail={email}
                onNext={(enteredEmail) => {
                  setEmail(enteredEmail)
                  setStep(2)
                }}
              />
            </>
          ) : (
            <>
              <h1 className={`${display} text-[32px] font-extrabold leading-tight tracking-tight`}>
                Reset your password
              </h1>
              <p className="mb-8 mt-2 text-sm text-[var(--muted-2)]">
                Enter the 4-digit verification code sent to your email, along with your new password.
              </p>
              <StepReset
                email={email}
                onBack={() => setStep(1)}
              />
            </>
          )}

          <p className="mt-8 text-center text-sm text-[var(--muted-2)]">
            Remember your password?{' '}
            <Link to={ROUTES.LOGIN} className="font-semibold text-[var(--cyan)] no-underline hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <footer className={`${mono} text-center text-[11px] text-[var(--muted)]`}>
          © 2026 MonitorMyHost · SOC 2 Type II · GDPR ready
        </footer>
      </main>
      <ShowcasePanel />
    </div>
  )
}

