import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { api, ApiError, type One, type Page } from "@/lib/api";
import { useUI } from "@/store/ui";

export function useList<T>(key: QueryKey, path: string, enabled = true) {
  return useQuery({ queryKey: key, queryFn: () => api.get<Page<T>>(path), enabled, staleTime: 15_000 });
}
export function useOne<T>(key: QueryKey, path: string, enabled = true) {
  return useQuery({ queryKey: key, queryFn: () => api.get<One<T>>(path), enabled, staleTime: 15_000 });
}
/** Mutation with toast + cache invalidation. onError shows the backend policy message verbatim. */
export function useAction<TIn, TOut = unknown>(fn: (input: TIn) => Promise<TOut>, invalidate: QueryKey[] = [], okText?: string) {
  const qc = useQueryClient(); const toast = useUI((s) => s.toast);
  return useMutation({
    mutationFn: fn,
    onSuccess: () => { invalidate.forEach((k) => qc.invalidateQueries({ queryKey: k })); if (okText) toast(okText); },
    onError: (e) => toast(e instanceof ApiError ? `${e.message}${e.correlationId ? ` (ref ${e.correlationId})` : ""}` : String(e), "err"),
  });
}
export function useIsMobile() {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches);
  useEffect(() => {
    const q = window.matchMedia("(max-width: 767px)"); const h = () => setM(q.matches);
    q.addEventListener("change", h); return () => q.removeEventListener("change", h);
  }, []);
  return m;
}
