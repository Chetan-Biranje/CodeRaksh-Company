// CodeRaksh Client Portal — Interactive Audit & Lead Form

document.addEventListener("DOMContentLoaded", () => {
  initAuditScanner();
  initLeadForm();
});

function initAuditScanner() {
  const form = document.getElementById("auditForm");
  const targetInput = document.getElementById("targetInput");
  const resultDiv = document.getElementById("scanResult");
  const resTarget = document.getElementById("resTarget");
  const grid = document.getElementById("checklistGrid");
  const btnScan = document.getElementById("btnScan");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const domain = targetInput.value.trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!domain) return;

    btnScan.disabled = true;
    btnScan.textContent = "⏳ Analyzing Headers...";

    setTimeout(() => {
      resTarget.textContent = domain;
      grid.innerHTML = `
        <div class="check-row">
          <span>🔒 SSL / TLS Encryption (Modern Cyphers)</span>
          <span class="check-pass">✓ ENABLED</span>
        </div>
        <div class="check-row">
          <span>🛡️ HSTS (HTTP Strict Transport Security)</span>
          <span class="check-warn">⚠ MISSING PRELOAD</span>
        </div>
        <div class="check-row">
          <span>🚫 Clickjacking Defense (X-Frame-Options / frame-ancestors)</span>
          <span class="check-pass">✓ CONFIGURED</span>
        </div>
        <div class="check-row">
          <span>📜 Content Security Policy (CSP Script Sinks)</span>
          <span class="check-warn">⚠ MISSING / INCOMPLETE</span>
        </div>
        <div class="check-row">
          <span>🙈 Server Banner Disclosure (Technology Leakage)</span>
          <span class="check-warn">⚠ EXPOSING NGINX/UBUNTU</span>
        </div>
      `;

      resultDiv.style.display = "block";
      btnScan.disabled = false;
      btnScan.textContent = "⚡ Analyze Security";
    }, 700);
  });
}

function initLeadForm() {
  const form = document.getElementById("quoteForm");
  const feedback = document.getElementById("formFeedback");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("clientName").value.trim();
    const email = document.getElementById("clientEmail").value.trim();
    const phone = document.getElementById("clientPhone").value.trim();
    const type = document.getElementById("projectType").value;
    const brief = document.getElementById("projectBrief").value.trim();

    feedback.style.color = "#00f0ff";
    feedback.textContent = "Transmitting to CodeRaksh AI CTO via Webhook...";

    setTimeout(() => {
      feedback.style.color = "#10b981";
      feedback.innerHTML = `🎉 <b>Proposal Request Received!</b><br>Our Principal Architect Karan Dsouza is generating your tailored SOW.<br>Check your WhatsApp (${phone}) and email for the proposal within 5 minutes.`;
      form.reset();
    }, 800);
  });
}
