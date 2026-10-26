// CodeRaksh Enterprise OS — Client Logic & Simulator

const AGENTS = [
  // Sales
  { id: "01", name: "Rohan Verma", role: "Outbound Lead Specialist", dept: "sales", icon: "🎯", desc: "Scrapes Google Maps for niche businesses every morning and writes personalized email openers." },
  { id: "02", name: "Pooja Sharma", role: "Rapid WhatsApp Specialist", dept: "sales", icon: "💬", desc: "Replies to WhatsApp leads within seconds and asks qualifying intent questions." },
  { id: "03", name: "Aditya Kulkarni", role: "Inbound Deal Qualifier", dept: "sales", icon: "🔥", desc: "Scores form & ad leads into Hot/Warm/Cold and alerts founders on hot buying signals." },
  { id: "04", name: "Kavita Mane", role: "Retention & Repeat Orders", dept: "sales", icon: "🔄", desc: "Monitors client re-order cycles and engages clients proactively before product expiry." },

  // Support
  { id: "05", name: "Ananya Deshmukh", role: "Executive Receptionist", dept: "support", icon: "📅", desc: "Schedules Google Calendar appointments via WhatsApp chat and sends 24h reminders." },
  { id: "06", name: "Vikram Nambiar", role: "Missed-Call Recovery Lead", dept: "support", icon: "📞", desc: "Sends instant friendly WhatsApp follow-ups for every missed call within 5 seconds." },
  { id: "07", name: "Tanvi Patil", role: "Executive Inbox Concierge", dept: "support", icon: "📥", desc: "Reads incoming Gmail, drafts smart contextual responses, and flags urgent client queries." },
  { id: "08", name: "Suresh Rao", role: "24/7 Client Care & FAQ", dept: "support", icon: "🤖", desc: "Answers technical FAQs instantly from knowledge base with human escalation." },

  // Marketing
  { id: "09", name: "Arjun Bhatia", role: "SEO Content Architect", dept: "marketing", icon: "✍️", desc: "Researches competitors, writes high-ranking technical guides, and saves WordPress drafts." },
  { id: "10", name: "Sneha Gokhale", role: "Omnichannel Repurposer", dept: "marketing", icon: "🎥", desc: "Converts 1 video/link into 5 social assets: LinkedIn post, X thread, Shorts hook & newsletter." },
  { id: "11", name: "Meera Trivedi", role: "Brand Reputation Lead", dept: "marketing", icon: "⭐", desc: "Monitors Google Reviews hourly, drafts polite replies, and shields from negative spam." },
  { id: "12", name: "Nikhil Pawar", role: "Review & Feedback Booster", dept: "marketing", icon: "🌟", desc: "Requests Google Reviews from happy clients while routing complaints directly to management." },

  // Finance
  { id: "13", name: "Sunita Kadam", role: "Accounts Payable Analyst", dept: "finance", icon: "🧾", desc: "OCR scans bill PDFs from Gmail and populates vendor, amount, date & tax in Sheets." },
  { id: "14", name: "Dinesh Bapat", role: "Cash Flow & Payment Chaser", dept: "finance", icon: "💸", desc: "Finds overdue invoices nightly and sends tiered reminders (friendly, firm, final notice)." },
  { id: "15", name: "Ritu Sengupta", role: "Bank Reconciliation Specialist", dept: "finance", icon: "🏦", desc: "Parses bank statement PDFs and categorizes income and expense line items." },
  { id: "16", name: "Manish Joshi", role: "GST & Tax Compliance Clerk", dept: "finance", icon: "📊", desc: "Validates GSTINs, calculates CGST/SGST/IGST, and reconciles input tax credit." },

  // Ops
  { id: "17", name: "Preeti Varma", role: "Talent Acquisition Screener", dept: "ops", icon: "👩‍💼", desc: "Scores candidate resumes 0–10 against job descriptions and shortlists top talent." },
  { id: "18", name: "Kunal More", role: "Attendance & Waitlist Manager", dept: "ops", icon: "⏱️", desc: "Confirms appointment attendance via WhatsApp and fills cancellations from waitlists." },
  { id: "19", name: "Deepak Shinde", role: "Statutory Deadline Bot", dept: "ops", icon: "⏳", desc: "Tracks tax, ITR, project, and compliance deadlines with multi-day alerts." },
  { id: "20", name: "Swati Naik", role: "Client KYC & Doc Chaser", dept: "ops", icon: "📁", desc: "Tracks pending client documents and follows up politely until onboarding is complete." },

  // Executive
  { id: "21", name: "Chetan Biranje (AI CEO)", role: "Chief Executive Orchestrator", dept: "exec", icon: "👑", desc: "Synthesizes all 26 agents, calculates Company Health Score, compiles morning/nightly reports." },

  // Cyber & DevSecOps
  { id: "22", name: "Aakash Vaidya", role: "Principal DevSecOps Sentinel", dept: "tech", icon: "🛡️", desc: "Automated PR security gate: secret leak detection, OWASP Top 10 SAST audit, PR comments." },
  { id: "23", name: "Sameer Datar", role: "Autonomous Bug Hunter Lead", dept: "tech", icon: "🎯", desc: "Ingests Nuclei/Burp vulnerabilities, filters false positives, calculates CVSS 4.0, drafts patches." },
  { id: "24", name: "Rohan Bhosale", role: "DevOps SRE & Pipeline Doctor", dept: "tech", icon: "🚑", desc: "Diagnoses CI/CD build crashes, isolates root causes, and generates git fix diffs." },
  { id: "25", name: "Karan Dsouza", role: "Principal Solutions Architect", dept: "tech", icon: "💼", desc: "Turns client RFPs into fullstack architectures, DB schemas, sprint timelines, and SOW quotes." },
  { id: "26", name: "Priyanka Sawant", role: "Corporate Treasury Analyst", dept: "tech", icon: "📈", desc: "Monitors pre-market movements, SEC EDGAR earnings filings, and guards company reserves." }
];

