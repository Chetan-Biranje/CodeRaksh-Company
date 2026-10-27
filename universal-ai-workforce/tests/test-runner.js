/**
 * Universal AI Workforce - Comprehensive Automated Test Runner
 * Validates all 18 mandatory requirements specified in Master Build Prompt Section 13.
 */

import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Import core modules
import { SkillValidator } from '../core/skill-registry/skill-validator.js';
import { SkillRegistry } from '../core/skill-registry/skill-registry.js';
import { SkillLifecycleManager } from '../core/skill-registry/skill-lifecycle.js';
import { AgentRegistry } from '../core/agent-factory/agent-registry.js';
import { AgentFactory } from '../core/agent-factory/agent-factory.js';
import { TaskEngine } from '../core/task-engine/task-engine.js';
import { TaskDAG } from '../core/task-engine/task-dag.js';
import { TaskQueue } from '../core/task-engine/task-queue.js';
import { PolicyEngine } from '../core/policy-engine/policy-engine.js';
import { EventBus } from '../core/event-system/event-bus.js';
import { AIChiefExecutiveOrchestrator } from '../core/orchestrator/ceo-orchestrator.js';
import { OrganizationHierarchy } from '../core/orchestrator/hierarchy.js';
import { MockProvider } from '../providers/mock-provider.js';
import { WorkforceScheduler } from '../core/scheduler/workforce-scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export async function runAllTests() {
  const suites = [
    { id: 1, name: 'Adding and validating a new skill', fn: test01_AddAndValidateSkill },
    { id: 2, name: 'Attaching a skill to an existing agent', fn: test02_AttachSkillToExistingAgent },
    { id: 3, name: 'Creating a new specialist agent when justified', fn: test03_CreateSpecialistAgentWhenJustified },
    { id: 4, name: 'Detecting duplicate capabilities', fn: test04_DetectDuplicateCapabilities },
    { id: 5, name: 'Blocking activation when dependencies are missing', fn: test05_BlockActivationOnMissingDeps },
    { id: 6, name: 'Revalidating updated skills', fn: test06_RevalidateUpdatedSkills },
    { id: 7, name: 'Safely disabling or removing skills', fn: test07_SafeDisableOrRemoveSkills },
    { id: 8, name: 'Creating and completing a task', fn: test08_CreateAndCompleteTask },
    { id: 9, name: 'Delegating tasks through the organization hierarchy', fn: test09_HierarchicalTaskDelegation },
    { id: 10, name: 'Preventing infinite delegation and circular dependencies', fn: test10_PreventCircularDependencies },
    { id: 11, name: 'Enforcing approval policies for sensitive operations', fn: test11_EnforceApprovalPolicies },
    { id: 12, name: 'Protecting secrets from logs and event payloads', fn: test12_ProtectSecretsFromLogs },
    { id: 13, name: 'Scaling workers under increased workload', fn: test13_ScaleWorkersUnderWorkload },
    { id: 14, name: 'Respecting concurrency and budget limits', fn: test14_RespectConcurrencyAndBudgetLimits },
    { id: 15, name: 'Recovering after an interrupted task', fn: test15_RecoverInterruptedTasks },
    { id: 16, name: 'Running without real credentials using mock provider', fn: test16_RunMockProviderOffline },
    { id: 17, name: 'Handling provider errors and rate limits with retries', fn: test17_HandleProviderErrorsAndRateLimits },
    { id: 18, name: 'Supporting 1,000 logical agent records in realistic load test', fn: test18_LoadTest1000Agents },
    { id: 19, name: 'Dynamic Department restructuring (merging and splitting)', fn: test19_DynamicDepartmentRestructuring },
    { id: 20, name: 'Workforce Scheduler periodic dispatch and deadline watchdog', fn: test20_SchedulerAndDeadlineWatchdog },
    { id: 21, name: 'Industry workforce template application and agent provisioning', fn: test21_IndustryTemplateProvisioning }
  ];

  console.log(`========================================================================================`);
  console.log(`🧪 UNIVERSAL AI WORKFORCE — 21 COMPREHENSIVE VERIFICATION TEST SUITES`);
  console.log(`========================================================================================\n`);

  let passedCount = 0;
  let failedCount = 0;
  const results = [];

  for (const suite of suites) {
    const startTime = Date.now();
    try {
      await suite.fn();
      const elapsed = Date.now() - startTime;
      passedCount++;
      results.push({ id: suite.id, name: suite.name, status: 'PASSED', elapsed });
      console.log(`  ✅ Test ${String(suite.id).padStart(2, '0')}: ${suite.name} (${elapsed}ms)`);
    } catch (err) {
      const elapsed = Date.now() - startTime;
      failedCount++;
      results.push({ id: suite.id, name: suite.name, status: 'FAILED', elapsed, error: err.message });
      console.log(`  ❌ Test ${String(suite.id).padStart(2, '0')}: ${suite.name} (${elapsed}ms)`);
      console.log(`     Error: ${err.message}`);
    }
  }

  console.log(`\n========================================================================================`);
  console.log(`📊 FINAL TEST RUN RESULTS: ${passedCount}/${suites.length} Passed (${failedCount} Failed)`);
  console.log(`========================================================================================\n`);

  return { passedCount, failedCount, results };
}

