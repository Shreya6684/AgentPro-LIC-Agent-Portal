
"use strict";

/* AgentPro - LIC Agent Portal
   Academic demo. Data stays in this browser only. */

const DB_KEY = "agentpro_db_v2";
const USER_KEY = "agentpro_user_v2";
const THEME_KEY = "agentpro_theme_v2";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const today = () => new Date().toISOString().slice(0, 10);
const dateOffset = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(Number(value) || 0);
const safe = (value) => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));
const titleCase = (value) => String(value || "").replace(/[-_]/g, " ")
  .replace(/\b\w/g, letter => letter.toUpperCase());
const uid = (prefix) => prefix + "-" + Date.now().toString(36).toUpperCase() +
  "-" + Math.random().toString(36).slice(2, 5).toUpperCase();

const moduleInfo = {
  clients: {
    title: "Client Management",
    subtitle: "Manage client profiles and their contact details.",
    key: "clients",
    fields: [
      ["name", "Client name", "text", true],
      ["phone", "Phone number", "tel", true],
      ["email", "Email address", "email", false],
      ["address", "Address", "textarea", false],
      ["nominee", "Nominee name", "text", false],
      ["medicalHistory", "Medical history notes", "textarea", false]
    ],
    columns: [
      ["name", "Client"], ["phone", "Phone"], ["email", "Email"],
      ["address", "Address"], ["nominee", "Nominee"], ["medicalHistory", "Medical notes"]
    ]
  },
  policies: {
    title: "Policy Management",
    subtitle: "Manage policy details, coverage and policy documents.",
    key: "policies",
    fields: [
      ["clientId", "Client", "client", true],
      ["policyNumber", "Policy number", "text", true],
      ["type", "Policy type", "policyType", true],
      ["premium", "Premium amount (₹)", "number", true],
      ["term", "Term (years)", "number", true],
      ["sumAssured", "Sum assured (₹)", "number", true],
      ["startDate", "Start date", "date", true],
      ["endDate", "End date", "date", true],
      ["frequency", "Payment frequency", "frequency", true],
      ["status", "Policy status", "policyStatus", true]
    ],
    columns: [
      ["policyNumber", "Policy"], ["clientId", "Client"], ["type", "Type"],
      ["premium", "Premium"], ["sumAssured", "Sum assured"],
      ["endDate", "End date"], ["status", "Status"]
    ]
  },
  premiums: {
    title: "Premium Tracking",
    subtitle: "Track premium due dates, payments and overdue amounts.",
    key: "premiums",
    fields: [
      ["policyId", "Policy", "policy", true],
      ["amount", "Amount (₹)", "number", true],
      ["dueDate", "Due date", "date", true],
      ["status", "Payment status", "paymentStatus", true],
      ["paidDate", "Paid date", "date", false],
      ["method", "Payment method", "paymentMethod", false],
      ["reference", "Payment reference", "text", false]
    ],
    columns: [
      ["policyId", "Policy / Client"], ["amount", "Amount"],
      ["dueDate", "Due date"], ["status", "Status"], ["paidDate", "Paid date"],
      ["method", "Method"], ["reference", "Reference"]
    ]
  },
  renewals: {
    title: "Renewal Management",
    subtitle: "Follow up on upcoming renewals and update their status.",
    key: "renewals",
    fields: [
      ["policyId", "Policy", "policy", true],
      ["dueDate", "Renewal date", "date", true],
      ["status", "Renewal status", "renewalStatus", true],
      ["notes", "Follow-up notes", "textarea", false]
    ],
    columns: [
      ["policyId", "Policy / Client"], ["dueDate", "Renewal date"],
      ["status", "Status"], ["notes", "Notes"]
    ]
  },
  claims: {
    title: "Claims Management",
    subtitle: "Record claims and follow their progress.",
    key: "claims",
    fields: [
      ["clientId", "Client", "client", true],
      ["policyId", "Policy", "policy", true],
      ["claimNumber", "Claim number", "text", true],
      ["claimType", "Claim type", "claimType", true],
      ["amount", "Claim amount (₹)", "number", true],
      ["date", "Claim date", "date", true],
      ["status", "Claim status", "claimStatus", true],
      ["notes", "Notes", "textarea", false]
    ],
    columns: [
      ["claimNumber", "Claim"], ["clientId", "Client"], ["claimType", "Type"],
      ["amount", "Amount"], ["date", "Claim date"], ["status", "Status"]
    ]
  },
  leads: {
    title: "Lead Management",
    subtitle: "Track prospects, follow-ups and conversions.",
    key: "leads",
    fields: [
      ["name", "Prospect name", "text", true],
      ["phone", "Phone number", "tel", true],
      ["email", "Email address", "email", false],
      ["source", "Lead source", "leadSource", true],
      ["interest", "Interested in", "policyType", true],
      ["followUp", "Next follow-up", "date", false],
      ["status", "Lead status", "leadStatus", true],
      ["notes", "Notes", "textarea", false]
    ],
    columns: [
      ["name", "Prospect"], ["phone", "Phone"], ["source", "Source"],
      ["interest", "Interest"], ["followUp", "Follow-up"], ["status", "Status"]
    ]
  }
};

