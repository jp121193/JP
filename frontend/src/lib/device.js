const KEY = "jp_device_id";

function makeId() {
  // crypto.randomUUID is unavailable on very old browsers; fall through silently.
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through to non-crypto fallback below */
  }
  return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getDeviceId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = makeId();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // localStorage throws in Safari private mode; degrade to an ephemeral id.
    return makeId();
  }
}