// ---------------------------------------------------------------------------
// TEST 1: Adding and validating a new skill
// ---------------------------------------------------------------------------
async function test01_AddAndValidateSkill() {
  const validator = new SkillValidator();
  const rawSkill = {
    id: 'test-code-reviewer',
    name: 'Code Reviewer',
    version: '1.0.0',
    description: 'Autonomous code review for pull requests and stylistic checks.',
    capabilities: ['code_review', 'style_check'],
    riskLevel: 'low'
  };

  const validation = validator.validateStructure(rawSkill);
  assert.strictEqual(validation.isValid, true, 'Skill structure must be valid');
  assert.strictEqual(validation.errors.length, 0);

  const registry = new SkillRegistry();
  const registered = registry.register(rawSkill);
  assert.strictEqual(registered.id, 'test-code-reviewer');
  assert.strictEqual(registry.has('test-code-reviewer'), true);
}

// ---------------------------------------------------------------------------
// TEST 2: Attaching a skill to an existing agent
// ---------------------------------------------------------------------------
async function test02_AttachSkillToExistingAgent() {
  const agentRegistry = new AgentRegistry();
  const agentFactory = new AgentFactory({}, agentRegistry);

  const agent = agentFactory.createAgent({
    id: 'agt_dev_01',
    name: 'Backend Developer Agent',
    roleId: 'backend_dev',
    departmentId: 'engineering',
    capabilities: ['api_development']
  });

  const newSkill = {
    id: 'docker-optimizer',
    name: 'Docker Optimizer',
    capabilities: ['container_optimization']
  };

  agentFactory.attachSkillToAgent(agent.id, newSkill);
  const updatedAgent = agentRegistry.get('agt_dev_01');

  assert.ok(updatedAgent.skills.includes('docker-optimizer'), 'Skill must be attached to agent skills list');
  assert.ok(updatedAgent.capabilities.includes('container_optimization'), 'Agent must inherit skill capabilities');
}

// ---------------------------------------------------------------------------
// TEST 3: Creating a new specialist agent when justified
// ---------------------------------------------------------------------------
async function test03_CreateSpecialistAgentWhenJustified() {
  const agentRegistry = new AgentRegistry();
  const agentFactory = new AgentFactory({}, agentRegistry);
  const skillRegistry = new SkillRegistry();
  const lifecycle = new SkillLifecycleManager({
    agentRegistry,
    agentFactory,
    skillRegistry
  });

  const novelSkill = {
    id: 'quantum-cryptography-audit',
    name: 'Quantum Cryptography Audit',
    version: '1.0.0',
    description: 'Post-quantum cryptographic algorithm resilience verification.',
    capabilities: ['pqc_algorithm_verification'],
    riskLevel: 'high'
  };

  const result = await lifecycle.processSkill(novelSkill);
  assert.strictEqual(result.decision.action, 'create_specialist_agent', 'Must create specialist for distinct responsibility');
  assert.ok(result.assignedAgent, 'Specialist agent must be returned');
  assert.ok(result.assignedAgent.capabilities.includes('pqc_algorithm_verification'));
}