const optionSets = {
  client: () => db.clients.map(c => [c.id, c.name]),
  policy: () => db.policies.map(p => [p.id, `${p.policyNumber} · ${clientName(p.clientId)}`]),
  policyType: () => [
    ["Life Insurance", "Life Insurance"], ["Term Insurance", "Term Insurance"],
    ["Endowment", "Endowment"], ["Money Back", "Money Back"],
    ["Pension", "Pension"], ["Child Plan", "Child Plan"], ["Other", "Other"]
  ],
  frequency: () => [
    ["Monthly", "Monthly"], ["Quarterly", "Quarterly"],
    ["Half-yearly", "Half-yearly"], ["Yearly", "Yearly"]
  ],
  policyStatus: () => [
    ["Active", "Active"], ["Lapsed", "Lapsed"], ["Matured", "Matured"], ["Surrendered", "Surrendered"]
  ],
  paymentStatus: () => [
    ["Due", "Due"], ["Paid", "Paid"], ["Overdue", "Overdue"]
  ],
  paymentMethod: () => [
    ["Cash", "Cash"], ["UPI", "UPI (demo)"], ["Bank Transfer", "Bank Transfer"],
    ["Cheque", "Cheque"], ["Other", "Other"]
  ],
  renewalStatus: () => [
    ["Upcoming", "Upcoming"], ["Contacted", "Contacted"],
    ["Renewed", "Renewed"], ["Not Renewing", "Not Renewing"]
  ],
  claimType: () => [
    ["Death", "Death claim"], ["Maturity", "Maturity claim"],
    ["Health", "Health-related claim"], ["Other", "Other"]
  ],
  claimStatus: () => [
    ["Open", "Open"], ["In Progress", "In Progress"],
    ["Approved", "Approved"], ["Rejected", "Rejected"], ["Settled", "Settled"]
  ],
  leadSource: () => [
    ["Referral", "Referral"], ["Website", "Website"], ["Social Media", "Social media"],
    ["Walk-in", "Walk-in"], ["Call", "Phone call"], ["Other", "Other"]
  ],
  leadStatus: () => [
    ["New", "New"], ["Contacted", "Contacted"], ["Follow-up", "Follow-up"],
    ["Converted", "Converted"], ["Lost", "Lost"]
  ]
};

function seedData() {
  const clients = [
    { id: "C-1001", name: "Aarav Mehta", phone: "9876501234", email: "aarav@example.com", address: "Jamshedpur", nominee: "Neha Mehta", medicalHistory: "Sample note" },
    { id: "C-1002", name: "Priya Singh", phone: "9876505678", email: "priya@example.com", address: "Ranchi", nominee: "Amit Singh", medicalHistory: "" },
    { id: "C-1003", name: "Rohan Das", phone: "9876509876", email: "rohan@example.com", address: "Adityapur", nominee: "Mita Das", medicalHistory: "" }
  ];
  const policies = [
    { id: "P-2001", clientId: "C-1001", policyNumber: "LIC-10001", type: "Term Insurance", premium: 12000, term: 20, sumAssured: 1000000, startDate: dateOffset(-365), endDate: dateOffset(3650), frequency: "Yearly", status: "Active", documentName: "" },
    { id: "P-2002", clientId: "C-1002", policyNumber: "LIC-10002", type: "Endowment", premium: 18000, term: 15, sumAssured: 800000, startDate: dateOffset(-120), endDate: dateOffset(5350), frequency: "Yearly", status: "Active", documentName: "" },
    { id: "P-2003", clientId: "C-1003", policyNumber: "LIC-10003", type: "Money Back", premium: 9000, term: 10, sumAssured: 500000, startDate: dateOffset(-600), endDate: dateOffset(3050), frequency: "Half-yearly", status: "Active", documentName: "" }
  ];
  const premiums = [
    { id: "PM-3001", policyId: "P-2001", amount: 12000, dueDate: dateOffset(10), status: "Due", paidDate: "", method: "", reference: "" },
    { id: "PM-3002", policyId: "P-2002", amount: 18000, dueDate: dateOffset(-10), status: "Overdue", paidDate: "", method: "", reference: "" },
    { id: "PM-3003", policyId: "P-2003", amount: 9000, dueDate: dateOffset(-20), status: "Paid", paidDate: dateOffset(-20), method: "UPI", reference: "DEMO-REF-3003" }
  ];
  const renewals = [
    { id: "R-4001", policyId: "P-2001", dueDate: dateOffset(10), status: "Upcoming", notes: "Sample reminder" },
    { id: "R-4002", policyId: "P-2002", dueDate: dateOffset(20), status: "Contacted", notes: "Sample follow-up" }
  ];
  const claims = [
    { id: "CL-5001", clientId: "C-1001", policyId: "P-2001", claimNumber: "CLM-001", claimType: "Maturity", amount: 50000, date: dateOffset(-3), status: "In Progress", notes: "Sample claim" }
  ];
  const leads = [
    { id: "L-6001", name: "Kavya Roy", phone: "9876501111", email: "kavya@example.com", source: "Referral", interest: "Life Insurance", followUp: dateOffset(2), status: "New", notes: "Sample lead" },
    { id: "L-6002", name: "Vivek Kumar", phone: "9876502222", email: "vivek@example.com", source: "Website", interest: "Term Insurance", followUp: dateOffset(5), status: "Follow-up", notes: "" }
  ];
  return { clients, policies, premiums, renewals, claims, leads, commissions: [], notifications: [] };
}

function loadDB() {
  try {
    const saved = JSON.parse(localStorage.getItem(DB_KEY));
    if (saved && Array.isArray(saved.clients) && Array.isArray(saved.policies)) {
      for (const key of ["clients", "policies", "premiums", "renewals", "claims", "leads", "commissions", "notifications"]) {
        if (!Array.isArray(saved[key])) saved[key] = [];
      }
      return saved;
    }
  } catch (error) {
    console.warn("Saved demo data could not be read.", error);
  }
  return seedData();
}

let db = loadDB();
let currentUser = null;
let currentPage = "dashboard";
let authMode = "login";
let activeSearch = "";
let activeFilter = "all";
let editingRecord = null;
let toastTimer = null;
let selectedUploadPolicy = null;

function saveDB() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (error) {
    showToast("Browser storage is full. Try removing large attachments or clearing old demo data.");
  }
}
saveDB();

