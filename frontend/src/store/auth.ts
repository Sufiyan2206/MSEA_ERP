import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Me {
  id: string; username: string; name: string; role: string; branch_id: string | null; must_change_password: boolean;
  permissions: Record<string, string[]>; scope: string[] | null; kids: string[];
}
interface AuthState {
  token: string | null; me: Me | null;
  setSession: (token: string, me: Me) => void; setMe: (me: Me) => void; logout: () => void;
  can: (module: string, action?: string) => boolean;
}
export const useAuth = create<AuthState>()(persist((set, get) => ({
  token: null, me: null,
  setSession: (token, me) => set({ token, me }),
  setMe: (me) => set({ me }),
  logout: () => set({ token: null, me: null }),
  can: (module, action = "View") => {
    const me = get().me; if (!me) return false;
    if (me.role === "Super Admin") return true;
    return (me.permissions[module] ?? []).includes(action);
  },
}), { name: "msea-auth" }));
