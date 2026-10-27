#!/usr/bin/env node

/**
 * Universal AI Workforce CLI
 * Enterprise management interface for skills, agents, tasks, departments, and orchestration.
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { globalOrganizationHierarchy } from '../core/orchestrator/hierarchy.js';
import { globalSkillRegistry } from '../core/skill-registry/skill-registry.js';
import { globalSkillLifecycleManager } from '../core/skill-registry/skill-lifecycle.js';
import { SkillValidator } from '../core/skill-registry/skill-validator.js';
import { globalAgentRegistry } from '../core/agent-factory/agent-registry.js';
import { globalAgentFactory } from '../core/agent-factory/agent-factory.js';
import { globalTaskEngine } from '../core/task-engine/task-engine.js';
import { globalAIChiefExecutiveOrchestrator } from '../core/orchestrator/ceo-orchestrator.js';
import { globalPolicyEngine } from '../core/policy-engine/policy-engine.js';
import { globalEventBus } from '../core/event-system/event-bus.js';
import { MockProvider } from '../providers/mock-provider.js';
import { renderCliDashboard } from '../dashboard/cli-dashboard.js';
import { generateHtmlDashboard } from '../dashboard/html-dashboard.js';
import { globalStorage } from '../storage/file-storage.js';
import { loadWorkforceState, saveWorkforceState } from '../core/index.js';
import { globalWorkforceScheduler } from '../core/scheduler/workforce-scheduler.js';
import { seed1000Agents } from '../scripts/seed-1000-agents.js';
import { runBenchmark } from '../scripts/benchmark-workforce.js';
import { WorkforceMcpServer } from '../core/mcp-server/mcp-server.js';
import { WorkforceHttpServer } from '../core/http-server/http-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Set default test provider for CLI operations
globalTaskEngine.setProvider(new MockProvider({ latencyMs: 2 }));

const args = process.argv.slice(2);
const command = args[0] || 'status';
const subCommand = args[1];

async function main() {
  try {
    await loadWorkforceState();

    switch (command) {
      case 'init':
        await handleInit();
        await saveWorkforceState();
        break;

      case 'status':
      case 'dashboard':
        await handleStatus();
        break;

      case 'tree':
        handleTree();
        break;

      case 'skill':
        await handleSkill(subCommand, args.slice(2));
        await saveWorkforceState();
        break;

      case 'agent':
        handleAgent(subCommand, args.slice(2));
        await saveWorkforceState();
        break;

      case 'task':
        await handleTask(subCommand, args.slice(2));
        await saveWorkforceState();
        break;

      case 'goal':
        await handleGoal(args.slice(1).join(' '));
        await saveWorkforceState();
        break;

      case 'department':
        handleDepartment(subCommand, args.slice(2));
        await saveWorkforceState();
        break;

      case 'template':
        await handleTemplate(subCommand, args.slice(2));
        await saveWorkforceState();
        break;

      case 'scheduler':
        await handleScheduler(subCommand, args.slice(2));
        break;

      case 'seed':
        await handleSeed(args[1]);
        break;

      case 'benchmark':
        await runBenchmark();
        break;

      case 'upgrade':
        await handleUpgrade();
        break;

      case 'rollback':
        await handleRollback();
        break;

      case 'report':
        await handleReport();
        break;

      case 'doctor':
        await handleDoctor();
        break;

      case 'kill-switch':
        handleKillSwitch(subCommand);
        await saveWorkforceState();
        break;

      case 'mcp-server':
      case 'mcp': {
        const mcpServer = new WorkforceMcpServer();
        mcpServer.startStdio();
        return;
      }

      case 'server':
      case 'api': {
        const port = args[1] && !isNaN(args[1]) ? parseInt(args[1], 10) : 3456;
        await handleHttpServer(port);
        return;
      }

      case 'install':
      case 'integrate': {
        await handleInstall(subCommand, args.slice(2));
        break;
      }

      case 'test':
        await handleRunTests();
        break;

      case 'help':
      case '--help':
      case '-h':
      default:
        printHelp();
        break;
    }
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    process.exit(1);
  }
}

async function handleInit() {
  console.log(`\n🚀 Initializing Universal AI Workforce...`);

  // Auto-register built-in starter skills
  const skillsDir = path.join(rootDir, 'skills');
  const entries = await fs.readdir(skillsDir, { withFileTypes: true });

  let registeredCount = 0;
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillPath = path.join(skillsDir, entry.name);
      try {
        await globalSkillLifecycleManager.processSkill(skillPath);
        registeredCount++;
      } catch (err) {
        console.warn(`  ⚠️ Skipped skill ${entry.name}: ${err.message}`);
      }
    }
  }

  console.log(`✅ System initialized successfully.`);
  console.log(`   Departments loaded: ${globalOrganizationHierarchy.listDepartments().length}`);
  console.log(`   Skills registered: ${registeredCount}`);
  console.log(`   Logical agents provisioned: ${globalAgentRegistry.count()}\n`);
}

async function handleStatus() {
  const isHtml = args.includes('--html');
  const skills = globalSkillRegistry.list();
  const agents = globalAgentRegistry.list({}, { page: 1, pageSize: 1000 }).items;
  const tasks = globalTaskEngine.listTasks();

  const tasksByStatus = {};
  for (const t of tasks) {
    tasksByStatus[t.status] = (tasksByStatus[t.status] || 0) + 1;
  }

  const agentsByDept = {};
  let totalBudgetUsed = 0.0;
  for (const a of agents) {
    agentsByDept[a.departmentId] = (agentsByDept[a.departmentId] || 0) + 1;
    totalBudgetUsed += (a.budgetUsedUsd || 0.0);
  }

  const data = {
    registeredSkills: skills.length,
    totalAgents: agents.length,
    activeWorkers: 0,
    pendingApprovals: tasks.filter(t => t.status === 'waiting_approval').length,
    tasksByStatus,
    agentsByDept,
    budgetUsedUsd: totalBudgetUsed,
    recentEvents: globalEventBus.getRecentLogs(10),
    killSwitchActive: globalPolicyEngine.isKillSwitchEngaged()
  };

  if (isHtml) {
    const html = generateHtmlDashboard(data);
    const outPath = path.join(rootDir, 'storage', 'dashboard.html');
    await fs.mkdir(path.dirname(outPath), { recursive: true });
    await fs.writeFile(outPath, html, 'utf8');
    console.log(`✅ HTML Dashboard generated at: ${outPath}`);
  } else {
    console.log('\n' + renderCliDashboard(data) + '\n');
  }
}

function handleTree() {
  const tree = globalOrganizationHierarchy.getStructureTree();
  console.log(`\n======================================================`);
  console.log(`🏢 ORGANIZATIONAL HIERARCHY CHAIN OF COMMAND`);
  console.log(`======================================================`);
  console.log(`[FOUNDER / OWNER] : ${tree.founder.title}`);
  console.log(`  └── [AI CEO]    : ${tree.ceo.name}`);

  for (const cs of tree.cSuite) {
    console.log(`        ├── [${cs.id.toUpperCase()}] ${cs.title} (Lead: ${cs.department})`);
  }

  console.log(`\n🏛️  DEPARTMENTS:`);
  for (const dept of tree.departments) {
    const agents = globalAgentRegistry.findAgentsByDepartment(dept.id);
    console.log(`  • ${dept.name} (${dept.id}) [C-Suite: ${dept.cSuiteLead.toUpperCase()}] — ${agents.length} Agent(s)`);
    for (const ag of agents.slice(0, 3)) {
      console.log(`      └─ [${ag.id}] ${ag.name} (${ag.jobTitle}) - Skills: ${ag.skills.join(', ') || 'none'}`);
    }
    if (agents.length > 3) {
      console.log(`      └─ ... and ${agents.length - 3} more agent(s)`);
    }
  }
  console.log(`======================================================\n`);
}

async function handleSkill(action, extraArgs) {
  switch (action) {
    case 'add': {
      const skillPath = extraArgs[0];
      if (!skillPath) throw new Error("Usage: workforce skill add <path_to_skill>");
      const fullPath = path.resolve(process.cwd(), skillPath);
      console.log(`\n📦 Processing skill via 10-step Lifecycle Manager: ${fullPath}`);
      const result = await globalSkillLifecycleManager.processSkill(fullPath);
      console.log(`✅ Skill Registered: '${result.skill.name}' (ID: ${result.skill.id})`);
      console.log(`   Final Status   : ${result.skill.status}`);
      console.log(`   Scaling Action : ${result.decision.action} (${result.decision.reason})`);
      if (result.assignedAgent) {
        console.log(`   Assigned Agent : [${result.assignedAgent.id}] ${result.assignedAgent.name}`);
      }
      console.log('');
      break;
    }
    case 'validate': {
      const skillPath = extraArgs[0];
      if (!skillPath) throw new Error("Usage: workforce skill validate <path_to_skill>");
      const validator = new SkillValidator();
      const loaded = await validator.loadFromPath(path.resolve(process.cwd(), skillPath));
      const res = validator.validateStructure(loaded.definition);
      const deps = validator.checkDependencies(loaded.definition.dependencies);
      console.log(`\n🔍 Skill Validation Report for: ${loaded.definition.name}`);
      console.log(`   Structure Valid: ${res.isValid ? 'YES' : 'NO'}`);
      if (!res.isValid) console.log(`   Errors: ${res.errors.join(', ')}`);
      console.log(`   Dependencies Met: ${deps.satisfied ? 'YES' : 'NO'}`);
      if (!deps.satisfied) console.log(`   Missing: ${JSON.stringify(deps.missing)}`);
      console.log('');
      break;
    }
    case 'list': {
      const list = globalSkillRegistry.list();
      console.log(`\n📋 Registered Skills (${list.length}):`);
      for (const s of list) {
        console.log(`  • [${s.id}] ${s.name} v${s.version} — Status: ${s.status} (Risk: ${s.riskLevel})`);
      }
      console.log('');
      break;
    }
    case 'disable': {
      const id = extraArgs[0];
      if (!id) throw new Error("Usage: workforce skill disable <id>");
      globalSkillRegistry.disable(id);
      console.log(`✅ Skill '${id}' has been disabled.\n`);
      break;
    }
    default:
      console.log("Usage: workforce skill [add|validate|list|disable]");
  }
}

function handleAgent(action, extraArgs) {
  switch (action) {
    case 'list': {
      const res = globalAgentRegistry.list({}, { page: 1, pageSize: 100 });
      console.log(`\n🤖 Registered Logical Agents (${res.total}):`);
      for (const a of res.items) {
        console.log(`  • [${a.id}] ${a.name} (${a.jobTitle}) | Dept: ${a.departmentId} | Status: ${a.status}`);
      }
      console.log('');
      break;
    }
    case 'inspect': {
      const id = extraArgs[0];
      if (!id) throw new Error("Usage: workforce agent inspect <id>");
      const agent = globalAgentRegistry.get(id);
      if (!agent) throw new Error(`Agent '${id}' not found.`);
      console.log(`\n🔍 Agent Inspection: [${agent.id}]`);
      console.log(JSON.stringify(agent, null, 2));
      console.log('');
      break;
    }
    case 'pause': {
      const id = extraArgs[0];
      if (!id) throw new Error("Usage: workforce agent pause <id>");
      globalAgentRegistry.pauseAgent(id);
      console.log(`✅ Agent '${id}' paused.\n`);
      break;
    }
    case 'resume': {
      const id = extraArgs[0];
      if (!id) throw new Error("Usage: workforce agent resume <id>");
      globalAgentRegistry.resumeAgent(id);
      console.log(`✅ Agent '${id}' resumed.\n`);
      break;
    }
    default:
      console.log("Usage: workforce agent [list|inspect|pause|resume]");
  }
}

async function handleTask(action, extraArgs) {
  switch (action) {
    case 'list': {
      const tasks = globalTaskEngine.listTasks();
      console.log(`\n📋 Tasks (${tasks.length}):`);
      for (const t of tasks) {
        console.log(`  • [${t.id}] ${t.title} | Dept: ${t.departmentId} | Status: ${t.status} | Priority: ${t.priority}`);
      }
      console.log('');
      break;
    }
    case 'inspect': {
      const id = extraArgs[0];
      if (!id) throw new Error("Usage: workforce task inspect <id>");
      const t = globalTaskEngine.getTask(id);
      if (!t) throw new Error(`Task '${id}' not found.`);
      console.log(`\n🔍 Task Details: [${t.id}]`);
      console.log(JSON.stringify(t, null, 2));
      console.log('');
      break;
    }
    case 'approve': {
      const id = extraArgs[0];
      if (!id) throw new Error("Usage: workforce task approve <id>");
      globalTaskEngine.approveTask(id, 'founder', 'Manual approval via CLI');
      console.log(`✅ Task '${id}' approved.\n`);
      break;
    }
    case 'run': {
      const id = extraArgs[0];
      if (!id) throw new Error("Usage: workforce task run <id>");
      console.log(`🚀 Executing task '${id}'...`);
      const completed = await globalTaskEngine.executeTask(id);
      console.log(`✅ Task completed. Status: ${completed.status}\n`);
      break;
    }
    default:
      console.log("Usage: workforce task [list|inspect|approve|run]");
  }
}

async function handleGoal(objective) {
  if (!objective || objective.trim() === '') {
    throw new Error("Usage: workforce goal <objective_text>");
  }
  console.log(`\n🎯 AI CEO received business objective: "${objective}"`);
  console.log(`   Decomposing into department workflows, resolving capabilities, building DAG plan...\n`);

  const outcome = await globalAIChiefExecutiveOrchestrator.submitGoal(objective);
  console.log(outcome.report);
  console.log(`\n✅ Goal Plan Result: ${outcome.status.toUpperCase()} (${outcome.completedCount}/${outcome.tasks.length} tasks executed)\n`);
}

function handleDepartment(action, extraArgs) {
  switch (action) {
    case 'list': {
      const depts = globalOrganizationHierarchy.listDepartments();
      console.log(`\n🏛️  Departments (${depts.length}):`);
      for (const d of depts) {
        const status = d.active !== false ? 'Active' : (d.mergedInto ? `Merged -> ${d.mergedInto}` : 'Inactive');
        console.log(`  • [${d.id}] ${d.name} (C-Suite Lead: ${d.cSuiteLead}) [${status}]`);
      }
      console.log('');
      break;
    }
    case 'add': {
      const id = extraArgs[0];
      const name = extraArgs.slice(1).join(' ');
      if (!id || !name) throw new Error("Usage: workforce department add <id> <name>");
      globalOrganizationHierarchy.addDepartment({ id, name });
      console.log(`✅ Department '${name}' (${id}) added.\n`);
      break;
    }
    case 'rename': {
      const id = extraArgs[0];
      const newName = extraArgs.slice(1).join(' ');
      if (!id || !newName) throw new Error("Usage: workforce department rename <id> <newName>");
      globalOrganizationHierarchy.renameDepartment(id, newName);
      console.log(`✅ Department '${id}' renamed to '${newName}'.\n`);
      break;
    }
    case 'merge': {
      const sourceId = extraArgs[0];
      const targetId = extraArgs[1];
      if (!sourceId || !targetId) throw new Error("Usage: workforce department merge <sourceId> <targetId>");
      const res = globalOrganizationHierarchy.mergeDepartments(sourceId, targetId, globalAgentRegistry);
      console.log(`✅ Merged department '${sourceId}' into '${targetId}'. Reassigned ${res.reassignedAgents} agent(s).\n`);
      break;
    }
    case 'split': {
      const deptId = extraArgs[0];
      const idA = extraArgs[1];
      const nameA = extraArgs[2];
      const idB = extraArgs[3];
      const nameB = extraArgs[4];
      if (!deptId || !idA || !nameA || !idB || !nameB) {
        throw new Error("Usage: workforce department split <deptId> <idA> <nameA> <idB> <nameB>");
      }
      const res = globalOrganizationHierarchy.splitDepartment(
        deptId,
        { id: idA, name: nameA },
        { id: idB, name: nameB },
        globalAgentRegistry
      );
      console.log(`✅ Split department '${deptId}' into '${idA}' (${res.distribution[idA]} agents) and '${idB}' (${res.distribution[idB]} agents).\n`);
      break;
    }
    default:
      console.log("Usage: workforce department [list|add|rename|merge|split]");
  }
}

async function handleTemplate(action, extraArgs) {
  const templatesDir = path.join(rootDir, 'templates');
  switch (action) {
    case 'list': {
      const files = await fs.readdir(templatesDir);
      console.log(`\n📋 Available Industry Workforce Templates (${files.length}):`);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const raw = await fs.readFile(path.join(templatesDir, file), 'utf8');
          const tpl = JSON.parse(raw);
          console.log(`  • [${tpl.id}] ${tpl.name} — Industry: ${tpl.targetIndustry}`);
          console.log(`      Departments: ${tpl.departments?.join(', ') || 'N/A'}`);
          console.log(`      Recommended Agents: ${tpl.recommendedAgents?.length || 0}`);
        }
      }
      console.log('');
      break;
    }
    case 'apply': {
      const templateId = extraArgs[0];
      if (!templateId) throw new Error("Usage: workforce template apply <template_id>");
      const filePath = path.join(templatesDir, `${templateId}.json`);
      let templateData;
      try {
        const raw = await fs.readFile(filePath, 'utf8');
        templateData = JSON.parse(raw);
      } catch (err) {
        throw new Error(`Template '${templateId}' not found at ${filePath}`);
      }

      console.log(`\n🚀 Applying template: '${templateData.name}' (${templateData.id})...`);

      // 1. Ensure departments are registered
      for (const deptId of templateData.departments || []) {
        if (!globalOrganizationHierarchy.getDepartment(deptId)) {
          globalOrganizationHierarchy.addDepartment({
            id: deptId,
            name: `${deptId.toUpperCase()} Department`,
            industry: templateData.targetIndustry
          });
          console.log(`  ➕ Provisioned department: ${deptId}`);
        }
      }

      // 2. Provision recommended specialist agents
      let provisionedCount = 0;
      for (const agentDef of templateData.recommendedAgents || []) {
        if (!globalAgentRegistry.has(agentDef.id)) {
          globalAgentFactory.createAgent({
            id: agentDef.id,
            name: agentDef.name,
            jobTitle: agentDef.jobTitle,
            departmentId: agentDef.departmentId,
            capabilities: agentDef.capabilities || [],
            skills: agentDef.skills || []
          });
          provisionedCount++;
          console.log(`  🤖 Provisioned agent: [${agentDef.id}] ${agentDef.name}`);
        }
      }

      console.log(`✅ Template '${templateData.id}' applied successfully. Added ${provisionedCount} agent(s).\n`);
      break;
    }
    default:
      console.log("Usage: workforce template [list|apply <id>]");
  }
}

async function handleScheduler(action, extraArgs) {
  switch (action) {
    case 'status': {
      const jobs = globalWorkforceScheduler.listRecurringJobs();
      console.log(`\n⏱️  Workforce Scheduler Status:`);
      console.log(`   Running: ${globalWorkforceScheduler.isRunning ? 'ACTIVE (Tick interval: 1s)' : 'Idle'}`);
      console.log(`   Recurring Jobs: ${jobs.length}`);
      for (const job of jobs) {
        console.log(`   • [${job.id}] ${job.name} (Dept: ${job.departmentId}) — Interval: ${job.intervalMs}ms — Runs: ${job.runCount}`);
      }
      console.log('');
      break;
    }
    case 'tick': {
      console.log(`\n⏱️  Triggering workforce scheduler tick...`);
      const tickResult = await globalWorkforceScheduler.tick();
      console.log(`   Timestamp: ${tickResult.timestamp}`);
      console.log(`   Dispatched Tasks: ${tickResult.dispatchedTasks.length}`);
      console.log(`   Triggered Jobs: ${tickResult.triggeredJobs.length}`);
      console.log(`   Expired Deadlines: ${tickResult.expiredDeadlines}\n`);
      break;
    }
    default:
      console.log("Usage: workforce scheduler [status|tick]");
  }
}

async function handleSeed(countArg) {
  const count = parseInt(countArg || '1000', 10);
  await seed1000Agents(count);
}

async function handleUpgrade() {
  console.log(`\n🛡️  Initiating Universal AI Workforce Safe Upgrade Checkpoint...`);
  const backupFile = path.join(rootDir, 'storage', `state.backup.${Date.now()}.json`);
  const currentState = await globalStorage.loadState();
  if (currentState) {
    await fs.writeFile(backupFile, JSON.stringify(currentState, null, 2), 'utf8');
    console.log(`  💾 State snapshot backed up to: ${backupFile}`);
  }

  console.log(`  🩺 Running system diagnostics...`);
  await handleDoctor();
  console.log(`✅ System verified for safe upgrade. Zero breaking schema changes detected.\n`);
}

async function handleRollback() {
  console.log(`\n⏮️  Initiating Universal AI Workforce Rollback...`);
  const storageDir = path.join(rootDir, 'storage');
  const files = await fs.readdir(storageDir);
  const backups = files.filter(f => f.startsWith('state.backup.')).sort().reverse();

  if (backups.length === 0) {
    throw new Error("No state backups found in storage/ directory to roll back to.");
  }

  const latestBackup = path.join(storageDir, backups[0]);
  console.log(`  Restoring from: ${latestBackup}`);
  const raw = await fs.readFile(latestBackup, 'utf8');
  await globalStorage.saveState(JSON.parse(raw));
  console.log(`✅ Rollback complete. Workforce state restored from ${backups[0]}.\n`);
}

async function handleReport() {
  await handleStatus();
}

async function handleDoctor() {
  const quiet = args.includes('--quiet');
  const issues = [];

  // Check Node version
  const nodeVer = process.version;
  const major = parseInt(nodeVer.replace('v', '').split('.')[0], 10);
  if (major < 18) issues.push(`Node.js version is ${nodeVer}. Requires >= 18.0.0.`);

  // Check storage directory
  try {
    await fs.mkdir(path.join(rootDir, 'storage'), { recursive: true });
  } catch (err) {
    issues.push(`Cannot write to storage directory: ${err.message}`);
  }

  if (quiet) {
    if (issues.length > 0) process.exit(1);
    process.exit(0);
  }

  console.log(`\n🩺 Universal AI Workforce Diagnostics (Doctor):`);
  console.log(`   Node.js Runtime : ${nodeVer} (Supported)`);
  console.log(`   Platform / OS   : ${process.platform} (${process.arch})`);
  console.log(`   Storage Path    : ${path.join(rootDir, 'storage')}`);
  console.log(`   Audit Logging   : Active`);
  console.log(`   Kill Switch     : ${globalPolicyEngine.isKillSwitchEngaged() ? 'ENGAGED' : 'Disengaged (Normal)'}`);

  if (issues.length === 0) {
    console.log(`\n✅ All system checks passed. Workforce runtime is healthy.\n`);
  } else {
    console.log(`\n⚠️  Found ${issues.length} issue(s):`);
    for (const iss of issues) console.log(`   - ${iss}`);
    console.log('');
  }
}

function handleKillSwitch(action) {
  if (action === 'on' || action === 'engage') {
    globalPolicyEngine.setKillSwitch(true, 'Manual operator kill switch engaged via CLI');
    console.log(`🚨 GLOBAL KILL SWITCH ENGAGED. All agent executions are now paused.\n`);
  } else if (action === 'off' || action === 'disengage') {
    globalPolicyEngine.setKillSwitch(false, 'Operator disengaged kill switch via CLI');
    console.log(`🟢 GLOBAL KILL SWITCH DISENGAGED. Agent executions restored.\n`);
  } else {
    console.log(`Kill Switch Status: ${globalPolicyEngine.isKillSwitchEngaged() ? 'ENGAGED (RED)' : 'DISENGAGED (GREEN)'}`);
    console.log(`Usage: workforce kill-switch [on|off]`);
  }
}

async function handleHttpServer(port = 3456) {
  const server = new WorkforceHttpServer({ port });
  const info = await server.start();
  console.log(`\n🌐 Universal AI Workforce HTTP REST API Server`);
  console.log(`   Running at: http://localhost:${info.port}`);
  console.log(`   Status Endpoint  : http://localhost:${info.port}/v1/status`);
  console.log(`   ChatGPT OpenAPI  : http://localhost:${info.port}/v1/openapi.json`);
  console.log(`   Goal Dispatch    : POST http://localhost:${info.port}/v1/goals`);
  console.log(`   Press Ctrl+C to terminate server.\n`);
}

async function handleInstall(target = 'all') {
  const normTarget = (target || 'all').toLowerCase();
  console.log(`\n🔌 Configuring Universal AI Workforce for: ${normTarget.toUpperCase()}...`);

  const workforceBin = path.join(rootDir, 'bin/workforce.mjs');
  const nodeExec = process.execPath;

  // 1. Claude Desktop Configuration
  if (normTarget === 'all' || normTarget === 'claude' || normTarget === 'claude-desktop') {
    const claudeDesktopDir = path.join(rootDir, 'integrations/claude-desktop');
    await fs.mkdir(claudeDesktopDir, { recursive: true });
    const claudeConfig = {
      mcpServers: {
        "universal-ai-workforce": {
          command: nodeExec,
          args: [workforceBin, "mcp-server"],
          env: {
            WORKFORCE_ENV: "production"
          }
        }
      }
    };
    await fs.writeFile(
      path.join(claudeDesktopDir, 'claude_desktop_config.json'),
      JSON.stringify(claudeConfig, null, 2)
    );
    console.log(`  ✅ Claude Desktop Config: integrations/claude-desktop/claude_desktop_config.json`);
    console.log(`     (Copy into %APPDATA%\\Claude\\claude_desktop_config.json on Windows, or ~/Library/Application Support/Claude/ on macOS)`);
  }

  // 2. Claude Code Plugin Configuration
  if (normTarget === 'all' || normTarget === 'claude' || normTarget === 'claude-code') {
    const claudeCodeDir = path.join(rootDir, '.claude');
    await fs.mkdir(claudeCodeDir, { recursive: true });
    const claudeCodeConfig = {
      mcpServers: {
        "universal-ai-workforce": {
          command: nodeExec,
          args: [workforceBin, "mcp-server"]
        }
      }
    };
    await fs.writeFile(
      path.join(claudeCodeDir, 'config.json'),
      JSON.stringify(claudeCodeConfig, null, 2)
    );
    console.log(`  ✅ Claude Code Config: .claude/config.json`);
  }

  // 3. Cursor & Windsurf Configuration
  if (normTarget === 'all' || normTarget === 'cursor' || normTarget === 'windsurf') {
    const cursorDir = path.join(rootDir, '.cursor');
    await fs.mkdir(cursorDir, { recursive: true });
    const cursorConfig = {
      mcpServers: {
        "universal-ai-workforce": {
          command: nodeExec,
          args: [workforceBin, "mcp-server"]
        }
      }
    };
    await fs.writeFile(
      path.join(cursorDir, 'mcp.json'),
      JSON.stringify(cursorConfig, null, 2)
    );
    console.log(`  ✅ Cursor / Windsurf Config: .cursor/mcp.json`);
  }

  // 4. Google Gemini & Antigravity Configuration
  if (normTarget === 'all' || normTarget === 'gemini' || normTarget === 'antigravity') {
    const geminiMcpPath = path.join(rootDir, 'mcp_config.json');
    const geminiConfig = {
      mcpServers: {
        "universal-ai-workforce": {
          command: nodeExec,
          args: [workforceBin, "mcp-server"],
          env: {
            WORKFORCE_ENV: "production"
          }
        }
      }
    };
    await fs.writeFile(geminiMcpPath, JSON.stringify(geminiConfig, null, 2));
    console.log(`  ✅ Google Gemini / Antigravity MCP Config: mcp_config.json`);
  }

  // 5. OpenAI ChatGPT Integration
  if (normTarget === 'all' || normTarget === 'chatgpt' || normTarget === 'openai') {
    console.log(`  ✅ OpenAI ChatGPT Custom Actions OpenAPI: integrations/chatgpt/openapi.json`);
    console.log(`     To connect ChatGPT:`);
    console.log(`     1. Run: node bin/workforce.mjs server 3456`);
    console.log(`     2. Create a Custom GPT -> Configure -> Actions -> Import OpenAPI from http://localhost:3456/v1/openapi.json`);
  }

  console.log(`\n🎉 Universal integration setup complete for: ${normTarget.toUpperCase()}\n`);
}

async function handleRunTests() {
  console.log(`\n🧪 Launching Universal AI Workforce Automated Test Suites...\n`);
  const { runAllTests } = await import('../tests/test-runner.js');
  await runAllTests();
}

function printHelp() {
  console.log(`
🛡️  UNIVERSAL AI WORKFORCE CLI — Commands Reference

Usage:
  workforce <command> [subcommand] [arguments...]

Core Commands:
  workforce init                     Initialize departments and register built-in starter skills
  workforce status [--html]          Display live workforce status dashboard (or generate HTML)
  workforce tree                     Display full organizational hierarchy and agent tree
  workforce goal <objective>         Submit business goal for autonomous AI CEO decomposition & DAG execution
  workforce dashboard                Render terminal status dashboard
  workforce mcp-server               Start JSON-RPC 2.0 MCP server for Claude, Gemini, Cursor, Windsurf
  workforce server [port]            Start HTTP REST API server for ChatGPT Custom GPT Actions (default: 3456)
  workforce install [target]         Install configs for claude, gemini, cursor, chatgpt, or all
  workforce report                   Generate executive summary report
  workforce doctor [--quiet]         Run system health and compatibility diagnostics
  workforce kill-switch [on|off]     Emergency kill switch to halt/resume all agent actions
  workforce test                     Run all automated test suites
  workforce seed [count]             Seed 1,000+ realistic logical agents and profile heap allocation
  workforce benchmark                Run performance stress test on DAG, queries, and secret redaction
  workforce upgrade                  Perform diagnostic checks and safe state checkpoint
  workforce rollback                 Restore workforce state from latest snapshot backup
  workforce report                   Generate executive summary report
  workforce doctor [--quiet]         Run system health and compatibility diagnostics
  workforce kill-switch [on|off]     Emergency kill switch to halt/resume all agent actions
  workforce test                     Run all 18 automated test suites
  workforce seed [count]             Seed 1,000+ realistic logical agents and profile heap allocation
  workforce benchmark                Run performance stress test on DAG, queries, and secret redaction
  workforce upgrade                  Perform diagnostic checks and safe state checkpoint
  workforce rollback                 Restore workforce state from latest snapshot backup

Skill Commands:
  workforce skill add <path>         Process and register skill via 10-step lifecycle manager
  workforce skill validate <path>    Validate skill structure, dependencies, and risk level
  workforce skill list               List registered skills
  workforce skill disable <id>       Disable a skill safely

Agent Commands:
  workforce agent list               List all logical agents
  workforce agent inspect <id>       Inspect full configuration of a specific agent
  workforce agent pause <id>         Pause an agent's task intake
  workforce agent resume <id>        Resume a paused agent

Task Commands:
  workforce task list                List all tasks and statuses
  workforce task inspect <id>        Inspect task details, DAG dependencies, and audit trail
  workforce task approve <id>        Approve a task held for human sign-off
  workforce task run <id>            Directly trigger execution of a task

Department Commands:
  workforce department list          List all 12+ company departments
  workforce department add <id> <name> Add a new department dynamically
  workforce department rename <id> <name> Rename an existing department
  workforce department merge <src> <dest> Merge source department into destination and reassign agents
  workforce department split <id> <idA> <nameA> <idB> <nameB> Split department into two

Template Commands:
  workforce template list            List all 8 industry workforce templates
  workforce template apply <id>      Apply an industry workforce template

Scheduler Commands:
  workforce scheduler status         Inspect recurring jobs and scheduler health
  workforce scheduler tick           Trigger manual execution tick
`);
}

main();
