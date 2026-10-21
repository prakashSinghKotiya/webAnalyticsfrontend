import { io } from 'socket.io-client'
import { getAuthToken, getGuestId } from '../utils/tokenStorage'

const IS_DEV = Boolean(import.meta.env.DEV)
const IS_BROWSER = typeof window !== 'undefined'

const log = IS_DEV ? (...args) => console.debug('[socket]', ...args) : () => {}

function resolveSocketUrl() {
  return "https://api.monitormyhost.com";
}

export const SOCKET_URL = resolveSocketUrl()

/* ------------------------------------------------------------------ */
/* Event names - aligned with backend BullMQ worker & queue emissions */
/* ------------------------------------------------------------------ */

export const EMIT = Object.freeze({
  TTFB_JOB: 'ttfb-job',
  TTFB_JOB_ALL: 'ttfb-job-global',
  LIGHTHOUSE_JOB: 'Lighthouse-job',
  UPTIME_JOB: 'uptime-job',
  DNS_JOB: 'dnsRecordCheck-job',
  REDIRECT_JOB: 'redirect-job',
  WHOIS_JOB: 'whois-job',
  CATCHUP: 'catchup',
})

export const ON = Object.freeze({
  // Standardized events (DEMO_FLOW.md)
  TTFB_RESULT: 'ttfb:result',
  LIGHTHOUSE_RESULT: 'lighthouse:result',
  DNS_RESULT: 'dns:result',
  REDIRECT_RESULT: 'redirect:result',
  WHOIS_RESULT: 'whois:result',
  UPTIME_RESULT: 'uptime:result',

  // Legacy events & compatibility aliases
  TTFB_COMPLETED: 'ttfbCompleted',
  LIGHTHOUSE_COMPLETED: 'lighthouseCompleted',
  LIGHTHOUSE_COMPLETED_ALT: 'Lighthouse-completed',
  LIGHTHOUSE_FAILED: 'Lighthouse-failed',
  DNS_COMPLETED: 'dnsRecordCompleted',
  DNS_COMPLETED_ALT: 'dnsRecordCheck-completed',
  DNS_FAILED: 'dnsRecordFailed',
  DNS_FAILED_ALT: 'dnsRecordCheck-failed',
  REDIRECT_COMPLETED: 'redirectCheckCompleted',
  REDIRECT_COMPLETED_ALT: 'redirect-completed',
  REDIRECT_FAILED: 'redirectCheckFailed',
  REDIRECT_FAILED_ALT: 'redirect-failed',
  WHOIS_COMPLETED: 'whoisLookupCompleted',
  WHOIS_COMPLETED_ALT: 'whoisLookup-completed',
  WHOIS_FAILED: 'whoisLookupFailed',
  WHOIS_FAILED_ALT: 'whoisLookup-failed',
  UPTIME_COMPLETED: 'uptimeCompleted',
  UPTIME_FAILED: 'uptimeMonitor-failed',
  ROOM_MIGRATED: 'roomMigrated',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
})

/* ------------------------------------------------------------------ */
/* Connection state store                                             */
/* ------------------------------------------------------------------ */

/** @typedef {'idle'|'connecting'|'connected'|'reconnecting'|'disconnected'|'unauthorized'} SocketStatus */

let connectionState = { status: 'idle', error: null, attempt: 0 }
const stateSubscribers = new Set()

function setConnectionState(patch) {
  connectionState = { ...connectionState, ...patch }
  stateSubscribers.forEach((fn) => fn(connectionState))
}

export function getConnectionState() {
  return connectionState
}

export function subscribeToConnectionState(callback) {
  stateSubscribers.add(callback)
  return () => stateSubscribers.delete(callback)
}

/* ------------------------------------------------------------------ */
/* Auth payload synchronization                                       */
/* ------------------------------------------------------------------ */

/**
 * Constructs the multi-source auth payload for Socket.IO handshake.
 * Provides token/sessionId for authenticated users and guestId for demo visitors.
 */
function getSocketAuthPayload() {
  const token = getAuthToken()
  const guestId = getGuestId()
  return {
    token: token || undefined,
    sessionId: token || undefined,
    guestId: guestId || undefined,
  }
}

/** Synchronizes the latest auth credentials onto the socket instance */
function syncSocketAuth(instance) {
  if (!instance) return
  const auth = getSocketAuthPayload()
  instance.auth = auth

  if (instance.io?.opts) {
    instance.io.opts.auth = auth
    const query = {
      ...(auth.token ? { token: auth.token } : {}),
      ...(auth.guestId ? { guestId: auth.guestId } : {}),
    }
    instance.io.opts.query = query
  }
}