// ---------------------------------------------------------------------------
// TEST 4: Detecting duplicate capabilities
// ---------------------------------------------------------------------------
async function test04_DetectDuplicateCapabilities() {
  const skillRegistry = new SkillRegistry();
  skillRegistry.register({
    id: 'seo-optimizer-v1',
    name: 'SEO Optimizer v1',
    capabilities: ['keyword_research', 'serp_analysis'],
    status: 'active'
  });

  const duplicateSkill = {
    id: 'seo-optimizer-copy',
    name: 'SEO Optimizer Copy',
    capabilities: ['keyword_research', 'serp_analysis']
  };

  const duplicates = skillRegistry.findDuplicates(duplicateSkill.capabilities, duplicateSkill.id);
  assert.strictEqual(duplicates.length, 1, 'Should find 1 duplicate');
  assert.strictEqual(duplicates[0].type, 'exact_duplicate');
  assert.strictEqual(duplicates[0].skillId, 'seo-optimizer-v1');
}

// ---------------------------------------------------------------------------
// TEST 5: Blocking activation when dependencies are missing
// ---------------------------------------------------------------------------
async function test05_BlockActivationOnMissingDeps() {
  const lifecycle = new SkillLifecycleManager({
    agentRegistry: new AgentRegistry(),
    agentFactory: new AgentFactory(),
    skillRegistry: new SkillRegistry()
  });

  const skillWithMissingDeps = {
    id: 'k8s-cluster-scaler',
    name: 'K8s Cluster Scaler',
    version: '1.0.0',
    description: 'Scales production kubernetes clusters.',
    capabilities: ['k8s_scale'],
    dependencies: {
      tools: ['non_existent_fake_cli_tool_xyz_123'],
      env: ['MISSING_MANDATORY_SECRET_KEY_XYZ']
    },
    riskLevel: 'high'
  };

  const outcome = await lifecycle.processSkill(skillWithMissingDeps);
  assert.strictEqual(outcome.skill.status, 'pending_deps', 'Must block activation and set status to pending_deps');
  assert.strictEqual(outcome.decision.action, 'keep_pending');
}

// ---------------------------------------------------------------------------
// TEST 6: Revalidating updated skills
// ---------------------------------------------------------------------------
async function test06_RevalidateUpdatedSkills() {
  const lifecycle = new SkillLifecycleManager({
    agentRegistry: new AgentRegistry(),
    agentFactory: new AgentFactory(),
    skillRegistry: new SkillRegistry()
  });

  const initial = {
    id: 'payment-processor',
    name: 'Payment Processor',
    version: '1.0.0',
    description: 'Processes credit card payments.',
    capabilities: ['card_charge'],
    riskLevel: 'medium'
  };
  await lifecycle.processSkill(initial);

  // Update with higher risk and new capabilities
  const updated = {
    id: 'payment-processor',
    name: 'Payment Processor v2',
    version: '2.0.0',
    description: 'Processes credit card payments and cross-border bank wires.',
    capabilities: ['card_charge', 'wire_transfer'],
    riskLevel: 'high'
  };

  const outcome = await lifecycle.processSkill(updated);
  assert.strictEqual(outcome.skill.version, '2.0.0');
  assert.ok(outcome.skill.capabilities.includes('wire_transfer'));
  assert.strictEqual(outcome.skill.riskLevel, 'high');
}