function clientName(id) {
  return db.clients.find(c => c.id === id)?.name || "Deleted / unknown client";
}
function policyName(id) {
  const p = db.policies.find(item => item.id === id);
  return p ? `${p.policyNumber} · ${clientName(p.clientId)}` : "Deleted / unknown policy";
}
function nextId(collection, prefix) {
  const numbers = db[collection].map(item => Number(String(item.id).match(/(\d+)$/)?.[1] || 0));
  return `${prefix}-${Math.max(1000, ...numbers) + 1}`;
}
function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}
function formatDate(value) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? safe(value) : date.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
}
function statusClass(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "-");
}
function isOverdue(premium) {
  return premium.status !== "Paid" && premium.dueDate && premium.dueDate < today();
}
function normalizePremiumStatuses() {
  let changed = false;
  db.premiums.forEach(p => {
    if (p.status !== "Paid" && p.dueDate && p.dueDate < today() && p.status !== "Overdue") {
      p.status = "Overdue";
      changed = true;
    }
  });
  if (changed) saveDB();
}
normalizePremiumStatuses();

function getUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)); }
  catch { return null; }
}
function startSession(user) {
  currentUser = user;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  $("#authScreen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#userName").textContent = user.name;
  $("#userRole").textContent = user.role;
  $("#userAvatar").textContent = (user.name || "A").trim().charAt(0).toUpperCase();
  $("#todayLabel").textContent = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });
  applyTheme();
  renderPage("dashboard");
}
function endSession() {
  localStorage.removeItem(USER_KEY);
  currentUser = null;
  $("#app").classList.add("hidden");
  $("#authScreen").classList.remove("hidden");
  $("#authForm").reset();
  setAuthMode("login");
}

