import { create } from "zustand";
export interface Toast { id: number; kind: "ok" | "err" | "info"; text: string }
interface UI { toasts: Toast[]; toast: (text: string, kind?: Toast["kind"]) => void; dismiss: (id: number) => void; drawer: boolean; setDrawer: (v: boolean) => void }
let n = 0;
export const useUI = create<UI>((set) => ({
  toasts: [], drawer: false,
  toast: (text, kind = "ok") => { const id = ++n; set((s) => ({ toasts: [...s.toasts, { id, kind, text }] })); setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 4500); },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  setDrawer: (v) => set({ drawer: v }),
}));