/* ------------------------------------------------------------------ */
/* Socket singleton                                                   */
/* ------------------------------------------------------------------ */

let socket = null
const listenerRegistry = new Map() // event -> Set<handler>
const activeRooms = new Map() // key -> { joinEvent, payload }
const inFlightCatchupJobs = new Map() // id -> { service, id }

/** Register an in-flight job for automatic catchup recovery on connect/reconnect */
export function registerCatchupJob(service, id) {
  if (!id) return
  inFlightCatchupJobs.set(String(id), { service: service.toLowerCase(), id: String(id) })
}

/** Unregister a finished job from catchup recovery */
export function unregisterCatchupJob(id) {
  if (!id) return
  inFlightCatchupJobs.delete(String(id))
}

/** Proactively emit catchup request to replay finished job results */
export function emitCatchup(jobs) {
  const instance = getSocket()
  if (!instance?.connected) return false
  const list = Array.isArray(jobs)
    ? jobs.map((j) => ({ service: j.service?.toLowerCase(), id: String(j.id || j.jobId) }))
    : [{ service: jobs.service?.toLowerCase(), id: String(jobs.id || jobs.jobId) }]
  instance.emit('catchup', { jobs: list })
  return true
}

function createSocket() {
  const auth = getSocketAuthPayload()
  const query = {
    ...(auth.token ? { token: auth.token } : {}),
    ...(auth.guestId ? { guestId: auth.guestId } : {}),
  }

  const instance = io(SOCKET_URL, {
    autoConnect: false,
    auth,
    query,
    transports: ['websocket', 'polling'], // Ensures fast WebSocket connection on iOS
    tryAllTransports: true,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 15_000,
    randomizationFactor: 0.5,
    timeout: 20_000,
  })

  instance.on('connect', () => {
    log('connected with ID:', instance.id)
    setConnectionState({ status: 'connected', error: null, attempt: 0 })

    // Rejoin rooms on reconnect if necessary
    if (!instance.recovered) {
      for (const { joinEvent, payload } of activeRooms.values()) {
        instance.emit(joinEvent, payload)
      }
    }

    // Auto-replay in-flight jobs on connection or reconnect (DEMO_FLOW.md catchup)
    if (inFlightCatchupJobs.size > 0) {
      const jobs = Array.from(inFlightCatchupJobs.values())
      log('requesting catchup for in-flight jobs:', jobs)
      instance.emit('catchup', { jobs })
    }
  })

  // Handle server-side socket migration from guest to user room
  instance.on('roomMigrated', (data) => {
    log('Room migrated by backend:', data?.roomId)
  })

  instance.on('disconnect', (reason) => {
    log('disconnected:', reason)
    setConnectionState({
      status: instance.active ? 'reconnecting' : 'disconnected',
    })
  })

  instance.on('connect_error', (err) => {
    log('connect_error:', err?.message)
    const isAuthError = /unauthori[sz]ed|invalid|forbidden|authentication required/i.test(
      err?.message || '',
    )

    if (isAuthError) {
      setConnectionState({
        status: 'unauthorized',
        error: err,
      })
      return
    }

    if (!instance.active) {
      setConnectionState({
        status: 'disconnected',
        error: err,
      })
      return
    }

    setConnectionState({ status: 'reconnecting', error: err })
  })

  instance.io.on('reconnect_attempt', (attempt) => {
    // Keep auth in sync during reconnect attempts
    syncSocketAuth(instance)
    setConnectionState({ status: 'reconnecting', attempt })
  })

  // Re-attach registered listeners
  for (const [event, handlers] of listenerRegistry) {
    handlers.forEach((handler) => instance.on(event, handler))
  }

  return instance
}

function ensureConnected() {
  const instance = getSocket()
  syncSocketAuth(instance)
  if (!instance.connected && !instance.active) {
    setConnectionState({ status: 'connecting', error: null })
    instance.connect()
  }
  return instance
}

/* ------------------------------------------------------------------ */
/* Public API                                                         */
/* ------------------------------------------------------------------ */

export function getSocket({ autoConnect = false } = {}) {
  if (!socket) socket = createSocket()
  if (autoConnect) ensureConnected()
  return socket
}

export function resetSocketAuth() {
  if (connectionState.status === 'unauthorized') {
    setConnectionState({ status: 'idle', error: null, attempt: 0 })
  }
}

export function connectSocket({ force = false } = {}) {
  if (force) {
    resetSocketAuth()
  }
  return ensureConnected()
}

export function disconnectSocket() {
  if (!socket) return
  const instance = socket
  socket = null
  instance.disconnect()
  instance.removeAllListeners()
  if (instance.io) instance.io.removeAllListeners()
  activeRooms.clear()
  listenerRegistry.clear()
  setConnectionState({ status: 'idle', error: null, attempt: 0 })
}