const SKILLS_SAMPLE = [
  { name: "offensive-xss", cat: "Security", desc: "Cross-site scripting detection, stored/reflected sinks, CSP bypasses." },
  { name: "offensive-sqli", cat: "Security", desc: "Error, Union, Blind, Time-based SQLi & SQLMap automation." },
  { name: "offensive-ssrf", cat: "Security", desc: "Server-side request forgery against AWS IMDSv2 and internal clouds." },
  { name: "offensive-idor", cat: "Security", desc: "BOLA & object permission flaws across REST and GraphQL endpoints." },
  { name: "offensive-cicd-pipeline", cat: "DevSecOps", desc: "GitHub Actions expression injection, token overscoping & runner compromise." },
  { name: "offensive-cloud", cat: "Cloud", desc: "AWS/Azure/GCP IAM privilege escalation and container persistence." },
  { name: "ponytail", cat: "Engineering", desc: "Lazy senior dev mode: smallest code changes, zero bloat, high clarity." },
  { name: "gstack", cat: "Fullstack", desc: "Complete engineering review, QA, autoplan, design audit, and shipping suite." },
  { name: "ui-ux-pro-max", cat: "Design", desc: "Design intelligence, accessible color palettes, typography and components." },
  { name: "trader-scanner", cat: "Finance", desc: "Intraday and pre-market technical chart breakout pattern scanner." }
];

const SAMPLE_PAYLOADS = {
  ceo_command: {
    query: "What is our total unpaid invoice amount and show hot leads from today?",
    sender: "Chetan Biranje"
  },
  pr_security: {
    action: "opened",
    pull_request: {
      number: 43,
      title: "Add Stripe webhook checkout handler",
      body: "Initial checkout implementation. Tested locally with test keys."
    },
    repository: { full_name: "CodeRaksh/Payment-Gateway" },
    diff: `+ const stripeKey = 'sk_live_51M0...EXAMPLE_LEAKED_SECRET';\n+ const query = "SELECT * FROM users WHERE email = '" + req.body.email + "'";`
  },
  vuln_ingest: {
    title: "SQL Injection in User Authentication Endpoint",
    target: "https://api.clientapp.com/v1/login",
    severity: "CRITICAL",
    cwe: "CWE-89",
    poc: "POST /v1/login HTTP/1.1\\nUser: admin' OR '1'='1"
  },
  ci_doctor: {
    repo: "CodeRaksh/AI-Orchestrator",
    job: "Run Unit & E2E Tests",
    error_message: "Error: Cannot find module '@anthropic-ai/sdk'\\nRequire stack:\\n- /app/dist/server.js\\nexit code 1"
  },
  freelance_sow: {
    client_name: "FinTech Global UK",
    project_title: "AI Real-Time Transaction Anomaly Detector",
    budget: "$8,000 - $12,000",
    timeline: "6 Weeks",
    description: "We need a microservice that ingests Kafka transaction streams and alerts on credit card fraud in < 200ms using Python/FastAPI and Redis."
  },
  sos_alert: {
    event_type: "CRITICAL_PAYMENT_DEFAULT",
    severity: "P1_EMERGENCY",
    message: "Client AlphaTech overdue by 45 days. Amount: ₹3,50,000. Phone lines unresponsive.",
    name: "AlphaTech Director",
    phone: "+919800000000"
  }
};

