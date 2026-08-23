/* ==========================================================================
   AI MASTERY 2026 — Admin dashboard
   --------------------------------------------------------------------------
   NOTE ON SECURITY: this password check runs entirely in the browser.
   It stops casual visitors from poking around, but it is NOT real
   security — anyone who views this file's source can read the password.
   Do not rely on this to protect sensitive data; it only guards data
   that already lives in this same browser's localStorage.
   ========================================================================== */

const ADMIN_PASSWORD = "infinityadmin01";
const ADMIN_SESSION_KEY = "aimastery2026_admin_session";
const ALL_REG_KEY = "aimastery2026_all_registrations";

(function initAdmin() {
  const loginShell = document.getElementById("adminLoginShell");
  const loginForm = document.getElementById("adminLoginForm");
  const loginError = document.getElementById("adminLoginError");
  const panel = document.getElementById("adminPanel");
  if (!loginShell || !panel) return;

  function showPanel() {
    loginShell.style.display = "none";
    panel.style.display = "block";
    renderTable();
  }

  // Stay logged in for this browser tab session only
  if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
    showPanel();
  }

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const entered = document.getElementById("adminPassword").value;
    if (entered === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      loginError.classList.remove("show");
      showPanel();
    } else {
      loginError.textContent = "Incorrect password. Please try again.";
      loginError.classList.add("show");
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    panel.style.display = "none";
    loginShell.style.display = "block";
    document.getElementById("adminPassword").value = "";
  });

  document.getElementById("clearDataBtn").addEventListener("click", () => {
    if (confirm("This permanently deletes every registration stored on this device. Continue?")) {
      localStorage.removeItem(ALL_REG_KEY);
      renderTable();
    }
  });

  document.getElementById("exportCsvBtn").addEventListener("click", exportCsv);
  document.getElementById("adminSearch").addEventListener("input", renderTable);

  function getRegistrations() {
    try {
      const raw = localStorage.getItem(ALL_REG_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function renderTable() {
    const all = getRegistrations().slice().reverse();
    const query = (document.getElementById("adminSearch").value || "").trim().toLowerCase();

    const filtered = query
      ? all.filter((r) =>
          [r.fullName, r.school, r.registrationId, r.city, r.email]
            .filter(Boolean)
            .some((v) => String(v).toLowerCase().includes(query))
        )
      : all;

    const tbody = document.getElementById("adminTableBody");
    const emptyState = document.getElementById("adminEmptyState");
    const table = document.getElementById("adminTable");

    if (filtered.length === 0) {
      tbody.innerHTML = "";
      table.style.display = "none";
      emptyState.style.display = "block";
    } else {
      table.style.display = "table";
      emptyState.style.display = "none";
      tbody.innerHTML = filtered
        .map((r) => {
          const submitted = r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "—";
          return `<tr>
            <td>${escapeHtml(r.registrationId)}</td>
            <td>${escapeHtml(r.fullName)}</td>
            <td>${escapeHtml(r.school)}</td>
            <td>${escapeHtml(r.classYear)}</td>
            <td>${escapeHtml(r.email)}</td>
            <td>${escapeHtml(r.whatsapp)}</td>
            <td>${escapeHtml(r.city)}</td>
            <td>${escapeHtml(r.paymentStatus || "pending")}</td>
            <td>${escapeHtml(submitted)}</td>
          </tr>`;
        })
        .join("");
    }

    // Stats
    document.getElementById("statTotal").textContent = all.length;
    const today = new Date().toDateString();
    document.getElementById("statToday").textContent = all.filter(
      (r) => r.submittedAt && new Date(r.submittedAt).toDateString() === today
    ).length;
    document.getElementById("statPending").textContent = all.filter(
      (r) => (r.paymentStatus || "pending") === "pending"
    ).length;
  }

  function exportCsv() {
    const all = getRegistrations();
    if (all.length === 0) {
      alert("No registrations to export yet.");
      return;
    }
    const headers = [
      "Registration ID", "Full Name", "School/College", "Class/Year",
      "Email", "WhatsApp", "City", "Message", "Program", "Amount",
      "Payment Status", "Submitted At"
    ];
    const rows = all.map((r) => [
      r.registrationId, r.fullName, r.school, r.classYear, r.email,
      r.whatsapp, r.city, r.message || "", r.program, r.amount,
      r.paymentStatus || "pending", r.submittedAt || ""
    ]);

    const csvLines = [headers, ...rows].map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = csvLines.join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-mastery-2026-registrations-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
})();