function setAuthMode(mode) {
  authMode = mode;
  $$(".auth-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.auth === mode));
  $("#authName").classList.toggle("hidden", mode === "login");
  $("#nameLabel").classList.toggle("hidden", mode === "login");
  $("#authName").required = mode === "register";
  $("#authSubmit").textContent = mode === "register" ? "Create demo account" : "Enter Demo Portal";
  $("#authMessage").textContent = mode === "register"
    ? "Creates a local demo profile on this browser."
    : "Use any demo email and password to enter the portal.";
}

$("#authForm").addEventListener("submit", event => {
  event.preventDefault();
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;
  const role = $("#authRole").value;
  if (!email || !password) return;
  if (authMode === "register" && !$("#authName").value.trim()) {
    $("#authMessage").textContent = "Please enter your name.";
    return;
  }
  const user = {
    name: authMode === "register" ? $("#authName").value.trim() : (email.split("@")[0] || "Demo Agent"),
    email, role
  };
  startSession(user);
  showToast(authMode === "register" ? "Demo profile created on this browser." : "Welcome to AgentPro demo.");
});
$$(".auth-tab").forEach(tab => tab.addEventListener("click", () => setAuthMode(tab.dataset.auth)));

function applyTheme() {
  document.body.classList.toggle("dark", localStorage.getItem(THEME_KEY) === "dark");
}
$("#themeToggle").addEventListener("click", () => {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  localStorage.setItem(THEME_KEY, next);
  applyTheme();
});
$("#logoutBtn").addEventListener("click", endSession);
$("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#navigation").addEventListener("click", event => {
  const button = event.target.closest("[data-page]");
  if (!button) return;
  renderPage(button.dataset.page);
  $("#sidebar").classList.remove("open");
});
$("#reminderBtn").addEventListener("click", checkReminders);
$("#pageContent").addEventListener("input", event => {
  if (event.target.id === "searchInput") {
    activeSearch = event.target.value;
    const position = event.target.selectionStart;
    renderPage(currentPage, false);
    const input = $("#searchInput");
    if (input) {
      input.focus();
      input.setSelectionRange(position, position);
    }
  }
});
$("#pageContent").addEventListener("change", event => {
  if (event.target.id === "filterSelect") {
    activeFilter = event.target.value;
    renderPage(currentPage, false);
  }
});
$("#pageContent").addEventListener("click", handlePageAction);
$("#recordForm").addEventListener("submit", saveRecord);
$("#modal").addEventListener("click", event => {
  if (event.target.closest("[data-close-modal]")) closeModal();
});
$("#documentInput").addEventListener("change", handleDocumentUpload);

function renderPage(page, resetSearch = true) {
  currentPage = page;
  if (resetSearch) {
    activeSearch = "";
    activeFilter = "all";
  }
  $$(".nav-link[data-page]").forEach(button => button.classList.toggle("active", button.dataset.page === page));
  $("#pageTitle").textContent = page === "dashboard" ? "Dashboard" : (moduleInfo[page]?.title || titleCase(page));
  if (page === "dashboard") $("#pageContent").innerHTML = renderDashboard();
  else if (page === "commissions") $("#pageContent").innerHTML = renderCommissions();
  else if (page === "reports") $("#pageContent").innerHTML = renderReports();
  else if (moduleInfo[page]) $("#pageContent").innerHTML = renderModule(page);
  else $("#pageContent").innerHTML = `<div class="panel"><h2>Page not found</h2><button class="btn primary" data-action="navigate" data-page="dashboard">Back to dashboard</button></div>`;
  updateReminderCount();
}

function pageHeading(title, subtitle, buttons = "") {
  return `<div class="page-heading"><div><p class="eyebrow">AGENTPRO WORKSPACE</p><h1>${safe(title)}</h1><p>${safe(subtitle)}</p></div><div class="heading-actions">${buttons}</div></div>`;
}
function statCard(label, value, icon, foot = "") {
  return `<article class="stat-card"><div class="stat-top"><span>${safe(label)}</span><span class="stat-icon">${icon}</span></div><div class="stat-value">${safe(value)}</div><div class="stat-foot">${foot}</div></article>`;
}
function renderDashboard() {
  const due = db.premiums.filter(p => p.status !== "Paid");
  const overdue = due.filter(isOverdue);
  const paidTotal = db.premiums.filter(p => p.status === "Paid").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const dueTotal = due.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const activePolicies = db.policies.filter(p => p.status === "Active").length;
  const converted = db.leads.filter(l => l.status === "Converted").length;
  const upcoming = db.renewals.filter(r => r.status !== "Renewed" && r.status !== "Not Renewing" && r.dueDate >= today())
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 5);
  const recent = [...db.premiums].sort((a, b) => (b.paidDate || b.dueDate || "").localeCompare(a.paidDate || a.dueDate || "")).slice(0, 5);
  const monthNames = [];
  const monthTotals = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthNames.push(d.toLocaleDateString("en-IN", { month: "short" }));
    monthTotals.push(db.premiums.filter(p => p.status === "Paid" && (p.paidDate || "").startsWith(key))
      .reduce((sum, p) => sum + Number(p.amount || 0), 0));
  }
  const maxTotal = Math.max(1, ...monthTotals);
  const bars = monthNames.map((month, index) => `
    <div class="chart-column" title="${safe(month)}: ${money(monthTotals[index])}">
      <div class="chart-bar" style="height:${Math.max(4, monthTotals[index] / maxTotal * 88)}%"></div>
      <small>${safe(month)}</small>
    </div>`).join("");
  const renewalProgress = db.renewals.length
    ? Math.round(db.renewals.filter(r => r.status === "Renewed").length / db.renewals.length * 100) : 0;
  const recentRows = recent.map(p => `<tr>
    <td><div class="cell-main">${safe(policyName(p.policyId))}</div></td>
    <td>${money(p.amount)}</td>
    <td>${formatDate(p.paidDate || p.dueDate)}</td>
    <td><span class="badge ${statusClass(p.status)}">${safe(p.status)}</span></td>
  </tr>`).join("");
  const renewalRows = upcoming.map(r => `<tr>
    <td><div class="cell-main">${safe(policyName(r.policyId))}</div><div class="cell-sub">${formatDate(r.dueDate)}</div></td>
    <td><span class="badge ${statusClass(r.status)}">${safe(r.status)}</span></td>
    <td><button class="table-action" data-action="edit" data-module="renewals" data-id="${safe(r.id)}">Update</button></td>
  </tr>`).join("");
  return `
    ${pageHeading("Good day, " + (currentUser?.name || "Agent"), "Here is a quick overview of your sample insurance portfolio.",
      `<button class="btn secondary" data-action="export" data-module="clients">Export clients CSV</button>`)}
    <div class="stats-grid">
      ${statCard("Total clients", db.clients.length, "♙", "Client profiles")}
      ${statCard("Active policies", activePolicies, "▤", "Currently active")}
      ${statCard("Premiums collected", money(paidTotal), "₹", "Paid demo records")}
      ${statCard("Outstanding premiums", money(dueTotal), "◷", `${overdue.length} overdue record(s)`)}
    </div>
    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-head"><div><h2>Premium collection</h2><p>Paid premiums by month</p></div><span class="badge active">6 months</span></div>
        <div class="chart">${bars}</div>
        <div class="chart-legend"><span><i class="legend-dot"></i>Collected premiums</span><strong>${money(paidTotal)}</strong></div>
      </section>
      <section class="panel">
        <div class="panel-head"><div><h2>Portfolio snapshot</h2><p>Progress of your current demo data</p></div></div>
        <div class="progress-row"><div class="progress-label"><span>Renewals completed</span><strong>${renewalProgress}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${renewalProgress}%"></div></div></div>
        <div class="progress-row"><div class="progress-label"><span>Lead conversion</span><strong>${db.leads.length ? Math.round(converted / db.leads.length * 100) : 0}%</strong></div><div class="progress-track"><div class="progress-fill" style="width:${db.leads.length ? converted / db.leads.length * 100 : 0}%"></div></div></div>
        <div class="progress-row"><div class="progress-label"><span>Overdue premiums</span><strong>${overdue.length}</strong></div><div class="progress-track"><div class="progress-fill" style="width:${db.premiums.length ? Math.min(100, overdue.length / db.premiums.length * 100) : 0}%;background:linear-gradient(90deg,#fca5a5,#dc2626)"></div></div></div>
      </section>
    </div>
    <section class="panel" style="margin-bottom:20px">
      <div class="panel-head"><div><h2>Quick actions</h2><p>Jump directly to a workflow</p></div></div>
      <div class="quick-grid">
        <button class="quick-btn" data-action="navigate" data-page="clients"><span>♙</span><strong>Manage clients</strong></button>
        <button class="quick-btn" data-action="navigate" data-page="policies"><span>▤</span><strong>Add policy</strong></button>
        <button class="quick-btn" data-action="navigate" data-page="premiums"><span>₹</span><strong>Track premium</strong></button>
        <button class="quick-btn" data-action="navigate" data-page="renewals"><span>↻</span><strong>Renewals</strong></button>
        <button class="quick-btn" data-action="navigate" data-page="leads"><span>♧</span><strong>Manage leads</strong></button>
        <button class="quick-btn" data-action="navigate" data-page="reports"><span>▥</span><strong>View reports</strong></button>
      </div>
    </section>
    <div class="dashboard-grid">
      <section class="panel"><div class="panel-head"><div><h2>Recent premium records</h2><p>Latest activity in this browser</p></div><button class="btn secondary small" data-action="navigate" data-page="premiums">View all</button></div>
        <div class="table-wrap"><table><thead><tr><th>Policy / client</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead><tbody>${recentRows || `<tr><td colspan="4" class="empty-state">No premium records yet.</td></tr>`}</tbody></table></div>
      </section>
      <section class="panel"><div class="panel-head"><div><h2>Upcoming renewals</h2><p>Next renewal follow-ups</p></div><button class="btn secondary small" data-action="navigate" data-page="renewals">View all</button></div>
        <div class="table-wrap"><table><thead><tr><th>Policy</th><th>Status</th><th>Action</th></tr></thead><tbody>${renewalRows || `<tr><td colspan="3" class="empty-state">No upcoming renewals.</td></tr>`}</tbody></table></div>
      </section>
    </div>`;
}

function displayValue(module, record, key) {
  const value = record[key];
  if (value === undefined || value === null || value === "") return "—";
  if (key === "clientId") return clientName(value);
  if (key === "policyId") return safe(policyName(value));
  if (["premium", "sumAssured", "amount"].includes(key)) return money(value);
  if (["startDate", "endDate", "dueDate", "paidDate", "followUp", "date"].includes(key)) return formatDate(value);
  if (key === "medicalHistory" || key === "notes" || key === "address") {
    const str = String(value);
    return safe(str.length > 55 ? str.slice(0, 52) + "..." : str);
  }
  if (key === "status") return `<span class="badge ${statusClass(value)}">${safe(value)}</span>`;
  return safe(value);
}