// ---------------------------------------------------------------------------
// TEST 7: Safely disabling or removing skills
// ---------------------------------------------------------------------------
async function test07_SafeDisableOrRemoveSkills() {
  const skillRegistry = new SkillRegistry();
  skillRegistry.register({
    id: 'legacy-ftp-uploader',
    name: 'Legacy FTP',
    capabilities: ['ftp_upload'],
    status: 'active'
  });

  assert.strictEqual(skillRegistry.findByCapability('ftp_upload').length, 1);

  // Disable skill
  skillRegistry.disable('legacy-ftp-uploader', 'Deprecating FTP in favor of SFTP');
  assert.strictEqual(skillRegistry.get('legacy-ftp-uploader').status, 'disabled');
  assert.strictEqual(skillRegistry.findByCapability('ftp_upload').length, 0, 'Disabled skills must not match capability queries');

  // Remove skill
  skillRegistry.remove('legacy-ftp-uploader');
  assert.strictEqual(skillRegistry.get('legacy-ftp-uploader').status, 'removed');
}

// ---------------------------------------------------------------------------
// TEST 8: Creating and completing a task
// ---------------------------------------------------------------------------
async function test08_CreateAndCompleteTask() {
  const agentRegistry = new AgentRegistry();
  const agentFactory = new AgentFactory({}, agentRegistry);
  const taskEngine = new TaskEngine({ agentRegistry, agentFactory });
  const mockProvider = new MockProvider({ latencyMs: 1 });
  taskEngine.setProvider(mockProvider);

  const agent = agentFactory.createAgent({
    id: 'agt_writer_01',
    name: 'Copywriter Agent',
    departmentId: 'marketing',
    capabilities: ['copywriting']
  });

  const task = taskEngine.createTask({
    title: 'Draft Product Announcement',
    departmentId: 'marketing',
    assignedAgentId: agent.id,
    requiredCapabilities: ['copywriting']
  });

  assert.strictEqual(task.status, 'pending');
  const completed = await taskEngine.executeTask(task.id);

  assert.strictEqual(completed.status, 'completed');
  assert.strictEqual(completed.deliverables.length, 1);
  assert.ok(completed.deliverables[0].content.includes('Draft Product Announcement'));
}

// ---------------------------------------------------------------------------
// TEST 9: Delegating tasks through the organization hierarchy
// ---------------------------------------------------------------------------
async function test09_HierarchicalTaskDelegation() {
  const hierarchy = new OrganizationHierarchy();
  const agentRegistry = new AgentRegistry();
  const agentFactory = new AgentFactory({}, agentRegistry);
  const taskEngine = new TaskEngine({ agentRegistry, agentFactory });
  const mockProvider = new MockProvider({ latencyMs: 1 });
  taskEngine.setProvider(mockProvider);

  const ceo = new AIChiefExecutiveOrchestrator({
    hierarchy,
    agentRegistry,
    agentFactory,
    taskEngine
  });

  const goalResult = await ceo.submitGoal('Launch a new online store for retail electronics');
  assert.strictEqual(goalResult.status, 'completed');
  assert.ok(goalResult.tasks.length >= 3, 'Must decompose into at least 3 department subtasks');
  assert.ok(goalResult.report.includes('EXECUTIVE STATUS BRIEFING'));
}

// ---------------------------------------------------------------------------
// TEST 10: Preventing infinite delegation and circular dependencies
// ---------------------------------------------------------------------------
async function test10_PreventCircularDependencies() {
  const dag = new TaskDAG();
  dag.addTask({ id: 'task_A', dependencies: [] });
  dag.addTask({ id: 'task_B', dependencies: ['task_A'] });
  dag.addTask({ id: 'task_C', dependencies: ['task_B'] });

  // Introduce circular dependency: task_A depends on task_C
  let caught = false;
  try {
    dag.addDependency('task_A', 'task_C');
  } catch (err) {
    caught = true;
    assert.ok(err.message.includes('Circular dependency detected'), 'Must detect cycle');
  }
  assert.strictEqual(caught, true, 'Must throw error on circular dependency');
}

