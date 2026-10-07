import { useEffect, useRef, useState } from "react"
import createGlobe from "cobe"

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

export default function NetworkGlobe({ theme, probes = defaultProbes }) {
  const canvasRef = useRef(null)
  const rotation = useRef(1.25)
  const drag = useRef(null)
  const [paused, setPaused] = useState(false)
  const pausedRef = useRef(paused)
  const [available, setAvailable] = useState(true)
  const [selected, setSelected] = useState(0)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let globe
    let frame
    let visible = true
    let lastTime = 0
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const dark = theme !== "light"
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    const size = canvas.clientWidth || 300
    try {
      const activeProbe = probes[selected] || probes[0]
      globe = createGlobe(canvas, {
        devicePixelRatio: pixelRatio,
        width: size * pixelRatio,
        height: size * pixelRatio,
        phi: rotation.current,
        theta: 0.24,
        dark: dark ? 1 : 0,
        diffuse: 1.4,
        mapSamples: 18000,
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
    } catch {
      setTimeout(() => setAvailable(false), 0)
      return
    }
    const resize = new ResizeObserver(() => {
      if (!canvas || !canvas.clientWidth) return
      const width = canvas.clientWidth * pixelRatio
      globe?.update({ width, height: width })
    })
    resize.observe(canvas)
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
    })
    observer.observe(canvas)
    const animate = (time) => {
      const elapsed = Math.min(time - lastTime, 40)
      lastTime = time
      if (visible && !document.hidden) {
        if (!pausedRef.current && !motion.matches && drag.current === null)
          rotation.current += elapsed * 0.00007
        globe?.update({ phi: rotation.current })
      }
      frame = requestAnimationFrame(animate)
    }
    frame = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      observer.disconnect()
      globe?.destroy()
    }
  }, [theme, selected, probes])

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
        {!available && (
          <div className="absolute inset-[12%] flex flex-col items-center justify-center gap-2.5 rounded-full border border-[var(--border-bright)] bg-[var(--surface-2)] text-[var(--green)]">
            <span className="text-[80px]">◎</span>
            <p>Worldwide probe network</p>
            <small className="text-[10px]">
              3D preview needs WebGL support.
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
        <button
          className={`${probeButton} min-h-9 min-w-9 text-xs`}
          onClick={() => setPaused(!paused)}
          aria-label={paused ? "Resume globe rotation" : "Pause globe rotation"}
          aria-pressed={paused}
        >
          {paused ? "▶" : "Ⅱ"}
        </button>
      </figcaption>
      <p className="mt-3 text-[9px] leading-relaxed text-[var(--muted-2)]">
        Drag to explore · Connection arcs illustrate global analysis, not live
        traffic.
      </p>
    </figure>
  )
}