function moduleRecords(module) {
  const info = moduleInfo[module];
  let records = [...db[info.key]];
  if (module === "premiums") {
    records = records.map(p => isOverdue(p) ? { ...p, status: "Overdue" } : p);
  }
  const query = activeSearch.trim().toLowerCase();
  if (query) {
    records = records.filter(record => {
      const combined = Object.entries(record).map(([key, value]) => {
        if (key === "clientId") return clientName(value);
        if (key === "policyId") return policyName(value);
        return String(value ?? "");
      }).join(" ").toLowerCase();
      return combined.includes(query);
    });
  }
  if (activeFilter !== "all") {
    records = records.filter(record => {
      if (module === "premiums") return (isOverdue(record) ? "Overdue" : record.status) === activeFilter;
      return record.status === activeFilter;
    });
  }
  return records;
}

function filterOptions(module) {
  const values = [...new Set(db[moduleInfo[module].key].map(record =>
    module === "premiums" && isOverdue(record) ? "Overdue" : record.status
  ).filter(Boolean))];
  return `<option value="all">All statuses</option>` + values.map(value =>
    `<option value="${safe(value)}" ${activeFilter === value ? "selected" : ""}>${safe(value)}</option>`
  ).join("");
}

function renderModule(module) {
  const info = moduleInfo[module];
  const records = moduleRecords(module);
  const addButton = `<button class="btn primary" data-action="add" data-module="${module}">+ Add ${module === "premiums" ? "premium record" : module === "claims" ? "claim" : module === "leads" ? "lead" : module === "renewals" ? "renewal" : module.slice(0, -1)}</button>`;
  const tools = `<div class="toolbar"><input id="searchInput" type="search" placeholder="Search records..." value="${safe(activeSearch)}" aria-label="Search records">
    <select id="filterSelect" aria-label="Filter by status">${filterOptions(module)}</select>
    <button class="btn secondary" data-action="export" data-module="${module}">Export CSV</button></div>`;
  const header = info.columns.map(([, label]) => `<th>${safe(label)}</th>`).join("");
  const rows = records.map(record => {
    const cells = info.columns.map(([key]) => `<td>${displayValue(module, record, key)}</td>`).join("");
    let extra = "";
    if (module === "premiums" && record.status !== "Paid") {
      extra += `<button class="table-action" data-action="mark-paid" data-id="${safe(record.id)}">Mark paid</button>`;
    }
    if (module === "leads" && record.status !== "Converted" && record.status !== "Lost") {
      extra += `<button class="table-action" data-action="convert-lead" data-id="${safe(record.id)}">Convert</button>`;
    }
    if (module === "renewals" && record.status !== "Renewed" && record.status !== "Not Renewing") {
      extra += `<button class="table-action" data-action="complete-renewal" data-id="${safe(record.id)}">Complete</button>`;
    }
    if (module === "policies") {
      extra += `<button class="table-action" data-action="upload-doc" data-id="${safe(record.id)}">Document</button>`;
      if (record.documentName) extra += `<span class="badge active" title="${safe(record.documentName)}">File saved</span>`;
    }
    extra += `<button class="table-action" data-action="edit" data-module="${module}" data-id="${safe(record.id)}">Edit</button>`;
    extra += `<button class="table-action delete" data-action="delete" data-module="${module}" data-id="${safe(record.id)}">Delete</button>`;
    return `<tr>${cells}<td><div class="actions">${extra}</div></td></tr>`;
  }).join("");
  return `${pageHeading(info.title, info.subtitle, addButton)}
    ${module === "premiums" ? `<div class="notice">Payment actions are simulated for this demo. Marking a record paid does not process a real transaction.</div>` : ""}
    ${module === "policies" ? `<div class="notice">Policy document uploads are stored in this browser for demo purposes only. Do not upload real client documents.</div>` : ""}
    ${module === "claims" ? `<div class="notice">Use sample data only. This demo is not connected to LIC claims systems.</div>` : ""}
    <section class="panel">${tools}<div class="table-wrap"><table><thead><tr>${header}<th>Actions</th></tr></thead>
    <tbody>${rows || `<tr><td colspan="${info.columns.length + 1}" class="empty-state">No matching records. Use “Add” to create one.</td></tr>`}</tbody></table></div>
    <p class="muted" style="font-size:11px;margin:15px 0 0">Showing ${records.length} record(s) · Saved in this browser</p></section>`;
}