// ---------------------------------------------------------------------------
// TEST 11: Enforcing approval policies for sensitive operations
// ---------------------------------------------------------------------------
async function test11_EnforceApprovalPolicies() {
  const policyEngine = new PolicyEngine({
    sensitiveActionTypes: ['delete_production_database', 'spend_money']
  });
  const agentRegistry = new AgentRegistry();
  const agentFactory = new AgentFactory({}, agentRegistry);
  const taskEngine = new TaskEngine({ policyEngine, agentRegistry, agentFactory });

  const agent = agentFactory.createAgent({
    id: 'agt_db_admin',
    departmentId: 'engineering',
    capabilities: ['database_admin']
  });

  const sensitiveTask = taskEngine.createTask({
    title: 'Purge Customer Records',
    departmentId: 'engineering',
    assignedAgentId: agent.id,
    approvalState: { required: true, actionType: 'delete_production_database' }
  });

  // Attempt to execute without approval -> must fail
  let blocked = false;
  try {
    await taskEngine.executeTask(sensitiveTask.id);
  } catch (err) {
    blocked = true;
    assert.ok(err.message.includes('requires approval'));
  }
  assert.strictEqual(blocked, true, 'Task must be blocked without approval');

  // Request & Grant Approval
  taskEngine.requestApproval(sensitiveTask.id, 'delete_production_database', 'Quarterly data purge');
  taskEngine.approveTask(sensitiveTask.id, 'founder_user', 'Authorized by compliance');

  // Re-attempt execution -> must succeed
  taskEngine.setProvider(new MockProvider({ latencyMs: 1 }));
  const completed = await taskEngine.executeTask(sensitiveTask.id);
  assert.strictEqual(completed.status, 'completed');
  assert.strictEqual(completed.approvalState.status, 'approved');
}

// ---------------------------------------------------------------------------
// TEST 12: Protecting secrets from logs and event payloads
// ---------------------------------------------------------------------------
async function test12_ProtectSecretsFromLogs() {
  const eventBus = new EventBus({ maxMemoryLogs: 50 });
  const sampleSecret = 'sk-proj-1234567890abcdef1234567890';
  const sampleApiKey = 'AIzaSyA1234567890abcdef1234567890abcde';

  await eventBus.publish('SAMPLE_EVENT', {
    message: `Attempting connection with key ${sampleSecret} and google key ${sampleApiKey}`,
    password: 'super_secret_db_password_xyz'
  });

  const logs = eventBus.getRecentLogs(1);
  const loggedPayload = JSON.stringify(logs[0].payload);

  assert.strictEqual(loggedPayload.includes(sampleSecret), false, 'API secret must be redacted');
  assert.strictEqual(loggedPayload.includes(sampleApiKey), false, 'Google API key must be redacted');
  assert.strictEqual(loggedPayload.includes('super_secret_db_password_xyz'), false, 'Password field must be redacted');
  assert.ok(loggedPayload.includes('[REDACTED_SECRET]'), 'Must replace secrets with [REDACTED_SECRET]');
}

// ---------------------------------------------------------------------------
// TEST 13: Scaling workers under increased workload
// ---------------------------------------------------------------------------
async function test13_ScaleWorkersUnderWorkload() {
  const agentRegistry = new AgentRegistry();
  const agentFactory = new AgentFactory({
    tasksPerWorkerToScaleUp: 2,
    maxWorkersPerRole: 5
  }, agentRegistry);

  const agent = agentFactory.createAgent({
    id: 'agt_scaler_01',
    roleId: 'batch_worker',
    departmentId: 'operations'
  });

  // Zero queue -> 0 or 1 worker
  assert.strictEqual(agentFactory.getWorkers(agent.id).length, 0);

  // 6 tasks in queue -> with threshold 2, should scale to 3 workers
  const scaleUp = agentFactory.evaluateWorkloadAndScale(agent.id, 6);
  assert.strictEqual(scaleUp.action, 'scaled_up');
  assert.strictEqual(agentFactory.getWorkers(agent.id).length, 3);

  // Drain queue to 0 -> should scale down idle workers
  const scaleDown = agentFactory.evaluateWorkloadAndScale(agent.id, 0);
  assert.strictEqual(scaleDown.action, 'scaled_down');
}

