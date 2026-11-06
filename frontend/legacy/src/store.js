/* ===== Shared state: defaults, persistence (artifact db when available, memory otherwise), audit ===== */
const MODULES = [
  ['exec', 'Executive Dashboard'], ['cancel', 'Cancellations & Withdrawals'], ['strength', 'Strength, Target & Capacity'], ['targets', 'Target Planning'], ['capacity', 'Capacity Setup'],
  ['admplan', 'Admission Plan'], ['revenue', 'Revenue & Collection'], ['compare', 'Multi-year Comparison'], ['masters', 'Category Masters'], ['import', 'Data Import'],
  ['dashboard', 'Management Dashboard'], ['daily', 'Daily Collection Report'], ['target', 'Monthly Target'], ['instalment', 'Instalment Dues'],
  ['zeropayer', 'Zero Payer Analysis'], ['students', 'Student Corner'], ['alerts', 'Alerts & Escalations'], ['exceptions', 'Exceptions & Reconciliation'],
  ['email', 'Email Reports'], ['settings', 'Targets & Instalments'], ['approvals', 'Approvals & Adjustments'],
  ['sis', 'Student Information System'], ['acad', 'Academic Management'], ['lms', 'Learning Management'], ['exam', 'Examinations'], ['udise', 'UDISE+ & Compliance'], ['house', 'House System'], ['meet', 'Meeting Management'], ['consent', 'Parent Consents'], ['franchise', 'Franchise Management'], ['cal', 'Calendar & Planner'], ['tac', 'Teacher Academy & Policies'], ['lrc', 'Outcomes & Report Cards'], ['qps', 'Question Paper Security'], ['lib', 'Library'], ['smk', 'Smart Classroom & Kits'], ['adp', 'Admission Tests & Offers'], ['cmc', 'Communication Centre'], ['cur', 'Curriculum Master'], ['fbp', 'Foundation & Board Prep'], ['hml', 'Hostel & Mess'], ['tnp', 'Transport'], ['alm', 'Alumni & Placements'], ['rov', 'Backup & Year-end'], ['cdk', 'Collections desk'], ['cch', 'Cash control'], ['att', 'Student attendance'], ['tapp', 'Teacher app'], ['portal', 'Parent & Student app'], ['rfc', 'Refunds & concessions'], ['fst', 'Fee Structure'], ['fdm', 'Fee Reminders'], ['crt', 'Certificates & ID Cards'], ['opay', 'Online Payments'], ['smv', 'Student Moves'], ['ptk', 'Parent Help Desk'], ['acpl', 'Academic Planning'], ['corp', 'Corporate Dashboard'], ['grat', 'Gratuity'], ['iplan', 'Instalment Plans'], ['scl', 'Smart Classroom & Content'], ['gap', 'Gap Analysis Center'], ['tasks', 'Task & Approval Center'], ['sdev', 'Classroom Devices & Sync'], ['rost', 'Shift Roster'], ['icoy', 'Inter-company Accounting'], ['ema', 'Emergency Alerts'], ['svy', 'Parent Surveys'], ['portal', 'Parent & Student app'], ['myday', 'My Day'], ['ai_chat', 'AI Assistant'], ['ai_admin', 'AI Control Centre'], ['admin_home', 'Admin Control Centre'], ['admin_users', 'User Management'], ['admin_roles', 'Roles & Permissions'], ['admin_mapping', 'Data Scope Mapping'],
  ['admin_email', 'Email Distribution'], ['admin_sync', 'ERP Sync & Reconciliation'], ['audit', 'Audit Log'], ['srf', 'SRF Workspace'],
  ['pr_home', 'Store & Purchase Dashboard'], ['pr_mr', 'Material Requests'], ['pr_pr', 'Purchase Requests'], ['pr_inbox', 'Purchase Approvals Inbox'], ['pr_store', 'Store & Inventory'], ['pr_vendors', 'Vendors & Quotations'], ['pr_po', 'Purchase Orders'], ['pr_budget', 'Budget & Finance Controls'], ['pr_reports', 'Store & Purchase Reports'], ['pr_admin', 'Store & Purchase Settings'],
  ['as_home', 'Asset Dashboard'], ['as_register', 'Asset Register'], ['as_alloc', 'Asset Allocation & Returns'], ['as_transfer', 'Asset Transfers'], ['as_maint', 'Asset Maintenance & AMC'], ['as_verify', 'Asset Verification & Audit'], ['as_incidents', 'Asset Incidents & Disposal'], ['as_finance', 'Fixed Assets & Depreciation'], ['as_requests', 'Asset Requests'], ['as_reports', 'Asset Reports'], ['as_admin', 'Asset Control Centre'],
  ['cb_home', 'Petty Cash Dashboard'], ['cb_vouchers', 'Petty Cash Vouchers'], ['cb_advances', 'Cash Advances & Reimbursements'], ['cb_day', 'Daily Cash Book'], ['cb_replenish', 'Petty Cash Replenishment'], ['cb_reports', 'Petty Cash Reports'], ['cb_admin', 'Petty Cash Control Centre'],
  ['ut_home', 'Utilities Dashboard'], ['ut_conns', 'Utility Connections'], ['ut_bills', 'Utility Bills & Payments'], ['ut_meters', 'Meters, Water & Tankers'], ['ut_ptax', 'Property Tax'], ['ut_rent', 'Rent & Leases'], ['ut_tickets', 'Utility Complaints & Renewals'], ['ut_reports', 'Utilities Reports'], ['ut_admin', 'Utilities Control Centre'],
  ['rm_home', 'Rent Management Dashboard'], ['rm_master', 'Rent Master'], ['rm_entries', 'Monthly Rent Processing'], ['rm_ledger', 'Rent Accounting & Payments'], ['rm_reports', 'Rent Reports'], ['rm_import', 'Rent – Tally Excel Import'], ['rm_admin', 'Rent Control Centre'],
  ['fn_home', 'Finance Dashboard'], ['fn_gl', 'General Ledger'], ['fn_ar', 'Accounts Receivable'], ['fn_ap', 'Accounts Payable'], ['fn_bank', 'Bank Reconciliation & Cash'], ['fn_budget', 'Budget & Cost Control'], ['fn_reports', 'Financial Reports'], ['fn_admin', 'Finance Control Centre'],
  ['br_home', 'Bank Reconciliation Dashboard'], ['br_recon', 'Direct Bank Reconciliation'], ['br_fees', 'Fee Collection Reconciliation'], ['br_bulk', 'Bulk Payment Reconciliation'], ['br_import', 'Bank Statements & Import'], ['br_accounts', 'Bank Account Master'], ['br_reports', 'BRS & Reconciliation Reports'], ['br_admin', 'Bank Reconciliation Control Centre'], ['hr_home', 'HR Dashboard'], ['hr_emp', 'Employee Master'], ['hr_prf', 'Staff Requirement (PRF) & Position Control'], ['hr_recruit', 'Recruitment & ATS'], ['hr_onboard', 'Onboarding & Confirmation'], ['hr_att', 'Attendance & Shifts'], ['hr_leave', 'Leave & Holidays'], ['hr_pms', 'Performance Management'], ['hr_train', 'Training & CPT'], ['hr_ess', 'Employee / Manager Self-Service'], ['hr_exit', 'Separation & Exit'], ['hr_comp', 'Grievance, Discipline & Compliance'], ['hr_reports', 'HR Reports'], ['hr_admin', 'HR Control Centre'], ['py_home', 'Payroll Dashboard'], ['py_run', 'Payroll Processing'], ['py_salary', 'Salary Structures'], ['py_bank', 'Staff Bank Information'], ['py_reports', 'Payroll Reports'], ['lc_home', 'Legal & Compliance Dashboard'], ['lc_register', 'Legal Document Register'], ['lc_cal', 'Compliance Calendar'], ['lc_renew', 'Renewals & Filings'], ['lc_cases', 'Cases & Notices'], ['lc_reports', 'Legal & Compliance Reports'], ['lc_setup', 'Legal & Compliance Setup'], ['lc_audit', 'Legal & Compliance Audit Trail'], ['mm_home', 'Maintenance Management'], ['crm_home', 'Admissions CRM'], ['psd_home', 'Salary release (phased disbursement)'], ['psd_me', 'My salary status'], ['it_home', 'IT Management'], ['tc_app', 'Technician App'], ['tcm_app', 'Maintenance Manager App'], ['it_mgr_app', 'IT Manager App'], ['it_tech_app', 'IT Technician App'], ['tcv_home', 'Technician Conveyance & Daily Work Report'],
  ['sa_home', 'Super Admin Dashboard'], ['sa_modules', 'Module Control'], ['sa_access', 'Access & Sensitive Data'], ['sa_rules', 'Data Access Rules'], ['sa_workflows', 'Approval Workflows'], ['sa_requests', 'Access Requests'], ['sa_reports', 'Access & Security Reports']
];
const ACTIONS = ['View', 'Add', 'Edit', 'Delete', 'Approve', 'Reject', 'Export Excel', 'Export PDF', 'Download CSV', 'Email report', 'Schedule report',
  'View student-level details', 'View branch-level details', 'View group consolidated data', 'Configure targets', 'Configure instalments',
  'Configure email templates', 'Configure report schedules', 'Manage user access', 'Manage branch mapping', 'View audit logs', 'Run ERP sync', 'Resolve sync exceptions', 'Recommend',
  'Submit', 'Verify', 'Post', 'Reverse', 'Print', 'Upload', 'Send Email', 'Send WhatsApp', 'Configure Settings', 'View Sensitive Data', 'View All Branches', 'View Only Assigned Branches'];
const SENSITIVE_DATA = ['Salary', 'Bank details', 'Student documents', 'Employee documents', 'Fee concessions', 'Finance reports', 'Audit logs'];
const ROLES = ['Super Admin', 'Chairman', 'Vice Chairman / VCP', 'CEO', 'CFO', 'Corporate Finance', 'Finance Manager', 'Finance Executive', 'System Admin', 'IT Support',
  'Regional Director', 'Zonal Director', 'Principal', 'Accounts Executive', 'Collection Executive', 'Branch Accountant', 'Admissions Head', 'Admissions Counsellor', 'HR Officer', 'Auditor', 'Read-Only Management User', 'Branch Requester', 'Store In-Charge', 'Storekeeper', 'Corporate Purchase', 'Asset Coordinator', 'Central Asset Team', 'Maintenance Manager', 'Technician', 'Petty Cash Custodian', 'Utility Coordinator', 'Finance Admin', 'Accountant', 'Accounts Payable Executive', 'Accounts Receivable Executive', 'Cashier', 'Head Cashier', 'Branch Cashier', 'Teacher', 'Parent', 'Student', 'Vice Principal', 'Front Office', 'Academic Coordinator', 'Class Teacher', 'Content Creator', 'Content Reviewer', 'Content Approver', 'Corporate Academic Head', 'Director', 'Internal Auditor', 'External Auditor', 'HR Admin', 'Corporate HR', 'Branch HR', 'Recruitment Executive', 'Payroll Executive', 'HOD', 'Employee', 'Legal Admin', 'Legal Staff'];
const ACCESS_TYPES = ['Own Branch Only', 'Selected Branches', 'All Branches Under Region', 'All Branches Under Zone', 'All Branches Under State', 'All Branches Under Entity', 'All Branches'];
const REPORT_MODS = ['dashboard', 'daily', 'target', 'instalment', 'zeropayer', 'students', 'alerts'];

