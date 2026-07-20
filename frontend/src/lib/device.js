const KEY = "jp_device_id";

function makeId() {
  // Use crypto.randomUUID if available, otherwise fallback
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {}
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
    return makeId();
  }
}