// ---------------------------------------------------------------------------
// TEST 14: Respecting concurrency and budget limits
// ---------------------------------------------------------------------------
async function test14_RespectConcurrencyAndBudgetLimits() {
  const agentRegistry = new AgentRegistry();
  const agentFactory = new AgentFactory({}, agentRegistry);
  const taskEngine = new TaskEngine({ agentRegistry, agentFactory });
  taskEngine.setProvider(new MockProvider({ latencyMs: 1 }));

  const tightBudgetAgent = agentFactory.createAgent({
    id: 'agt_frugal_01',
    budgetLimitUsd: 0.10, // Only $0.10 limit
    budgetUsedUsd: 0.08,
    departmentId: 'finance'
  });

  // Task estimated cost is $0.05, which exceeds remaining $0.02
  const expensiveTask = taskEngine.createTask({
    title: 'Expensive Model Inference',
    departmentId: 'finance',
    assignedAgentId: tightBudgetAgent.id,
    estimatedCostUsd: 0.05
  });

  let blocked = false;
  try {
    await taskEngine.executeTask(expensiveTask.id);
  } catch (err) {
    blocked = true;
    assert.ok(err.message.includes('exceeded budget limit'));
  }
  assert.strictEqual(blocked, true, 'Task must be blocked when budget limit is exceeded');
}

// ---------------------------------------------------------------------------
// TEST 15: Recovering after an interrupted task
// ---------------------------------------------------------------------------
async function test15_RecoverInterruptedTasks() {
  const taskEngine = new TaskEngine();

  // Simulate a task that was left in "running" status when process died
  const interruptedTask = taskEngine.createTask({
    id: 'tsk_crashed_01',
    title: 'Long Running Calculation',
    departmentId: 'engineering'
  });
  interruptedTask.status = 'running';

  const recovered = taskEngine.recoverInterruptedTasks();
  assert.strictEqual(recovered.length, 1);
  assert.strictEqual(recovered[0].id, 'tsk_crashed_01');
  assert.strictEqual(recovered[0].status, 'pending', 'Interrupted task must be restored to pending for re-execution');
}

// ---------------------------------------------------------------------------
// TEST 16: Running without real provider credentials using mock providers
// ---------------------------------------------------------------------------
async function test16_RunMockProviderOffline() {
  const mock = new MockProvider({ latencyMs: 2 });
  assert.strictEqual(mock.isAvailable(), true);

  const result = await mock.executePrompt({
    taskTitle: 'Offline Unit Test',
    description: 'Verify deterministic mock execution without network or keys',
    capabilities: ['offline_testing']
  });

  assert.strictEqual(result.success, true);
  assert.strictEqual(result.provider, 'mock');
  assert.ok(result.costUsd > 0);
  assert.ok(result.content.includes('Offline Unit Test'));
}

// ---------------------------------------------------------------------------
// TEST 17: Handling provider errors and rate limits with retries
// ---------------------------------------------------------------------------
async function test17_HandleProviderErrorsAndRateLimits() {
  const agentRegistry = new AgentRegistry();
  const agentFactory = new AgentFactory({}, agentRegistry);
  const taskEngine = new TaskEngine({ agentRegistry, agentFactory });

  const agent = agentFactory.createAgent({
    id: 'agt_retry_01',
    departmentId: 'support',
    capabilities: ['support_response']
  });

  // Mock provider that fails the first attempt with 503, but succeeds on 2nd attempt
  const failingProvider = new MockProvider({ latencyMs: 1, errorCount: 1 });
  taskEngine.setProvider(failingProvider);

  const retryTask = taskEngine.createTask({
    title: 'Transient Error Task',
    departmentId: 'support',
    assignedAgentId: agent.id,
    maxRetries: 2
  });

  // 1st attempt fails
  try {
    await taskEngine.executeTask(retryTask.id);
  } catch {
    // Expected transient failure
  }
  assert.strictEqual(retryTask.retries, 1, 'Retry count must be incremented');
  assert.strictEqual(retryTask.status, 'pending', 'Status must be set back to pending for retry');

  // 2nd attempt succeeds
  const completed = await taskEngine.executeTask(retryTask.id);
  assert.strictEqual(completed.status, 'completed', 'Task must complete after transient retry');
}

