import { STORAGE_KEYS } from '../constants';

const memoryStore = new Map();

const isStorageAvailable = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const testKey = '__wp_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const storageAvailable = isStorageAvailable();

/** Safely read an item from localStorage with memory fallback */
export function getStoredItem(key) {
  try {
    if (storageAvailable) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
  } catch (err) {
    console.warn(`[storage] Failed to read ${key}:`, err);
  }
  return memoryStore.get(key) || null;
}

/** Safely store an item in localStorage with memory fallback */
export function setStoredItem(key, value) {
  if (!value) {
    removeStoredItem(key);
    return;
  }
  try {
    if (storageAvailable) {
      window.localStorage.setItem(key, String(value));
    }
  } catch (err) {
    console.warn(`[storage] Failed to set ${key}:`, err);
  }
  memoryStore.set(key, String(value));
}

/** Safely remove an item from localStorage and memory fallback */
export function removeStoredItem(key) {
  try {
    if (storageAvailable) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`[storage] Failed to remove ${key}:`, err);
  }
  memoryStore.delete(key);
}

/* ------------------------------------------------------------------ */
/* Auth Token Helpers                                                 */
/* ------------------------------------------------------------------ */

export function getAuthToken() {
  return getStoredItem(STORAGE_KEYS.AUTH_TOKEN);
}

export function setAuthToken(token) {
  setStoredItem(STORAGE_KEYS.AUTH_TOKEN, token);
}

export function removeAuthToken() {
  removeStoredItem(STORAGE_KEYS.AUTH_TOKEN);
}

/* ------------------------------------------------------------------ */
/* Guest ID Helpers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Validates whether a candidate guest ID conforms strictly to the backend schema:
 * 32-character hexadecimal string (/^[a-f0-9]{32}$/i).
 */
export function isValidGuestId(id) {
  return typeof id === 'string' && /^[a-f0-9]{32}$/i.test(id);
}

/**
 * Generates a cryptographically strong 32-character hexadecimal guest ID
 * aligned with backend crypto.randomBytes(16).toString("hex").
 */
export function generateGuestHexId() {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }
  let hex = '';
  for (let i = 0; i < 32; i++) {
    hex += Math.floor(Math.random() * 16).toString(16);
  }
  return hex;
}

export function getGuestId() {
  return getStoredItem(STORAGE_KEYS.GUEST_ID);
}

export function setGuestId(guestId) {
  setStoredItem(STORAGE_KEYS.GUEST_ID, guestId);
}

/**
 * Returns the persisted guest ID if valid, or creates and persists a new 32-char hex ID.
 * Self-heals any legacy or non-hex string stored previously in localStorage.
 */
export function getOrCreateGuestId() {
  let gid = getGuestId();
  if (!isValidGuestId(gid)) {
    gid = generateGuestHexId();
    setGuestId(gid);
  }
  return gid;
}

export function removeGuestId() {
  removeStoredItem(STORAGE_KEYS.GUEST_ID);
}

/* ------------------------------------------------------------------ */
/* Clear All                                                          */
/* ------------------------------------------------------------------ */

export function clearAllAuth() {
  removeAuthToken();
  removeGuestId();
}

