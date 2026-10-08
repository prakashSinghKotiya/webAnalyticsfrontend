import { axiosWithCreds } from './axiosInstance';
import { findTTFB, findTTFBAllRegions } from './ttfb';
import { generateLighthouseReport } from './lighthouse';
import { lookupDnsRecords } from './dnsType';
import { checkRedirects } from './redirectCheck';
import { whoisLookup } from './whoisLookup';

let inFlightSessionPromise = null;
let isSessionEstablished = false;

/**
 * Establishes the signed guest cookie required by Socket.IO demo sessions.
 * Concurrency-safe: sharing in-flight promises guarantees zero duplicate calls and race-free handshake.
 */
export async function initializeDemoSession({ force = false } = {}) {
  if (isSessionEstablished && !force) {
    return Promise.resolve();
  }

  if (inFlightSessionPromise && !force) {
    return inFlightSessionPromise;
  }

  inFlightSessionPromise = axiosWithCreds
    .post('/demo/session')
    .then(() => {
      isSessionEstablished = true;
    })
    .catch((err) => {
      isSessionEstablished = false;
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
  inFlightSessionPromise = null;
}

/**
 * Dispatches a demo job for any of the 5 supported services:
 * 'ttfb' | 'lighthouse' | 'dns' | 'redirects' | 'whois'
 */
export async function runDemoJob(service, targetUrl, options = {}) {
  await initializeDemoSession();

  switch (service) {
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
    case 'dns': {
      return await lookupDnsRecords(targetUrl);
    }
    case 'redirects': {
      return await checkRedirects(targetUrl);
    }
    case 'whois': {
      return await whoisLookup(targetUrl);
    }
    default:
      throw new Error(`Unsupported demo service: "${service}"`);
  }
}