// ---------------------------------------------------------------------------
// TEST 18: Supporting 1,000 logical agent records in a realistic load test
// ---------------------------------------------------------------------------
async function test18_LoadTest1000Agents() {
  const agentRegistry = new AgentRegistry();
  const agentFactory = new AgentFactory({}, agentRegistry);

  const departments = ['engineering', 'marketing', 'sales', 'support', 'finance', 'operations', 'cybersecurity'];
  const capabilitiesPool = [
    'code_review', 'seo_audit', 'lead_qualification', 'ticket_triage',
    'invoice_reconciliation', 'process_automation', 'vulnerability_sweep',
    'data_analysis', 'api_integration', 'content_drafting'
  ];

  const startTime = Date.now();
  const TARGET_COUNT = 1000;

  for (let i = 1; i <= TARGET_COUNT; i++) {
    const dept = departments[i % departments.length];
    const cap1 = capabilitiesPool[i % capabilitiesPool.length];
    const cap2 = capabilitiesPool[(i + 3) % capabilitiesPool.length];

    agentFactory.createAgent({
      id: `agt_scale_${String(i).padStart(4, '0')}`,
      name: `Scale Agent ${i}`,
      roleId: `role_${dept}_${i % 10}`,
      jobTitle: `Specialist Level ${1 + (i % 5)}`,
      departmentId: dept,
      reportingManagerId: `manager_${dept}`,
      capabilities: [cap1, cap2],
      skills: [`skill_${cap1}`],
      budgetLimitUsd: 100.0
    });
  }

  const creationTime = Date.now() - startTime;
  assert.strictEqual(agentRegistry.count(), TARGET_COUNT, 'Must hold 1,000 logical agent records');

  // Test pagination performance on 1,000 records
  const queryStart = Date.now();
  const pageResult = agentRegistry.list({ departmentId: 'engineering' }, { page: 2, pageSize: 20 });
  const queryTime = Date.now() - queryStart;

  assert.strictEqual(pageResult.items.length, 20);
  assert.ok(queryTime < 25, `Pagination must execute in < 25ms (was ${queryTime}ms)`);

  // Test capability lookup on 1,000 records
  const capQueryStart = Date.now();
  const matching = agentRegistry.findAgentsByCapability('vulnerability_sweep');
  const capQueryTime = Date.now() - capQueryStart;

  assert.ok(matching.length > 50, 'Capability index must instantly resolve all matching agents');
  assert.ok(capQueryTime < 15, `Indexed capability query must execute in < 15ms (was ${capQueryTime}ms)`);

  console.log(`     [Load Test Metrics] Created 1,000 agents in ${creationTime}ms. Filter query: ${queryTime}ms. Index query: ${capQueryTime}ms.`);
}

// ---------------------------------------------------------------------------
// TEST 19: Dynamic Department restructuring (merging and splitting)
// ---------------------------------------------------------------------------
async function test19_DynamicDepartmentRestructuring() {
  const hierarchy = new OrganizationHierarchy();
  const agentRegistry = new AgentRegistry();
  const agentFactory = new AgentFactory({}, agentRegistry);

  // Add source department
  hierarchy.addDepartment({ id: 'mobile_dev', name: 'Mobile Applications Team' });
  const dev1 = agentFactory.createAgent({ id: 'agt_mob_01', departmentId: 'mobile_dev', capabilities: ['ios_dev'] });
  const dev2 = agentFactory.createAgent({ id: 'agt_mob_02', departmentId: 'mobile_dev', capabilities: ['android_dev'] });

  // Merge mobile_dev into engineering
  const mergeResult = hierarchy.mergeDepartments('mobile_dev', 'engineering', agentRegistry);
  assert.strictEqual(mergeResult.success, true);
  assert.strictEqual(mergeResult.reassignedAgents, 2);
  assert.strictEqual(agentRegistry.get('agt_mob_01').departmentId, 'engineering');
  assert.strictEqual(agentRegistry.get('agt_mob_02').departmentId, 'engineering');
  assert.strictEqual(hierarchy.getDepartment('mobile_dev').active, false);

  // Split engineering into platform_core and product_apps
  const splitResult = hierarchy.splitDepartment(
    'engineering',
    { id: 'platform_core', name: 'Core Platform Engineering' },
    { id: 'product_apps', name: 'Product Applications' },
    agentRegistry
  );
  assert.strictEqual(splitResult.success, true);
  assert.strictEqual(splitResult.createdDepartments.length, 2);
  assert.strictEqual(hierarchy.getDepartment('platform_core').active, true);
  assert.strictEqual(hierarchy.getDepartment('product_apps').active, true);
}

