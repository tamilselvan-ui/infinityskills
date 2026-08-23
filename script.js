/* ==========================================================================
   AI MASTERY 2026 — shared behaviour
   ========================================================================== */

const STORAGE_KEY = "aimastery2026_registration";
const ALL_REGISTRATIONS_KEY = "aimastery2026_all_registrations";

/* ---------------- Nav scroll state ---------------- */
(function initNav() {
  const nav = document.querySelector(".nav");
  if (!nav) return;
  const onScroll = () => {
    nav.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
})();

/* ---------------- FAQ accordion ---------------- */
(function initFaq() {
  const items = document.querySelectorAll(".faq-item");
  items.forEach((item) => {
    const q = item.querySelector(".faq-q");
    if (!q) return;
    q.addEventListener("click", () => {
      const wasOpen = item.classList.contains("is-open");
      items.forEach((i) => i.classList.remove("is-open"));
      if (!wasOpen) item.classList.add("is-open");
    });
  });
})();

/* ---------------- Storage helpers ---------------- */
function saveRegistrationToStorage(record) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch (e) {
    console.warn("Could not persist registration locally:", e);
  }
}

// Appends to a running log of every registration made on THIS browser.
// Note: localStorage is scoped per browser/device — this log only ever
// contains registrations submitted from this same device, not a global
// list of every registrant across all visitors.
function appendToRegistrationLog(record) {
  try {
    const raw = localStorage.getItem(ALL_REGISTRATIONS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    list.push({ ...record, submittedAt: new Date().toISOString() });
    localStorage.setItem(ALL_REGISTRATIONS_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Could not append to registration log:", e);
  }
}

function loadRegistrationFromStorage() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/* ---------------- Registration ID ---------------- */
function generateRegistrationId() {
  const time = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `INF-AI26-${time}${rand}`;
}

/* ==========================================================================
   REGISTER PAGE
   ========================================================================== */
(function initRegisterForm() {
  const form = document.getElementById("registerForm");
  if (!form) return;

  const submitBtn = document.getElementById("submitBtn");
  const errorBanner = document.getElementById("formErrorBanner");

  const fields = {
    fullName: { el: form.fullName, validate: (v) => v.trim().length >= 2, msg: "Please enter your full name." },
    email: { el: form.email, validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()), msg: "Please enter a valid email address." },
    whatsapp: { el: form.whatsapp, validate: (v) => /^[0-9+\s-]{8,15}$/.test(v.trim()), msg: "Please enter a valid WhatsApp number." },
    school: { el: form.school, validate: (v) => v.trim().length >= 2, msg: "Please enter your school or college." },
    classYear: { el: form.classYear, validate: (v) => v.trim().length >= 1, msg: "Please enter your class or year." },
    city: { el: form.city, validate: (v) => v.trim().length >= 2, msg: "Please enter your city." }
  };

  function showFieldError(key, show) {
    const fieldEl = fields[key].el.closest(".field");
    if (fieldEl) fieldEl.classList.toggle("has-error", show);
  }

  function validateAll() {
    let valid = true;
    for (const key in fields) {
      const { el, validate } = fields[key];
      const ok = validate(el.value || "");
      showFieldError(key, !ok);
      if (!ok) valid = false;
    }
    return valid;
  }

  // Live-clear errors as the user types, and keep the summary preview updated
  Object.keys(fields).forEach((key) => {
    fields[key].el.addEventListener("input", () => {
      showFieldError(key, false);
      updateLiveSummary();
    });
  });

  function updateLiveSummary() {
    const nameEl = document.getElementById("summaryName");
    if (nameEl) nameEl.textContent = form.fullName.value.trim() || "—";
  }
  updateLiveSummary();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (errorBanner) errorBanner.classList.remove("show");

    if (!validateAll()) {
      const firstError = form.querySelector(".has-error input, .has-error select, .has-error textarea");
      if (firstError) firstError.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting…';

    const values = {
      fullName: form.fullName.value.trim(),
      email: form.email.value.trim(),
      whatsapp: form.whatsapp.value.trim(),
      school: form.school.value.trim(),
      classYear: form.classYear.value.trim(),
      city: form.city.value.trim(),
      message: form.message ? form.message.value.trim() : ""
    };

    // No backend involved — the registration ID is generated right here,
    // and the details travel straight to WhatsApp on the next screen.
    const record = {
      registrationId: generateRegistrationId(),
      ...values,
      program: "AI Mastery 2026",
      amount: 39,
      paymentStatus: "pending"
    };
    saveRegistrationToStorage(record);
    appendToRegistrationLog(record);
    window.location.href = "payment.html";
  });
})();

