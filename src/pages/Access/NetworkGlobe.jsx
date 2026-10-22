import { useEffect, useRef, useState } from "react"

const defaultProbes = [
  { city: "India", location: [19.076, 72.8777], ms: 28 },
  { city: "USA", location: [38.9, -77.0], ms: 42 },
  { city: "Frankfurt", location: [50.1, 8.7], ms: 68 },
  { city: "Singapore", location: [1.3, 103.8], ms: 184 },
  { city: "Sydney", location: [-33.9, 151.2], ms: 212 },
  { city: "São Paulo", location: [-23.6, -46.6], ms: 156 },
]

const mono = "font-['JetBrains_Mono',monospace]"
const probeButton = `${mono} cursor-pointer rounded-md border border-[var(--border-mid)] bg-[var(--surface)] px-2.5 py-1.5 text-[9px] text-[var(--muted-2)] transition-colors hover:border-[var(--green)] hover:text-[var(--green)] aria-pressed:border-[var(--green)] aria-pressed:bg-[var(--green-dim)] aria-pressed:text-[var(--green)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--green)]`

/**
 * Pre-flight WebGL and environment capability check.
 * Returns false on SSR, crawlers/bots (navigator.webdriver), mobile/narrow viewports (< 768px),
 * prefers-reduced-motion, or when WebGL context cannot be created.
 */
function isWebGLAvailable() {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false
  }

  // Headless crawler / bot signals (Google Search Console, Lighthouse, Puppeteer)
  if (navigator.webdriver) {
    return false
  }

  // Mobile / small screens: show lightweight static fallback to prevent main-thread/GPU stalls
  if (window.innerWidth < 768) {
    return false
  }

  // User preference for reduced motion
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return false
  }

  // Test WebGL context creation on an offscreen test canvas
  try {
    const testCanvas = document.createElement("canvas")
    const gl =
      testCanvas.getContext("webgl2") ||
      testCanvas.getContext("webgl") ||
      testCanvas.getContext("experimental-webgl")
    if (!gl) return false

    if (typeof gl.isContextLost === "function" && gl.isContextLost()) {
      return false
    }
    return true
  } catch {
    return false
  }
}

