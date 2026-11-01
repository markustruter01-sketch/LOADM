import type { Role } from "@shared/constants";

/**
 * The one HTTP client. Every request carries the chosen demo role as a
 * header (the cookie is also set by the server, but the header makes the
 * choice explicit and survives cookie-less contexts).
 */

export const DEMO_ROLE_STORAGE_KEY = "loadm.demoRole";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
  get isNoPersona(): boolean {
    return this.status === 401;
  }
}

export function getStoredRole(): Role | null {
  try {
    return (localStorage.getItem(DEMO_ROLE_STORAGE_KEY) as Role | null) ?? null;
  } catch {
    return null;
  }
}

export function setStoredRole(role: Role | null): void {
  try {
    if (role) localStorage.setItem(DEMO_ROLE_STORAGE_KEY, role);
    else localStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
  } catch {
    /* storage unavailable: the cookie still carries the role */
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: Method;
  body?: unknown;
  signal?: AbortSignal;
}

interface ErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

async function parseError(res: Response): Promise<ApiError> {
  let payload: ErrorBody | null = null;
  try {
    payload = (await res.json()) as ErrorBody;
  } catch {
    /* non-JSON error body */
  }
  return new ApiError(
    res.status,
    payload?.error?.code ?? "http_error",
    payload?.error?.message ?? `${res.status} ${res.statusText}`,
    payload?.error?.details,
  );
}

export async function api<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  const role = getStoredRole();
  if (role) headers["X-Demo-Role"] = role;
  let body: BodyInit | undefined;
  if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }
  const res = await fetch(path, {
    method: opts.method ?? (body ? "POST" : "GET"),
    headers,
    body,
    credentials: "same-origin",
    signal: opts.signal,
  });
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  const ct = res.headers.get("content-type") ?? "";
  return (ct.includes("application/json") ? await res.json() : await res.text()) as T;
}

export const get = <T>(path: string, signal?: AbortSignal) => api<T>(path, { signal });
export const post = <T>(path: string, body?: unknown) => api<T>(path, { method: "POST", body });
export const put = <T>(path: string, body?: unknown) => api<T>(path, { method: "PUT", body });
export const patch = <T>(path: string, body?: unknown) => api<T>(path, { method: "PATCH", body });
export const del = <T>(path: string) => api<T>(path, { method: "DELETE" });

/** Build a query string, skipping undefined/empty values. */
export function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}