function defaultRoles() {
  const R = {};
  const EXP = ['Export Excel', 'Export PDF', 'Download CSV'];
  const give = (perms, mods, acts) => mods.forEach(m => { perms[m] = Array.from(new Set([...(perms[m] || []), ...acts])); });
  ROLES.forEach(role => {
    const p = {};
    if (role === 'Super Admin') { MODULES.forEach(([m]) => give(p, [m], ACTIONS.slice())); R[role] = { perms: p, active: true, sensitive: SENSITIVE_DATA.slice() }; return; }
    give(p, ['sa_requests'], ['View', 'Add']);
    const mgmt = ['Chairman', 'Vice Chairman / VCP', 'CEO', 'CFO', 'Read-Only Management User'].includes(role);
    const fin = ['Corporate Finance', 'Finance Manager', 'Finance Executive', 'CFO'].includes(role);
    if (mgmt || fin || role === 'Auditor') {
      give(p, [...REPORT_MODS, 'exceptions'], ['View', 'View student-level details', 'View branch-level details', 'View group consolidated data']);
      if (role !== 'Read-Only Management User') give(p, [...REPORT_MODS, 'exceptions'], EXP);
      give(p, ['email'], ['View']);
    }
    if (mgmt && role !== 'Read-Only Management User') give(p, ['email'], ['Email report']);
    if (fin) {
      give(p, ['email'], ['View', 'Email report', 'Schedule report', 'Configure email templates', 'Configure report schedules']);
      give(p, ['settings'], ['View', 'Edit', 'Configure targets', 'Configure instalments']);
      give(p, ['approvals'], ['View', 'Add']);
      give(p, ['admin_email'], ['View', 'Edit', 'Add', 'Configure report schedules']);
      give(p, ['exceptions'], ['Resolve sync exceptions']);
      give(p, ['audit'], ['View', 'View audit logs']);
    }
    if (['CFO', 'Corporate Finance', 'Finance Manager'].includes(role)) give(p, ['approvals'], ['Approve', 'Reject']);
    if (role === 'Corporate Finance') give(p, ['admin_sync'], ['View', 'Run ERP sync', 'Resolve sync exceptions']);
    if (role === 'System Admin') {
      give(p, ['sa_home', 'sa_reports', 'sa_requests'], ['View', 'Approve', 'Reject', 'Edit', 'Export Excel', 'Download CSV']); give(p, ['sa_modules', 'sa_access', 'sa_rules', 'sa_workflows'], ['View', 'Export Excel', 'Download CSV']);
      ['admin_home', 'admin_users', 'admin_roles', 'admin_mapping', 'admin_email', 'admin_sync', 'audit'].forEach(m => give(p, [m], ['View', 'Add', 'Edit', 'Delete']));
      give(p, ['admin_users'], ['Manage user access', 'Export Excel', 'Download CSV']); give(p, ['admin_roles'], ['Manage user access']);
      give(p, ['admin_mapping'], ['Manage branch mapping']); give(p, ['admin_email'], ['Configure report schedules', 'Email report']);
      give(p, ['admin_sync'], ['Run ERP sync', 'Resolve sync exceptions', 'Download CSV']); give(p, ['audit'], ['View audit logs', 'Export Excel', 'Download CSV']);
      give(p, ['exceptions'], ['View', 'Resolve sync exceptions']); give(p, ['dashboard'], ['View']);
    }
    if (role === 'IT Support') { give(p, ['admin_home', 'admin_sync'], ['View']); give(p, ['admin_users'], ['View']); }
    if (role === 'Auditor') give(p, ['audit'], ['View', 'View audit logs', 'Export Excel', 'Download CSV']);
    if (['Regional Director', 'Zonal Director', 'Principal'].includes(role)) {
      give(p, REPORT_MODS, ['View', 'View branch-level details', 'View student-level details', ...EXP]);
      give(p, ['email'], ['View']);
    }
    // strength, target, capacity and revenue modules
    const STR = ['exec', 'strength', 'admplan', 'revenue', 'compare', 'cancel'];
    const corp = ['Chairman', 'Vice Chairman / VCP', 'CEO', 'CFO'].includes(role);
    if (mgmt || fin || role === 'Auditor') { give(p, [...STR, 'targets', 'capacity'], ['View', 'View branch-level details', 'View group consolidated data', 'View student-level details']); if (role !== 'Read-Only Management User') give(p, STR, EXP); }
    if (corp) { give(p, ['targets', 'capacity'], ['Add', 'Edit', 'Approve', 'Reject', 'Configure targets', ...EXP]); give(p, ['admplan'], ['Edit']); }
    if (role === 'System Admin') { give(p, [...STR, 'targets', 'capacity'], ['View', 'View group consolidated data']); give(p, ['targets', 'capacity'], ['Add', 'Edit', 'Approve', 'Reject', 'Configure targets', ...EXP]); give(p, ['masters', 'import'], ['View', 'Add', 'Edit', 'Delete']); give(p, ['admplan'], ['Edit']); }
    if (role === 'Corporate Finance') give(p, ['import'], ['View', 'Add']);
    if (['Regional Director', 'Zonal Director', 'Principal'].includes(role)) { give(p, [...STR, 'targets', 'capacity'], ['View', 'View branch-level details', 'View student-level details', ...EXP]); give(p, ['students'], ['View', 'View student-level details', ...EXP]); }
    if (['Regional Director', 'Zonal Director'].includes(role)) { give(p, ['capacity'], ['Add', 'Recommend']); give(p, ['targets'], ['Add']); give(p, ['admplan'], ['Edit']); }
    if (role === 'Principal') { give(p, ['capacity'], ['Add']); give(p, ['targets'], ['Add']); give(p, ['cancel'], ['Add']); }
    if (['Zonal Director', 'Regional Director', 'Admissions Head', 'Branch Accountant', 'Accounts Executive'].includes(role)) give(p, ['cancel'], ['Add']);
    if (['CFO', 'Corporate Finance', 'Finance Manager', 'System Admin', 'CEO'].includes(role)) give(p, ['cancel'], ['Add', 'Approve', 'Reject']);
    if (role === 'Admissions Head') { give(p, ['exec', 'strength', 'admplan', 'compare', 'targets', 'capacity', 'cancel'], ['View', 'View branch-level details', ...EXP]); give(p, ['admplan'], ['Edit']); give(p, ['students'], ['View', 'View student-level details']); }
    if (role === 'Admissions Counsellor') { give(p, ['strength', 'admplan'], ['View', 'View branch-level details']); give(p, ['students'], ['View', 'View student-level details']); }
    if (role === 'Branch Accountant') { give(p, ['daily', 'zeropayer', 'students', 'instalment', 'revenue', 'dashboard', 'cancel'], ['View', 'View branch-level details', 'View student-level details', 'Export Excel', 'Download CSV']); }
    if (['Accounts Executive', 'Collection Executive'].includes(role)) give(p, ['daily', 'zeropayer', 'students', 'instalment'], ['View', 'View branch-level details', 'View student-level details', 'Download CSV']);
    if (!['IT Support', 'Collection Executive', 'Admissions Counsellor'].includes(role)) give(p, ['srf'], ['View']);
    if (role === 'HR Officer') give(p, ['exec', 'strength', 'cancel'], ['View', 'View branch-level details']);
    // Store & Purchase management
    const PRV = ['View', 'View branch-level details'], PRX = [...EXP, 'Print'];
    const prAll = ['pr_home', 'pr_mr', 'pr_pr', 'pr_inbox', 'pr_store', 'pr_vendors', 'pr_po', 'pr_budget', 'pr_reports'];
    if (role === 'Branch Requester') { give(p, ['pr_home', 'pr_inbox', 'pr_store', 'pr_reports'], PRV); give(p, ['pr_mr', 'pr_pr'], [...PRV, 'Add', 'Edit', 'Delete', 'Submit', 'Download CSV']); give(p, ['pr_reports'], ['Download CSV']); }
    if (role === 'Principal') { give(p, prAll, PRV); give(p, ['pr_mr', 'pr_pr'], ['Add', 'Edit', 'Delete', 'Submit', 'Approve', 'Reject', ...PRX]); give(p, ['pr_store'], ['Add']); give(p, ['pr_reports', 'pr_po'], PRX); }
    if (['Zonal Director', 'Regional Director'].includes(role)) { give(p, prAll, [...PRV, 'View group consolidated data']); give(p, ['pr_mr', 'pr_pr'], ['Approve', 'Reject', ...PRX]); give(p, ['pr_reports', 'pr_po', 'pr_budget'], PRX); }
    if (role === 'Store In-Charge') { give(p, [...prAll, 'pr_admin'], [...PRV, 'View group consolidated data']); give(p, ['pr_mr'], ['Approve', 'Reject', ...PRX]); give(p, ['pr_pr'], ['Add', 'Edit', 'Submit', ...PRX]); give(p, ['pr_store'], ['Add', 'Edit', 'Approve', 'Reject', 'Delete', 'Post', 'Upload', ...PRX]); give(p, ['pr_reports', 'pr_po'], PRX); }
    if (role === 'Storekeeper') { give(p, ['pr_home', 'pr_mr', 'pr_inbox', 'pr_store', 'pr_po', 'pr_reports'], PRV); give(p, ['pr_store'], ['Add', 'Edit', 'Post', 'Upload', ...PRX]); give(p, ['pr_reports'], PRX); }
    if (role === 'Corporate Purchase') { give(p, [...prAll, 'pr_admin'], [...PRV, 'View group consolidated data']); give(p, ['pr_pr'], ['Add', 'Edit', 'Submit', 'Approve', 'Reject', ...PRX]); give(p, ['pr_vendors'], ['Add', 'Edit', 'Approve', 'Delete', 'Upload', ...PRX]); give(p, ['pr_po'], ['Add', 'Edit', 'Delete', 'Send Email', ...PRX]); give(p, ['pr_reports', 'pr_budget', 'pr_store', 'pr_mr'], PRX); }
    if (fin) { give(p, [...prAll, ...(role === 'CFO' ? [] : ['pr_admin'])], [...PRV, 'View group consolidated data']); give(p, ['pr_pr'], ['Approve', 'Reject', ...PRX]); give(p, ['pr_po'], ['Approve', 'Reject', 'Edit', ...PRX]); give(p, ['pr_budget'], ['Approve', 'Reject', 'Edit', 'Post', ...PRX]); give(p, ['pr_reports', 'pr_store', 'pr_vendors', 'pr_mr'], PRX); }
    if (role === 'Auditor') { give(p, [...prAll, 'pr_admin'], [...PRV, 'View group consolidated data', 'View audit logs', ...PRX]); }
    if (role === 'System Admin') { give(p, [...prAll, 'pr_admin'], [...PRV, 'View group consolidated data', 'Add', 'Edit', 'Delete', 'Approve', 'Reject', 'Configure Settings', ...PRX]); }
    if (mgmt) { give(p, ['pr_home', 'pr_reports', 'pr_budget', 'pr_po', 'pr_pr', 'pr_mr'], [...PRV, 'View group consolidated data']); if (role !== 'Read-Only Management User') give(p, ['pr_reports', 'pr_budget'], PRX); }
    if (['Admissions Head', 'Branch Accountant', 'HR Officer'].includes(role)) { give(p, ['pr_home', 'pr_inbox', 'pr_store'], PRV); give(p, ['pr_mr', 'pr_pr'], [...PRV, 'Add', 'Edit', 'Submit', 'Download CSV']); }
    // Asset management
    const ASV = ['View', 'View branch-level details'], ASX = [...EXP, 'Print'];
    const asAll = ['as_home', 'as_register', 'as_alloc', 'as_transfer', 'as_maint', 'as_verify', 'as_incidents', 'as_finance', 'as_requests', 'as_reports'];
    // every employee is a potential custodian: own assets, acknowledge, raise repair / return / incident
    give(p, ['as_home', 'as_alloc', 'as_maint', 'as_incidents'], ['View']); give(p, ['as_alloc'], ['Edit']); give(p, ['as_maint', 'as_incidents'], ['Add']);
    if (role === 'Asset Coordinator') { give(p, asAll, [...ASV, ...ASX]); give(p, ['as_register'], ['Add', 'Edit']); give(p, ['as_alloc'], ['Add', 'Edit', 'Approve']); give(p, ['as_transfer', 'as_verify', 'as_incidents', 'as_requests'], ['Add', 'Edit', 'Approve', 'Reject']); give(p, ['as_maint'], ['Add', 'Edit']); }
    if (role === 'Principal') { give(p, asAll, [...ASV, ...ASX]); give(p, ['as_alloc'], ['Add', 'Edit', 'Approve']); give(p, ['as_transfer', 'as_incidents', 'as_requests', 'as_maint', 'as_verify'], ['Add', 'Edit', 'Approve', 'Reject']); give(p, ['as_register'], ['Add', 'Edit']); }
    if (['Zonal Director', 'Regional Director'].includes(role)) { give(p, asAll, [...ASV, 'View group consolidated data', ...ASX]); give(p, ['as_transfer', 'as_incidents', 'as_requests', 'as_maint'], ['Approve', 'Reject']); }
    if (role === 'Central Asset Team') { give(p, [...asAll, 'as_admin'], [...ASV, 'View group consolidated data', ...ASX]); give(p, ['as_register', 'as_alloc', 'as_transfer', 'as_verify', 'as_incidents', 'as_requests', 'as_maint'], ['Add', 'Edit', 'Approve', 'Reject', 'Delete', 'Upload']); give(p, ['as_finance'], ['Edit']); }
    if (['Store In-Charge', 'Storekeeper'].includes(role)) { give(p, ['as_home', 'as_register', 'as_transfer', 'as_reports'], [...ASV, ...ASX]); give(p, ['as_register'], ['Add', 'Edit']); give(p, ['as_transfer'], ['Add', 'Edit']); }
    if (['Maintenance Manager', 'Technician'].includes(role)) { give(p, ['as_home', 'as_register', 'as_maint', 'as_reports'], [...ASV, ...ASX]); give(p, ['as_maint'], ['Add', 'Edit', 'Approve', 'Reject', 'Post']); if (role === 'Maintenance Manager') give(p, ['as_incidents', 'as_transfer'], ['View', 'Approve', 'Reject']); }
    if (role === 'Corporate Purchase') { give(p, ['as_home', 'as_register', 'as_requests', 'as_reports', 'as_finance'], [...ASV, 'View group consolidated data', ...ASX]); give(p, ['as_register'], ['Add', 'Edit']); give(p, ['as_requests'], ['Approve', 'Reject']); }
    if (fin) { give(p, [...asAll, ...(role === 'CFO' ? [] : ['as_admin'])], [...ASV, 'View group consolidated data', ...ASX]); give(p, ['as_finance'], ['Edit', 'Post', 'Approve', 'Reject']); if (role === 'CFO') give(p, ['as_register'], ['Edit']); give(p, ['as_incidents', 'as_transfer', 'as_requests', 'as_maint'], ['Approve', 'Reject']); }
    if (role === 'HR Officer') { give(p, ['as_alloc', 'as_reports'], [...ASV, ...ASX]); give(p, ['as_alloc'], ['Approve']); }
    if (role === 'Auditor') { give(p, [...asAll, 'as_admin'], [...ASV, 'View group consolidated data', 'View audit logs', ...ASX]); give(p, ['as_verify'], ['Add', 'Edit']); }
    if (role === 'System Admin') { give(p, [...asAll, 'as_admin'], [...ASV, 'View group consolidated data', 'Add', 'Edit', 'Delete', 'Approve', 'Reject', 'Post', 'Configure Settings', ...ASX]); }
    if (mgmt) { give(p, ['as_home', 'as_register', 'as_reports', 'as_finance', 'as_incidents'], [...ASV, 'View group consolidated data']); if (role !== 'Read-Only Management User') give(p, ['as_reports', 'as_finance'], ASX); }
    if (['Admissions Head', 'Branch Accountant', 'Branch Requester'].includes(role)) { give(p, ['as_register', 'as_requests'], ASV); give(p, ['as_requests'], ['Add', 'Edit']); }
    // Petty cash
    const CBV = ['View', 'View branch-level details'], CBX = [...EXP, 'Print'];
    const cbAll = ['cb_home', 'cb_vouchers', 'cb_advances', 'cb_day', 'cb_replenish', 'cb_reports'];
    give(p, ['cb_home', 'cb_vouchers', 'cb_advances'], ['View']); give(p, ['cb_vouchers', 'cb_advances'], ['Add', 'Edit', 'Submit']); // every employee: own requests
    if (role === 'Petty Cash Custodian') { give(p, cbAll, [...CBV, ...CBX]); give(p, ['cb_vouchers', 'cb_advances', 'cb_replenish', 'cb_day'], ['Add', 'Edit', 'Submit', 'Post']); }
    if (role === 'Principal') { give(p, cbAll, [...CBV, ...CBX]); give(p, ['cb_vouchers', 'cb_advances', 'cb_replenish'], ['Approve', 'Reject']); give(p, ['cb_day'], ['Add', 'Approve']); }
    if (['Zonal Director', 'Regional Director'].includes(role)) { give(p, cbAll, [...CBV, 'View group consolidated data', ...CBX]); give(p, ['cb_vouchers', 'cb_advances', 'cb_replenish'], ['Approve', 'Reject']); give(p, ['cb_day'], ['Add', 'Approve']); }
    if (fin) { give(p, [...cbAll, ...(role === 'CFO' ? [] : ['cb_admin'])], [...CBV, 'View group consolidated data', ...CBX]); give(p, ['cb_vouchers', 'cb_advances', 'cb_replenish'], ['Approve', 'Reject', 'Post', 'Reverse']); give(p, ['cb_day'], ['Add', 'Approve', 'Post']); if (role !== 'CFO') give(p, ['cb_admin'], ['Edit']); }
    if (role === 'Finance Executive') { give(p, cbAll, [...CBV, ...CBX]); give(p, ['cb_day'], ['Approve']); }
    if (role === 'Auditor') { give(p, [...cbAll, 'cb_admin'], [...CBV, 'View group consolidated data', 'View audit logs', ...CBX]); give(p, ['cb_day'], ['Add']); }
    if (role === 'HR Officer') { give(p, ['cb_advances', 'cb_reports'], [...CBV, ...CBX]); }
    if (role === 'System Admin') { give(p, [...cbAll, 'cb_admin'], [...CBV, 'View group consolidated data', 'Add', 'Edit', 'Approve', 'Reject', 'Post', 'Configure Settings', ...CBX]); }
    if (mgmt) { give(p, ['cb_home', 'cb_reports'], [...CBV, 'View group consolidated data']); if (role !== 'Read-Only Management User') give(p, ['cb_reports'], CBX); }
    if (['Branch Accountant', 'Accounts Executive'].includes(role)) { give(p, cbAll, [...CBV, ...CBX]); }
    // Utilities
    const UTV = ['View', 'View branch-level details'], UTX = [...EXP, 'Print'];
    const utAll = ['ut_home', 'ut_conns', 'ut_bills', 'ut_meters', 'ut_ptax', 'ut_rent', 'ut_tickets', 'ut_reports'];
    give(p, ['ut_tickets'], ['View', 'Add']); // every employee may raise a utility complaint
    if (role === 'Utility Coordinator') { give(p, utAll, [...UTV, ...UTX]); give(p, ['ut_conns', 'ut_bills', 'ut_meters', 'ut_ptax', 'ut_rent', 'ut_tickets'], ['Add', 'Edit', 'Submit', 'Upload']); }
    if (role === 'Principal') { give(p, utAll, [...UTV, ...UTX]); give(p, ['ut_conns', 'ut_bills', 'ut_meters', 'ut_tickets'], ['Add', 'Edit', 'Submit']); give(p, ['ut_bills', 'ut_tickets'], ['Approve', 'Reject']); }
    if (['Zonal Director', 'Regional Director'].includes(role)) { give(p, utAll, [...UTV, 'View group consolidated data', ...UTX]); give(p, ['ut_bills', 'ut_tickets'], ['Approve', 'Reject']); }
    if (['Branch Accountant', 'Accounts Executive'].includes(role)) { give(p, utAll, [...UTV, ...UTX]); give(p, ['ut_bills', 'ut_meters', 'ut_ptax', 'ut_rent'], ['Add', 'Edit', 'Submit']); }
    if (role === 'IT Support') { give(p, ['ut_home', 'ut_conns', 'ut_tickets', 'ut_reports'], [...UTV, 'View group consolidated data', ...UTX]); give(p, ['ut_conns', 'ut_tickets'], ['Add', 'Edit', 'Submit']); }
    if (['Maintenance Manager', 'Technician'].includes(role)) { give(p, ['ut_home', 'ut_conns', 'ut_meters', 'ut_tickets', 'ut_reports'], [...UTV, 'View group consolidated data', ...UTX]); give(p, ['ut_tickets', 'ut_meters'], ['Add', 'Edit']); }
    if (fin) { give(p, [...utAll, ...(role === 'CFO' ? [] : ['ut_admin'])], [...UTV, 'View group consolidated data', ...UTX]); give(p, ['ut_bills', 'ut_tickets'], ['Approve', 'Reject', 'Post', 'Reverse']); give(p, ['ut_conns', 'ut_ptax', 'ut_rent', 'ut_meters'], ['Add', 'Edit', 'Post']); if (role !== 'CFO') give(p, ['ut_admin'], ['Edit']); }
    if (role === 'Finance Executive') { give(p, utAll, [...UTV, 'View group consolidated data', ...UTX]); give(p, ['ut_bills', 'ut_ptax', 'ut_rent'], ['Add', 'Edit', 'Submit']); }
    if (role === 'Auditor') { give(p, [...utAll, 'ut_admin'], [...UTV, 'View group consolidated data', 'View audit logs', ...UTX]); }
    if (role === 'System Admin') { give(p, [...utAll, 'ut_admin'], [...UTV, 'View group consolidated data', 'Add', 'Edit', 'Delete', 'Approve', 'Reject', 'Post', 'Configure Settings', ...UTX]); }
    if (mgmt) { give(p, ['ut_home', 'ut_conns', 'ut_rent', 'ut_reports'], [...UTV, 'View group consolidated data']); if (role !== 'Read-Only Management User') give(p, ['ut_reports'], UTX); }
    // Rent management (Accounts / Finance)
    const RMV = ['View', 'View branch-level details'], RMX = [...EXP, 'Print'];
    const rmAll = ['rm_home', 'rm_master', 'rm_entries', 'rm_ledger', 'rm_reports'];
    give(p, ['rm_import'], ['Accounts Executive', 'Finance Executive', 'Finance Manager', 'Corporate Finance', 'System Admin'].includes(role) ? ['View', 'Add', 'Upload'] : ['Auditor', 'CFO'].includes(role) ? ['View'] : []);
    if (['Accounts Executive', 'Finance Executive'].includes(role)) { give(p, rmAll, [...RMV, 'View group consolidated data', ...RMX]); give(p, ['rm_entries'], ['Add', 'Edit', 'Submit', 'Post', 'Upload']); give(p, ['rm_ledger'], ['Post']); give(p, ['rm_master'], ['Add']); }
    if (role === 'Branch Accountant') { give(p, rmAll, [...RMV, ...RMX]); give(p, ['rm_entries'], ['Add', 'Edit', 'Submit', 'Upload']); }
    if (['Finance Manager', 'Corporate Finance'].includes(role)) { give(p, [...rmAll, 'rm_admin'], [...RMV, 'View group consolidated data', ...RMX]); give(p, ['rm_master'], ['Add', 'Edit']); give(p, ['rm_entries'], ['Add', 'Edit', 'Submit', 'Approve', 'Reject', 'Post', 'Delete', 'Upload']); give(p, ['rm_ledger'], ['Post', 'Reverse']); give(p, ['rm_admin'], ['Edit']); }
    if (role === 'CFO') { give(p, [...rmAll, 'rm_admin'], [...RMV, 'View group consolidated data', ...RMX]); give(p, ['rm_master'], ['Add', 'Edit']); give(p, ['rm_entries'], ['Approve', 'Reject', 'Post']); give(p, ['rm_ledger'], ['Post', 'Reverse']); }
    if (role === 'Auditor') { give(p, [...rmAll, 'rm_admin'], [...RMV, 'View group consolidated data', 'View audit logs', ...RMX]); }
    if (role === 'System Admin') { give(p, [...rmAll, 'rm_admin'], [...RMV, 'View group consolidated data', 'Add', 'Edit', 'Approve', 'Reject', 'Post', 'Reverse', 'Configure Settings', ...RMX]); }
    if (mgmt && role !== 'CFO') { give(p, ['rm_home', 'rm_master', 'rm_reports'], [...RMV, 'View group consolidated data']); if (role !== 'Read-Only Management User') give(p, ['rm_reports'], RMX); }
    if (['Principal', 'Zonal Director', 'Regional Director'].includes(role)) { give(p, ['rm_home', 'rm_master', 'rm_reports'], [...RMV, ...RMX]); }
    // Finance module (GL, AR, AP, bank, budgets, reports)
    const FNV = ['View', 'View branch-level details'], FNX = [...EXP, 'Print'], fnMods = ['fn_home', 'fn_gl', 'fn_ar', 'fn_ap', 'fn_bank', 'fn_budget', 'fn_reports'];
    const finCore = ['Finance Manager', 'Corporate Finance', 'Finance Admin'].includes(role);
    if (finCore) { give(p, [...fnMods, 'fn_admin'], [...FNV, 'View group consolidated data', 'View audit logs', ...FNX]); give(p, ['fn_gl', 'fn_ar', 'fn_ap', 'fn_bank', 'fn_budget'], ['Add', 'Edit', 'Submit', 'Approve', 'Reject', 'Post', 'Reverse', 'Upload']); give(p, ['fn_admin'], ['Edit', 'Configure Settings']); }
    if (role === 'CFO') { give(p, [...fnMods, 'fn_admin'], [...FNV, 'View group consolidated data', 'View audit logs', ...FNX]); give(p, ['fn_gl', 'fn_ar', 'fn_ap', 'fn_bank', 'fn_budget'], ['Approve', 'Reject', 'Post', 'Reverse']); give(p, ['fn_admin'], ['Edit', 'Configure Settings']); }
    if (role === 'Accountant') { give(p, fnMods, [...FNV, 'View group consolidated data', ...FNX]); give(p, ['fn_gl', 'fn_ar', 'fn_ap', 'fn_bank'], ['Add', 'Edit', 'Submit', 'Post', 'Upload']); }
    if (role === 'Accounts Payable Executive') { give(p, ['fn_home', 'fn_ap', 'fn_gl', 'fn_reports', 'fn_budget'], [...FNV, 'View group consolidated data', ...FNX]); give(p, ['fn_ap'], ['Add', 'Edit', 'Submit', 'Post', 'Upload']); }
    if (role === 'Accounts Receivable Executive') { give(p, ['fn_home', 'fn_ar', 'fn_gl', 'fn_reports', 'fn_bank'], [...FNV, 'View group consolidated data', ...FNX]); give(p, ['fn_ar'], ['Add', 'Edit', 'Submit', 'Post', 'Upload']); }
    if (['Finance Executive', 'Accounts Executive'].includes(role)) { give(p, fnMods, [...FNV, 'View group consolidated data', ...FNX]); give(p, ['fn_gl', 'fn_ar', 'fn_ap', 'fn_bank'], ['Add', 'Edit', 'Submit', 'Upload']); }
    if (role === 'Cashier') { give(p, ['fn_home', 'fn_ar', 'fn_bank'], [...FNV, ...FNX]); give(p, ['fn_ar'], ['Add', 'Post']); }
    if (role === 'Branch Accountant') { give(p, ['fn_home', 'fn_ar', 'fn_ap', 'fn_bank', 'fn_budget', 'fn_reports'], [...FNV, ...FNX]); give(p, ['fn_ar', 'fn_ap'], ['Add', 'Submit', 'Upload']); }
    if (['Principal', 'Zonal Director', 'Regional Director'].includes(role)) { give(p, ['fn_home', 'fn_ar', 'fn_budget', 'fn_reports'], [...FNV, ...FNX]); }
    if (['Store In-Charge', 'Corporate Purchase', 'Maintenance Manager', 'HR Officer'].includes(role)) { give(p, ['fn_ap', 'fn_budget'], [...FNV, ...FNX]); }
    if (['Auditor', 'Internal Auditor', 'External Auditor'].includes(role)) { give(p, [...fnMods, 'fn_admin'], [...FNV, 'View group consolidated data', 'View audit logs', ...FNX]); }
    if (role === 'System Admin') { give(p, [...fnMods, 'fn_admin'], [...FNV, 'View group consolidated data', 'View audit logs', 'Add', 'Edit', 'Approve', 'Reject', 'Post', 'Reverse', 'Configure Settings', ...FNX]); }
    if (mgmt && role !== 'CFO') { give(p, ['fn_home', 'fn_reports', 'fn_budget'], [...FNV, 'View group consolidated data']); if (role !== 'Read-Only Management User') give(p, ['fn_reports'], FNX); }
    // Bank reconciliation: view / import / reconcile / approve / reverse / reports as separate rights
    const BRV = ['View', 'View branch-level details', 'View group consolidated data'], BRX = [...EXP, 'Print'], brAll = ['br_home', 'br_recon', 'br_fees', 'br_bulk', 'br_import', 'br_accounts', 'br_reports'];
    if (['Finance Executive', 'Accountant', 'Accounts Executive'].includes(role)) { give(p, brAll, [...BRV, ...BRX]); give(p, ['br_import'], ['Add', 'Upload']); give(p, ['br_recon'], ['Add', 'Edit', 'Post', 'Submit', 'Upload']); }
    if (['Accounts Payable Executive', 'Accounts Receivable Executive', 'Cashier'].includes(role)) { give(p, ['br_home', 'br_recon', 'br_fees', 'br_bulk', 'br_reports'], [...BRV, ...BRX]); give(p, ['br_recon'], ['Edit', 'Submit']); }
    if (['Finance Manager', 'Corporate Finance', 'Finance Admin'].includes(role)) { give(p, [...brAll, 'br_admin'], [...BRV, 'View audit logs', ...BRX]); give(p, ['br_import'], ['Add', 'Upload']); give(p, ['br_recon'], ['Add', 'Edit', 'Post', 'Submit', 'Approve', 'Reject', 'Reverse', 'Upload']); give(p, ['br_accounts', 'br_admin'], ['Add', 'Edit', 'Configure Settings']); give(p, ['br_reports'], ['Add']); }
    if (role === 'CFO') { give(p, [...brAll, 'br_admin'], [...BRV, 'View audit logs', ...BRX]); give(p, ['br_recon'], ['Approve', 'Reject', 'Reverse']); give(p, ['br_accounts', 'br_admin'], ['Edit', 'Configure Settings']); give(p, ['br_reports'], ['Add']); }
    if (['Auditor', 'Internal Auditor', 'External Auditor'].includes(role)) { give(p, [...brAll, 'br_admin'], [...BRV, 'View audit logs', ...BRX]); }
    if (role === 'System Admin') { give(p, [...brAll, 'br_admin'], [...BRV, 'View audit logs', 'Add', 'Edit', 'Post', 'Submit', 'Approve', 'Reject', 'Reverse', 'Configure Settings', ...BRX]); }
    if (role === 'Branch Accountant') { give(p, ['br_home', 'br_fees', 'br_reports'], [...BRV, ...BRX]); }
    if (mgmt && role !== 'CFO') { give(p, ['br_home', 'br_reports'], BRV); if (role !== 'Read-Only Management User') give(p, ['br_reports'], BRX); }
    // HRMS: separate rights for HR, managers, employees; Payroll independently secured
    const HRV = ['View', 'View branch-level details', 'View group consolidated data'], HRX = [...EXP, 'Print'], hrAll = ['hr_home', 'hr_emp', 'hr_prf', 'hr_recruit', 'hr_onboard', 'hr_att', 'hr_leave', 'hr_pms', 'hr_train', 'hr_ess', 'hr_exit', 'hr_comp', 'hr_reports'], pyAll = ['py_home', 'py_run', 'py_salary', 'py_bank', 'py_reports'];
    const hrFull = [...HRV, 'View audit logs', 'Add', 'Edit', 'Submit', 'Approve', 'Reject', 'Verify', 'Upload', 'View Sensitive Data', ...HRX];
    if (['HR Admin', 'HR Officer'].includes(role)) { give(p, [...hrAll, 'hr_admin'], [...hrFull, 'Configure Settings', 'Manage user access']); give(p, ['py_home', 'py_bank', 'py_reports'], [...HRV, ...HRX]); }
    if (role === 'Corporate HR') { give(p, hrAll, hrFull); give(p, ['hr_admin'], [...HRV]); }
    if (role === 'Branch HR') { give(p, hrAll, ['View', 'View branch-level details', 'Add', 'Edit', 'Submit', 'Upload', ...HRX]); }
    if (role === 'Recruitment Executive') { give(p, ['hr_home', 'hr_prf', 'hr_recruit', 'hr_onboard', 'hr_ess', 'hr_reports'], ['View', 'View branch-level details', 'View group consolidated data', 'Add', 'Edit', 'Submit', 'Upload', ...HRX]); }
    if (role === 'Payroll Executive') { give(p, pyAll, [...HRV, 'View audit logs', 'Add', 'Edit', 'Submit', 'Post', 'Verify', 'Upload', 'View Sensitive Data', ...HRX]); give(p, ['hr_home', 'hr_emp', 'hr_att', 'hr_leave', 'hr_ess', 'hr_reports'], [...HRV, 'View Sensitive Data', ...HRX]); }
    if (['Finance Admin', 'CFO'].includes(role)) { give(p, pyAll, [...HRV, 'View audit logs', 'Approve', 'Reject', 'Verify', 'View Sensitive Data', ...HRX]); give(p, ['hr_home', 'hr_prf', 'hr_ess', 'hr_reports', 'hr_pms'], [...HRV, 'Approve', 'Reject', 'View Sensitive Data', ...HRX]); }
    if (['CEO', 'Chairman', 'Vice Chairman / VCP'].includes(role)) { give(p, ['hr_home', 'hr_prf', 'hr_recruit', 'hr_ess', 'hr_pms', 'hr_exit', 'hr_comp', 'hr_reports'], [...HRV, 'Approve', 'Reject', 'View Sensitive Data', ...HRX]); if (role === 'CEO') give(p, ['py_home', 'py_reports'], [...HRV, ...HRX]); }
    if (['Regional Director', 'Zonal Director'].includes(role)) { give(p, ['hr_home', 'hr_emp', 'hr_prf', 'hr_recruit', 'hr_att', 'hr_leave', 'hr_ess', 'hr_pms', 'hr_train', 'hr_exit', 'hr_reports'], ['View', 'View branch-level details', 'Approve', 'Reject', ...HRX]); }
    if (role === 'Principal') { give(p, ['hr_home', 'hr_emp', 'hr_prf', 'hr_recruit', 'hr_onboard', 'hr_att', 'hr_leave', 'hr_ess', 'hr_pms', 'hr_train', 'hr_exit', 'hr_reports'], ['View', 'View branch-level details', 'Add', 'Edit', 'Submit', 'Approve', 'Reject', ...HRX]); }
    if (role === 'HOD') { give(p, ['hr_home', 'hr_prf', 'hr_att', 'hr_leave', 'hr_ess', 'hr_pms', 'hr_train'], ['View', 'View branch-level details', 'Add', 'Submit', 'Approve', 'Reject']); }
    if (role === 'Employee') { give(p, ['hr_ess', 'hr_leave', 'hr_train', 'hr_comp'], ['View', 'Add', 'Submit']); }
    if (['Auditor', 'Internal Auditor', 'External Auditor'].includes(role)) { give(p, [...hrAll, 'hr_admin', ...pyAll], [...HRV, 'View audit logs', 'View Sensitive Data', ...HRX]); }
    if (role === 'System Admin') { give(p, [...hrAll, 'hr_admin', ...pyAll], [...HRV, 'View audit logs', 'Add', 'Edit', 'Submit', 'Approve', 'Reject', 'Post', 'Verify', 'Upload', 'Configure Settings', 'Manage user access', 'View Sensitive Data', ...HRX]); }
    if (mgmt && !['CEO', 'CFO', 'Chairman', 'Vice Chairman / VCP'].includes(role)) { give(p, ['hr_home', 'hr_reports'], HRV); }
    if (!p.hr_ess) give(p, ['hr_ess', 'hr_leave'], ['View', 'Add', 'Submit']);
    // Maintenance management
    const MMV = ['View', 'View branch-level details', 'View group consolidated data'], MMXP = [...EXP, 'Print'];
    if (['System Admin', 'Maintenance Manager'].includes(role)) give(p, ['mm_home'], [...MMV, 'View audit logs', 'Add', 'Edit', 'Approve', 'Reject', 'Upload', 'Configure Settings', ...MMXP]);
    if (['Technician', 'Asset Coordinator', 'Central Asset Team'].includes(role)) give(p, ['mm_home'], [...MMV, 'Add', 'Edit', 'Upload', ...MMXP]);
    if (['Principal', 'Zonal Director', 'Regional Director'].includes(role)) give(p, ['mm_home'], [...MMV, 'Add', 'Approve', 'Reject', ...MMXP]);
    if (['Branch Requester', 'Branch Accountant', 'Branch HR', 'Store In-Charge', 'Storekeeper', 'Corporate Purchase', 'HR Officer', 'HR Admin', 'Employee', 'Teacher'].includes(role)) give(p, ['mm_home'], [...MMV.slice(0, 2), 'Add']);
    if (['Auditor', 'Internal Auditor', 'External Auditor', 'Read-Only Management User', 'CEO', 'Chairman', 'Vice Chairman / VCP', 'CFO'].includes(role)) give(p, ['mm_home'], [...MMV, 'View audit logs', ...MMXP]);
    // Phased salary disbursement
    { const PSX = ['Export Excel', 'Export PDF', 'Download CSV'], PSV = ['View', 'View branch-level details', 'View group consolidated data'];
      give(p, ['psd_me'], ['View']);
      if (['Payroll Executive', 'HR Admin', 'Corporate HR', 'HR Officer'].includes(role)) give(p, ['psd_home'], [...PSV, 'View Sensitive Data', 'View audit logs', 'Submit', 'Post', 'Upload', ...PSX]);
      if (role === 'Branch HR') give(p, ['psd_home'], [...PSV, 'View Sensitive Data', ...PSX]);
      if (['Finance Admin', 'Finance Manager', 'Corporate Finance'].includes(role)) give(p, ['psd_home'], [...PSV, 'View Sensitive Data', 'View audit logs', 'Add', 'Edit', 'Submit', 'Verify', ...PSX]);
      if (role === 'Finance Manager') give(p, ['psd_home'], ['Approve', 'Reject']);
      if (role === 'CFO') give(p, ['psd_home'], [...PSV, 'View Sensitive Data', 'View audit logs', 'Approve', 'Reject', ...PSX]);
      if (['CEO', 'Chairman', 'Vice Chairman / VCP'].includes(role)) give(p, ['psd_home'], [...PSV, 'View Sensitive Data', 'Approve', 'Reject', ...PSX]);
      if (role === 'System Admin') give(p, ['psd_home'], [...PSV, 'View Sensitive Data', 'View audit logs', 'Configure Settings', ...PSX]);
      if (['Auditor', 'Internal Auditor', 'External Auditor'].includes(role)) give(p, ['psd_home'], [...PSV, 'View Sensitive Data', 'View audit logs', ...PSX]);
      if (['Principal', 'Zonal Director', 'Regional Director'].includes(role)) give(p, ['psd_home'], ['View', 'View branch-level details']);
      if (role === 'Read-Only Management User') give(p, ['psd_home'], PSV); }
    // Admissions CRM
    { const CRX = ['Export Excel', 'Export PDF', 'Download CSV'];
      if (['Admissions Head', 'System Admin'].includes(role)) give(p, ['crm_home'], ['View', 'View branch-level details', 'View group consolidated data', 'View audit logs', 'Add', 'Edit', 'Upload', 'Configure Settings', ...CRX]);
      if (['Admissions Counsellor', 'Principal'].includes(role)) give(p, ['crm_home'], ['View', 'View branch-level details', 'Add', 'Edit', ...CRX]);
      if (['Zonal Director', 'Regional Director'].includes(role)) give(p, ['crm_home'], ['View', 'View branch-level details', 'View group consolidated data', 'Add', 'Edit', ...CRX]);
      if (['CEO', 'Chairman', 'Vice Chairman / VCP', 'CFO', 'Auditor', 'Internal Auditor', 'External Auditor', 'Read-Only Management User'].includes(role)) give(p, ['crm_home'], ['View', 'View branch-level details', 'View group consolidated data', 'View audit logs', ...CRX]); }
    // IT Management (IT assets are kept under the IT Manager)
    if (role === 'System Admin') give(p, ['it_home'], [...MMV, 'View audit logs', 'Add', 'Edit', 'Approve', 'Reject', 'Upload', 'Configure Settings', ...MMXP]);
    if (['IT Support', 'Technician'].includes(role)) give(p, ['it_home'], [...MMV, 'Add', 'Edit', 'Upload', ...MMXP]);
    if (['Principal', 'Zonal Director', 'Regional Director'].includes(role)) give(p, ['it_home'], [...MMV, 'Add', 'Approve', 'Reject', ...MMXP]);
    if (['Branch Requester', 'Branch Accountant', 'Branch HR', 'Store In-Charge', 'Storekeeper', 'Corporate Purchase', 'HR Officer', 'HR Admin', 'Employee', 'Teacher', 'Asset Coordinator', 'Central Asset Team'].includes(role)) give(p, ['it_home'], [...MMV.slice(0, 2), 'Add']);
    if (['Auditor', 'Internal Auditor', 'External Auditor', 'Read-Only Management User', 'CEO', 'Chairman', 'Vice Chairman / VCP', 'CFO'].includes(role)) give(p, ['it_home'], [...MMV, 'View audit logs', ...MMXP]);
    // Technician conveyance and Technician App (fine-grained rights are in the module's own access matrix)
    if (['System Admin', 'Maintenance Manager', 'Technician', 'Principal', 'Zonal Director', 'Regional Director', 'Finance Manager', 'Finance Executive', 'Corporate Finance', 'Finance Admin', 'CFO', 'CEO', 'Chairman', 'Vice Chairman / VCP', 'HR Admin', 'Corporate HR', 'Auditor', 'Internal Auditor', 'External Auditor', 'Read-Only Management User'].includes(role)) give(p, ['tcv_home'], [...MMV, 'View audit logs', 'Add', 'Edit', 'Approve', 'Reject', 'Upload', 'Configure Settings', ...MMXP]);
    if (['System Admin', 'Maintenance Manager', 'Technician', 'Principal', 'Zonal Director', 'Regional Director'].includes(role)) give(p, ['tc_app'], ['View', 'Add', 'Edit']);
    if (['System Admin', 'Maintenance Manager', 'Principal', 'Zonal Director', 'Regional Director'].includes(role)) give(p, ['tcm_app'], ['View', 'Add', 'Edit', 'Approve', 'Reject']);
    if (['System Admin', 'IT Support'].includes(role)) give(p, ['it_mgr_app', 'it_tech_app'], ['View', 'Add', 'Edit']);
    if (role === 'Technician') give(p, ['it_tech_app'], ['View', 'Add', 'Edit']);
    // Legal documents & compliance
    const LCV = ['View', 'View branch-level details', 'View group consolidated data'], LCX = [...EXP, 'Print'], lcAll = ['lc_home', 'lc_register', 'lc_cal', 'lc_renew', 'lc_cases', 'lc_reports'];
    if (['Legal Admin', 'System Admin'].includes(role)) give(p, [...lcAll, 'lc_setup', 'lc_audit'], [...LCV, 'View audit logs', 'Add', 'Edit', 'Delete', 'Submit', 'Approve', 'Reject', 'Verify', 'Upload', 'Configure Settings', 'View Sensitive Data', ...LCX]);
    if (role === 'Legal Staff') { give(p, [...lcAll, 'lc_setup', 'lc_audit'], [...LCV, 'View audit logs', 'Add', 'Edit', 'Submit', 'Verify', 'Upload', 'View Sensitive Data', ...LCX]); }
    if (['Principal', 'Branch HR', 'HR Admin', 'Maintenance Manager', 'Asset Coordinator', 'Payroll Executive'].includes(role)) give(p, ['lc_home', 'lc_register', 'lc_cal', 'lc_renew', 'lc_reports'], ['View', 'View branch-level details', 'Add', 'Edit', 'Submit', 'Upload', ...LCX]);
    if (['Finance Admin', 'CFO', 'Finance Manager', 'Corporate Finance', 'Accountant'].includes(role)) give(p, lcAll, [...LCV, 'Approve', 'Reject', ...LCX]);
    if (['Corporate HR', 'Zonal Director', 'Regional Director', 'Auditor', 'Internal Auditor', 'External Auditor'].includes(role)) give(p, [...lcAll, 'lc_audit'], [...LCV, 'View audit logs', ...LCX]);
    if (mgmt) give(p, lcAll, [...LCV, ...LCX]);
    // Student Information System: view by management and branch roles; edit by branch/admissions roles; sensitive (Aadhaar last 4, medical) and status approval limited
    const SISV = ['Chairman', 'Vice Chairman / VCP', 'CEO', 'CFO', 'Regional Director', 'Zonal Director', 'Principal', 'Admissions Head', 'Admissions Counsellor', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor', 'Branch Accountant', 'HR Officer'];
    if (SISV.includes(role) || ['Vice Principal', 'Front Office'].includes(role)) give(p, ['sis'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'Admissions Head', 'System Admin', 'Super Admin'].includes(role)) give(p, ['sis'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'Admissions Head', 'Admissions Counsellor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['sis'], ['Add', 'Edit', 'Upload']);
    if (['Principal', 'Admissions Head', 'System Admin', 'Super Admin'].includes(role)) give(p, ['sis'], ['Verify']);
    if (['Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['sis'], ['View Sensitive Data', 'Approve']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['sis'], ['View audit logs']);
    // Academic Management
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['acad'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['acad'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['acad'], ['Add', 'Edit', 'Approve']);
    if (['Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin'].includes(role)) give(p, ['acad'], ['Submit']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['acad'], ['View audit logs']);
    // Learning Management
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['lms'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lms'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lms'], ['Add', 'Edit', 'Submit']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lms'], ['Approve']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lms'], ['View audit logs']);
    // Examinations
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['exam'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['exam'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin'].includes(role)) give(p, ['exam'], ['Add', 'Edit', 'Submit']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['exam'], ['Approve']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['exam'], ['View audit logs']);
    // UDISE+ and compliance
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['udise'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['udise'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['udise'], ['Add', 'Edit', 'Submit']);
    if (['CEO', 'Regional Director', 'Zonal Director', 'System Admin', 'Super Admin'].includes(role)) give(p, ['udise'], ['Approve']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['udise'], ['View audit logs']);
    // House System
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['house'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['house'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin'].includes(role)) give(p, ['house'], ['Add', 'Edit', 'Submit']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['house'], ['Approve']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['house'], ['View audit logs']);
    // Meeting Management
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['meet'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['meet'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin'].includes(role)) give(p, ['meet'], ['Add', 'Edit', 'Submit']);
    if (['CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['meet'], ['Approve']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['meet'], ['View audit logs']);
    // Parent Consents
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['consent'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['consent'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin'].includes(role)) give(p, ['consent'], ['Add', 'Edit', 'Submit']);
    if (['CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['consent'], ['Approve']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['consent'], ['View audit logs']);
    // Franchise Management
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'CFO', 'Corporate Finance', 'Finance Admin', 'Accounts Receivable Executive', 'Regional Director', 'Zonal Director', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor', 'Read-Only Management User'].includes(role)) give(p, ['franchise'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'CFO', 'Corporate Finance', 'Regional Director', 'Zonal Director', 'System Admin', 'Super Admin'].includes(role)) give(p, ['franchise'], ['Export Excel', 'Export PDF']);
    if (['CEO', 'Regional Director', 'Zonal Director', 'Finance Admin', 'Accounts Receivable Executive', 'System Admin', 'Super Admin'].includes(role)) give(p, ['franchise'], ['Add', 'Edit', 'Submit']);
    if (['CEO', 'Regional Director', 'Zonal Director', 'System Admin', 'Super Admin'].includes(role)) give(p, ['franchise'], ['Approve']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['franchise'], ['View audit logs']);
    // Calendar & Planner
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['cal'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cal'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cal'], ['Add', 'Edit', 'Submit']);
    if (['CEO', 'Regional Director', 'Zonal Director', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cal'], ['Approve']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cal'], ['View audit logs']);
    // Teacher Academy & Policies
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'Corporate HR', 'HR Admin', 'Branch HR', 'HR Officer', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['tac'], ['View']);
    if (['Principal', 'HOD', 'Employee', 'Teacher', 'Corporate HR', 'HR Admin', 'Branch HR', 'HR Officer', 'System Admin', 'Super Admin'].includes(role)) give(p, ['tac'], ['Submit']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Corporate HR', 'HR Admin', 'System Admin', 'Super Admin'].includes(role)) give(p, ['tac'], ['Export Excel', 'Export PDF']);
    if (['Corporate HR', 'HR Admin', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['tac'], ['Add', 'Edit']);
    if (['Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['tac'], ['Verify']);
    if (['CEO', 'Vice Chairman / VCP', 'Regional Director', 'Corporate HR', 'HR Admin', 'System Admin', 'Super Admin'].includes(role)) give(p, ['tac'], ['Approve']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'Corporate HR', 'HR Admin', 'System Admin', 'Super Admin'].includes(role)) give(p, ['tac'], ['View audit logs']);
    // Outcomes & Report Cards
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['lrc'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lrc'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lrc'], ['Submit']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lrc'], ['Add']);
    if (['Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lrc'], ['Edit', 'Verify']);
    if (['CEO', 'Regional Director', 'Zonal Director', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lrc'], ['Approve']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lrc'], ['View audit logs']);
    // Question Paper Security
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['qps'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['qps'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin'].includes(role)) give(p, ['qps'], ['Submit']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['qps'], ['Edit']);
    if (['Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['qps'], ['Verify']);
    if (['CEO', 'Regional Director', 'Zonal Director', 'System Admin', 'Super Admin'].includes(role)) give(p, ['qps'], ['Approve']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['qps'], ['View audit logs']);
    // Library
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['lib'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lib'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lib'], ['Add']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lib'], ['Edit']);
    if (['Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lib'], ['Verify']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['lib'], ['View audit logs']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['smk'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'System Admin', 'Super Admin'].includes(role)) give(p, ['smk'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin'].includes(role)) give(p, ['smk'], ['Submit']);
    if (['Principal', 'HOD', 'Employee', 'System Admin', 'Super Admin'].includes(role)) give(p, ['smk'], ['Add']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['smk'], ['Edit']);
    if (['Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['smk'], ['Verify']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['smk'], ['View audit logs']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'Admissions Head', 'Admissions Counsellor', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['adp'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'Admissions Head', 'System Admin', 'Super Admin'].includes(role)) give(p, ['adp'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'Admissions Head', 'Admissions Counsellor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['adp'], ['Add']);
    if (['Principal', 'Admissions Head', 'System Admin', 'Super Admin'].includes(role)) give(p, ['adp'], ['Edit', 'Verify']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['adp'], ['View audit logs']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'Admissions Head', 'Admissions Counsellor', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['cmc'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cmc'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'Admissions Head', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cmc'], ['Add']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cmc'], ['Edit']);
    if (['Regional Director', 'Zonal Director', 'Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cmc'], ['Verify']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cmc'], ['View audit logs']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['cur'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cur'], ['Export Excel', 'Export PDF']);
    if (['Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cur'], ['Add']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cur'], ['Edit']);
    if (['CEO', 'Regional Director', 'Zonal Director', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cur'], ['Approve']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cur'], ['View audit logs']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['fbp'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['fbp'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'System Admin', 'Super Admin'].includes(role)) give(p, ['fbp'], ['Add']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['fbp'], ['Edit']);
    if (['Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['fbp'], ['Verify']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['fbp'], ['View audit logs']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['hml'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['hml'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin'].includes(role)) give(p, ['hml'], ['Submit']);
    if (['Principal', 'HOD', 'Employee', 'System Admin', 'Super Admin'].includes(role)) give(p, ['hml'], ['Add']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['hml'], ['Edit']);
    if (['Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['hml'], ['Verify']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['hml'], ['View audit logs']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['tnp'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['tnp'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin'].includes(role)) give(p, ['tnp'], ['Submit']);
    if (['Principal', 'HOD', 'Employee', 'System Admin', 'Super Admin'].includes(role)) give(p, ['tnp'], ['Add']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['tnp'], ['Edit']);
    if (['Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['tnp'], ['Verify']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['tnp'], ['View audit logs']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'Employee', 'Teacher', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['alm'], ['View']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['alm'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'Employee', 'System Admin', 'Super Admin'].includes(role)) give(p, ['alm'], ['Add']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['alm'], ['Edit']);
    if (['Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['alm'], ['Verify']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['alm'], ['View audit logs']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'System Admin', 'Super Admin', 'Auditor', 'Internal Auditor'].includes(role)) give(p, ['rov'], ['View']);
    if (['Chairman', 'CEO', 'System Admin', 'Super Admin'].includes(role)) give(p, ['rov'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'HOD', 'System Admin', 'Super Admin'].includes(role)) give(p, ['rov'], ['Add']);
    if (['System Admin', 'Super Admin'].includes(role)) give(p, ['rov'], ['Edit', 'Approve']);
    if (['Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['rov'], ['Verify']);
    if (['Chairman', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['rov'], ['View audit logs']);
    if (['Chairman', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'Branch Accountant', 'Accounts Executive', 'Collection Executive', 'Cashier', 'CFO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cdk'], ['View']);
    if (['Branch Accountant', 'Accounts Executive', 'Collection Executive', 'Cashier', 'Super Admin'].includes(role)) give(p, ['cdk'], ['Add']);
    if (['Principal', 'Branch Accountant', 'CFO', 'Super Admin'].includes(role)) give(p, ['cdk'], ['Approve', 'Verify']);
    if (['Chairman', 'CEO', 'CFO', 'Principal', 'Branch Accountant', 'Accounts Executive', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cdk'], ['Export Excel', 'Export PDF']);
    if (['Chairman', 'CEO', 'CFO', 'Principal', 'Branch Accountant', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cdk'], ['View audit logs']);
    if (['Chairman', 'CEO', 'CFO', 'Corporate Finance', 'Finance Manager', 'Finance Executive', 'Regional Director', 'Zonal Director', 'Principal', 'Branch Accountant', 'Accounts Executive', 'Accounts Receivable Executive', 'Accountant', 'Collection Executive', 'Cashier', 'Head Cashier', 'Branch Cashier', 'Auditor', 'Internal Auditor', 'External Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cch'], ['View']);
    if (['Collection Executive', 'Cashier', 'Head Cashier', 'Branch Cashier', 'Finance Manager', 'Corporate Finance', 'CFO', 'Super Admin'].includes(role)) give(p, ['cch'], ['Add']);
    if (['Cashier', 'Head Cashier', 'Super Admin'].includes(role)) give(p, ['cch'], ['Post']);
    if (['Branch Accountant', 'Accounts Executive', 'Accounts Receivable Executive', 'Accountant', 'Finance Executive', 'Finance Manager', 'Corporate Finance', 'CFO', 'Super Admin'].includes(role)) give(p, ['cch'], ['Verify']);
    if (['Principal', 'Finance Manager', 'Corporate Finance', 'CFO', 'Super Admin'].includes(role)) give(p, ['cch'], ['Approve']);
    if (['Finance Manager', 'Corporate Finance', 'CFO', 'Super Admin'].includes(role)) give(p, ['cch'], ['Reverse']);
    if (['System Admin', 'Super Admin'].includes(role)) give(p, ['cch'], ['Configure Settings']);
    if (['Chairman', 'CEO', 'CFO', 'Corporate Finance', 'Finance Manager', 'Regional Director', 'Zonal Director', 'Principal', 'Branch Accountant', 'Accounts Executive', 'Auditor', 'Internal Auditor', 'External Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cch'], ['Export Excel', 'Export PDF']);
    if (['Chairman', 'CEO', 'CFO', 'Corporate Finance', 'Finance Manager', 'Principal', 'Branch Accountant', 'Auditor', 'Internal Auditor', 'External Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['cch'], ['View audit logs']);
    if (['Teacher', 'Employee', 'HOD', 'Principal', 'Vice Principal', 'Regional Director', 'Zonal Director', 'CEO', 'Chairman', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['att'], ['View']);
    if (['Teacher', 'Employee', 'HOD', 'Principal', 'Vice Principal', 'Super Admin'].includes(role)) give(p, ['att'], ['Add']);
    if (['HOD', 'Principal', 'Vice Principal', 'Super Admin'].includes(role)) give(p, ['att'], ['Approve']);
    if (['HOD', 'Principal', 'Regional Director', 'Zonal Director', 'CEO', 'Chairman', 'Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['att'], ['Export Excel', 'Export PDF']);
    if (['Principal', 'Auditor', 'Internal Auditor', 'CEO', 'Chairman', 'System Admin', 'Super Admin'].includes(role)) give(p, ['att'], ['View audit logs']);
    if (['Teacher', 'Employee', 'HOD', 'Principal', 'Super Admin'].includes(role)) give(p, ['tapp'], ['View']);
    if (['Parent', 'Student', 'Super Admin'].includes(role)) give(p, ['portal'], ['View', 'Add']);
    if (['System Admin', 'Super Admin'].includes(role)) give(p, ['portal'], ['View', 'Configure Settings']);
    { const RV = ['Chairman', 'CEO', 'CFO', 'Finance Manager', 'Corporate Finance', 'Principal', 'Branch Accountant', 'Accounts Executive', 'Collection Executive', 'Cashier', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'];
      if (RV.includes(role)) give(p, ['rfc'], ['View']);
      if (['Principal', 'Branch Accountant', 'Accounts Executive', 'Collection Executive', 'Cashier', 'Super Admin'].includes(role)) give(p, ['rfc'], ['Add']);
      if (['Principal', 'CFO', 'Finance Manager', 'Corporate Finance', 'Super Admin'].includes(role)) give(p, ['rfc'], ['Approve']);
      if (['CFO', 'Super Admin'].includes(role)) give(p, ['rfc'], ['Reverse']);
      if (['Branch Accountant', 'Accounts Executive', 'CFO', 'Super Admin'].includes(role)) give(p, ['rfc'], ['Verify']);
      if (['Principal', 'Branch Accountant', 'Super Admin'].includes(role)) give(p, ['rfc'], ['Edit']);
      if (['Chairman', 'CEO', 'CFO', 'Finance Manager', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['rfc'], ['View audit logs']); }
    { if (['Chairman', 'CEO', 'CFO', 'Finance Manager', 'Corporate Finance', 'Regional Director', 'Zonal Director', 'Principal', 'Branch Accountant', 'Accounts Executive', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['fst'], ['View']);
      if (['Principal', 'Branch Accountant', 'Finance Manager', 'Corporate Finance', 'Super Admin'].includes(role)) give(p, ['fst'], ['Add']);
      if (['CFO', 'Finance Manager', 'Corporate Finance', 'Regional Director', 'Zonal Director', 'Super Admin'].includes(role)) give(p, ['fst'], ['Approve']);
      if (['Chairman', 'CEO', 'CFO', 'Finance Manager', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['fst'], ['View audit logs']); }
    { if (['Chairman', 'CEO', 'CFO', 'Finance Manager', 'Corporate Finance', 'Regional Director', 'Zonal Director', 'Principal', 'Branch Accountant', 'Accounts Executive', 'Collection Executive', 'Cashier', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['fdm'], ['View']);
      if (['Branch Accountant', 'Accounts Executive', 'Collection Executive', 'Cashier', 'Super Admin'].includes(role)) give(p, ['fdm'], ['Add']);
      if (['Principal', 'Branch Accountant', 'CFO', 'Super Admin'].includes(role)) give(p, ['fdm'], ['Approve']);
      if (['CFO', 'System Admin', 'Super Admin'].includes(role)) give(p, ['fdm'], ['Configure Settings']);
      if (['Chairman', 'CEO', 'CFO', 'Finance Manager', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['fdm'], ['View audit logs']); }
    { if (['Chairman', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'Vice Principal', 'Admissions Head', 'Admissions Counsellor', 'Branch Accountant', 'Accounts Executive', 'Front Office', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['crt'], ['View']);
      if (['Principal', 'Vice Principal', 'Admissions Head', 'Admissions Counsellor', 'Branch Accountant', 'Accounts Executive', 'Front Office', 'Super Admin'].includes(role)) give(p, ['crt'], ['Add']);
      if (['Principal', 'Super Admin'].includes(role)) give(p, ['crt'], ['Approve']);
      if (['Chairman', 'CEO', 'Principal', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['crt'], ['View audit logs']); }
    { if (['Chairman', 'CEO', 'CFO', 'Finance Manager', 'Corporate Finance', 'Regional Director', 'Zonal Director', 'Principal', 'Branch Accountant', 'Accounts Executive', 'Collection Executive', 'Cashier', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['opay'], ['View']);
      if (['Branch Accountant', 'Accounts Executive', 'Collection Executive', 'Cashier', 'Super Admin'].includes(role)) give(p, ['opay'], ['Add']);
      if (['Branch Accountant', 'Finance Manager', 'Corporate Finance', 'CFO', 'Super Admin'].includes(role)) give(p, ['opay'], ['Verify']);
      if (['CFO', 'System Admin', 'Super Admin'].includes(role)) give(p, ['opay'], ['Configure Settings']);
      if (['Chairman', 'CEO', 'CFO', 'Finance Manager', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['opay'], ['View audit logs']); }
    { if (['Chairman', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'Vice Principal', 'HOD', 'Admissions Head', 'Admissions Counsellor', 'Branch Accountant', 'Front Office', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['smv'], ['View']);
      if (['Principal', 'Vice Principal', 'HOD', 'Admissions Head', 'Admissions Counsellor', 'Front Office', 'Super Admin'].includes(role)) give(p, ['smv'], ['Add']);
      if (['Principal', 'Zonal Director', 'Regional Director', 'Super Admin'].includes(role)) give(p, ['smv'], ['Approve']);
      if (['Chairman', 'CEO', 'Principal', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['smv'], ['View audit logs']); }
    { if (['Chairman', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'Vice Principal', 'HOD', 'Admissions Head', 'Admissions Counsellor', 'Branch Accountant', 'Front Office', 'Transport Manager', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['ptk'], ['View']);
      if (['Principal', 'Vice Principal', 'HOD', 'Admissions Head', 'Admissions Counsellor', 'Branch Accountant', 'Front Office', 'Transport Manager', 'Super Admin'].includes(role)) give(p, ['ptk'], ['Add']);
      if (['Principal', 'Zonal Director', 'Regional Director', 'Super Admin'].includes(role)) give(p, ['ptk'], ['Approve']);
      if (['Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['ptk'], ['Configure Settings']);
      if (['Chairman', 'CEO', 'Principal', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['ptk'], ['View audit logs']); }
    { if (['Chairman', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'Vice Principal', 'HOD', 'Teacher', 'Employee', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['acpl'], ['View']);
      if (['Principal', 'Vice Principal', 'HOD', 'Teacher', 'Employee', 'Super Admin'].includes(role)) give(p, ['acpl'], ['Add']);
      if (['Principal', 'Vice Principal', 'HOD', 'Super Admin'].includes(role)) give(p, ['acpl'], ['Approve', 'Export PDF']);
      if (['Chairman', 'CEO', 'Principal', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['acpl'], ['View audit logs']); }
    { const EV = ['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'Vice Principal', 'HOD', 'Teacher', 'Employee', 'Front Office', 'Transport Manager', 'Admissions Head', 'Admissions Counsellor', 'Branch Accountant', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'];
      if (EV.includes(role)) give(p, ['ema'], ['View']);
      if (['Principal', 'Vice Principal', 'Zonal Director', 'Regional Director', 'CEO', 'Super Admin'].includes(role)) give(p, ['ema'], ['Add']);
      if (['Chairman', 'CEO', 'Principal', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['ema'], ['View audit logs']);
      if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'Vice Principal', 'HOD', 'Admissions Head', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['svy'], ['View']);
      if (['Principal', 'Vice Principal', 'HOD', 'Admissions Head', 'Super Admin'].includes(role)) give(p, ['svy'], ['Add']);
      if (['Principal', 'Zonal Director', 'Regional Director', 'CEO', 'Super Admin'].includes(role)) give(p, ['svy'], ['Approve']);
      if (['Chairman', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'System Admin', 'Super Admin'].includes(role)) give(p, ['svy'], ['Export Excel', 'Export PDF']);
      if (['Chairman', 'CEO', 'Principal', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['svy'], ['View audit logs']); }
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'CFO', 'Corporate Finance', 'Finance Manager', 'Regional Director', 'Zonal Director', 'Read-Only Management User', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['corp'], ['View', 'Export Excel', 'Export PDF']);
    { if (['HR Admin', 'HR Officer', 'Corporate HR', 'Payroll Executive', 'Finance Admin', 'Finance Manager', 'CFO', 'CEO', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['grat'], ['View', 'Export Excel', 'Export PDF']);
      if (['HR Admin', 'HR Officer', 'Corporate HR', 'Super Admin'].includes(role)) give(p, ['grat'], ['Add']);
      if (['Finance Manager', 'CFO', 'Super Admin'].includes(role)) give(p, ['grat'], ['Approve']);
      if (['Payroll Executive', 'Finance Admin', 'Finance Manager', 'CFO', 'Super Admin'].includes(role)) give(p, ['grat'], ['Verify']);
      if (['CFO', 'System Admin', 'Super Admin'].includes(role)) give(p, ['grat'], ['Configure Settings']);
      if (['HR Admin', 'HR Officer', 'Corporate HR', 'Branch HR', 'Principal', 'Vice Principal', 'HOD', 'Teacher', 'Employee', 'Zonal Director', 'Regional Director', 'CEO', 'Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['rost'], ['View']);
      if (['HR Admin', 'HR Officer', 'Corporate HR', 'Branch HR', 'Principal', 'Vice Principal', 'Super Admin'].includes(role)) give(p, ['rost'], ['Edit', 'Approve']);
      if (['CFO', 'Corporate Finance', 'Finance Manager', 'Finance Admin', 'Accountant', 'Auditor', 'Internal Auditor', 'External Auditor', 'CEO', 'Chairman', 'System Admin', 'Super Admin'].includes(role)) give(p, ['icoy'], ['View', 'Export Excel', 'Export PDF']);
      if (['Corporate Finance', 'Finance Manager', 'Finance Admin', 'Accountant', 'Super Admin'].includes(role)) give(p, ['icoy'], ['Add']);
      if (['CFO', 'Finance Manager', 'Super Admin'].includes(role)) give(p, ['icoy'], ['Approve']);
      if (['CFO', 'System Admin', 'Super Admin'].includes(role)) give(p, ['icoy'], ['Configure Settings']); }
    { if (['Chairman', 'CEO', 'CFO', 'Finance Manager', 'Corporate Finance', 'Regional Director', 'Zonal Director', 'Principal', 'Vice Principal', 'Branch Accountant', 'Accounts Executive', 'Collection Executive', 'Admissions Head', 'Admissions Counsellor', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'].includes(role)) give(p, ['iplan'], ['View']);
      if (['Principal', 'Branch Accountant', 'Accounts Executive', 'Admissions Head', 'Admissions Counsellor', 'Super Admin'].includes(role)) give(p, ['iplan'], ['Add']);
      if (['CFO', 'System Admin', 'Super Admin'].includes(role)) give(p, ['iplan'], ['Configure Settings']); }
    { const ACAD_MGMT = ['Chairman', 'Director', 'CEO', 'Regional Director', 'Zonal Director', 'Principal', 'Vice Principal', 'Academic Coordinator', 'HOD', 'Corporate Academic Head', 'Auditor', 'Internal Auditor', 'System Admin', 'Super Admin'];
      if (ACAD_MGMT.concat(['Teacher', 'Class Teacher', 'Content Creator', 'Content Reviewer', 'Content Approver']).includes(role)) give(p, ['scl'], ['View']);
      if (['Content Creator', 'Corporate Academic Head', 'Super Admin'].includes(role)) give(p, ['scl'], ['Add']);
      if (['Content Reviewer', 'Corporate Academic Head', 'Principal', 'Academic Coordinator', 'Super Admin'].includes(role)) give(p, ['scl'], ['Verify']);
      if (['Content Approver', 'Corporate Academic Head', 'Super Admin'].includes(role)) give(p, ['scl'], ['Approve']);
      if (['Corporate Academic Head', 'System Admin', 'Super Admin'].includes(role)) give(p, ['scl'], ['Configure Settings']);
      if (ACAD_MGMT.concat(['IT Support']).includes(role)) give(p, ['sdev'], ['View']);
      if (['IT Support', 'System Admin', 'Super Admin'].includes(role)) give(p, ['sdev'], ['Add']);
      if (['Teacher', 'Class Teacher', 'Academic Coordinator', 'HOD'].includes(role)) { give(p, ['tapp', 'att', 'lms', 'acpl', 'acad'], ['View']); give(p, ['tapp', 'att', 'lms', 'acpl'], ['Add']); }
      if (['Academic Coordinator'].includes(role)) { give(p, ['tac', 'lrc', 'exam', 'cur', 'sis'], ['View']); give(p, ['tac'], ['Add', 'Verify']); give(p, ['acad', 'acpl', 'lms'], ['Approve']); }
      if (['Corporate Academic Head'].includes(role)) { give(p, ['acad', 'acpl', 'lms', 'tac', 'lrc', 'exam', 'cur', 'sis', 'corp', 'att', 'smk'], ['View']); give(p, ['cur', 'acpl'], ['Add', 'Approve']); }
      if (['Director'].includes(role)) give(p, ['corp', 'dashboard', 'acad', 'att', 'exam', 'lrc', 'tac'], ['View']); }
    { const MGMT = ['Chairman', 'Vice Chairman / VCP', 'CEO', 'Director', 'CFO', 'Corporate Finance', 'Finance Manager', 'Regional Director', 'Zonal Director', 'Principal', 'Vice Principal', 'Admissions Head', 'HR Admin', 'Corporate HR', 'Head Cashier', 'Maintenance Manager', 'Central Asset Team', 'Corporate Purchase', 'Corporate Academic Head', 'Academic Coordinator', 'Auditor', 'Internal Auditor', 'Legal Admin', 'System Admin', 'Super Admin'];
      const STAFF = ['Finance Executive', 'Accounts Executive', 'Collection Executive', 'Branch Accountant', 'Admissions Counsellor', 'HR Officer', 'Branch HR', 'Recruitment Executive', 'Payroll Executive', 'Accountant', 'Accounts Payable Executive', 'Accounts Receivable Executive', 'Cashier', 'Branch Cashier', 'Store In-Charge', 'Storekeeper', 'Asset Coordinator', 'Technician', 'Utility Coordinator', 'IT Support', 'HOD', 'Teacher', 'Class Teacher', 'Legal Staff', 'Front Office', 'Finance Admin'];
      if (MGMT.concat(STAFF).includes(role)) { give(p, ['gap', 'tasks'], ['View', 'Add']); }
      if (MGMT.includes(role)) give(p, ['gap'], ['Approve']);
      if (['CEO', 'CFO', 'Director', 'System Admin', 'Super Admin'].includes(role)) give(p, ['gap'], ['Configure Settings']); }
    give(p, ['myday'], ['View']);
    // AI Assistant: who may ask, download, approve and share; the data itself stays limited by each role's own module permissions and branch scope
    const AIU = ['Chairman', 'Vice Chairman / VCP', 'CEO', 'CFO', 'Corporate Finance', 'Finance Manager', 'Finance Admin', 'Finance Executive', 'Regional Director', 'Zonal Director', 'Principal', 'Admissions Head', 'HR Officer', 'HR Admin', 'Corporate HR', 'Branch HR', 'Auditor', 'Internal Auditor', 'Read-Only Management User', 'System Admin', 'Corporate Purchase'];
    if (AIU.includes(role)) give(p, ['ai_chat'], ['View']);
    if (AIU.includes(role) && role !== 'Read-Only Management User') give(p, ['ai_chat'], ['Export Excel', 'Export PDF']);
    if (['Chairman', 'Vice Chairman / VCP', 'CEO', 'CFO'].includes(role)) give(p, ['ai_chat'], ['Approve', 'Reject', 'Send Email', 'Send WhatsApp']);
    if (['Finance Manager', 'Regional Director', 'Zonal Director', 'Principal', 'Admissions Head', 'HR Officer'].includes(role)) give(p, ['ai_chat'], ['Send Email']);
    if (['Regional Director', 'Zonal Director'].includes(role)) give(p, ['ai_chat'], ['Send WhatsApp']);
    if (['Chairman', 'CEO', 'CFO', 'Auditor', 'Internal Auditor', 'System Admin'].includes(role)) give(p, ['ai_chat'], ['View audit logs']);
    if (role === 'System Admin') give(p, ['ai_chat'], ['Configure Settings']);
    if (role === 'System Admin') give(p, ['ai_admin'], ['View', 'Edit', 'View audit logs', 'Export Excel', 'Export PDF']);
    if (['Auditor', 'Internal Auditor'].includes(role)) give(p, ['ai_admin'], ['View', 'View audit logs']);
    if (['Parent', 'Student'].includes(role)) Object.keys(p).forEach(k => { if (k !== 'portal') delete p[k]; }); // families see their own child's app and nothing else
    R[role] = { active: true, perms: p, desc: '' };
  });
  return R;
}

function defaultDirectory(src) {
  const users = [], maps = [], bmap = [];
  let n = 0;
  const id = () => 'U' + String(++n).padStart(3, '0');
  const slug = s => s.toLowerCase().replace(/^ms /, '').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
  const add = (o, scope) => {
    const u = Object.assign({ id: id(), status: 'Active', mfa: true, sessionTimeout: 30, singleSession: false, forceChange: false, doj: '2019-06-01', lastLogin: '2026-10-19T09:12:00+05:30', manager: '', dept: 'Management', mobile: '9XXXXX' + String(1000 + n * 37 % 9000) }, o);
    u.empId = 'MSEA' + String(1000 + n); users.push(u);
    if (scope) maps.push(Object.assign({ id: 'M' + String(maps.length + 1).padStart(3, '0'), user: u.id, from: '2026-04-01', to: '', status: 'Active', level: 'Read Only' }, scope));
    return u;
  };
  const all = { type: 'All Branches' };
  const ch = add({ name: 'Chairman (demo)', role: 'Chairman', desig: 'Chairman', email: 'chairman@msea.example', dept: 'Board' }, all);
  add({ name: 'Vice Chairman (demo)', role: 'Vice Chairman / VCP', desig: 'Vice Chairman', email: 'vc@msea.example', dept: 'Board', manager: ch.id }, all);
  const ceo = add({ name: 'CEO (demo)', role: 'CEO', desig: 'Chief Executive Officer', email: 'ceo@msea.example', manager: ch.id }, all);
  const cfo = add({ name: 'CFO (demo)', role: 'CFO', desig: 'Chief Financial Officer', email: 'cfo@msea.example', dept: 'Finance', manager: ceo.id }, { type: 'All Branches', level: 'Full Control' });
  add({ name: 'Corporate Finance Lead (demo)', role: 'Corporate Finance', desig: 'Head – Corporate Finance', email: 'corp.finance@msea.example', dept: 'Finance', manager: cfo.id }, { type: 'All Branches', level: 'Full Control' });
  add({ name: 'Corporate Finance Analyst (demo)', role: 'Corporate Finance', desig: 'Analyst', email: 'finance.analyst@msea.example', dept: 'Finance', manager: cfo.id }, all);
  const fm = add({ name: 'Finance Manager (demo)', role: 'Finance Manager', desig: 'Finance Manager', email: 'finance.manager@msea.example', dept: 'Finance', manager: cfo.id }, { type: 'All Branches', level: 'Full Control' });
  add({ name: 'Finance Executive (demo)', role: 'Finance Executive', desig: 'Finance Executive', email: 'finance.exec@msea.example', dept: 'Finance', manager: fm.id }, all);
  add({ name: 'Finance Executive 2 (demo)', role: 'Finance Executive', desig: 'Finance Executive', email: 'finance.exec2@msea.example', dept: 'Finance', manager: fm.id, status: 'Pending Activation', lastLogin: '' }, all);
  const sa = add({ name: 'System Admin (demo)', role: 'System Admin', desig: 'IT Manager', email: 'sysadmin@msea.example', dept: 'IT', manager: ceo.id }, all);
  add({ name: 'Super Admin (demo)', role: 'Super Admin', desig: 'Group CIO', email: 'superadmin@msea.example', dept: 'IT', manager: '' }, { type: 'All Branches', level: 'Full Control' });
  add({ name: 'System Admin 2 (demo)', role: 'System Admin', desig: 'Systems Engineer', email: 'sysadmin2@msea.example', dept: 'IT', manager: sa.id }, all);
  add({ name: 'IT Support (demo)', role: 'IT Support', desig: 'IT Support Engineer', email: 'it.support@msea.example', dept: 'IT', manager: sa.id }, all);
  add({ name: 'Internal Auditor (demo)', role: 'Auditor', desig: 'Internal Auditor', email: 'audit@msea.example', dept: 'Audit', manager: cfo.id }, all);
  add({ name: 'Management Viewer (demo)', role: 'Read-Only Management User', desig: 'Management Associate', email: 'mgmt.view@msea.example', manager: ceo.id }, all);
  const regions = [...new Set(src.branches.map(b => b.region))];
  const zones = [...new Set(src.branches.map(b => b.zone))];
  const rd = {};
  const RDN = { 'Delhi': 'Imran Qureshi', 'Maharashtra': 'Farhan Shaikh', 'Uttar Pradesh': 'Asif Siddiqui', 'Telangana': 'Mohammed Ather Hussain' };
  const ZDN = { 'Delhi': 'Sana Rizvi', 'Mumbai': 'Nadeem Ansari', 'Kanpur': 'Tariq Hashmi', 'Hyderabad South': 'Syed Mujtaba Ali', 'Hyderabad Central': 'Ayesha Farooqui', 'Hyderabad West': 'Khaja Moinuddin' };
  regions.forEach(r => rd[r] = add({ name: `${RDN[r] || 'Regional Director – ' + r} (demo)`, role: 'Regional Director', desig: 'Regional Director', email: `rd.${slug(r)}@msea.example`, region: r, manager: ceo.id }, { type: 'All Branches Under Region', region: r }));
  const zdU = {}; zones.forEach(z => { const r = src.branches.find(b => b.zone === z).region; zdU[z] = add({ name: `${ZDN[z] || 'Zonal Director – ' + z} (demo)`, role: 'Zonal Director', desig: 'Zonal Director', email: `zd.${slug(z)}@msea.example`, region: r, zone: z, manager: rd[r].id }, { type: 'All Branches Under Zone', zone: z }); });
  src.branches.forEach(b => {
    add({ name: `Principal – ${b.name} (demo)`, role: 'Principal', desig: 'Principal', dept: 'Academics', email: `principal.${slug(b.name)}@msea.example`, region: b.region, zone: b.zone, branch: b.id, manager: zdU[b.zone].id }, { type: 'Own Branch Only', branches: [b.id] });
  });
  add({ name: 'Accounts Executive – Hyderabad (demo)', role: 'Accounts Executive', desig: 'Accounts Executive', email: 'accounts.hyd@msea.example', dept: 'Accounts', region: 'Telangana', manager: fm.id }, { type: 'Selected Branches', branches: src.branches.filter(b => b.zone === 'Hyderabad Central').map(b => b.id) });
  add({ name: 'Collection Executive – Malakpet (demo)', role: 'Collection Executive', desig: 'Collection Executive', email: 'collections.malakpet@msea.example', dept: 'Accounts', region: 'Telangana', manager: fm.id }, { type: 'Selected Branches', branches: src.branches.filter(b => b.portfolio === 5).map(b => b.id) });
  add({ name: 'HR Officer (demo)', role: 'HR Officer', desig: 'HR Officer', email: 'hr.officer@msea.example', dept: 'Human Resources', manager: ceo.id }, all);
  // admissions and branch accounts (added after the original directory so existing user ids stay the same)
  const ah = add({ name: 'Admissions Head (demo)', role: 'Admissions Head', desig: 'Head – Admissions', email: 'admissions.head@msea.example', dept: 'Admissions', manager: ceo.id }, all);
  zones.forEach(z => { const r = src.branches.find(b => b.zone === z).region; add({ name: `Admissions Counsellor – ${z} (demo)`, role: 'Admissions Counsellor', desig: 'Admissions Counsellor', email: `counsellor.${slug(z)}@msea.example`, dept: 'Admissions', region: r, zone: z, manager: ah.id }, { type: 'All Branches Under Zone', zone: z }); });
  const b21 = src.branches.find(b => b.id === 'B21') || src.branches[0];
  add({ name: `Branch Accountant – ${b21.name} (demo)`, role: 'Branch Accountant', desig: 'Branch Accountant', email: `accounts.${slug(b21.name)}@msea.example`, dept: 'Accounts', region: b21.region, zone: b21.zone, branch: b21.id, manager: fm.id }, { type: 'Own Branch Only', branches: [b21.id] });
  // Store & Purchase management: branch requesters, store team and corporate purchase (appended so earlier ids stay stable)
  zones.forEach((z, zi) => { const b = src.branches.find(x => x.zone === z); add({ name: `Branch Requester – ${b.name} (demo)`, role: 'Branch Requester', desig: 'Office Superintendent', dept: ['Administration', 'Academics', 'Laboratory', 'Sports', 'Library', 'Housekeeping'][zi % 6], email: `requester.${slug(b.name)}@msea.example`, region: b.region, zone: b.zone, branch: b.id, manager: '' }, { type: 'Own Branch Only', branches: [b.id] }); });
  const sic = add({ name: 'Store In-Charge (demo)', role: 'Store In-Charge', desig: 'Store In-Charge – Central Store', dept: 'Stores', email: 'store.incharge@msea.example', manager: cfo.id }, { type: 'All Branches', level: 'Full Control' });
  add({ name: 'Storekeeper – Central Store (demo)', role: 'Storekeeper', desig: 'Storekeeper', dept: 'Stores', email: 'storekeeper.central@msea.example', manager: sic.id }, all);
  const cp = add({ name: 'Head – Corporate Purchase (demo)', role: 'Corporate Purchase', desig: 'Head – Corporate Purchase', dept: 'Purchase', email: 'purchase.head@msea.example', manager: cfo.id }, { type: 'All Branches', level: 'Full Control' });
  add({ name: 'Purchase Executive (demo)', role: 'Corporate Purchase', desig: 'Purchase Executive', dept: 'Purchase', email: 'purchase.exec@msea.example', manager: cp.id }, all);
  // Asset management: branch asset coordinators (by zone), central asset team, maintenance manager and technicians
  zones.forEach(z => { const b = src.branches.find(x => x.zone === z); add({ name: `Asset Coordinator – ${z} (demo)`, role: 'Asset Coordinator', desig: 'Branch Asset Coordinator', dept: 'Administration', email: `assets.${slug(z)}@msea.example`, region: b.region, zone: z, manager: zdU[z].id }, { type: 'All Branches Under Zone', zone: z }); });
  const cat = add({ name: 'Central Asset Team (demo)', role: 'Central Asset Team', desig: 'Head – Fixed Assets', dept: 'Administration', email: 'assets.central@msea.example', manager: cfo.id }, { type: 'All Branches', level: 'Full Control' });
  add({ name: 'Asset Officer (demo)', role: 'Central Asset Team', desig: 'Asset Officer', dept: 'Administration', email: 'asset.officer@msea.example', manager: cat.id }, all);
  const mm = add({ name: 'Maintenance Manager (demo)', role: 'Maintenance Manager', desig: 'Maintenance Manager', dept: 'Maintenance', email: 'maintenance.manager@msea.example', manager: ceo.id }, all);
  add({ name: 'Technician – IT (demo)', role: 'Technician', desig: 'IT Technician', dept: 'IT', email: 'tech.it@msea.example', manager: mm.id }, all);
  add({ name: 'Technician – Electrical (demo)', role: 'Technician', desig: 'Electrical Technician', dept: 'Maintenance', email: 'tech.electrical@msea.example', manager: mm.id }, all);
  // Petty cash custodians: one per branch (demo) and one for the Corporate Office
  src.branches.forEach(b => { add({ name: `Petty Cash Custodian – ${b.name} (demo)`, role: 'Petty Cash Custodian', desig: 'Office Assistant / Cashier', dept: 'Accounts', email: `pettycash.${slug(b.name)}@msea.example`, region: b.region, zone: b.zone, branch: b.id, manager: '' }, { type: 'Own Branch Only', branches: [b.id] }); });
  add({ name: 'Petty Cash Custodian – Corporate Office (demo)', role: 'Petty Cash Custodian', desig: 'Cashier', dept: 'Finance', email: 'pettycash.corporate@msea.example', manager: fm.id }, all);
  // Utility coordinators: one per zone (demo)
  zones.forEach(z => { const b = src.branches.find(x => x.zone === z); add({ name: `Utility Coordinator – ${z} (demo)`, role: 'Utility Coordinator', desig: 'Branch Utility Coordinator', dept: 'Administration', email: `utilities.${slug(z)}@msea.example`, region: b.region, zone: z, manager: zdU[z].id }, { type: 'All Branches Under Zone', zone: z }); });
  // Finance team (demo): finance admin, accountant, AP / AR executives, cashiers, auditors
  const fa = add({ name: 'Finance Admin (demo)', role: 'Finance Admin', desig: 'Finance Admin / Controller', dept: 'Finance', email: 'finance.admin@msea.example', manager: cfo.id }, { type: 'All Branches', level: 'Full Control' });
  add({ name: 'Accountant (demo)', role: 'Accountant', desig: 'Accountant – General Ledger', dept: 'Finance', email: 'accountant@msea.example', manager: fm.id }, all);
  add({ name: 'Accounts Payable Executive (demo)', role: 'Accounts Payable Executive', desig: 'AP Executive', dept: 'Finance', email: 'ap.exec@msea.example', manager: fm.id }, all);
  add({ name: 'Accounts Receivable Executive (demo)', role: 'Accounts Receivable Executive', desig: 'AR Executive', dept: 'Finance', email: 'ar.exec@msea.example', manager: fm.id }, all);
  src.branches.slice(0, 3).forEach(b => add({ name: `Cashier – ${b.name} (demo)`, role: 'Cashier', desig: 'Cashier', dept: 'Accounts', email: `cashier.${slug(b.name)}@msea.example`, region: b.region, zone: b.zone, branch: b.id, manager: '' }, { type: 'Own Branch Only', branches: [b.id] }));
  add({ name: 'Internal Auditor (demo)', role: 'Internal Auditor', desig: 'Internal Auditor', dept: 'Audit', email: 'internal.audit@msea.example', manager: fa.id }, all);
  add({ name: 'External Auditor – Mehta & Associates (demo)', role: 'External Auditor', desig: 'Statutory Auditor', dept: 'Audit', email: 'external.audit@mehta.example', manager: fa.id }, all);
  // HRMS & payroll (appended so earlier ids stay stable)
  const hra = add({ name: 'HR Admin (demo)', role: 'HR Admin', desig: 'HR Manager', dept: 'Human Resources', email: 'hr.admin@msea.example', manager: ceo.id }, { type: 'All Branches', level: 'Full Control' });
  add({ name: 'Corporate HR (demo)', role: 'Corporate HR', desig: 'HR Executive', dept: 'Human Resources', email: 'hr.corporate@msea.example', manager: hra.id }, all);
  const hcz = src.branches.find(b => b.zone === 'Hyderabad Central') || src.branches[0];
  add({ name: `Branch HR – ${hcz.zone} (demo)`, role: 'Branch HR', desig: 'HR Executive', dept: 'Human Resources', email: `hr.${slug(hcz.zone)}@msea.example`, region: hcz.region, zone: hcz.zone, manager: hra.id }, { type: 'All Branches Under Zone', zone: hcz.zone });
  add({ name: 'Recruitment Executive (demo)', role: 'Recruitment Executive', desig: 'Recruitment Executive', dept: 'Human Resources', email: 'recruitment@msea.example', manager: hra.id }, all);
  add({ name: 'Legal Admin (demo)', role: 'Legal Admin', desig: 'Head – Legal & Compliance', dept: 'Legal', email: 'legal.admin@msea.example', manager: ceo.id }, all);
  add({ name: 'Legal Staff (demo)', role: 'Legal Staff', desig: 'Legal Executive', dept: 'Legal', email: 'legal@msea.example', manager: users[users.length - 1].id }, all);
  add({ name: 'Payroll Executive (demo)', role: 'Payroll Executive', desig: 'Payroll Executive', dept: 'Finance', email: 'payroll@msea.example', manager: fa.id }, all);
  add({ name: `HOD Mathematics – ${b21.name} (demo)`, role: 'HOD', desig: 'HOD', dept: 'Academics', email: `hod.maths.${slug(b21.name)}@msea.example`, region: b21.region, zone: b21.zone, branch: b21.id, manager: users.find(u => u.role === 'Principal' && u.branch === b21.id).id }, { type: 'Own Branch Only', branches: [b21.id] });
  add({ name: `Teacher – ${b21.name} (demo)`, role: 'Employee', desig: 'TGT', dept: 'Academics', email: `teacher.${slug(b21.name)}@msea.example`, region: b21.region, zone: b21.zone, branch: b21.id, manager: users[users.length - 1].id, doj: '2024-06-10' }, { type: 'Own Branch Only', branches: [b21.id] });
  // a realistic mix of account states
  const set = (i, st, extra) => Object.assign(users[i], { status: st }, extra || {});
  set(40, 'Locked'); set(55, 'Inactive'); set(61, 'Resigned', { lastLogin: '2026-08-30T10:02:00+05:30' }); set(70, 'Pending Activation', { lastLogin: '' }); set(78, 'Pending Activation', { lastLogin: '' });
  return { users, maps, bmap };
}

function defaultConfig() {
  return {
    ay: '2026-27', years: [{ code: '2022-23', start: '2022-04-01', end: '2023-03-31', status: 'Closed' }, { code: '2023-24', start: '2023-04-01', end: '2024-03-31', status: 'Closed' }, { code: '2024-25', start: '2024-04-01', end: '2025-03-31', status: 'Closed' }, { code: '2025-26', start: '2025-04-01', end: '2026-03-31', status: 'Closed' }, { code: '2026-27', start: '2026-04-01', end: '2027-03-31', status: 'Current', source: 'ERP' }], yearSchedules: {}, targetPct: 80, branchPct: {}, advanceCounts: false, freshCounts: false,
    weekOff: [0], holidays: ['2026-08-15', '2026-08-26', '2026-10-02', '2026-10-20', '2026-11-08', '2026-12-25', '2027-01-26', '2027-03-10'],
    schedule: [
      { key: 'PY', name: 'Previous Year Dues', kind: 'py', due: '2026-04-01', grace: 0, active: true, branches: 'all', types: 'all', classes: 'all' },
      { key: 'I1', name: 'Instalment 1', kind: 'pct', pct: 40, due: '2026-04-10', grace: 15, active: true, branches: 'all', types: 'all', classes: 'all' },
      { key: 'I2', name: 'Instalment 2', kind: 'pct', pct: 30, due: '2026-10-10', grace: 10, active: true, branches: 'all', types: 'all', classes: 'all' },
      { key: 'I3', name: 'Instalment 3', kind: 'pct', pct: 30, due: '2027-01-10', grace: 10, active: true, branches: 'all', types: 'all', classes: 'all' }
    ],
    zpLimitDefault: 1000000, zpLimit: {}, osLimitPct: 45,
    rag: { achGreen: 95, achAmber: 75, osGreen: 30, osAmber: 45, zpGreen: 8, zpAmber: 15, tgtGreen: 100, tgtAmber: 85 },
    strength: { capAlertPct: 95, lowConvPct: 20, lowCollPct: 60, highConcPct: 12, highWithdrawPct: 3, revAlertPct: 85, cancelRatePct: 5, cancelVsNewPct: 25, classCancels: 3 },
    frozen: {}, targetFreezeDay: 1, cutoffTime: '23:59',
    concessionTreatment: 'Net fee is shown after approved concessions', refundTreatment: 'Refunds reduce collection on the refund date',
    alerts: { belowDaily: true, missTarget: true, osLimit: true, zpLimit: true, zpIncreasePct: 5, dueApproachDays: 10, overdueIncreasePct: 8, noCollectionBy: '14:00', syncFail: true, recon: true, whatsapp: false }
  };
}

function defaultEmail(dir) {
  return {
    m365: { tenantId: '', clientId: '', sender: 'fee-reports@msea.example', status: 'Not connected' },
    lists: [
      { id: 'E1', name: 'Daily Branch Report – Principals', type: 'Daily Collection', freq: 'Daily', time: '21:30', dateLogic: 'Today (after evening sync)', rtype: 'Principal', scope: 'Own branch', cc: '', bcc: '', excel: true, pdf: true, link: true, active: true, escalation: 'Collection below daily required', escTo: 'Zonal Director', template: 'Principal' },
      { id: 'E2', name: 'Daily Zone Report – Zonal Directors', type: 'Daily Collection', freq: 'Daily', time: '21:40', dateLogic: 'Today (after evening sync)', rtype: 'Zonal Director', scope: 'Zone', cc: '', bcc: '', excel: true, pdf: true, link: true, active: true, escalation: 'Likely to miss monthly target', escTo: 'Regional Director', template: 'Director' },
      { id: 'E3', name: 'Daily Management Summary', type: 'Management Summary', freq: 'Daily', time: '22:00', dateLogic: 'Today (after evening sync)', rtype: 'Management', scope: 'All branches', cc: 'corp.finance@msea.example', bcc: '', excel: true, pdf: true, link: true, active: true, escalation: 'Zero payer outstanding above limit', escTo: 'CFO', template: 'Management' },
      { id: 'E4', name: 'Weekly Zero Payer Review', type: 'Zero Payer', freq: 'Weekly', time: 'Mon 09:00', dateLogic: 'Previous day', rtype: 'Regional Director', scope: 'Region', cc: 'finance.manager@msea.example', bcc: '', excel: true, pdf: false, link: true, active: true, escalation: 'Increase in zero payer count', escTo: 'Corporate Finance', template: 'Director' },
      { id: 'E5', name: 'Monthly Target Statement', type: 'Monthly Target', freq: 'Monthly', time: '1st 10:00', dateLogic: 'Last day of previous month', rtype: 'Corporate Finance', scope: 'All branches', cc: '', bcc: 'audit@msea.example', excel: true, pdf: true, link: true, active: false, escalation: '', escTo: '', template: 'Management' },
      { id: 'E6', name: 'Weekly Target Strength & Capacity Statement', type: 'Target Strength & Capacity', freq: 'Weekly', time: 'Mon 09:30', dateLogic: 'Previous day', rtype: 'Zonal Director', scope: 'Zone', cc: 'corp.finance@msea.example', bcc: '', excel: true, pdf: true, link: true, active: true, escalation: 'Target strength below plan', escTo: 'Regional Director', template: 'Target Strength' },
      { id: 'E7', name: 'Daily SRF Pending Actions', type: 'SRF Pending Actions', freq: 'Daily', time: '18:00', dateLogic: 'Today (after evening sync)', rtype: 'Accounts', scope: 'Mapped branches', cc: 'hr.officer@msea.example', bcc: '', excel: true, pdf: false, link: true, active: true, escalation: 'SRF verification overdue (SLA)', escTo: 'Corporate Finance', template: 'SRF Incentive' },
      { id: 'E8', name: 'Monthly SRF Incentive Summary', type: 'SRF Incentive Summary', freq: 'Monthly', time: '1st 10:30', dateLogic: 'Last day of previous month', rtype: 'Corporate Finance', scope: 'All branches', cc: 'hr.officer@msea.example', bcc: 'audit@msea.example', excel: true, pdf: true, link: true, active: true, escalation: 'SRF payment pending beyond cycle', escTo: 'CFO', template: 'SRF Incentive' }
    ]
  };
}
function defaultTemplates() {
  return {
    Principal: { subject: 'Daily Fee Collection & Outstanding Report – {portfolio} – {date}', greeting: 'Dear {name},', intro: 'Please find below the fee collection and outstanding position as of {date}.', closing: 'Please follow up with the zero payer and overdue families listed in the attached report.', signature: 'Corporate Finance\nMS Educational and Welfare Trust' },
    'Director': { subject: 'Daily Fee Collection & Outstanding Report – {portfolio} – {date}', greeting: 'Dear {name},', intro: 'Please find below the consolidated fee collection and outstanding position of your branches as of {date}.', closing: 'Branch-wise details are in the table below and in the attached Excel and PDF reports.', signature: 'Corporate Finance\nMS Educational and Welfare Trust' },
    Management: { subject: 'Daily Fee Collection & Outstanding Report – Group – {date}', greeting: 'Dear {name},', intro: 'Please find below the group consolidated fee collection and outstanding position as of {date}.', closing: 'Region-wise performance and the top 10 risk branches are summarised below.', signature: 'Corporate Finance\nMS Educational and Welfare Trust' },
    'Target Strength': { subject: 'Target Strength & Capacity Statement – {portfolio} – {date}', greeting: 'Dear {name},', intro: 'Please find below the existing strength, net strength, target strength and approved capacity position as of {date}.', closing: 'Branches below their target strength or above capacity are highlighted. Please review the admission plan and capacity requests for these branches.', signature: 'Corporate Finance\nMS Educational and Welfare Trust' },
    'SRF Incentive': { subject: 'SRF Incentive – Pending Actions & Summary – {portfolio} – {date}', greeting: 'Dear {name},', intro: 'Please find below the Seat Reservation Fee incentive position as of {date}: requests awaiting verification, incentives awaiting payment and amounts paid this month.', closing: 'Requests older than the verification SLA and payments pending beyond the payroll cycle are listed for action.', signature: 'Corporate Finance\nMS Educational and Welfare Trust' }
  };
}
function defaultSync() {
  const runs = [
    { at: '2026-10-19T21:00:00+05:30', status: 'Success', by: 'Scheduler', ok: 0, failed: 0, dups: 3, entity: 'All' },
    { at: '2026-10-19T13:00:00+05:30', status: 'Success', by: 'Scheduler', ok: 0, failed: 0, dups: 0, entity: 'All' },
    { at: '2026-10-19T06:00:00+05:30', status: 'Partial', by: 'Scheduler', ok: 0, failed: 14, dups: 0, entity: 'Concessions', error: 'ERP API timeout after 120 s on /concessions?page=7 (HTTP 504)' },
    { at: '2026-10-18T21:00:00+05:30', status: 'Success', by: 'Scheduler', ok: 0, failed: 0, dups: 0, entity: 'All' }
  ];
  return { schedule: ['06:00', '13:00', '21:00'], lastSuccess: runs[0].at, runs, erp: { baseUrl: 'https://erp.msea.example/api/v1', auth: 'OAuth 2.0 client credentials', status: 'Simulated – demo dataset' } };
}

const Store = (() => {
  const DOCS = ['rpt', 'onb', 'gap', 'tasks', 'exl', 'axd', 'scl', 'iplan', 'grat', 'rost', 'icoy', 'pins', 'ema', 'svy', 'qpg', 'dbt', 'ptk', 'smv', 'opay', 'crt', 'fdm', 'fst', 'rfc', 'att', 'cch', 'cdk', 'rov', 'alm', 'tnp', 'hml', 'config', 'users', 'roles', 'mappings', 'branchmap', 'emaildist', 'templates', 'sync', 'resolved', 'adjustments', 'targets', 'capacity', 'admplans', 'categories', 'branchmeta', 'histimport', 'exits', 'srf', 'srf_work', 'srf_audit', 'modules', 'workflows', 'datarules', 'accessreq', 'grants', 'sessions', 'psd', 'proc', 'proc_tx', 'assets', 'asset_tx', 'pcash', 'pcash_tx', 'util', 'util_tx', 'rent', 'rent_tx', 'fin', 'fin_tx', 'bank', 'bank_tx', 'hr', 'hr_tx', 'payroll', 'legal', 'legal_tx', 'mm', 'tcv', 'crm', 'ai', 'sis', 'acad', 'lms', 'exam', 'udise', 'house', 'meet', 'consent', 'franchise', 'cal', 'tac', 'lrc', 'qps', 'lib', 'smk', 'adp', 'cmc', 'cur', 'fbp'];
  const docs = {}, colls = { audit: [], approvals: [], emaillog: [], views: [], srfsubs: [], ailog: [] };
  const subs = new Set();
  let db = null, writable = true, mode = 'local';
  const clone = o => JSON.parse(JSON.stringify(o));
  const emit = k => subs.forEach(f => { try { f(k); } catch (e) { console.error(e); } });
  function init(defaults) { Object.keys(defaults).forEach(k => { if (defaults[k] !== undefined) docs[k] = clone(defaults[k]); }); }
  async function connect() {
    try { db = window.claude && window.claude.use ? await window.claude.use('db') : null; } catch (e) { db = null; }
    if (!db) return false;
    mode = 'shared';
    try { const u = await window.claude.use('user'); if (u && u.can) { const c = await u.can('data.write'); if (c === false) writable = false; } } catch (e) { }
    DOCS.forEach(k => db.doc('app/' + k).onSnapshot(s => { if (s.exists && s.data() && s.data().v !== undefined) { docs[k] = clone(s.data().v); emit(k); } }, () => { }));
    const live = (c, n) => db.collection(c).orderBy('ts', 'desc').limit(n).onSnapshot(q => { colls[c] = q.docs.map(d => Object.assign({ id: d.id }, d.data())); emit(c); }, () => { });
    live('audit', 600); live('approvals', 300); live('emaillog', 300); live('views', 200); live('srfsubs', 500); live('ailog', 1500);
    emit('mode');
    return true;
  }
  const get = k => docs[k];
  const list = c => colls[c];
  async function put(k, v) {
    docs[k] = clone(v); emit(k);
    if (db) { try { await db.doc('app/' + k).set({ v, updatedAt: new Date().toISOString() }); } catch (e) { onFail(e); } }
  }
  async function add(c, obj) {
    obj = Object.assign({ ts: new Date().toISOString() }, obj);
    if (db) { try { await db.collection(c).add(obj); return; } catch (e) { onFail(e); } }
    colls[c] = [Object.assign({ id: 'L' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) }, obj), ...colls[c]]; emit(c);
  }
  async function patch(c, id, p) {
    const x = colls[c].find(a => a.id === id); if (x) Object.assign(x, p); emit(c);
    if (db && !String(id).startsWith('L')) { try { await db.doc(c + '/' + id).update(p); } catch (e) { onFail(e); } }
  }
  async function setDoc(c, id, obj) {
    obj = Object.assign({ ts: new Date().toISOString() }, obj);
    const i = colls[c].findIndex(x => x.id === id); if (i >= 0) colls[c][i] = Object.assign({ id }, obj); else colls[c] = [Object.assign({ id }, obj), ...colls[c]];
    if (db) { try { await db.doc(c + '/' + id).set(obj); } catch (e) { onFail(e); } }
  }
  function onFail(e) { if (e && e.code === 'invalid_argument') writable = false; emit('error:' + (e && e.code || 'unknown')); }
  return { init, connect, get, names: () => Object.keys(docs), list, put, add, patch, setDoc, on: f => subs.add(f), clone, get mode() { return mode; }, get writable() { return writable; } };
})();
