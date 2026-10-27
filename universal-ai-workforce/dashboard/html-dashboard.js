/**
 * Universal AI Workforce - HTML Observability Dashboard Generator
 * Produces a responsive, single-file HTML dashboard with dark mode and metric cards.
 */

export function generateHtmlDashboard(data = {}) {
  const {
    registeredSkills = 0,
    totalAgents = 0,
    activeWorkers = 0,
    pendingApprovals = 0,
    tasksByStatus = {},
    agentsByDept = {},
    budgetUsedUsd = 0.0,
    recentEvents = [],
    killSwitchActive = false
  } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Universal AI Workforce — Executive Observability Dashboard</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --border: #1f2937;
      --accent: #3b82f6;
      --accent-green: #10b981;
      --accent-red: #ef4444;
      --accent-yellow: #f59e0b;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
    }
    body {
      margin: 0;
      padding: 24px;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 24px;
    }
    .status-badge {
      padding: 6px 14px;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.85rem;
      background: ${killSwitchActive ? 'var(--accent-red)' : 'var(--accent-green)'};
      color: #fff;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
    }
    .card-title {
      color: var(--text-muted);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .card-value {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text);
    }
    .card-sub {
      color: var(--text-muted);
      font-size: 0.8rem;
      margin-top: 6px;
    }
    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: #172033;
      color: var(--text-muted);
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="margin: 0; font-size: 1.5rem;">🛡️ Universal AI Workforce OS</h1>
      <p style="margin: 4px 0 0 0; color: var(--text-muted);">Enterprise Autonomous AI Workforce & Orchestration Matrix</p>
    </div>
    <div class="status-badge">
      ${killSwitchActive ? '🔴 KILL SWITCH ACTIVE' : '🟢 ALL SYSTEMS OPERATIONAL'}
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">Logical Agents</div>
      <div class="card-value">${totalAgents.toLocaleString()}</div>
      <div class="card-sub">Mapped across departments</div>
    </div>
    <div class="card">
      <div class="card-title">Registered Skills</div>
      <div class="card-value">${registeredSkills}</div>
      <div class="card-sub">Active capability runbooks</div>
    </div>
    <div class="card">
      <div class="card-title">Active Workers</div>
      <div class="card-value">${activeWorkers}</div>
      <div class="card-sub">Running model sessions</div>
    </div>
    <div class="card">
      <div class="card-title">Pending Approvals</div>
      <div class="card-value" style="color: ${pendingApprovals > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)'}">
        ${pendingApprovals}
      </div>
      <div class="card-sub">Sensitive actions held</div>
    </div>
    <div class="card">
      <div class="card-title">Budget Consumed</div>
      <div class="card-value">$${budgetUsedUsd.toFixed(3)}</div>
      <div class="card-sub">Total actual provider costs</div>
    </div>
  </div>

  <div class="section-title">Department Distribution</div>
  <table>
    <thead>
      <tr><th>Department</th><th>Active Logical Agents</th><th>Status</th></tr>
    </thead>
    <tbody>
      ${Object.entries(agentsByDept).map(([dept, count]) => `
        <tr><td><strong>${dept}</strong></td><td>${count} agents</td><td><span style="color:var(--accent-green);">● Ready</span></td></tr>
      `).join('') || '<tr><td colspan="3">No departments provisioned yet</td></tr>'}
    </tbody>
  </table>

  <div class="section-title" style="margin-top: 32px;">Recent Audit & Lifecycle Events</div>
  <table>
    <thead>
      <tr><th>Timestamp</th><th>Event Type</th><th>Payload Summary</th></tr>
    </thead>
    <tbody>
      ${recentEvents.slice(-10).map(ev => `
        <tr>
          <td style="font-family: monospace; font-size: 0.85rem;">${ev.timestamp || ''}</td>
          <td><code>${ev.type || ''}</code></td>
          <td style="font-size: 0.85rem; color: var(--text-muted);">${JSON.stringify(ev.payload || {}).slice(0, 100)}</td>
        </tr>
      `).join('') || '<tr><td colspan="3">No recent events recorded</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
}