/**
 * Completely tears down the current socket instance and reconnects fresh
 * using current credentials (e.g. after login, logout, or guest session init).
 * All event subscriptions registered via subscribeToEvents are preserved.
 */
export function reconnectSocket() {
  if (socket) {
    const prevSocket = socket
    socket = null
    prevSocket.disconnect()
    prevSocket.removeAllListeners()
    if (prevSocket.io) prevSocket.io.removeAllListeners()
  }
  resetSocketAuth()
  return ensureConnected()
}

export function isSocketConnected() {
  return Boolean(socket?.connected)
}

/**
 * Resilient socket readiness waiter.
 * Resolves true as soon as the socket is connected.
 * Never fails prematurely on transient disconnected/reconnecting states while within timeoutMs.
 */
export function waitForSocket(timeoutMs = 15_000) {
  if (isSocketConnected()) return Promise.resolve(true)
  connectSocket()

  return new Promise((resolve) => {
    let finished = false
    const finish = (value) => {
      if (finished) return
      finished = true
      clearTimeout(timer)
      unsubscribe()
      resolve(value)
    }

    const timer = setTimeout(() => finish(false), timeoutMs)
    const unsubscribe = subscribeToConnectionState((state) => {
      if (state.status === 'connected') {
        finish(true)
      } else if (state.status === 'unauthorized') {
        finish(false)
      }
    })

    if (isSocketConnected()) finish(true)
  })
}

/* ------------------------------------------------------------------ */
/* Subscriptions                                                      */
/* ------------------------------------------------------------------ */

/**
 * Subscribe to socket events. Returns cleanup function.
 * Registered handlers survive reconnects and socket rebuilds.
 */
export function subscribeToEvents(handlers) {
  const entries = Object.entries(handlers ?? {})
    .filter(([, handler]) => typeof handler === 'function')
    .map(([event, handler]) => {
      const wrapped = (...args) => {
        try {
          handler(...args)
        } catch (err) {
          console.error(`[socket] handler for "${event}" threw`, err)
        }
      }
      return [event, wrapped]
    })

  for (const [event, wrapped] of entries) {
    if (!listenerRegistry.has(event)) listenerRegistry.set(event, new Set())
    listenerRegistry.get(event).add(wrapped)
    if (socket) socket.on(event, wrapped)
  }

  return () => {
    for (const [event, wrapped] of entries) {
      listenerRegistry.get(event)?.delete(wrapped)
      if (socket) socket.off(event, wrapped)
    }
  }
}

/* ------------------------------------------------------------------ */
/* Emitting                                                           */
/* ------------------------------------------------------------------ */

export function emitSocketEvent(event, payload) {
  const instance = getSocket()
  if (!instance.connected) {
    return false
  }
  instance.emit(event, payload)
  return true
}

export function emitWithAck(event, payload, { timeout = 10_000 } = {}) {
  const instance = getSocket()
  if (!instance.connected) {
    return Promise.reject(new Error(`Socket not connected`))
  }

  return new Promise((resolve, reject) => {
    instance.timeout(timeout).emit(event, payload, (err, response) => {
      if (err) reject(new Error(`"${event}" timed out`))
      else resolve(response)
    })
  })
}

/* ------------------------------------------------------------------ */
/* Room management                                                    */
/* ------------------------------------------------------------------ */

export function joinRoom(event, payload, key) {
  if (!key) throw new Error('joinRoom requires a key')
  if (activeRooms.has(key)) return false

  activeRooms.set(key, { joinEvent: event, payload })
  const instance = ensureConnected()
  if (instance.connected) instance.emit(event, payload)
  return true
}

export function leaveRoom(key) {
  if (!activeRooms.has(key)) return false
  activeRooms.delete(key)
  return true
}

/* ------------------------------------------------------------------ */
/* Browser lifecycle                                                  */
/* ------------------------------------------------------------------ */

if (IS_BROWSER) {
  window.addEventListener('online', () => {
    if (socket && !socket.connected && connectionState.status !== 'unauthorized') {
      syncSocketAuth(socket)
      socket.connect()
    }
  })
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => disconnectSocket())
}

export default {
  getSocket,
  connectSocket,
  reconnectSocket,
  disconnectSocket,
  isSocketConnected,
  waitForSocket,
  subscribeToEvents,
  getConnectionState,
  subscribeToConnectionState,
  emitSocketEvent,
  emitWithAck,
  joinRoom,
  leaveRoom,
  registerCatchupJob,
  unregisterCatchupJob,
  emitCatchup,
  resetSocketAuth,
}