export default function NetworkGlobe({ theme, probes = defaultProbes }) {
  const canvasRef = useRef(null)
  const rotation = useRef(1.25)
  const drag = useRef(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(paused)
  const [canMountGlobe, setCanMountGlobe] = useState(false)
  const [isMobileOrCrawler, setIsMobileOrCrawler] = useState(false)
  const [available, setAvailable] = useState(true)
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  // Feature detection on client mount and resize
  useEffect(() => {
    const checkEligibility = () => {
      const isMobile =
        typeof window !== "undefined" &&
        (window.innerWidth < 768 || Boolean(navigator.webdriver))
      setIsMobileOrCrawler(isMobile)

      const supported = isWebGLAvailable()
      setCanMountGlobe(supported)
    }

    checkEligibility()

    window.addEventListener("resize", checkEligibility, { passive: true })
    return () => window.removeEventListener("resize", checkEligibility)
  }, [])

  // Interactive Globe lifecycle: lazy-loaded and deferred via requestIdleCallback
  useEffect(() => {
    if (!canMountGlobe || !available) return

    const canvas = canvasRef.current
    if (!canvas) return

    let globe
    let frame
    let visible = true
    let lastTime = 0
    let cancelled = false
    let failureCount = 0
    const MAX_FAILURES = 3

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const dark = theme !== "light"
    const isTablet = window.innerWidth < 1024
    // Cap DPR and mapSamples to avoid ReadPixels GPU stalls
    const pixelRatio = isTablet ? 1 : Math.min(window.devicePixelRatio || 1, 1.5)
    const mapSamples = isTablet ? 6000 : 12000
    const size = canvas.clientWidth || 300

    const scheduleIdle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback
        : (cb) => setTimeout(cb, 100)
    const cancelIdle =
      typeof window.cancelIdleCallback === "function"
        ? window.cancelIdleCallback
        : clearTimeout

    let resizeObserver
    let intersectionObserver

    const handleContextLost = (event) => {
      event.preventDefault()
      cancelAnimationFrame(frame)
      try {
        globe?.destroy()
      } catch {
        /* ignore destroy errors */
      }
      setAvailable(false)
    }
    canvas.addEventListener("webglcontextlost", handleContextLost, false)

    const idleId = scheduleIdle(async () => {
      if (cancelled) return

      try {
        // Dynamic import: lazy-load cobe out of hydration-critical bundle
        const { default: createGlobe } = await import("cobe")
        if (cancelled) return

        const activeProbe = probes[selected] || probes[0]
        globe = createGlobe(canvas, {
          devicePixelRatio: pixelRatio,
          width: size * pixelRatio,
          height: size * pixelRatio,
          phi: rotation.current,
          theta: 0.24,
          dark: dark ? 1 : 0,
          diffuse: 1.4,
          mapSamples: mapSamples,
          mapBrightness: dark ? 5 : 2.2,
          baseColor: dark ? [0.12, 0.24, 0.21] : [0.72, 0.79, 0.65],
          markerColor: dark ? [0.1, 1, 0.64] : [0.02, 0.35, 0.19],
          glowColor: dark ? [0.05, 0.14, 0.12] : [0.93, 0.9, 0.83],
          markers: probes.map((probe, index) => ({
            location: probe.location,
            size: index === selected ? 0.085 : 0.045,
          })),
          arcs: probes
            .filter((_, index) => index !== selected)
            .map((probe) => ({
              from: activeProbe.location,
              to: probe.location,
            })),
          arcColor: dark ? [0.1, 0.85, 0.57] : [0.05, 0.42, 0.25],
          arcWidth: 0.6,
          arcHeight: 0.24,
        })

        resizeObserver = new ResizeObserver(() => {
          if (!canvas || !canvas.clientWidth || !globe) return
          try {
            const width = canvas.clientWidth * pixelRatio
            globe.update({ width, height: width })
          } catch {
            // Guard against resize update errors
          }
        })
        resizeObserver.observe(canvas)

        intersectionObserver = new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting
        })
        intersectionObserver.observe(canvas)

        const animate = (time) => {
          try {
            const elapsed = Math.min(time - lastTime, 40)
            lastTime = time
            if (visible && !document.hidden && globe) {
              if (!pausedRef.current && !motion.matches && drag.current === null) {
                rotation.current += elapsed * 0.00007
              }
              globe.update({ phi: rotation.current })
            }
            failureCount = 0
          } catch {
            failureCount += 1
            if (failureCount >= MAX_FAILURES) {
              cancelAnimationFrame(frame)
              try {
                globe?.destroy()
              } catch {
                /* ignore destroy errors */
              }
              setAvailable(false)
              return
            }
          }
          frame = requestAnimationFrame(animate)
        }
        frame = requestAnimationFrame(animate)
      } catch {
        setAvailable(false)
      }
    })

    return () => {
      cancelled = true
      cancelIdle(idleId)
      cancelAnimationFrame(frame)
      canvas.removeEventListener("webglcontextlost", handleContextLost)
      if (resizeObserver) resizeObserver.disconnect()
      if (intersectionObserver) intersectionObserver.disconnect()
      if (globe) {
        try {
          globe.destroy()
        } catch {
          /* ignore destroy errors */
        }
      }
    }
  }, [canMountGlobe, available, theme, selected, probes])

  const showGlobe = canMountGlobe && available

  return (
    <figure
      className="relative w-full py-[18px]"
      aria-label="Interactive 3D illustration of worldwide website analysis probes"
    >
      <div
        className={`${mono} flex items-center gap-2 text-[9px] tracking-[.12em] text-[var(--green)]`}
      >
        <span className="h-[5px] w-[5px] rounded-full bg-[var(--green)]" /> LIVE{" "}
        <span className="ml-auto text-[7px] tracking-[.06em] text-[var(--muted-2)]">
          IN
        </span>
      </div>
      <div className="relative isolate aspect-square w-full">
        <div className="pointer-events-none absolute inset-x-0 inset-y-[12%] -z-10 scale-y-50 -rotate-[28deg] rounded-full border border-[var(--border-bright)]" />
        <div className="pointer-events-none absolute inset-x-[13%] inset-y-0 -z-10 scale-x-[.6] rotate-[28deg] rounded-full border border-[var(--border-bright)]" />
        {showGlobe ? (
          <canvas
            ref={canvasRef}
            className="block h-full w-full touch-pan-y cursor-grab active:cursor-grabbing"
            aria-label="Drag to rotate the globe"
            onPointerDown={(event) => {
              drag.current = event.clientX
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerMove={(event) => {
              if (drag.current !== null) {
                rotation.current += (event.clientX - drag.current) * 0.006
                drag.current = event.clientX
              }
            }}
            onPointerUp={() => {
              drag.current = null
            }}
            onPointerCancel={() => {
              drag.current = null
            }}
          />
        ) : (
          <div className="absolute inset-[12%] flex flex-col items-center justify-center gap-2.5 rounded-full border border-[var(--border-bright)] bg-[var(--surface-2)] text-[var(--green)] shadow-inner">
            <span className="text-[64px] sm:text-[80px] leading-none" aria-hidden="true">◎</span>
            <p className="font-semibold text-center text-xs sm:text-sm">Worldwide probe network</p>
            <small className="text-[10px] text-[var(--muted-2)] text-center px-4">
              {isMobileOrCrawler
                ? "Global latency & uptime monitoring mesh"
                : "3D preview needs WebGL support."}
            </small>
          </div>
        )}
        <div className="pointer-events-none absolute top-[23%] right-0 flex items-start gap-2 rounded-xl border border-[var(--border-bright)] bg-[var(--surface)] p-2.5 shadow-[var(--shadow-card)] sm:px-3.5 sm:py-3">
          <span className="mt-[3px] h-1.5 w-1.5 rounded-full bg-[var(--green)]" />
          <div>
            <span
              className={`${mono} block text-[8px] tracking-[.08em] text-[var(--muted-2)]`}
            >
              {(probes[selected] || probes[0]).city.toUpperCase()} / EDGE NODE
            </span>
            <strong
              className={`${mono} mt-1.5 block text-2xl font-normal text-[var(--green)]`}
            >
              {(probes[selected] || probes[0]).ms}
              <small className="text-[10px]"> ms</small>
            </strong>
            <span className="mt-[5px] block text-[8px] text-[var(--muted-2)]">
              Sample response time
            </span>
          </div>
        </div>
      </div>
      <figcaption className="flex items-center justify-between gap-2.5 border-t border-[var(--border-mid)] pt-4">
        <div>
          <span
            className={`${mono} text-[8px] tracking-[.13em] text-[var(--muted-2)]`}
          >
            EXPLORE THE NETWORK
          </span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {probes.slice(0, 3).map((probe, index) => (
              <button
                key={probe.city}
                className={probeButton}
                aria-pressed={selected === index}
                onClick={() => setSelected(index)}
              >
                {probe.city}
              </button>
            ))}
          </div>
        </div>
        {showGlobe && (
          <button
            className={`${probeButton} min-h-9 min-w-9 text-xs`}
            onClick={() => setPaused(!paused)}
            aria-label={paused ? "Resume globe rotation" : "Pause globe rotation"}
            aria-pressed={paused}
          >
            {paused ? "▶" : "Ⅱ"}
          </button>
        )}
      </figcaption>
      <p className="mt-3 text-[9px] leading-relaxed text-[var(--muted-2)]">
        {showGlobe
          ? "Drag to explore · Connection arcs illustrate global analysis, not live traffic."
          : "Global edge probe network monitoring worldwide latency and availability."}
      </p>
    </figure>
  )
}