// Initialization
document.addEventListener("DOMContentLoaded", () => {
  initClock();
  initNavigation();
  renderAgents("all");
  initAgentFilters();
  initSimulator();
  renderSkills();
  initActionButtons();
});

function initClock() {
  const clockEl = document.getElementById("liveClock");
  function update() {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST";
  }
  update();
  setInterval(update, 1000);
}

function initNavigation() {
  const navBtns = document.querySelectorAll(".nav-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");
  const pageTitle = document.getElementById("pageTitle");

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      navBtns.forEach(b => b.classList.remove("active"));
      tabPanes.forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const target = btn.getAttribute("data-tab");
      document.getElementById(`tab-${target}`).classList.add("active");

      if (target === "overview") pageTitle.textContent = "Executive Overview";
      if (target === "agents") pageTitle.textContent = "26 AI Team Members Directory";
      if (target === "simulator") pageTitle.textContent = "Autonomous Webhook Simulator";
      if (target === "skills") pageTitle.textContent = "Claude Code & Antigravity Skills Arsenal";
    });
  });
}

function renderAgents(filterDept) {
  const container = document.getElementById("agentsContainer");
  container.innerHTML = "";

  const filtered = filterDept === "all" ? AGENTS : AGENTS.filter(a => a.dept === filterDept);

  filtered.forEach(agent => {
    const card = document.createElement("div");
    card.className = "agent-card";
    card.innerHTML = `
      <div class="agent-card-top">
        <div class="agent-avatar">${agent.icon}</div>
        <div class="agent-info">
          <h4>${agent.name}</h4>
          <span class="agent-role">${agent.role}</span>
        </div>
      </div>
      <p class="agent-desc">${agent.desc}</p>
      <div class="agent-meta">
        <span class="agent-dept">Agent #${agent.id} · ${agent.dept.toUpperCase()}</span>
        <span class="agent-status-badge"><span class="dot"></span> ACTIVE</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function initAgentFilters() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderAgents(btn.getAttribute("data-filter"));
    });
  });
}

function initSimulator() {
  const select = document.getElementById("simSelect");
  const payloadBox = document.getElementById("simPayload");
  const fireBtn = document.getElementById("btnFireSimulator");
  const outputBox = document.getElementById("simOutput");
  const statusPill = document.getElementById("simStatusPill");

  function updatePayload() {
    const key = select.value;
    payloadBox.value = JSON.stringify(SAMPLE_PAYLOADS[key], null, 2);
  }
  updatePayload();
  select.addEventListener("change", updatePayload);

  fireBtn.addEventListener("click", () => {
    statusPill.textContent = "PROCESSING...";
    statusPill.style.color = "#f59e0b";
    outputBox.textContent = "⏳ Transmitting payload to Claude 3.5 Sonnet Brain via n8n webhook pipeline...\n";

    setTimeout(() => {
      const type = select.value;
      let reply = "";

      if (type === "ceo_command") {
        reply = `👑 [CODERAKSH AI CEO RESPONSE — 320ms]
--------------------------------------------------
Founder Chetan, here is your real-time snapshot:

• Total Unpaid Invoices: ₹2,35,000 across 2 clients
  - #CR-2026-088 (FinTech Solutions): ₹1,50,000 [Overdue 3 days]
  - #CR-2026-089 (HealthTech Global): ₹85,000 [Due Nov 5]

• Today's Hot Leads (2 Qualified):
  1. Amit Sharma (FinTech Solutions) — Banking app penetration test
  2. Neha Patil (EduTech Labs) — DevOps CI/CD pipeline retainer

Directive: Both hot deals are ready to close. Meeting with Neha is set for 3:30 PM.`;
      } else if (type === "pr_security") {
        reply = `🛡️ [CODERAKSH DEVSECOPS SENTINEL — PULL REQUEST #43 AUDIT]
--------------------------------------------------
VERDICT: CRITICAL_BLOCK ❌
SECURITY RISK: CRITICAL

🔍 FINDINGS:
1. Hardcoded Secret Detected:
   - Line 1 commits live Stripe Secret Key ('sk_live_51M0...').
   - Impact: Attackers can execute arbitrary refunds and drain payouts.
2. OWASP Top 10 — SQL Injection (CWE-89):
   - Line 2 concatenates unescaped user input into raw SQL query.
   - Impact: Full database takeover and authentication bypass.

🛠️ REQUIRED FIX:
- Move Stripe key to environment variable (process.env.STRIPE_SECRET_KEY).
- Replace raw query with parameterized prepared statement:
  \`SELECT * FROM users WHERE email = $1\`, [req.body.email]

Review comment posted on GitHub PR. Immediate WhatsApp alert dispatched to Founder.`;
      } else if (type === "vuln_ingest") {
        reply = `🎯 [CODERAKSH VULNERABILITY TRIAGE ADVISORY]
--------------------------------------------------
TARGET: https://api.clientapp.com/v1/login
VULNERABILITY: SQL Injection in Authentication Parameter
CALCULATED CVSS: 9.8 (CRITICAL) — CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
CONFIDENCE: CONFIRMED EXPLOITABLE

💥 ATTACK IMPACT:
An unauthenticated remote attacker can bypass authentication as admin and dump customer credentials.

🛠️ REMEDIATION CODE PATCH:
```python
# Before (Vulnerable):
query = f"SELECT * FROM users WHERE username = '{username}' AND password = '{pwd}'"

# After (Remediated):
cursor.execute(
    "SELECT * FROM users WHERE username = %s AND password_hash = %s",
    (username, hash_password(pwd))
)
```
Entry added to Vulnerabilities sheet. Advisory PDF ready.`;
      } else if (type === "ci_doctor") {
        reply = `🚑 [CODERAKSH DEVOPS CI/CD PIPELINE DOCTOR]
--------------------------------------------------
JOB: Run Unit & E2E Tests [FAILED]
ROOT CAUSE: Missing Dependency '@anthropic-ai/sdk'

DIAGNOSIS:
The file '/app/dist/server.js' imports '@anthropic-ai/sdk', but package.json is missing the package dependency, causing Node.js module resolution to abort during CI test suite.

🛠️ 1-LINE COMMIT FIX:
Run in repository root:
$ npm install @anthropic-ai/sdk --save
$ git commit -am "fix(deps): add missing @anthropic-ai/sdk dependency"
$ git push origin main`;
      } else if (type === "freelance_sow") {
        reply = `💼 [CODERAKSH PROPOSAL & SCOPE OF WORK (SOW)]
--------------------------------------------------
CLIENT: FinTech Global UK
PROJECT: AI Real-Time Transaction Anomaly Detector
RECOMMENDED INVESTMENT: $9,500 USD (3 Milestones)

🏗️ SYSTEM ARCHITECTURE:
• Streaming Ingestion: Apache Kafka cluster (5,000 tx/sec throughput)
• Core ML Engine: Python 3.12 / FastAPI + ONNX Runtime for < 40ms inference
• State Store: Redis Sentinel for real-time velocity counters
• Security: Mutual TLS (mTLS) + HMAC webhook signatures

📅 SPRINT TIMELINE:
• Sprint 1 (W1-2): Kafka ingestion pipeline & Redis feature store ($3,500)
• Sprint 2 (W3-4): Anomaly detection model deployment & API ($3,500)
• Sprint 3 (W5-6): Security hardening, load testing & handoff ($2,500)

Proposal draft generated and saved to Proposals tab.`;
      } else if (type === "sos_alert") {
        reply = `🚨 [CODERAKSH PRIORITY 1 SOS ALERT]
--------------------------------------------------
ALERT TYPE: CRITICAL_PAYMENT_DEFAULT
SEVERITY: P1_EMERGENCY
TIMESTAMP: ${new Date().toLocaleString()}

DETAILS:
Client AlphaTech overdue by 45 days. Amount: ₹3,50,000. Phone lines unresponsive.

⚡ IMMEDIATE ACTION REQUIRED:
1. Automated legal notice generated by Finance Agent Dinesh.
2. Escalation WhatsApp alert sent to Founder Chetan Biranje (+9198XXXXXXXX).
3. Temporary suspension flag placed on AlphaTech API gateway access tokens.`;
      }

      outputBox.textContent = reply;
      statusPill.textContent = "SUCCESS (200 OK)";
      statusPill.style.color = "#10b981";
    }, 600);
  });
}

function renderSkills() {
  const grid = document.getElementById("skillsGrid");
  grid.innerHTML = "";

  SKILLS_SAMPLE.forEach(skill => {
    const card = document.createElement("div");
    card.className = "skill-card";
    card.innerHTML = `
      <div class="skill-card-top">
        <strong>${skill.name}</strong>
        <span class="skill-badge">${skill.cat}</span>
      </div>
      <p>${skill.desc}</p>
    `;
    grid.appendChild(card);
  });
}

function initActionButtons() {
  document.getElementById("btnMorningBriefing").addEventListener("click", () => {
    alert("🌅 CodeRaksh Morning Flight Plan generated! Check your WhatsApp & Gmail for today's top 3 founder priorities.");
  });
  document.getElementById("btnNightAudit").addEventListener("click", () => {
    alert("🌙 Nightly Boardroom Audit executed! CodeRaksh Health Score calculated at 88/100 (HEALTHY). Daily Log updated.");
  });
}
