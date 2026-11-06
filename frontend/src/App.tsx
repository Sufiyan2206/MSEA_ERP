import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/store/auth";
import Shell from "@/components/Shell";
import Login, { ChangePassword } from "@/pages/Login";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Students, { StudentDetail } from "@/pages/Students";
import Admissions, { LeadDetail } from "@/pages/Admissions";
import Collect, { Approvals, Receipts, ReceiptView, Structures } from "@/pages/Fees";
import Closing, { Handovers } from "@/pages/Cash";
import Attendance from "@/pages/Attendance";
import Employees, { EmployeeDetail, LeavePage, Payroll } from "@/pages/HR";
import Gaps, { GapDetail } from "@/pages/Gaps";
import { Admin, AuditLog, Notifications, Reports, Search, Tasks } from "@/pages/Misc";
import Modules from "@/pages/Modules";
import LegacyHost from "@/pages/LegacyHost";

function Guard({ mod, action, children }: { mod?: string; action?: string; children: JSX.Element }) {
  const { token, me, can } = useAuth(); const loc = useLocation();
  if (!token || !me) return <Navigate to="/login" replace state={{ from: loc }} />;
  if (me.must_change_password && loc.pathname !== "/change-password") return <Navigate to="/change-password" replace />;
  if (mod && !can(mod, action ?? "View")) return <div className="page"><div className="card"><b>No access.</b> <span className="muted">Your role ({me.role}) lacks '{action ?? "View"}' on '{mod}'. Ask the System Admin.</span></div></div>;
  return children;
}

export default function App() {
  return <div className="nx"><Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/change-password" element={<Guard><ChangePassword /></Guard>} />
    <Route element={<Guard><Shell /></Guard>}>
      <Route index element={<Home />} />
      <Route path="dashboard" element={<Guard mod="dashboard"><Dashboard /></Guard>} />
      <Route path="students" element={<Guard mod="students"><Students /></Guard>} />
      <Route path="students/:id" element={<Guard mod="students"><StudentDetail /></Guard>} />
      <Route path="admissions" element={<Guard mod="admissions"><Admissions /></Guard>} />
      <Route path="admissions/:id" element={<Guard mod="admissions"><LeadDetail /></Guard>} />
      <Route path="fees/collect" element={<Guard mod="fees" action="Add"><Collect /></Guard>} />
      <Route path="fees/receipts" element={<Guard mod="fees"><Receipts /></Guard>} />
      <Route path="fees/receipts/:id" element={<Guard mod="fees"><ReceiptView /></Guard>} />
      <Route path="fees/approvals" element={<Guard mod="fees"><Approvals /></Guard>} />
      <Route path="fees/structures" element={<Guard mod="fees"><Structures /></Guard>} />
      <Route path="cash/closing" element={<Guard mod="cash"><Closing /></Guard>} />
      <Route path="cash/handovers" element={<Guard mod="cash"><Handovers /></Guard>} />
      <Route path="attendance" element={<Attendance />} />
      <Route path="hr/employees" element={<Guard mod="hr"><Employees /></Guard>} />
      <Route path="hr/employees/:id" element={<Guard mod="hr"><EmployeeDetail /></Guard>} />
      <Route path="hr/leave" element={<LeavePage />} />
      <Route path="hr/payroll" element={<Guard mod="payroll"><Payroll /></Guard>} />
      <Route path="gaps" element={<Guard mod="gaps"><Gaps /></Guard>} />
      <Route path="gaps/:id" element={<Guard mod="gaps"><GapDetail /></Guard>} />
      <Route path="tasks" element={<Tasks />} />
      <Route path="reports" element={<Guard mod="reports"><Reports /></Guard>} />
      <Route path="admin/users" element={<Guard mod="admin"><Admin /></Guard>} />
      <Route path="admin/audit" element={<Guard mod="audit"><AuditLog /></Guard>} />
      <Route path="modules" element={<Guard mod="legacy"><Modules /></Guard>} />
      <Route path="app" element={<Guard mod="legacy"><LegacyHost /></Guard>} />
      <Route path="app/:page" element={<Guard mod="legacy"><LegacyHost /></Guard>} />
      <Route path="notifications" element={<Notifications />} />
      <Route path="search" element={<Search />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes></div>;
}
