/**
 * Next.js instrumentation hook — runs once when the server starts.
 *
 * Node.js 22+ exposes globalThis.localStorage, but its methods
 * (getItem, setItem, etc.) are undefined unless --localstorage-file
 * is passed. Libraries like @supabase/auth-js check
 * typeof localStorage === 'object' (truthy) then call .getItem(),
 * which crashes. This polyfill prevents that.
 */
export function register() {
  if (
    typeof globalThis.localStorage === 'object' &&
    typeof globalThis.localStorage.getItem !== 'function'
  ) {
    const store: Record<string, string> = {}
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (key: string) => store[key] ?? null,
        setItem: (key: string, value: string) => { store[key] = value },
        removeItem: (key: string) => { delete store[key] },
        clear: () => { Object.keys(store).forEach(k => delete store[k]) },
        get length() { return Object.keys(store).length },
        key: (i: number) => Object.keys(store)[i] ?? null,
      },
      writable: true,
      configurable: true,
    })
  }
}
