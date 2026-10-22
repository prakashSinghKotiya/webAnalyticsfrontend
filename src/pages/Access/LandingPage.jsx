import { useEffect, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import NetworkGlobe from "./NetworkGlobe.jsx"
import {
  DnsPreview,
  RedirectPreview,
  WhoisPreview,
} from "./DomainToolPreview.jsx"
import { ROUTES } from "../../constants"
import Footer from "../../components/Footer.jsx"
import { useAuthState, useTheme } from "../../context"
import { getAppUrl } from "../../utils/subdomainNav"

// Local ThemeContext removed: Single source of truth is the global ThemeProvider
const display = "font-['Outfit',sans-serif]"
const mono = "font-['JetBrains_Mono',monospace]"
const container = "mx-auto w-full max-w-[1200px] px-5 sm:px-8 lg:px-12"
const section = "py-12 sm:py-16 lg:py-24"
const card =
  "rounded-[20px] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]"
const primary = `${display} inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-linear-to-br from-[var(--cyan)] to-[var(--action-end)] px-6 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60`
const secondary = `${display} inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-mid)] px-6 py-3 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--surface-2)]`
const tones = {
  cyan: {
    text: "text-[var(--cyan)]",
    wash: "bg-[var(--cyan-dim)]",
    border: "border-[var(--cyan-mid)]",
    fill: "fill-[var(--cyan)]",
  },
  green: {
    text: "text-[var(--green)]",
    wash: "bg-[var(--green-dim)]",
    border: "border-[var(--border-bright)]",
    fill: "fill-[var(--green)]",
  },
  orange: {
    text: "text-[var(--orange)]",
    wash: "bg-[var(--orange-dim)]",
    border: "border-[var(--border-mid)]",
    fill: "fill-[var(--orange)]",
  },
}
const iconPaths = {
  activity: "M22 12h-4l-3 9-6-18-3 9H2",
  globe:
    "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M3 12h18 M12 3c-5 5-5 13 0 18 5-5 5-13 0-18",
  zap: "M13 2 3 14h8l-1 8L21 10h-8z",
  search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
  chart: "M6 20v-6 M12 20V4 M18 20V10",
  arrow: "M5 12h14 M12 5l7 7-7 7",
  check: "M5 12l4 4L19 6",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  close: "M6 6l12 12 M6 18 18 6",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  sun: "M12 2v2 M12 20v2 M2 12h2 M20 12h2 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  moon: "M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8",
  dns: "M3 4h18v7H3z M3 14h18v7H3z M7 7h1 M7 17h1",
}

function Icon({ name, size = 18, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d={iconPaths[name] || iconPaths.activity} />
    </svg>
  )
}
function Logo() {
  return (
    <Link
      to={ROUTES.PUBLIC_HOME}
      aria-label="MonitorMyHost home"
      className="inline-flex shrink-0 items-center gap-2 sm:gap-2.5"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-[var(--cyan)] to-[var(--green)] text-white">
        <Icon name="activity" size={16} />
      </span>
      <span className={`${display} text-sm min-[380px]:text-base sm:text-lg font-bold tracking-tight`}>
        Monitor<span className="text-[var(--cyan)]">MyHost</span>
      </span>
    </Link>
  )
}
function Badge({ children, tone = "cyan" }) {
  return (
    <span
      className={`${mono} inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] tracking-wider ${tones[tone].text} ${tones[tone].wash} ${tones[tone].border}`}
    >
      {children}
    </span>
  )
}
function SectionHeading({ badge, title, children, tone = "cyan" }) {
  return (
    <div className="mx-auto mb-12 max-w-xl text-center">
      {badge && (
        <div className="mb-5">
          <Badge tone={tone}>{badge}</Badge>
        </div>
      )}
      <h2
        className={`${display} text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl`}
      >
        {title}
      </h2>
      {children && (
        <p className="mt-4 text-sm leading-7 text-[var(--muted)] sm:text-base">
          {children}
        </p>
      )}
    </div>
  )
}
function ThemeToggle() {
  const { toggleTheme } = useTheme()
  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Switch theme"
      className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg sm:rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--cyan)] transition hover:border-[var(--border-bright)]"
    >
      <Icon name="sun" size={16} className="theme-toggle-sun" />
      <Icon name="moon" size={16} className="theme-toggle-moon" />
    </button>
  )
}
const MOBILE_DEMO_SERVICES = [
  {
    name: "Global TTFB Test",
    path: "/ttfb-test",
    icon: "zap",
    badge: "35+ Nodes",
    tone: "cyan",
    desc: "First byte server response time & edge latency",
  },
  {
    name: "FullSite Report",
    path: "/fullsite-report",
    icon: "chart",
    badge: "Core Vitals",
    tone: "orange",
    desc: "Google Lighthouse performance & SEO score audit",
  },
  {
    name: "DNS Inspector",
    path: "/dns-checker",
    icon: "dns",
    badge: "Authoritative",
    tone: "green",
    desc: "Check A, AAAA, MX, CNAME, & TXT records",
  },
  {
    name: "Redirect Checker",
    path: "/redirection-checker",
    icon: "arrow",
    badge: "Trace Hops",
    tone: "orange",
    desc: "Analyze 301/302 chains & prevent infinite loops",
  },
  {
    name: "WHOIS Domain Lookup",
    path: "/whois-lookup",
    icon: "shield",
    badge: "Domain Intel",
    tone: "cyan",
    desc: "Registrar intel, nameservers, & expiration dates",
  },
]

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [socketStatus, setSocketStatus] = useState({
    status: "idle",
    isConnected: false,
  })
  const menuRef = useRef(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    let unsub
    import("../../api/socket")
      .then(
        ({
          subscribeToConnectionState,
          isSocketConnected,
          getConnectionState,
        }) => {
          const cur = getConnectionState()
          setSocketStatus({
            status: cur?.status || "idle",
            isConnected: Boolean(isSocketConnected?.()),
          })
          unsub = subscribeToConnectionState((next) => {
            setSocketStatus({
              status: next.status,
              isConnected: next.status === "connected",
            })
          })
        },
      )
      .catch(() => {})

    return () => {
      if (unsub) unsub()
    }
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const close = (event) => {
      if (event.key === "Escape") {
        setOpen(false)
        triggerRef.current?.focus()
      }
      if (
        event.type === "pointerdown" &&
        !menuRef.current?.contains(event.target) &&
        !triggerRef.current?.contains(event.target)
      )
        setOpen(false)
    }
    document.addEventListener("keydown", close)
    document.addEventListener("pointerdown", close)
    return () => {
      document.removeEventListener("keydown", close)
      document.removeEventListener("pointerdown", close)
    }
  }, [open])

  useEffect(() => {
    if (typeof document === "undefined") return
    if (open) {
      const prev = document.body.style.overflow
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = prev
      }
    }
  }, [open])

  const jump = (event, target) => {
    event.preventDefault()
    setOpen(false)
    document
      .getElementById(target)
      ?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      })
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b transition-colors ${
          scrolled
            ? "border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <nav
          aria-label="Main navigation"
          className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between gap-2 px-3.5 sm:gap-4 sm:px-8 lg:px-12"
        >
          <Logo />
          <div className="hidden items-center gap-7 lg:flex">
            {[ "Features", "Tools", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                onClick={(event) => jump(event, item.toLowerCase())}
                className="text-sm font-medium text-[var(--muted-2)] transition hover:text-[var(--text)]"
              >
                {item}
              </a>
            ))}
           
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3">
            <ThemeToggle />
            <a
              href={getAppUrl(ROUTES.LOGIN)}
              className="hidden text-sm font-medium text-[var(--text-2)] hover:text-[var(--cyan)] sm:block"
            >
              Login
            </a>
            <a
              href={getAppUrl(ROUTES.REGISTER)}
              className="hidden text-sm font-medium text-[var(--muted-2)] hover:text-[var(--cyan)] sm:block"
            >
              Sign Up
            </a>
            <a
              href={getAppUrl(ROUTES.LOGIN)}
              className={`${display} inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-lg sm:rounded-xl bg-linear-to-br from-[var(--cyan)] to-[var(--action-end)] px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:brightness-110 active:scale-95`}
            >
              <span className="hidden sm:inline">Get Started Free</span>
              <span className="sm:hidden">Get Started</span>
            </a>
            <button
              ref={triggerRef}
              type="button"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => setOpen(!open)}
              className="rounded-lg p-1.5 text-[var(--text-2)] hover:bg-[var(--surface-2)] sm:p-2 lg:hidden"
            >
              <Icon name={open ? "close" : "menu"} size={20} />
            </button>
          </div>
        </nav>
      </header>

      {/* ── MOBILE SIDEBAR DRAWER (GUEST & DEMO SERVICES) ── */}
      {/* Backdrop Overlay - completely covers viewport, outside header */}
      {open && (
        <div
          className="fixed inset-0 z-[99] bg-black/80 backdrop-blur-md transition-opacity duration-300 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-over Drawer Panel - 100% solid, fully opaque background, top-to-bottom */}
      <aside
        ref={menuRef}
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation & Free Demo Tools"
        style={{
          backgroundColor: "var(--surface, #181b22)",
          color: "var(--text, #f0f0f0)",
        }}
        className={`fixed inset-y-0 right-0 z-[100] flex h-screen w-full max-w-[340px] flex-col border-l border-[var(--border-mid)] bg-[var(--surface)] text-[var(--text)] shadow-2xl transition-all duration-300 ease-out lg:hidden ${
          open ? "translate-x-0 pointer-events-auto opacity-100 visible" : "hidden pointer-events-none"
        }`}
      >
        {/* Drawer Header */}
        <div
          style={{ backgroundColor: "var(--surface, #181b22)" }}
          className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--border)] px-4"
        >
          <Logo />
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="rounded-lg p-2 text-[var(--muted-2)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Scrollable Drawer Body */}
        <div
          style={{ backgroundColor: "var(--surface, #181b22)" }}
          className="flex-1 space-y-5 overflow-y-auto px-4 py-4"
        >
          {/* Socket Connection Status Banner */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="flex items-center justify-between">
           
            </div>
            <div className="mt-2.5 flex items-center gap-2.5">
              {socketStatus.isConnected ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--green)] opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--green)]" />
                </span>
              ) : socketStatus.status === "connecting" ||
                socketStatus.status === "reconnecting" ? (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="relative inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--orange)]" />
                </span>
              ) : (
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--cyan)]" />
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight text-[var(--text)]">
                  {socketStatus.isConnected
                    ? " Connected"
                    : socketStatus.status === "connecting" ||
                      socketStatus.status === "reconnecting"
                    ? "Connecting ..please fix your network"
                    : "Fix your network"}
                </p>
                
              </div>
            </div>
          </div>

          {/* Free Demo Services List */}
          <div>
            <div className="mb-2.5 flex items-center justify-between px-1">
              <p className="font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                Services
              </p>
              <span className="text-[10px] font-medium text-[var(--cyan)]">
                Zero Signup
              </span>
            </div>
            <div className="space-y-1.5">
              {MOBILE_DEMO_SERVICES.map((tool) => (
                <Link
                  key={tool.path}
                  to={tool.path}
                  onClick={() => setOpen(false)}
                  className="group flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/60 p-2.5 transition hover:border-[var(--cyan)] hover:bg-[var(--surface-2)] active:scale-[0.98]"
                >
                  <span
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                      tool.tone === "cyan"
                        ? "border-[var(--cyan-mid)] bg-[var(--cyan-dim)] text-[var(--cyan)]"
                        : tool.tone === "green"
                        ? "border-[var(--green)]/30 bg-[var(--green-dim)] text-[var(--green)]"
                        : "border-[var(--orange)]/30 bg-[var(--orange-dim)] text-[var(--orange)]"
                    }`}
                  >
                    <Icon name={tool.icon} size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--cyan)]">
                        {tool.name}
                      </span>
                      <span className="font-['JetBrains_Mono',monospace] text-[9px] font-semibold text-[var(--muted-2)]">
                        {tool.badge}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[10px] leading-tight text-[var(--muted-2)]">
                      {tool.desc}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Page Jump Anchors */}
          <div className="border-t border-[var(--border)] pt-3">
            <p className="mb-1.5 px-1 font-['JetBrains_Mono',monospace] text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Explore Platform
            </p>
            <div className="space-y-0.5">
              {[ "Features", "Tools", "Pricing"].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={(event) => jump(event, item.toLowerCase())}
                  className="block rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-2)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                >
                  {item}
                </a>
              ))}
              <Link
                to={ROUTES.CONTACT}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-xs font-medium text-[var(--text-2)] transition hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div
          style={{ backgroundColor: "var(--surface, #181b22)" }}
          className="space-y-2 border-t border-[var(--border)] p-4"
        >
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs text-[var(--muted-2)]">Theme</span>
            <ThemeToggle />
          </div>
          <div className="flex gap-2">
            <a
              href={getAppUrl(ROUTES.LOGIN)}
              onClick={() => setOpen(false)}
              className={`${secondary} flex-1 justify-center py-2 text-xs`}
            >
              Log In
            </a>
            <a
              href={getAppUrl(ROUTES.REGISTER)}
              onClick={() => setOpen(false)}
              className={`${primary} flex-1 justify-center py-2 text-xs`}
            >
              Sign Up
            </a>
          </div>
        </div>
      </aside>
    </>
  )
}

const globeProbes = [
  { city: "India", location: [19.076, 72.8777], ms: 28 },
  { city: "USA", location: [38.9, -77.0], ms: 42 },
  { city: "Frankfurt", location: [50.1, 8.7], ms: 68 },
  { city: "Singapore", location: [1.3, 103.8], ms: 184 },
  { city: "Sydney", location: [-33.9, 151.2], ms: 212 },
  { city: "São Paulo", location: [-23.6, -46.6], ms: 156 },
]

function Hero() {
  const { theme } = useTheme()
  const { isAuthenticated } = useAuthState()
  const navigate = useNavigate()
  const [url, setUrl] = useState("")
  const [error, setError] = useState("")
  const analyze = (event, tool = "ttfb") => {
    event?.preventDefault()
    try {
      const value = url.trim()
      const parsed = new URL(
        /^https?:\/\//i.test(value) ? value : `https://${value}`,
      )
      if (
        !parsed.hostname.includes(".") ||
        !["http:", "https:"].includes(parsed.protocol)
      )
        throw new Error()
      const toolMap = {
        ttfb: { auth: ROUTES.TTFB, demo: ROUTES.TOOLS_TTFB },
        lighthouse: { auth: ROUTES.LIGHTHOUSE, demo: ROUTES.TOOLS_LIGHTHOUSE },
        dns: { auth: ROUTES.DNS, demo: ROUTES.TOOLS_DNS },
        redirects: { auth: ROUTES.REDIRECTS, demo: ROUTES.TOOLS_REDIRECTS },
        whois: { auth: ROUTES.WHOIS, demo: ROUTES.TOOLS_WHOIS },
      }
      const selected = toolMap[tool] || toolMap.ttfb
      if (isAuthenticated) {
        window.location.href = getAppUrl(`${selected.auth}?url=${encodeURIComponent(parsed.href)}`)
      } else {
        navigate(`${selected.demo}?url=${encodeURIComponent(parsed.href)}`)
      }
    } catch {
      setError("Enter a valid website URL, such as https://example.com.")
    }
  }
  return (
    <section
      id="hero"
      className="relative pt-20 pb-10 sm:pt-24 sm:pb-14 lg:pt-28 lg:pb-16"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_65%_40%,var(--glow-bg),transparent_65%)]" />
      <div
        className={`${container} relative grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-12`}
      >
        <div>
          <Badge>
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--cyan)] motion-safe:animate-pulse" />
            6+ GLOBAL TEST LOCATIONS
          </Badge>
          <h1
            className={`${display} mt-7 text-[clamp(36px,5.4vw,68px)] font-extrabold leading-[1.05] tracking-[-.03em]`}
          >
            Analyze Your Website
            <br />
            <span className="bg-linear-to-r from-[var(--cyan)] to-[var(--green)] bg-clip-text text-transparent">
              Speed, TTFB &amp; Global Uptime
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-[var(--muted-2)] sm:text-lg">
            Global TTFB testing, uptime monitoring, Core Web Vitals, SEO audits
            — everything you need to keep your site fast.
          </p>
          <form
            onSubmit={analyze}
            className="mt-8 flex min-w-0 flex-wrap gap-2 rounded-xl border border-[var(--border-bright)] bg-[var(--surface)] p-2 shadow-[0_0_24px_var(--cyan-dim)] focus-within:ring-2 focus-within:ring-[var(--cyan-mid)]"
          >
            <label className="flex min-w-0 flex-[1_1_180px] items-center gap-3 px-2">
              <Icon name="search" className="text-[var(--muted)]" />
              <input
                id="hero-url"
                aria-label="Website URL"
                aria-describedby={error ? "hero-url-error" : undefined}
                aria-invalid={Boolean(error)}
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value)
                  setError("")
                }}
                placeholder="https://yourwebsite.com"
                required
                className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-[var(--muted)]"
              />
            </label>
            <button type="submit" className={`${primary} px-5`}>
              Analyze <Icon name="arrow" size={14} />
            </button>
          </form>
          {error && (
            <p
              id="hero-url-error"
              role="alert"
              className="mt-2 text-xs text-[var(--red)]"
            >
              {error}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
            <span>Try:</span>
            {["google.com", "github.com", "vercel.com"].map((site) => (
              <button
                key={site}
                type="button"
                onClick={() => setUrl(`https://${site}`)}
                className={`${mono} cursor-pointer rounded-md border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] text-[var(--muted-2)] transition hover:border-[var(--border-bright)] hover:text-[var(--cyan)]`}
              >
                {site}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="w-full text-xs text-[var(--muted)] sm:w-auto">Choose an analysis:</span>
            <button
              type="button"
              onClick={() => analyze(null, "ttfb")}
              className={`${display} inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--cyan-mid)] bg-[var(--cyan-dim)] px-3 py-1.5 text-xs font-bold text-[var(--cyan)] transition hover:bg-[var(--cyan)] hover:text-white`}
            >
              <Icon name="zap" size={13} /> TTFB
            </button>
            <button
              type="button"
              onClick={() => analyze(null, "lighthouse")}
              className={`${display} inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--text)] transition hover:border-[var(--cyan-mid)] hover:text-[var(--cyan)]`}
            >
              <Icon name="chart" size={13} /> FullSite Report
            </button>
            <button
              type="button"
              onClick={() => analyze(null, "dns")}
              className={`${display} inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--text)] transition hover:border-[var(--cyan-mid)] hover:text-[var(--cyan)]`}
            >
              <Icon name="dns" size={13} /> DNS
            </button>
            <button
              type="button"
              onClick={() => analyze(null, "redirects")}
              className={`${display} inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--text)] transition hover:border-[var(--cyan-mid)] hover:text-[var(--cyan)]`}
            >
              <Icon name="arrow" size={13} /> Redirects
            </button>
            <button
              type="button"
              onClick={() => analyze(null, "whois")}
              className={`${display} inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border-mid)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--text)] transition hover:border-[var(--cyan-mid)] hover:text-[var(--cyan)]`}
            >
              <Icon name="search" size={13} /> WHOIS
            </button>
          </div>
          <dl className="mt-9 flex flex-wrap gap-8">
            {[
              ["1k+", "Tests Run"],
              ["6+", "Locations"],
              ["99.9%", "Uptime"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-xs text-[var(--muted)]">{label}</dt>
                <dd
                  className={`${display} mt-1 text-2xl font-extrabold tracking-tight text-[var(--cyan)]`}
                >
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-[10px] text-[var(--muted)]">
            Product preview · Free online diagnostic tools.
          </p>
        </div>
        <div className="mx-auto w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[470px]">
          <NetworkGlobe theme={theme} probes={globeProbes} />
        </div>
      </div>
    </section>
  )
}
function StatsTicker() {
  const items = [
    "1K+ tests run",
    "99.97% uptime average",
    "6+ test locations",
    "Real-time alerts",
    "Full Core Web Vitals",
    
  ]
  return (
    <section
      aria-label="Platform highlights"
      className="overflow-hidden border-y border-[var(--border)] bg-[var(--surface)] py-5"
    >
      <div
        className={`${container} flex flex-wrap justify-center gap-x-8 gap-y-3`}
      >
        {items.map((item) => (
          <span
            key={item}
            className={`${mono} inline-flex items-center gap-2 text-[10px] text-[var(--muted-2)]`}
          >
            <span className="h-1 w-1 rounded-full bg-[var(--green)]" />
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}
function TTFBPreview() {
  return (
    <div className={`${mono} p-4 text-[10px]`}>
      <p className="mb-3 text-[9px] tracking-wider text-[var(--muted)]">
        TTFB / SAMPLE GLOBAL RESULTS
      </p>
      {[
        ["🇺🇸", "New York", 34],
        ["🇬🇧", "London", 78],
        ["🇩🇪", "Frankfurt", 62],
        ["🇸🇬", "Singapore", 240],
        ["🇮🇳", "Mumbai", 255],
      ].map(([flag, name, time]) => (
        <div
          key={name}
          className="flex items-center gap-2 border-b border-[var(--border)] py-1.5 last:border-0"
        >
          <span>{flag}</span>
          <span className="flex-1 text-[var(--muted-2)]">{name}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[9px] ${
              time < 100
                ? "bg-[var(--green-dim)] text-[var(--green)]"
                : "bg-[var(--orange-dim)] text-[var(--orange)]"
            }`}
          >
            {time < 100 ? "HIT" : "MISS"}
          </span>
          <span className="w-12 text-right text-[var(--text-2)]">{time}ms</span>
        </div>
      ))}
    </div>
  )
}
function UptimePreview() {
  return (
    <div className={`${mono} space-y-2 p-4 text-[10px]`}>
      <p className="mb-3 text-[9px] tracking-wider text-[var(--green)]">
        SAMPLE UPTIME MONITORING
      </p>
      {[
        ["api.example.com", "99.98%", true],
        ["app.example.com", "100%", true],
        ["cdn.example.com", "99.7%", false],
      ].map(([name, uptime, healthy]) => (
        <div
          key={name}
          className="rounded-lg border border-[var(--border)] p-2.5"
        >
          <div className="mb-2 flex justify-between gap-2">
            <span className="truncate text-[var(--muted-2)]">{name}</span>
            <span
              className={
                healthy ? "text-[var(--green)]" : "text-[var(--orange)]"
              }
            >
              {uptime}
            </span>
          </div>
          <div className="flex gap-0.5" aria-hidden="true">
            {Array.from({ length: 30 }, (_, index) => (
              <span
                key={index}
                className={`h-3 flex-1 rounded-xs border-t ${
                  !healthy && index > 27
                    ? "border-[var(--orange)] bg-[var(--orange-dim)]"
                    : "border-[var(--green)] bg-[var(--green-dim)]"
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
function ScoreRing({ score, tone, label }) {
  const circumference = 2 * Math.PI * 23
  return (
    <div className="text-center">
      <div className="relative h-14 w-14">
        <svg
          viewBox="0 0 56 56"
          className="h-full w-full -rotate-90"
          aria-label={`${label}: ${score} out of 100`}
        >
          <circle
            cx="28"
            cy="28"
            r="23"
            fill="none"
            stroke="var(--ring-track)"
            strokeWidth="4"
          />
          <circle
            cx="28"
            cy="28"
            r="23"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - score / 100)}
            className={tones[tone].text}
          />
        </svg>
        <span
          className={`${mono} absolute inset-0 flex items-center justify-center text-xs font-semibold ${tones[tone].text}`}
        >
          {score}
        </span>
      </div>
      <p
        className={`${mono} mt-2 text-[8px] tracking-wider ${tones[tone].text}`}
      >
        {label}
      </p>
    </div>
  )
}
function SEOPreview() {
  return (
    <div className="p-4">
      <div className="mb-4 flex justify-around">
        <ScoreRing score={94} tone="green" label="PERF" />
        <ScoreRing score={88} tone="cyan" label="SEO" />
        <ScoreRing score={76} tone="orange" label="A11Y" />
      </div>
      {[
        ["Title tag", true],
        ["Meta description", true],
        ["H1 present", true],
        ["Open Graph", false],
      ].map(([label, good]) => (
        <div
          key={label}
          className={`${mono} flex items-center gap-2 border-b border-[var(--border)] py-1.5 text-[10px] last:border-0`}
        >
          <span
            className={good ? "text-[var(--green)]" : "text-[var(--orange)]"}
          >
            {good ? "✓" : "!"}
          </span>
          <span className="text-[var(--muted-2)]">{label}</span>
        </div>
      ))}
      <p className="mt-2 text-[8px] text-[var(--muted)]">Illustrative audit</p>
    </div>
  )
}
const tools = [
  {
    name: "Global TTFB Test",
    icon: "globe",
    tone: "cyan",
    badge: "35 LOCATIONS",
    description:
      "Measure Time to First Byte from 35+ worldwide nodes. Detect CDN cache status, regional latency, and server bottlenecks.",
    Preview: TTFBPreview,
    authRoute: ROUTES.TTFB,
    demoRoute: ROUTES.TOOLS_TTFB,
  },
  {
    name: "Uptime Monitoring",
    icon: "activity",
    tone: "green",
    badge: "60s INTERVALS",
    description:
      "24/7 monitoring with instant alerts via email, Slack, or webhook. Track trends and catch downtime before users notice.",
    Preview: UptimePreview,
    authRoute: ROUTES.UPTIME,
    demoRoute: ROUTES.LOGIN,
  },
  {
    name: "FullSite Report",
    icon: "chart",
    tone: "orange",
    badge: "FULL AUDIT",
    description:
      "SEO audit, Core Web Vitals, accessibility check, and prioritized recommendations in a single shareable report.",
    Preview: SEOPreview,
    authRoute: ROUTES.LIGHTHOUSE,
    demoRoute: ROUTES.TOOLS_LIGHTHOUSE,
  },
  {
    name: "WHOIS Lookup",
    icon: "search",
    tone: "green",
    badge: "DOMAIN INTELLIGENCE",
    description:
      "Look up domain registration, registrar, expiration dates, and name servers. See ownership details where available, including privacy-protected registrations.",
    Preview: WhoisPreview,
    authRoute: ROUTES.WHOIS,
    demoRoute: ROUTES.TOOLS_WHOIS,
  },
  {
    name: "Redirect Checker",
    icon: "arrow",
    tone: "orange",
    badge: "TRACE EVERY HOP",
    description:
      "Trace each URL redirect to its final response, count every hop, and flag loops or non-200 destinations. Understand exactly where your visitors land.",
    Preview: RedirectPreview,
    authRoute: ROUTES.REDIRECTS,
    demoRoute: ROUTES.TOOLS_REDIRECTS,
  },
  {
    name: "DNS Record Checker",
    icon: "dns",
    tone: "green",
    badge: "RECORD INSPECTOR",
    description:
      "Inspect A, AAAA, CNAME, MX, TXT, NS, and other DNS records for a domain. Troubleshoot routing, email configuration, and domain verification.",
    Preview: DnsPreview,
    authRoute: ROUTES.DNS,
    demoRoute: ROUTES.TOOLS_DNS,
  },
]
function CoreTools() {
  const { isAuthenticated } = useAuthState()
  return (
    <section id="tools" className={`${container} ${section} scroll-mt-20`}>
      <SectionHeading
        badge="CORE TOOLS"
        tone="green"
        title="Everything Your Site Needs"
      >
        Six focused tools. One complete picture — from response times and SEO to
        domain ownership, redirects, and DNS.
      </SectionHeading>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => {
          const { name, icon, tone, badge, description, Preview, authRoute, demoRoute } = tool
          return (
            <article
              key={name}
              className={`${card} group flex min-w-0 flex-col p-5 transition duration-300 hover:border-[var(--border-bright)] hover:shadow-[var(--shadow-card-hover)] motion-safe:hover:-translate-y-1 sm:p-6`}
            >
              <div className="mb-6 min-h-48 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
                <Preview />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone].text} ${tones[tone].wash}`}
                >
                  <Icon name={icon} />
                </span>
                <span
                  className={`${mono} rounded-full border px-2 py-1 text-[8px] tracking-wider ${tones[tone].text} ${tones[tone].wash} ${tones[tone].border}`}
                >
                  {badge}
                </span>
              </div>
              <h3 className={`${display} mt-4 text-lg font-bold`}>{name}</h3>
              <p className="mt-2 flex-1 text-[13px] leading-6 text-[var(--muted)]">
                {description}
              </p>
              {isAuthenticated || !demoRoute ? (
                <a
                  href={getAppUrl(isAuthenticated ? (authRoute || ROUTES.LOGIN) : ROUTES.LOGIN)}
                  className={`mt-5 inline-flex w-fit items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition hover:bg-[var(--surface-2)] ${tones[tone].text} ${tones[tone].border}`}
                >
                  Explore Tool <Icon name="arrow" size={13} />
                </a>
              ) : (
                <Link
                  to={demoRoute}
                  className={`mt-5 inline-flex w-fit items-center gap-2 rounded-lg border px-4 py-2 text-xs font-semibold transition hover:bg-[var(--surface-2)] ${tones[tone].text} ${tones[tone].border}`}
                >
                  Explore Tool <Icon name="arrow" size={13} />
                </Link>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
function HowItWorks() {
  const steps = [
    {
      icon: "search",
      name: "Enter Your URL",
      text: "Paste any URL. Your test is queued across all global nodes instantly.",
    },
    {
      icon: "globe",
      name: "Multi-Location Scan",
      text: "Select the service and Simultaneous tests from 6+ data centers — TTFB, response time,  status.",
    },
    {
      icon: "chart",
      name: "Full Diagnostics",
      text: "Performance scores, SEO breakdown, Core Web Vitals, and prioritized fixes.",
    },
  ]
  return (
    <section
      className={`${section} border-y border-[var(--border)] bg-[var(--surface)]`}
    >
      <div className={container}>
        <SectionHeading badge="HOW IT WORKS" title="Three Steps to Clarity">
          No agents to install. No complicated setup.
        </SectionHeading>
        <ol className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.name} className="px-4 text-center">
              <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--cyan-mid)] bg-[var(--cyan-dim)] text-[var(--cyan)]">
                <Icon name={step.icon} size={24} />
                <span
                  className={`${mono} absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--cyan)] text-[9px] text-white`}
                >
                  {index + 1}
                </span>
              </div>
              <h3 className={`${display} text-xl font-bold`}>{step.name}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function Capabilities() {
  const features = [
    {
      icon: "zap",
      name: "Core Web Vitals",
      text: "LCP, INP, CLS, TBT, FCP — performance scoring with historical trends.",
      tone: "green",
    },

   {
  icon: "activity",
  name: "Uptime Monitor",
  text: "Monitor website uptime, response times, and availability with automatic checks and real-time outage detection.",
  tone: "orange",
},
    {
      icon: "activity",
      name: "Real-Time Alerts",
      text: "Instant notifications via email, Slack, PagerDuty, or custom webhooks.",
      tone: "green",
    },
    {
      icon: "chart",
      name: "Historical Charts",
      text: "Track TTFB, uptime, and performance scores over time. Spot regressions fast.",
      tone: "cyan",
    },
  {
    icon: "globe",
    name: "IP & Hosting Lookup",
    text: "Identify IP addresses, hosting providers, ASN information, and network infrastructure behind a domain.",
    tone: "orange",
  },
  ]
  return (
    <section
      id="features"
      className={`${section} scroll-mt-20 bg-[var(--surface)]`}
    >
      <div
        className={`${container} grid items-center gap-12 lg:grid-cols-[.85fr_1.4fr]`}
      >
        <div>
          <Badge tone="green">CAPABILITIES</Badge>
          <h2
            className={`${display} mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-[42px]`}
          >
            More Than Just
            <br />a Speed Test
          </h2>
          <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
            MonitorMyHost gives you a complete diagnostics suite
          </p>
          <ul className="mt-6 space-y-3">
            {[
              "Login —  paste a URL",
              "Pick a Service ",
              "Shareable public report links",
              "White-label reports for agencies",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-2.5 text-sm text-[var(--muted-2)]"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--green-dim)] text-[var(--green)]">
                  <Icon name="check" size={11} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.name}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-5"
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[feature.tone].text} ${tones[feature.tone].wash}`}
              >
                <Icon name={feature.icon} />
              </span>
              <h3 className={`${display} mt-3 text-base font-bold`}>
                {feature.name}
              </h3>
              <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
                {feature.text}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}




function Pricing() {
  const [annual, setAnnual] = useState(true)

  const plans = [
    {
      name: "Free",
      price: 0,
      billingNote: "Forever free",
      description: "Essential checks for developers and personal projects.",
      features: [
        "15 tool tests / day",
        "1 Uptime monitor (15-min check interval)",
        "Standard single-region checks",
        "Basic response time & SSL alerts",
        "Community & email support",
      ],
      cta: "Start for Free",
      highlight: false,
    },
    {
      name: "Pro",
      price: annual ? 55 : 5,
      billingNote: annual ? "/year · Save ~8%" : "/month",
      description: "Fast multi-region monitoring and high-volume diagnostics.",
      features: [
        "200 tool tests / day",
        "Up to 20 Uptime monitors",
        "Custom intervals (1 min, 5 min, 15 min, 30 min)",
        "6 Global test locations (multi-region TTFB)",
        "Instant alerts (Email, Webhooks & Slack)",
        "Priority crawl & diagnostic queues",
        "Direct priority support",
      ],
      cta: "Upgrade to Pro",
      highlight: true,
    },
  ]

  return (
    <section
      id="pricing"
      className={`${section} scroll-mt-20 bg-[var(--surface)]`}
    >
      <div className={container}>
        <SectionHeading title="Simple, Transparent Pricing">
          No hidden fees. Upgrade or cancel anytime.
        </SectionHeading>

        {/* Billing Toggle */}
        <div className="mb-10 flex justify-center">
          <div
            role="group"
            aria-label="Billing period"
            className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1"
          >
            {[
              ["Monthly ($5/mo)", false],
              ["Annual ($55/yr)", true],
            ].map(([label, value]) => (
              <button
                key={label}
                type="button"
                aria-pressed={annual === value}
                onClick={() => setAnnual(value)}
                className={`cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  annual === value
                    ? "bg-[var(--cyan)] text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {label}
                {value && (
                  <span className="ml-2 rounded bg-[var(--green-dim)] px-1.5 py-0.5 text-[9px] text-[var(--green)]">
                    Save 1 Month
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Card Centered Grid */}
        <div className="mx-auto grid max-w-4xl items-stretch gap-6 md:grid-cols-2">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-7 transition-all ${
                plan.highlight
                  ? "border-[var(--cyan)] bg-[var(--bg)] shadow-[var(--shadow-card)]"
                  : "border-[var(--border-mid)] bg-[var(--surface-2)]"
              }`}
            >
              {plan.highlight && (
                <span
                  className={`${mono} absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--cyan)] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm`}
                >
                  MOST POPULAR
                </span>
              )}

              <div className="flex items-center justify-between">
                <h3
                  className={`${display} text-xl font-bold ${
                    plan.highlight ? "text-[var(--cyan)]" : ""
                  }`}
                >
                  {plan.name}
                </h3>
              </div>

              {/* Price section */}
              <div className="my-5 flex flex-wrap items-baseline gap-2">
                <span
                  className={`${display} text-4xl font-extrabold tracking-tight`}
                >
                  {plan.price ? `$${plan.price}` : "$0"}
                </span>
                <span className="text-xs text-[var(--muted)] font-medium">
                  {plan.billingNote}
                </span>
              </div>

              <p className="mb-6 text-[13px] leading-relaxed text-[var(--muted)]">
                {plan.description}
              </p>

              <a
                href={getAppUrl(ROUTES.REGISTER)}
                className={`${
                  plan.highlight ? primary : secondary
                } mb-7 w-full text-center py-2.5 rounded-lg text-sm font-semibold transition`}
              >
                {plan.cta}
              </a>

              {/* Features List */}
              <ul className="space-y-3.5 border-t border-[var(--border)] pt-6">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-xs leading-5 text-[var(--muted-2)]"
                  >
                    <Icon
                      name="check"
                      size={15}
                      className="mt-0.5 shrink-0 text-[var(--green)]"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

      </div>
    </section>
  )
}
function CallToAction() {
  const { isAuthenticated } = useAuthState()
  const analysisRoute = isAuthenticated ? ROUTES.TTFB : ROUTES.TOOLS_TTFB
  return (
    <section className={`${container} ${section}`}>
      <div
        className={`${card} relative mx-auto max-w-3xl overflow-hidden border-[var(--border-bright)] px-6 py-12 text-center sm:px-12 sm:py-16`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--glow-bg),transparent_70%)]" />
        <div className="relative">
          <Badge>START IN 30 SECONDS</Badge>
          <h2
            className={`${display} mt-6 text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl`}
          >
            Your Site Has Blind Spots.
            <br />
            <span className="bg-linear-to-r from-[var(--cyan)] to-[var(--green)] bg-clip-text text-transparent">
              Time to Find Them.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[var(--muted)]">
            Explore diagnostics and discover what a complete website report can
            reveal. Start with the interactive product preview.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {isAuthenticated ? (
              <a href={getAppUrl(ROUTES.TTFB)} className={primary}>
                Analyze Your Site <Icon name="arrow" size={14} />
              </a>
            ) : (
              <Link to={analysisRoute} className={primary}>
                Analyze Your Site <Icon name="arrow" size={14} />
              </Link>
            )}
            <a href={getAppUrl(ROUTES.LOGIN)} className={secondary}>
              View Sample Report
            </a>
          </div>
          <p className="mt-6 text-xs text-[var(--muted)]">
            Don&apos;t have an account yet?{" "}
            <a
              href={getAppUrl(ROUTES.REGISTER)}
              className="font-semibold text-[var(--cyan)] hover:underline"
            >
              Sign Up
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}


export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg)] font-['Inter',sans-serif] text-[var(--text)] transition-colors [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[var(--cyan)] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[var(--cyan)]">
        <a
          href="#main-content"
          onClick={(event) => {
            event.preventDefault()
            document.getElementById("main-content")?.focus()
          }}
          className="fixed top-2 left-2 z-[100] -translate-y-24 rounded-lg bg-[var(--surface)] p-3 text-sm focus:translate-y-0"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1}>
          <Hero />
          <StatsTicker />
          <CoreTools />
          <HowItWorks />
          
          <Capabilities />
          
          <Pricing />
          <CallToAction />
        </main>
        <Footer />
      </div>

  )
}