// ---------------------------------------------------------------------------
// TEST 20: Workforce Scheduler periodic dispatch and deadline watchdog
// ---------------------------------------------------------------------------
async function test20_SchedulerAndDeadlineWatchdog() {
  const taskQueue = new TaskQueue();
  const agentRegistry = new AgentRegistry();
  const agentFactory = new AgentFactory({}, agentRegistry);
  const taskEngine = new TaskEngine({ taskQueue, agentRegistry, agentFactory });
  taskEngine.setProvider(new MockProvider({ latencyMs: 1 }));

  const scheduler = new WorkforceScheduler({ taskQueue, taskEngine });

  // Register recurring job
  scheduler.registerRecurringJob({
    id: 'nightly_security_sweep',
    name: 'Nightly Vulnerability Scan',
    departmentId: 'cybersecurity',
    intervalMs: 50,
    initialDelayMs: 0,
    taskBlueprint: {
      description: 'Run automated dependency vulnerability sweep',
      requiredCapabilities: ['vulnerability_scan']
    }
  });

  // Tick scheduler -> triggers recurring job, enqueues task and immediately dispatches it
  const tick1 = await scheduler.tick();
  assert.strictEqual(tick1.triggeredJobs.length, 1);
  assert.strictEqual(tick1.triggeredJobs[0].jobId, 'nightly_security_sweep');
  assert.strictEqual(tick1.dispatchedTasks.length, 1);

  // Test deadline watchdog
  const expiredTask = taskEngine.createTask({
    id: 'tsk_deadline_expired',
    title: 'Urgent Client Response',
    departmentId: 'support',
    deadline: new Date(Date.now() - 5000).toISOString() // 5s in past
  });

  const expiredCount = scheduler.checkDeadlines(Date.now());
  assert.strictEqual(expiredCount, 1);
  assert.strictEqual(expiredTask.status, 'failed');
  assert.ok(expiredTask.error.includes('exceeded deadline'));
}

// ---------------------------------------------------------------------------
// TEST 21: Industry workforce template application and agent provisioning
// ---------------------------------------------------------------------------
async function test21_IndustryTemplateProvisioning() {
  const template = {
    id: 'fintech-test',
    name: 'Fintech Template',
    targetIndustry: 'fintech',
    departments: ['finance', 'cybersecurity'],
    recommendedAgents: [
      {
        id: 'agt_fin_aml_specialist',
        name: 'AML Specialist Agent',
        departmentId: 'finance',
        jobTitle: 'AML Analyst',
        capabilities: ['aml_compliance', 'kyc_review']
      }
    ]
  };

  const agentRegistry = new AgentRegistry();
  const agentFactory = new AgentFactory({}, agentRegistry);
  const hierarchy = new OrganizationHierarchy();

  for (const deptId of template.departments) {
    if (!hierarchy.getDepartment(deptId)) {
      hierarchy.addDepartment({ id: deptId, name: `${deptId} Dept` });
    }
  }

  for (const ag of template.recommendedAgents) {
    agentFactory.createAgent(ag);
  }

  assert.strictEqual(agentRegistry.has('agt_fin_aml_specialist'), true);
  const found = agentRegistry.findAgentsByCapability('aml_compliance');
  assert.strictEqual(found.length, 1);
  assert.strictEqual(found[0].jobTitle, 'AML Analyst');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runAllTests().then(res => {
    process.exit(res.failedCount === 0 ? 0 : 1);
  });
}
