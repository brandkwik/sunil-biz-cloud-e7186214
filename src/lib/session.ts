// Reads the persisted session user directly from localStorage for route guards.
export function hasSessionUser(): boolean {
  if (typeof window === "undefined") return false;
  for (const key of ["sunildemo:v2", "sunildemo:v1"]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed?.user) return true;
    } catch {
      /* ignore malformed entries */
    }
  }
  return false;
}
