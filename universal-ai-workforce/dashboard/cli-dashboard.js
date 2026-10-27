/**
 * Universal AI Workforce - CLI Dashboard
 * ASCII & Unicode terminal dashboard displaying workforce metrics, agents, skills, and tasks.
 */

export function renderCliDashboard(data = {}) {
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

  const lines = [
    `========================================================================================`,
    `                      🛡️  UNIVERSAL AI WORKFORCE OPERATING SYSTEM                       `,
    `========================================================================================`,
    `  System Status    : ${killSwitchActive ? '🔴 KILL SWITCH ACTIVE' : '🟢 OPERATIONAL'}`,
    `  Logical Agents   : ${totalAgents.toLocaleString()} agents mapped across departments`,
    `  Active Workers   : ${activeWorkers} active execution instances`,
    `  Registered Skills: ${registeredSkills} skills active in registry`,
    `  Pending Approvals: ${pendingApprovals > 0 ? `⚠️  ${pendingApprovals} action(s) awaiting human sign-off` : '0 (None)'}`,
    `  Total Budget Used: $${budgetUsedUsd.toFixed(4)} USD`,
    `----------------------------------------------------------------------------------------`,
    `  📊 TASKS BREAKDOWN:`,
    `     Pending: ${tasksByStatus.pending || 0}  |  Queued: ${tasksByStatus.queued || 0}  |  Running: ${tasksByStatus.running || 0}`,
    `     Completed: ${tasksByStatus.completed || 0}  |  Failed: ${tasksByStatus.failed || 0}  |  Waiting Approval: ${tasksByStatus.waiting_approval || 0}`,
    `----------------------------------------------------------------------------------------`,
    `  🏢 DEPARTMENTS & AGENT COUNTS:`,
  ];

  const deptEntries = Object.entries(agentsByDept);
  if (deptEntries.length === 0) {
    lines.push(`     (No departments currently provisioned)`);
  } else {
    for (const [dept, count] of deptEntries) {
      lines.push(`     • ${dept.padEnd(25)}: ${count} logical agent(s)`);
    }
  }

  lines.push(`----------------------------------------------------------------------------------------`);
  lines.push(`  📜 RECENT AUDIT & LIFECYCLE EVENTS:`);
  if (recentEvents.length === 0) {
    lines.push(`     (No recent events recorded)`);
  } else {
    for (const ev of recentEvents.slice(-6)) {
      lines.push(`     [${ev.timestamp?.slice(11, 19) || 'TIME'}] ${ev.type.padEnd(24)} -> ${JSON.stringify(ev.payload || {}).slice(0, 50)}...`);
    }
  }

  lines.push(`========================================================================================`);
  return lines.join('\n');
}
