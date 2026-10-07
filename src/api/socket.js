import { io } from 'socket.io-client'

const IS_DEV = Boolean(import.meta.env.DEV)
const IS_BROWSER = typeof window !== 'undefined'

const log = IS_DEV ? (...args) => console.debug('[socket]', ...args) : () => {}

function resolveSocketUrl() {
  const fromEnv = import.meta.env.VITE_SOCKET_URL
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  if (IS_DEV) return 'https://webanalytics-9srv.onrender.com'
  return IS_BROWSER ? window.location.origin : ''
}

export const SOCKET_URL = resolveSocketUrl()

/* ------------------------------------------------------------------ */
/* Event names - aligned with backend                                 */
/* ------------------------------------------------------------------ */

export const EMIT = Object.freeze({
  TTFB_JOB: 'ttfb-job',
  TTFB_JOB_ALL: 'ttfb-job-global',
  LIGHTHOUSE_JOB: 'Lighthouse-job',
  UPTIME_JOB: 'uptime-job',
  DNS_JOB: 'dnsRecordCheck-job',
  REDIRECT_JOB: 'redirect-job',
  WHOIS_JOB: 'whois-job',
})

export const ON = Object.freeze({
  TTFB_COMPLETED: 'ttfbCompleted',
  LIGHTHOUSE_COMPLETED: 'Lighthouse-completed',
  LIGHTHOUSE_FAILED: 'Lighthouse-failed',
  DNS_COMPLETED: 'dnsRecordCheck-completed',
  DNS_FAILED: 'dnsRecordCheck-failed',
  REDIRECT_COMPLETED: 'redirectQueue-completed',
  REDIRECT_FAILED: 'redirectQueue-failed',
  WHOIS_COMPLETED: 'whoisLookup-completed',
  WHOIS_FAILED: 'whoisLookup-failed',
  UPTIME_COMPLETED: 'uptimeCompleted',
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
})


/* Connection state store                                             */


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
/* Socket singleton                                                   */
/* ------------------------------------------------------------------ */

let socket = null
const listenerRegistry = new Map() // event -> Set<handler>
const activeRooms = new Map() // key -> { joinEvent, payload }

function createSocket() {
  const instance = io(SOCKET_URL, {
    autoConnect: false,
    transports: ['websocket', 'polling'],
    tryAllTransports: true,
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 30_000,
    randomizationFactor: 0.5,
    timeout: 20_000,
  })

  instance.on('connect', () => {
    log('connected', instance.id)
    setConnectionState({ status: 'connected', error: null, attempt: 0 })
    
    // Rejoin rooms on reconnect
    if (!instance.recovered) {
      for (const { joinEvent, payload } of activeRooms.values()) {
        instance.emit(joinEvent, payload)
      }
    }
  })

  instance.on('disconnect', (reason) => {
    log('disconnected:', reason)
    setConnectionState({ 
      status: instance.active ? 'reconnecting' : 'disconnected' 
    })
  })

  instance.on('connect_error', (err) => {
    log('connect_error:', err?.message)
    const isAuthError = /unauthori[sz]ed|invalid|forbidden/i.test(err?.message || '')
    
    if (!instance.active) {
      setConnectionState({
        status: isAuthError ? 'unauthorized' : 'disconnected',
        error: err,
      })
      return
    }
    setConnectionState({ status: 'reconnecting', error: err })
  })

  instance.io.on('reconnect_attempt', (attempt) => {
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

export function connectSocket() {
  return ensureConnected()
}

export function disconnectSocket() {
  if (!socket) return
  const instance = socket
  socket = null
  instance.disconnect()
  instance.removeAllListeners()
  instance.io.removeAllListeners()
  activeRooms.clear()
  listenerRegistry.clear()
  setConnectionState({ status: 'idle', error: null, attempt: 0 })
}

export function isSocketConnected() {
  return Boolean(socket?.connected)
}

/* ------------------------------------------------------------------ */
/* Subscriptions                                                      */
/* ------------------------------------------------------------------ */

/**
 * Subscribe to socket events. Returns cleanup function.
 * Usage: useEffect(() => subscribeToEvents({ [ON.TTFB_COMPLETED]: handler }), [])
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
    console.warn(`[socket] Cannot emit "${event}" - not connected`)
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
  disconnectSocket,
  subscribeToEvents,
  getConnectionState,
  subscribeToConnectionState,
  emitSocketEvent,
  emitWithAck,
}
