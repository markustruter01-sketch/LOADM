/**
 * Debug hook used by the load-planning grids. Intentionally a no-op in the
 * showcase build: the grids call it on every interaction and we do not want
 * console noise in production.
 */
export function debugLog(_label: string, _payload?: unknown): void {
  /* no-op */
}