/* ==========================================================================
   PAYMENT PAGE
   ========================================================================== */
(function initPaymentPage() {
  const mount = document.getElementById("paymentSummary");
  if (!mount) return;

  const record = loadRegistrationFromStorage();
  const emptyState = document.getElementById("noRegistrationState");
  const filledState = document.getElementById("paymentFilledState");

  if (!record) {
    if (emptyState) emptyState.style.display = "block";
    if (filledState) filledState.style.display = "none";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  if (filledState) filledState.style.display = "block";

  document.getElementById("payRegId").textContent = record.registrationId;
  document.getElementById("payName").textContent = record.fullName;
  document.getElementById("payEmail").textContent = record.email;

  // WhatsApp destination: +91 93844 90973
  const WHATSAPP_NUMBER = "919384490973";

  function buildWhatsappMessage() {
    const lines = [
      "AI Mastery 2026 Registration",
      "",
      `Name: ${record.fullName}`,
      `Registration ID: ${record.registrationId}`,
      `Email: ${record.email}`,
      `WhatsApp: ${record.whatsapp}`,
      `School/College: ${record.school}`,
      `Class/Year: ${record.classYear}`,
      `City: ${record.city}`
    ];
    if (record.message) lines.push(`Message: ${record.message}`);
    lines.push("", "Program: AI Mastery 2026", "Registration Fee: ₹39", "Registration Status: Verification Pending");
    return lines.join("\n");
  }

  const sendBtn = document.getElementById("sendWhatsappBtn");
  const completedBtn = document.getElementById("completedPaymentBtn");

  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      const text = encodeURIComponent(buildWhatsappMessage());
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener");
      if (completedBtn) {
        completedBtn.style.display = "inline-flex";
        completedBtn.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  if (completedBtn) {
    completedBtn.addEventListener("click", () => {
      // This ONLY navigates to the status page. It never marks
      // registration_status/payment_status as confirmed — that must be
      // verified separately by the Infinity Skills team on WhatsApp.
      window.location.href = "payment-processing.html";
    });
  }
})();

/* ==========================================================================
   PAYMENT PROCESSING PAGE
   ========================================================================== */
(function initProcessingPage() {
  const mount = document.getElementById("processingCard");
  if (!mount) return;

  const record = loadRegistrationFromStorage();
  const emptyState = document.getElementById("noRegistrationStateProcessing");

  if (!record) {
    if (emptyState) emptyState.style.display = "block";
    mount.style.display = "none";
    return;
  }

  document.getElementById("procRegId").textContent = record.registrationId;
  document.getElementById("procEmail").textContent = record.email;
  document.getElementById("procWhatsapp").textContent = record.whatsapp;

  const waBtn = document.getElementById("whatsappContactBtn");
  if (waBtn) {
    const msg = encodeURIComponent(
      `AI Mastery 2026 Registration\n\nName: ${record.fullName}\nRegistration ID: ${record.registrationId}\nAmount: ₹39\nPayment Status: Verification Pending`
    );
    waBtn.href = `https://wa.me/919384490973?text=${msg}`;
  }
})();

/* ---------------- Mobile menu (index/marketing pages) ---------------- */
(function initMobileMenu() {
  const btn = document.querySelector(".nav__menu-btn");
  const links = document.querySelector(".nav__links");
  if (!btn || !links) return;
  btn.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
  });
})();
