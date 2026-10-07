import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, useToast, useTheme } from '../../context'
import { ROUTES } from '../../constants'

const display = "font-['Outfit',sans-serif]"
const mono = "font-['JetBrains_Mono',monospace]"

function Logo() {
  return (
    <Link to={ROUTES.PUBLIC_HOME} className="inline-flex items-center gap-2.5 no-underline">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--cyan)] to-[var(--green)] shadow-[0_0_16px_var(--cyan-mid)]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </span>
      <span className={`${display} text-lg font-bold tracking-tight text-[var(--text)]`}>
        Web<span className="text-[var(--cyan)]">Pulse</span>
      </span>
    </Link>
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

// Step 1: collect name/email/password
function StepCredentials({ onNext }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agree, setAgree] = useState(false)
  const [errors, setErrors] = useState({})
  const score = strength(password)
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['var(--red)', 'var(--red)', 'var(--orange)', 'var(--green)', 'var(--green)']

  const submit = (e) => {
    e.preventDefault()
    const errs = {}
    if (name.trim().length < 2) errs.name = 'Tell us your name.'
    if (!emailOk(email)) errs.email = 'Enter a valid email address.'
    if (score < 2) errs.password = 'Use 8+ characters with a mix of letters and numbers.'
    if (!agree) errs.agree = 'You need to accept the terms to continue.'
    setErrors(errs)
    if (Object.keys(errs).length) return
    onNext({ name, email, password })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <Field label="Full name" id="name" error={errors.name}>
        <input id="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" className={inputCls(errors.name)} />
      </Field>
      <Field label="Work email" id="email" error={errors.email}>
        <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={inputCls(errors.email)} />
      </Field>
      <Field label="Password" id="password" error={errors.password}>
        <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} placeholder="At least 8 characters" autoComplete="new-password" />
        <div className="mt-2.5 flex items-center gap-3">
          <div className="flex flex-1 gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-1 flex-1 rounded-full transition-colors duration-300" style={{ background: i < score ? colors[score] : 'var(--bar-track)' }} />
            ))}
          </div>
          <span className={`${mono} w-16 text-right text-[11px] text-[var(--muted-2)]`}>{password ? labels[score] : ''}</span>
        </div>
      </Field>
      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug text-[var(--text-2)]">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[var(--cyan)]" />
          <span>
            I agree to the <span className="text-[var(--cyan)]">Terms of Service</span> and{' '}
            <span className="text-[var(--cyan)]">Privacy Policy</span>.
          </span>
        </label>
        {errors.agree && <p role="alert" className="mt-1.5 text-xs text-[var(--red)]">{errors.agree}</p>}
      </div>
      <button
        type="submit"
        className={`${display} flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-none bg-gradient-to-br from-[var(--cyan)] to-[#0099ff] px-5 py-3 text-[15px] font-bold text-white shadow-[0_0_24px_var(--cyan-mid)] transition hover:-translate-y-px`}
      >
        Continue
      </button>
    </form>
  )
}