function renderCommissions() {
  const total = db.commissions.reduce((sum, item) => sum + Number(item.commission || 0), 0);
  const rates = [
    ["Year 1", "25%"], ["Year 2", "15%"], ["Years 3–5", "10%"], ["Renewal", "5%"]
  ];
  const rows = db.commissions.slice().reverse().map(item => `<tr>
    <td>${safe(item.policyNumber || "—")}</td><td>${safe(item.clientName || "—")}</td>
    <td>${safe(item.period)}</td><td>${money(item.premium)}</td>
    <td>${safe(item.rate)}%</td><td><strong>${money(item.commission)}</strong></td>
    <td><button class="table-action delete" data-action="delete-commission" data-id="${safe(item.id)}">Delete</button></td>
  </tr>`).join("");
  return `${pageHeading("Commission Calculator", "Estimate commission using the rates specified in your assignment.",
    `<button class="btn secondary" data-action="export" data-module="commissions">Export CSV</button>`)}
    <div class="notice">Rates used for this academic demo: Year 1 = 25%, Year 2 = 15%, Years 3–5 = 10%, renewal = 5%. These are assignment-provided sample rates, not a guarantee of actual LIC compensation.</div>
    <div class="stats-grid">
      ${statCard("Estimated commission", money(total), "％", "Saved calculations")}
      ${statCard("Calculations", db.commissions.length, "▤", "Stored in this browser")}
      ${statCard("Active policies", db.policies.filter(p => p.status === "Active").length, "✓", "Current demo portfolio")}
      ${statCard("Commission rate", "5–25%", "₹", "Depends on selected period")}
    </div>
    <section class="panel" style="margin-bottom:20px"><div class="panel-head"><div><h2>Calculate commission</h2><p>Choose a policy and commission period.</p></div></div>
      <form id="commissionForm">
        <div class="form-grid">
          <div class="form-field"><label for="commissionPolicy">Policy</label><select id="commissionPolicy" required>
            <option value="">Select policy</option>${db.policies.map(p => `<option value="${safe(p.id)}">${safe(p.policyNumber)} · ${safe(clientName(p.clientId))}</option>`).join("")}
          </select></div>
          <div class="form-field"><label for="commissionPremium">Premium amount (₹)</label><input id="commissionPremium" type="number" min="0" step="0.01" required></div>
          <div class="form-field"><label for="commissionPeriod">Commission period</label><select id="commissionPeriod" required>
            <option value="1">Year 1 (25%)</option><option value="2">Year 2 (15%)</option>
            <option value="3">Years 3–5 (10%)</option><option value="renewal">Renewal (5%)</option>
          </select></div>
          <div class="form-field"><label for="commissionRate">Rate</label><input id="commissionRate" value="25%" readonly></div>
        </div>
        <div class="modal-actions" style="border:0"><button class="btn primary" type="submit">Calculate and save</button></div>
      </form>
      <div id="commissionPreview" class="notice hidden"></div>
    </section>
    <section class="panel"><div class="panel-head"><div><h2>Calculation history</h2><p>Previously saved estimates</p></div></div>
      <div class="table-wrap"><table><thead><tr><th>Policy</th><th>Client</th><th>Period</th><th>Premium</th><th>Rate</th><th>Commission</th><th>Action</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="7" class="empty-state">No calculations yet.</td></tr>`}</tbody></table></div>
    </section>`;
}

function renderReports() {
  const totalPremium = db.premiums.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const paidPremium = db.premiums.filter(p => p.status === "Paid").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const outstanding = db.premiums.filter(p => p.status !== "Paid").reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const commission = db.commissions.reduce((sum, c) => sum + Number(c.commission || 0), 0);
  const activePolicies = db.policies.filter(p => p.status === "Active").length;
  const converted = db.leads.filter(l => l.status === "Converted").length;
  const leadRate = db.leads.length ? Math.round(converted / db.leads.length * 100) : 0;
  const claimOpen = db.claims.filter(c => ["Open", "In Progress"].includes(c.status)).length;
  const reportRows = [
    ["Total clients", db.clients.length],
    ["Total policies", db.policies.length],
    ["Active policies", activePolicies],
    ["Total premium records", db.premiums.length],
    ["Premium amount recorded", money(totalPremium)],
    ["Premium collected (marked paid)", money(paidPremium)],
    ["Outstanding premium amount", money(outstanding)],
    ["Estimated commission", money(commission)],
    ["Lead conversion rate", `${leadRate}%`],
    ["Open / in-progress claims", claimOpen]
  ];
  return `${pageHeading("Performance Reports", "A summary of the data currently stored in your browser.",
    `<button class="btn secondary" data-action="export-report">Export report CSV</button><button class="btn primary" data-action="print-report">Print / Save PDF</button>`)}
    <div class="notice">Report figures are calculated from demo records. “Print / Save PDF” opens your browser's print dialog; choose “Save as PDF” if available.</div>
    <div class="report-grid">
      <section class="panel"><p class="muted">Premium collected</p><div class="report-number">${money(paidPremium)}</div><p class="muted">Records marked as paid</p></section>
      <section class="panel"><p class="muted">Outstanding premiums</p><div class="report-number">${money(outstanding)}</div><p class="muted">Due and overdue records</p></section>
      <section class="panel"><p class="muted">Lead conversion</p><div class="report-number">${leadRate}%</div><p class="muted">${converted} converted of ${db.leads.length} leads</p></section>
      <section class="panel"><p class="muted">Estimated commission</p><div class="report-number">${money(commission)}</div><p class="muted">Based on saved demo calculations</p></section>
    </div>
    <section class="panel" style="margin-top:18px"><div class="panel-head"><div><h2>Portfolio summary</h2><p>Current data snapshot</p></div></div>
      ${reportRows.map(([label, value]) => `<div class="report-line"><span>${safe(label)}</span><strong>${safe(value)}</strong></div>`).join("")}
    </section>`;
}

function buildField(field, record) {
  const [name, label, type, required] = field;
  const value = record?.[name] ?? "";
  const full = type === "textarea" || ["medicalHistory", "address", "notes"].includes(name);
  let control = "";
  if (type === "textarea") {
    control = `<textarea id="field-${name}" name="${name}" ${required ? "required" : ""}>${safe(value)}</textarea>`;
  } else if (optionSets[type]) {
    const options = optionSets[type]();
    control = `<select id="field-${name}" name="${name}" ${required ? "required" : ""}>
      <option value="">Select ${safe(label.toLowerCase())}</option>
      ${options.map(([v, text]) => `<option value="${safe(v)}" ${String(value) === String(v) ? "selected" : ""}>${safe(text)}</option>`).join("")}
    </select>`;
  } else {
    const inputType = ["text", "email", "tel", "number", "date"].includes(type) ? type : "text";
    const min = inputType === "number" ? 'min="0" step="any"' : "";
    control = `<input id="field-${name}" name="${name}" type="${inputType}" value="${safe(value)}" ${min} ${required ? "required" : ""}>`;
  }
  return `<div class="form-field ${full ? "full-width" : ""}"><label for="field-${name}">${safe(label)}${required ? " *" : ""}</label>${control}</div>`;
}

function openRecordModal(module, id = null) {
  const info = moduleInfo[module];
  if (!info) return;
  if (["policies", "premiums", "renewals", "claims"].includes(module) &&
      db[module === "policies" ? "clients" : module === "claims" ? "policies" : "policies"].length === 0) {
    showToast(module === "policies" ? "Add a client first." : "Add a policy first.");
    return;
  }
  editingRecord = { module, id };
  const record = id ? db[info.key].find(item => item.id === id) : null;
  $("#modalTitle").textContent = `${id ? "Edit" : "Add"} ${info.title.replace(" Management", "").replace(" Tracking", "").replace("s", "")}`;
  $("#formFields").innerHTML = info.fields.map(field => buildField(field, record)).join("");
  $("#modal").classList.remove("hidden");
  const first = $("#formFields input, #formFields select, #formFields textarea");
  if (first) first.focus();
}
function closeModal() {
  $("#modal").classList.add("hidden");
  $("#recordForm").reset();
  editingRecord = null;
}

function saveRecord(event) {
  event.preventDefault();
  if (!editingRecord) return;
  const { module, id } = editingRecord;
  const info = moduleInfo[module];
  const formData = new FormData(event.currentTarget);
  const record = {};
  info.fields.forEach(([name, , type]) => {
    let value = formData.get(name);
    if (value === null) value = "";
    if (type === "number") value = value === "" ? 0 : Number(value);
    record[name] = value;
  });
  if (module === "policies" && new Date(record.endDate) < new Date(record.startDate)) {
    showToast("End date cannot be earlier than start date.");
    return;
  }
  if (module === "clients" && record.phone && !/^[+\d\s()-]{7,20}$/.test(record.phone)) {
    showToast("Please check the phone number.");
    return;
  }
  if (module === "policies" && db.policies.some(p => p.policyNumber.toLowerCase() === record.policyNumber.toLowerCase() && p.id !== id)) {
    showToast("That policy number already exists.");
    return;
  }
  if (id) {
    const index = db[info.key].findIndex(item => item.id === id);
    if (index >= 0) db[info.key][index] = { ...db[info.key][index], ...record };
  } else {
    record.id = nextId(info.key, {
      clients: "C", policies: "P", premiums: "PM", renewals: "R", claims: "CL", leads: "L"
    }[info.key] || "REC");
    if (module === "policies") record.documentName = "";
    db[info.key].push(record);
  }
  if (module === "policies") ensurePolicyRelatedRecords(db.policies.find(p => p.id === record.id) || record);
  saveDB();
  closeModal();
  renderPage(module);
  showToast(id ? "Record updated successfully." : "Record added successfully.");
}

function ensurePolicyRelatedRecords(policy) {
  if (!policy?.id) return;
  const exists = db.renewals.some(r => r.policyId === policy.id);
  if (!exists && policy.endDate) {
    db.renewals.push({
      id: nextId("renewals", "R"), policyId: policy.id,
      dueDate: policy.endDate, status: "Upcoming", notes: "Auto-created from policy end date"
    });
  }
}

function handlePageAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const module = button.dataset.module;
  const id = button.dataset.id;
  if (action === "navigate") return renderPage(button.dataset.page);
  if (action === "add") return openRecordModal(module);
  if (action === "edit") return openRecordModal(module, id);
  if (action === "delete") return deleteRecord(module, id);
  if (action === "export") return exportCSV(module);
  if (action === "mark-paid") return markPaid(id);
  if (action === "convert-lead") return convertLead(id);
  if (action === "complete-renewal") return completeRenewal(id);
  if (action === "upload-doc") {
    selectedUploadPolicy = id;
    $("#documentInput").click();
    return;
  }
  if (action === "delete-commission") {
    if (confirm("Delete this saved commission calculation?")) {
      db.commissions = db.commissions.filter(c => c.id !== id);
      saveDB();
      renderPage("commissions");
      showToast("Calculation deleted.");
    }
    return;
  }
  if (action === "export-report") return exportReport();
  if (action === "print-report") return window.print();
}

function deleteRecord(module, id) {
  const info = moduleInfo[module];
  if (!info) return;
  const record = db[info.key].find(item => item.id === id);
  if (!record) return;
  const displayName = record.name || record.policyNumber || record.claimNumber || record.id;
  if (!confirm(`Delete "${displayName}"? Related records may remain in this demo.`)) return;
  db[info.key] = db[info.key].filter(item => item.id !== id);
  saveDB();
  renderPage(module);
  showToast("Record deleted.");
}

function markPaid(id) {
  const premium = db.premiums.find(p => p.id === id);
  if (!premium) return;
  if (!confirm(`Mark ${money(premium.amount)} as paid? This only updates the demo record; no real payment will be processed.`)) return;
  premium.status = "Paid";
  premium.paidDate = today();
  if (!premium.method) premium.method = "Other";
  if (!premium.reference) premium.reference = "DEMO-" + Date.now().toString().slice(-7);
  saveDB();
  renderPage("premiums");
  showToast("Demo payment marked as paid.");
}

function convertLead(id) {
  const lead = db.leads.find(item => item.id === id);
  if (!lead) return;
  if (!confirm(`Convert ${lead.name} into a client profile?`)) return;
  const existing = db.clients.find(c => c.phone === lead.phone);
  if (!existing) {
    db.clients.push({
      id: nextId("clients", "C"), name: lead.name, phone: lead.phone,
      email: lead.email || "", address: "", nominee: "", medicalHistory: ""
    });
  }
  lead.status = "Converted";
  saveDB();
  renderPage("leads");
  showToast(existing ? "Lead marked converted; matching client already exists." : "Lead converted to a client.");
}

function completeRenewal(id) {
  const renewal = db.renewals.find(item => item.id === id);
  if (!renewal) return;
  if (!confirm("Mark this renewal as completed in the demo?")) return;
  renewal.status = "Renewed";
  const policy = db.policies.find(p => p.id === renewal.policyId);
  if (policy) {
    const end = new Date(`${policy.endDate}T00:00:00`);
    if (!Number.isNaN(end.getTime())) {
      end.setFullYear(end.getFullYear() + 1);
      policy.endDate = end.toISOString().slice(0, 10);
    }
  }
  saveDB();
  renderPage("renewals");
  showToast("Renewal marked completed.");
}

function handleDocumentUpload(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file || !selectedUploadPolicy) return;
  if (file.size > 1024 * 1024) {
    showToast("For this demo, choose a file smaller than 1 MB.");
    return;
  }
  const policy = db.policies.find(p => p.id === selectedUploadPolicy);
  if (!policy) return;
  const reader = new FileReader();
  reader.onload = () => {
    policy.documentName = file.name;
    policy.documentData = String(reader.result || "");
    saveDB();
    renderPage("policies");
    showToast("Demo document saved in this browser.");
  };
  reader.onerror = () => showToast("Could not read this file.");
  reader.readAsDataURL(file);
  selectedUploadPolicy = null;
}

function checkReminders() {
  normalizePremiumStatuses();
  const duePremiums = db.premiums.filter(p => p.status !== "Paid" && p.dueDate <= dateOffset(7));
  const renewals = db.renewals.filter(r => !["Renewed", "Not Renewing"].includes(r.status) && r.dueDate <= dateOffset(30));
  const leads = db.leads.filter(l => l.followUp && l.followUp <= dateOffset(3) && !["Converted", "Lost"].includes(l.status));
  const messages = [];
  if (duePremiums.length) messages.push(`${duePremiums.length} premium payment(s) due or overdue`);
  if (renewals.length) messages.push(`${renewals.length} renewal(s) due within 30 days`);
  if (leads.length) messages.push(`${leads.length} lead follow-up(s) due soon`);
  const summary = messages.length ? messages.join("\n") : "No upcoming demo reminders found.";
  alert("AgentPro Reminder Summary\n\n" + summary + "\n\nThese are on-screen demo reminders, not emails or messages sent to clients.");
  db.notifications.unshift({ id: uid("N"), date: today(), message: summary });
  db.notifications = db.notifications.slice(0, 50);
  saveDB();
  updateReminderCount();
}
function updateReminderCount() {
  const count = db.premiums.filter(p => p.status !== "Paid" && p.dueDate <= dateOffset(7)).length
    + db.renewals.filter(r => !["Renewed", "Not Renewing"].includes(r.status) && r.dueDate <= dateOffset(30)).length;
  $("#reminderCount").textContent = count;
}

$("#pageContent").addEventListener("change", event => {
  if (event.target.id === "commissionPolicy") {
    const policy = db.policies.find(p => p.id === event.target.value);
    if (policy) $("#commissionPremium").value = policy.premium;
  }
  if (event.target.id === "commissionPeriod") {
    $("#commissionRate").value = ({ "1": "25%", "2": "15%", "3": "10%", renewal: "5%" })[event.target.value] || "25%";
  }
});
$("#pageContent").addEventListener("submit", event => {
  if (event.target.id !== "commissionForm") return;
  event.preventDefault();
  const policy = db.policies.find(p => p.id === $("#commissionPolicy").value);
  const premium = Number($("#commissionPremium").value);
  const period = $("#commissionPeriod").value;
  if (!policy || !Number.isFinite(premium) || premium < 0) {
    showToast("Select a policy and enter a valid premium.");
    return;
  }
  const rates = { "1": 25, "2": 15, "3": 10, renewal: 5 };
  const rate = rates[period];
  const item = {
    id: uid("COM"), policyId: policy.id, policyNumber: policy.policyNumber,
    clientName: clientName(policy.clientId),
    period: period === "renewal" ? "Renewal" : period === "3" ? "Years 3–5" : `Year ${period}`,
    premium, rate, commission: Math.round(premium * rate) / 100
  };
  db.commissions.push(item);
  saveDB();
  renderPage("commissions");
  showToast(`Estimated commission: ${money(item.commission)}`);
});

function csvCell(value) {
  const str = String(value ?? "");
  return `"${str.replace(/"/g, '""')}"`;
}
function downloadCSV(filename, rows) {
  if (!rows.length) {
    showToast("No data available to export.");
    return;
  }
  const csv = rows.map(row => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("CSV export prepared.");
}
function exportCSV(module) {
  let records;
  if (module === "commissions") records = db.commissions;
  else if (moduleInfo[module]) records = db[moduleInfo[module].key];
  else return;
  if (!records.length) return showToast("No records available to export.");
  const rows = [Object.keys(records[0])];
  records.forEach(record => rows.push(Object.values(record).map(value => typeof value === "object" ? JSON.stringify(value) : value)));
  downloadCSV(`agentpro-${module}-${today()}.csv`, rows);
}
function exportReport() {
  const rows = [
    ["Metric", "Value"],
    ["Total clients", db.clients.length],
    ["Total policies", db.policies.length],
    ["Active policies", db.policies.filter(p => p.status === "Active").length],
    ["Premium records", db.premiums.length],
    ["Premium collected", db.premiums.filter(p => p.status === "Paid").reduce((s, p) => s + Number(p.amount || 0), 0)],
    ["Outstanding premium", db.premiums.filter(p => p.status !== "Paid").reduce((s, p) => s + Number(p.amount || 0), 0)],
    ["Estimated commission", db.commissions.reduce((s, c) => s + Number(c.commission || 0), 0)],
    ["Total leads", db.leads.length],
    ["Converted leads", db.leads.filter(l => l.status === "Converted").length],
    ["Open claims", db.claims.filter(c => ["Open", "In Progress"].includes(c.status)).length]
  ];
  downloadCSV(`agentpro-performance-report-${today()}.csv`, rows);
}

function resetDemoData() {
  if (!confirm("This will permanently reset the AgentPro demo records in this browser. Continue?")) return;
  db = seedData();
  saveDB();
  renderPage(currentPage);
  showToast("Demo data reset.");
}

/* Start with the existing demo session, or show the login page. */
const savedUser = getUser();
if (savedUser && savedUser.email && savedUser.role) {
  startSession(savedUser);
} else {
  $("#authScreen").classList.remove("hidden");
  $("#app").classList.add("hidden");
  setAuthMode("login");
}
