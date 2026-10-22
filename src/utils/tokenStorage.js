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

export function getGuestId() {
  return getStoredItem(STORAGE_KEYS.GUEST_ID);
}

export function setGuestId(guestId) {
  setStoredItem(STORAGE_KEYS.GUEST_ID, guestId);
}

export function getOrCreateGuestId() {
  let gid = getGuestId();
  if (!gid) {
    gid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
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