// Step 2: OTP verification + final registration
function StepOtp({ credentials, onBack }) {
  const { sendOtp, register } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOtp = async () => {
    setSending(true)
    try {
      await sendOtp(credentials.email)
      setOtpSent(true)
      toast.success(`OTP sent to ${credentials.email}`)
    } catch (err) {
      toast.error(err?.error || 'Failed to send OTP.')
    } finally {
      setSending(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (otp.length !== 4) { setError('Enter the 4-digit OTP.'); return }
    setError('')
    setLoading(true)
    try {
      await register({ ...credentials, otp })
      toast.success('Account created! Please sign in.')
      navigate(ROUTES.LOGIN, { replace: true })
    } catch (err) {
      setError(err?.error || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <div className="rounded-xl border border-[var(--border-mid)] bg-[var(--surface-2)] p-4 text-sm text-[var(--muted-2)]">
        Creating account for <span className={`${mono} text-[var(--text)]`}>{credentials.email}</span>
      </div>

      {!otpSent ? (
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={sending}
          className={`${display} flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border border-[var(--border-bright)] bg-[var(--surface)] px-5 py-3 text-[15px] font-bold text-[var(--text)] transition hover:border-[var(--cyan)] hover:text-[var(--cyan)] disabled:opacity-60`}
        >
          {sending && <span className="h-4 w-4 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-[var(--border)] border-t-[var(--cyan)]" />}
          {sending ? 'Sending OTP…' : 'Send OTP to email'}
        </button>
      ) : (
        <Field label="One-time password" id="otp" error={error}>
          <div className="flex gap-2">
            <input
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="4-digit code"
              className={`${inputCls(error)} flex-1`}
              maxLength={4}
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={sending}
              className={`${mono} shrink-0 cursor-pointer rounded-[10px] border border-[var(--border-mid)] bg-[var(--surface)] px-3 text-[11px] uppercase tracking-wider text-[var(--muted-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)] disabled:opacity-50`}
            >
              Resend
            </button>
          </div>
        </Field>
      )}

      {otpSent && (
        <button
          type="submit"
          disabled={loading || otp.length !== 4}
          className={`${display} flex w-full cursor-pointer items-center justify-center gap-2 rounded-[10px] border-none bg-gradient-to-br from-[var(--cyan)] to-[#0099ff] px-5 py-3 text-[15px] font-bold text-white shadow-[0_0_24px_var(--cyan-mid)] transition hover:-translate-y-px disabled:cursor-wait disabled:opacity-70`}
        >
          {loading && <span className="h-4 w-4 animate-[spin_0.7s_linear_infinite] rounded-full border-2 border-white/40 border-t-white" />}
          {loading ? 'Creating account…' : 'Create free account'}
        </button>
      )}

      <button type="button" onClick={onBack} className="text-center text-sm text-[var(--muted-2)] hover:text-[var(--text)] transition cursor-pointer bg-transparent border-none">
        ← Back
      </button>
    </form>
  )
}

const probes = [
  { city: 'Frankfurt', ms: 38 },
  { city: 'N. Virginia', ms: 52 },
  { city: 'Singapore', ms: 71 },
  { city: 'São Paulo', ms: 94 },
  { city: 'Sydney', ms: 118 },
]

function ShowcasePanel() {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1600)
    return () => clearInterval(id)
  }, [])

  return (
    <aside className="grid-bg relative hidden overflow-hidden border-l border-[var(--border)] bg-[var(--bg-deep)] p-12 lg:flex lg:flex-col lg:justify-between">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[var(--glow-bg)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-[var(--green-dim)] blur-3xl" />
      <div className="relative">
        <span className={`${mono} inline-flex items-center gap-2 rounded-full border border-[var(--border-bright)] bg-[var(--cyan-dim)] px-3 py-1 text-[11px] uppercase tracking-[0.1em] text-[var(--cyan)]`}>
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[var(--green)]" /> 42 probe locations live
        </span>
        <h2 className={`${display} mt-6 max-w-md text-4xl font-extrabold leading-[1.08] tracking-tight text-[var(--text)]`}>
          Know how fast your site is before your users do.
        </h2>
      </div>
      <div className="relative my-10 rounded-2xl border border-[var(--border-mid)] bg-[var(--surface)] p-6 shadow-[var(--hero-shadow)]">
        <div className="mb-5 flex items-center justify-between">
          <span className={`${mono} text-xs uppercase tracking-[0.1em] text-[var(--muted-2)]`}>TTFB · example.com</span>
          <span className={`${mono} text-xs text-[var(--green)]`}>● healthy</span>
        </div>
        <div className="flex flex-col gap-4">
          {probes.map((p, i) => {
            const ms = p.ms + ((tick * (i + 3)) % 9) - 4
            return (
              <div key={p.city}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="text-[var(--text-2)]">{p.city}</span>
                  <span className={`${mono} text-[var(--text)]`}>{ms} ms</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bar-track)]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[var(--cyan)] to-[var(--green)] transition-[width] duration-700" style={{ width: `${Math.min(100, (ms / 140) * 100)}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="relative grid grid-cols-3 gap-6 border-t border-[var(--border)] pt-6">
        {[['99.99%', 'uptime tracked'], ['1.2B', 'checks / month'], ['30s', 'check interval']].map(([v, l]) => (
          <div key={l}>
            <div className={`${mono} text-xl font-semibold text-[var(--cyan)]`}>{v}</div>
            <div className="mt-1 text-xs text-[var(--muted)]">{l}</div>
          </div>
        ))}
      </div>
    </aside>
  )
}

export default function Register() {
  const [step, setStep] = useState(1)
  const [credentials, setCredentials] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', localStorage.getItem('wp-theme') ?? 'dark')
  }, [])

  return (
    <div className="grid min-h-screen bg-[var(--bg)] text-[var(--text)] transition-colors lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <main className="flex flex-col px-6 py-6 sm:px-12">
        <header className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Link to={ROUTES.PUBLIC_HOME} className="hidden text-sm text-[var(--muted-2)] no-underline transition hover:text-[var(--text)] sm:inline">← Back to site</Link>
            <ThemeButton />
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          {step === 1 ? (
            <>
              <h1 className={`${display} text-[32px] font-extrabold leading-tight tracking-tight`}>
                Start monitoring in minutes
              </h1>
              <p className="mb-8 mt-2 text-sm text-[var(--muted-2)]">
                Free forever for up to 3 sites. No credit card required.
              </p>
              <StepCredentials onNext={(creds) => { setCredentials(creds); setStep(2) }} />
            </>
          ) : (
            <>
              <h1 className={`${display} text-[32px] font-extrabold leading-tight tracking-tight`}>
                Verify your email
              </h1>
              <p className="mb-8 mt-2 text-sm text-[var(--muted-2)]">
                We'll send a 4-digit code to confirm your address.
              </p>
              <StepOtp credentials={credentials} onBack={() => setStep(1)} />
            </>
          )}

          <p className="mt-8 text-center text-sm text-[var(--muted-2)]">
            Already have an account?{' '}
            <Link to={ROUTES.LOGIN} className="font-semibold text-[var(--cyan)] no-underline hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <footer className={`${mono} text-center text-[11px] text-[var(--muted)]`}>© 2026 WebPulse · SOC 2 Type II · GDPR ready</footer>
      </main>
      <ShowcasePanel />
    </div>
  )
}
