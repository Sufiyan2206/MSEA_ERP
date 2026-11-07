/** Typed fetch wrapper. All errors become ApiError {code,message,details,correlationId}
 *  (mirrors backend app/core/errors.py). The JWT lives in the auth store (localStorage). */
import { useAuth } from "@/store/auth";

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details: Record<string, unknown> = {}, public correlationId = "") {
    super(message);
  }
}

export interface Page<T> { data: T[]; total: number; unread?: number }
export interface One<T> { data: T }

const BASE = import.meta.env.VITE_API_BASE ?? "/api/v1";

async function request<T>(method: string, path: string, body?: unknown, raw = false): Promise<T> {
  const token = useAuth.getState().token;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  let res: Response;
  try {
    res = await fetch(BASE + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  } catch {
    throw new ApiError(0, "network", "You are offline or the server is unreachable.");
  }
  if (res.status === 401 && path !== "/auth/login") {
    useAuth.getState().logout();
    throw new ApiError(401, "unauthorized", "Session expired. Please sign in again.");
  }
  if (raw) return res as unknown as T;
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = json.error ?? {};
    throw new ApiError(res.status, e.code ?? "error", e.message ?? res.statusText, e.details ?? {}, e.correlation_id ?? "");
  }
  return json as T;
}

export const api = {
  get: <T>(p: string) => request<T>("GET", p),
  post: <T>(p: string, b?: unknown) => request<T>("POST", p, b ?? {}),
  patch: <T>(p: string, b?: unknown) => request<T>("PATCH", p, b ?? {}),
  put: <T>(p: string, b?: unknown) => request<T>("PUT", p, b ?? {}),
  /** Download a CSV/binary response and trigger browser save. */
  download: async (p: string, filename: string, body?: unknown) => {
    const res = await request<Response>(body ? "POST" : "GET", p, body, true);
    if (!res.ok) { const j = await res.json().catch(() => ({})); throw new ApiError(res.status, j.error?.code ?? "error", j.error?.message ?? res.statusText); }
    const blob = await res.blob(); const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  },
};

export const qs = (o: Record<string, string | number | boolean | undefined | null>) =>
  "?" + Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== "").map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");

export const inr = (n: number | null | undefined) => n == null ? "—" : "₹" + Math.round(n).toLocaleString("en-IN");
export const fmtDate = (s: string | null | undefined) => s ? new Date(s).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const today = () => new Date().toISOString().slice(0, 10);
