/**
 * Universal AI Workforce - Agent Data Models
 * Clean separation of concerns between Skill, Role Definition, Agent Configuration,
 * Worker Instance, Task Execution, and Human Approver.
 */

// 1. Skill Definition
export class SkillDefinition {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.version = data.version || '1.0.0';
    this.description = data.description || '';
    this.industry = data.industry || 'universal';
    this.capabilities = data.capabilities || [];
    this.dependencies = data.dependencies || { node: '>=18.0.0', tools: [], env: [], skills: [] };
    this.riskLevel = data.riskLevel || 'low';
    this.sensitiveActions = data.sensitiveActions || [];
    this.body = data.body || '';
  }
}

// 2. Agent Role Definition (Archetype / Blueprint)
export class AgentRoleDefinition {
  constructor(data = {}) {
    this.roleId = data.roleId;
    this.title = data.title;
    this.departmentId = data.departmentId;
    this.level = data.level || 'specialist'; // c_suite, director, manager, team_lead, specialist, worker
    this.standardCapabilities = data.standardCapabilities || [];
    this.requiredSkills = data.requiredSkills || [];
    this.defaultPermissions = data.defaultPermissions || ['execute_assigned_task'];
    this.approvalRequired = data.approvalRequired !== false;
  }
}

// 3. Agent Configuration (Concrete Logical Agent)
export class AgentConfiguration {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
    this.roleId = data.roleId;
    this.jobTitle = data.jobTitle;
    this.departmentId = data.departmentId;
    this.reportingManagerId = data.reportingManagerId || 'ceo';
    this.level = data.level || 'specialist';
    this.skills = Array.isArray(data.skills) ? [...data.skills] : [];
    this.capabilities = Array.isArray(data.capabilities) ? [...data.capabilities] : [];
    this.providerPreference = data.providerPreference || 'mock';
    this.model = data.model || 'default';
    this.permissions = data.permissions || ['execute_assigned_task'];
    this.approvalRequired = data.approvalRequired !== false;
    this.maxConcurrency = data.maxConcurrency || 1;
    this.budgetLimitUsd = data.budgetLimitUsd || 100.0;
    this.budgetUsedUsd = data.budgetUsedUsd || 0.0;
    this.status = data.status || 'idle'; // idle, busy, paused, retired, error
    this.metrics = {
      tasksCompleted: 0,
      tasksFailed: 0,
      totalRunTimeMs: 0,
      lastActiveAt: null,
      ...data.metrics
    };
    this.createdAt = data.createdAt || new Date().toISOString();
  }
}

// 4. Running Worker Instance (Ephemeral Execution Unit)
export class WorkerInstance {
  constructor(data = {}) {
    this.workerId = data.workerId || `wrk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    this.agentId = data.agentId;
    this.roleId = data.roleId;
    this.status = 'idle'; // idle, executing, terminating, stopped
    this.currentTaskId = null;
    this.startedAt = new Date().toISOString();
    this.lastHeartbeatAt = new Date().toISOString();
    this.tasksProcessed = 0;
  }

  assignTask(taskId) {
    this.currentTaskId = taskId;
    this.status = 'executing';
    this.lastHeartbeatAt = new Date().toISOString();
  }

  releaseTask() {
    this.currentTaskId = null;
    this.status = 'idle';
    this.tasksProcessed++;
    this.lastHeartbeatAt = new Date().toISOString();
  }
}

// 5. Task Execution
export class TaskExecution {
  constructor(data = {}) {
    this.id = data.id || `tsk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.title = data.title;
    this.description = data.description || '';
    this.goalId = data.goalId || null;
    this.departmentId = data.departmentId;
    this.assignedAgentId = data.assignedAgentId || null;
    this.requiredCapabilities = data.requiredCapabilities || [];
    this.dependencies = data.dependencies || [];
    this.priority = data.priority || 'medium'; // low, medium, high, urgent, critical
    this.status = data.status || 'pending';
    this.approvalState = {
      required: Boolean(data.approvalState?.required),
      actionType: data.approvalState?.actionType || null,
      status: data.approvalState?.status || 'none', // none, pending, approved, rejected
      requestedAt: null,
      approvedBy: null,
      approvedAt: null,
      notes: null,
      ...data.approvalState
    };
    this.deliverables = data.deliverables || [];
    this.retries = 0;
    this.maxRetries = data.maxRetries || 3;
    this.estimatedCostUsd = data.estimatedCostUsd || 0.0;
    this.actualCostUsd = 0.0;
    this.deadline = data.deadline || null;
    this.createdAt = new Date().toISOString();
    this.startedAt = null;
    this.completedAt = null;
    this.error = null;
    this.auditTrail = [];
  }

  logAudit(entry) {
    this.auditTrail.push(`[${new Date().toISOString()}] ${entry}`);
  }
}

// 6. Human Employee or Approver
export class HumanApprover {
  constructor(data = {}) {
    this.id = data.id || 'owner';
    this.name = data.name || 'Founder & CEO';
    this.email = data.email || 'founder@coderaksh.internal';
    this.role = data.role || 'founder';
    this.permissions = ['*'];
    this.notificationsEnabled = true;
  }
}
