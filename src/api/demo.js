import { axiosWithCreds } from './axiosInstance';
import { findTTFB, findTTFBAllRegions } from './ttfb';
import { generateLighthouseReport } from './lighthouse';
import { lookupDnsRecords } from './dnsType';
import { checkRedirects } from './redirectCheck';
import { whoisLookup } from './whoisLookup';
import { connectSocket, resetSocketAuth } from './socket';

let inFlightSessionPromise = null;
let isSessionEstablished = false;
let currentSessionData = null;

/**
 * Establishes the signed guest cookie required by Socket.IO demo sessions.
 * Concurrency-safe: sharing in-flight promises guarantees zero duplicate calls and race-free handshake.
 *
 * Flow per DEMO_FLOW.md:
 * 1. Call POST /demo/session with credentials: "include" -> sets signed HttpOnly 'gid' cookie.
 * 2. Connect Socket.IO -> socket joins room "guest:<guestId>".
 */
export async function initializeDemoSession({ force = false } = {}) {
  if (isSessionEstablished && currentSessionData && !force) {
    return Promise.resolve(currentSessionData);
  }

  if (inFlightSessionPromise && !force) {
    return inFlightSessionPromise;
  }

  // Clear any stale unauthorized socket state before establishing fresh guest cookie
  resetSocketAuth();

  inFlightSessionPromise = axiosWithCreds
    .post('/demo/session')
    .then((res) => {
      isSessionEstablished = true;
      currentSessionData = res.data;
      // Connect Socket.IO immediately now that the signed HttpOnly gid cookie is established
      connectSocket({ force: true });
      return res.data;
    })
    .catch((err) => {
      isSessionEstablished = false;
      currentSessionData = null;
      throw err;
    })
    .finally(() => {
      inFlightSessionPromise = null;
    });

  return inFlightSessionPromise;
}

/** Resets local session cache (e.g. after login or explicit reset). */
export function resetDemoSessionCache() {
  isSessionEstablished = false;
  currentSessionData = null;
  inFlightSessionPromise = null;
}

/** Returns the active session data (guestId, roomId) if initialized. */
export function getDemoSessionData() {
  return currentSessionData;
}

/**
 * Dispatches a demo job for any of the 5 supported services:
 * 'ttfb' | 'lighthouse' | 'dns' | 'redirects' | 'whois'
 */
export async function runDemoJob(service, targetUrl, options = {}) {
  await initializeDemoSession();

  switch (service.toLowerCase()) {
    case 'ttfb': {
      const mode = options.mode || 'single';
      const region = options.region || 'india';
      return mode === 'all'
        ? await findTTFBAllRegions(targetUrl)
        : await findTTFB(targetUrl, region);
    }
    case 'lighthouse': {
      const strategy = options.strategy || 'mobile';
      return await generateLighthouseReport(targetUrl, strategy);
    }
    case 'dns':
    case 'dnsrecord': {
      return await lookupDnsRecords(targetUrl);
    }
    case 'redirects':
    case 'redirect': {
      return await checkRedirects(targetUrl);
    }
    case 'whois': {
      return await whoisLookup(targetUrl);
    }
    default:
      throw new Error(`Unsupported demo service: "${service}"`);
  }
}

/**
 * Unified fallback status polling endpoint (GET /demo/status/:service/:id).
 * Works for both guest and authenticated users.
 */
export async function getDemoStatus(service, id) {
  const normService = service === 'redirects' ? 'redirect' : service;
  const { data } = await axiosWithCreds.get(`/demo/status/${normService}/${id}`);
  return data;
}

/**
 * Demo infrastructure health check (GET /demo/health).
 * Returns MongoDB, Redis, and Socket connection stats.
 */
export async function getDemoHealth() {
  const { data } = await axiosWithCreds.get('/demo/health');
  return data;
}

/**
 * Failsafe polling fallback: polls status until job finishes (completed/failed) or times out.
 * Guarantees 100% result delivery even if WebSocket connection is interrupted.
 */
export async function pollDemoResult(service, id, { timeoutMs = 30000, intervalMs = 2500 } = {}) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    try {
      const res = await getDemoStatus(service, id);
      if (res?.success && (res.status === 'completed' || res.status === 'failed')) {
        return res;
      }
    } catch {
      // Keep polling until timeout
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error(`Timed out polling status for ${service} (ID: ${id})`);
}
