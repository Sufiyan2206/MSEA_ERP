import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError, type One } from "@/lib/api";
import { useAuth, type Me } from "@/store/auth";
import { Field } from "@/components/ui";

export default function Login() {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = useAuth((s) => s.setSession); const nav = useNavigate();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setErr("");
    try { const r = await api.post<One<{ token: string; user: Me }>>("/auth/login", { username: u, password: p }); set(r.data.token, r.data.user); nav(r.data.user.must_change_password ? "/change-password" : "/"); }
    catch (ex) { setErr(ex instanceof ApiError ? ex.message : "Login failed"); } finally { setBusy(false); }
  };
  return <div className="login"><form className="card" onSubmit={submit}>
    <div><h1>Eduvia</h1><div className="muted small">MS Education Academy · sign in with your staff account</div></div>
    <Field label="Username"><input value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" autoFocus required /></Field>
    <Field label="Password"><input type="password" value={p} onChange={(e) => setP(e.target.value)} autoComplete="current-password" required /></Field>
    {err && <div className="pill err">{err}</div>}
    <button className="btn primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    <div className="small muted">Forgot password? Ask your System Admin to reset it. 5 wrong attempts lock the account.</div>
  </form></div>;
}

export function ChangePassword() {
  const [o, setO] = useState(""); const [n, setN] = useState(""); const [err, setErr] = useState(""); const nav = useNavigate(); const { me, setMe } = useAuth();
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.post("/auth/change-password", { old_password: o, new_password: n }); if (me) setMe({ ...me, must_change_password: false }); nav("/"); }
    catch (ex) { setErr(ex instanceof ApiError ? ex.message : "Failed"); }
  };
  return <div className="login"><form className="card" onSubmit={submit}><h1>Set a new password</h1>
    <Field label="Current password"><input type="password" value={o} onChange={(e) => setO(e.target.value)} required /></Field>
    <Field label="New password (8+ characters)"><input type="password" value={n} onChange={(e) => setN(e.target.value)} minLength={8} required /></Field>
    {err && <div className="pill err">{err}</div>}<button className="btn primary">Save</button></form></div>;
}
