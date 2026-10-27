/**
 * Universal AI Workforce - Task Engine
 * Handles task execution, worker assignment, budget tracking, approvals, retries, checkpointing, and recovery.
 */

import { EventTypes } from '../event-system/events.js';
import { globalEventBus } from '../event-system/event-bus.js';
import { globalPolicyEngine } from '../policy-engine/policy-engine.js';
import { globalAgentRegistry } from '../agent-factory/agent-registry.js';
import { globalAgentFactory } from '../agent-factory/agent-factory.js';
import { globalTaskQueue } from './task-queue.js';
import { TaskExecution } from '../agent-factory/agent-data-model.js';

export class TaskEngine {
  constructor(options = {}) {
    this.tasks = new Map(); // taskId -> TaskExecution
    this.policyEngine = options.policyEngine || globalPolicyEngine;
    this.agentRegistry = options.agentRegistry || globalAgentRegistry;
    this.agentFactory = options.agentFactory || globalAgentFactory;
    this.taskQueue = options.taskQueue || globalTaskQueue;
    this.eventBus = options.eventBus || globalEventBus;
    this.provider = options.provider || null; // Injected or dynamic
    this.checkpointStore = options.checkpointStore || null;
  }

  setProvider(provider) {
    this.provider = provider;
  }

  createTask(taskData) {
    const task = new TaskExecution(taskData);
    this.tasks.set(task.id, task);

    this.eventBus.publish(EventTypes.TASK_CREATED, {
      taskId: task.id,
      title: task.title,
      departmentId: task.departmentId,
      assignedAgentId: task.assignedAgentId
    });

    return task;
  }

  getTask(taskId) {
    return this.tasks.get(taskId);
  }

  listTasks(filter = {}) {
    let list = Array.from(this.tasks.values());
    if (filter.status) list = list.filter(t => t.status === filter.status);
    if (filter.departmentId) list = list.filter(t => t.departmentId === filter.departmentId);
    if (filter.assignedAgentId) list = list.filter(t => t.assignedAgentId === filter.assignedAgentId);
    if (filter.goalId) list = list.filter(t => t.goalId === filter.goalId);
    return list;
  }

  requestApproval(taskId, actionType = 'sensitive_operation', notes = '') {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task '${taskId}' not found.`);

    task.status = 'waiting_approval';
    task.approvalState = {
      required: true,
      actionType,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      notes
    };
    task.logAudit(`Approval requested for action '${actionType}': ${notes}`);

    this.eventBus.publish(EventTypes.TASK_APPROVAL_REQUESTED, {
      taskId: task.id,
      actionType,
      notes
    });

    return task;
  }

  approveTask(taskId, approverId = 'owner', notes = 'Approved by operator') {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task '${taskId}' not found.`);
    if (task.approvalState.status !== 'pending') {
      throw new Error(`Task '${taskId}' is not pending approval (current: ${task.approvalState.status})`);
    }

    task.approvalState.status = 'approved';
    task.approvalState.approvedBy = approverId;
    task.approvalState.approvedAt = new Date().toISOString();
    task.approvalState.notes = notes;
    task.status = 'pending'; // Ready to be queued or executed
    task.logAudit(`Task approved by ${approverId}: ${notes}`);

    this.eventBus.publish(EventTypes.TASK_APPROVED, {
      taskId: task.id,
      approvedBy: approverId
    });

    return task;
  }

  rejectTask(taskId, approverId = 'owner', reason = 'Rejected by operator') {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task '${taskId}' not found.`);

    task.approvalState.status = 'rejected';
    task.approvalState.approvedBy = approverId;
    task.status = 'cancelled';
    task.error = `Rejected: ${reason}`;
    task.logAudit(`Task rejected by ${approverId}: ${reason}`);

    this.eventBus.publish(EventTypes.TASK_REJECTED, {
      taskId: task.id,
      rejectedBy: approverId,
      reason
    });

    return task;
  }

  async executeTask(taskId) {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Task '${taskId}' not found.`);

    // Check Kill Switch
    this.policyEngine.assertExecutionAllowed({ taskId });

    // Check approval block
    if (task.approvalState.required && task.approvalState.status !== 'approved') {
      task.status = 'waiting_approval';
      throw new Error(`Execution blocked: Task '${taskId}' requires approval before execution.`);
    }

    // Agent assignment verification
    let agent = null;
    if (task.assignedAgentId) {
      agent = this.agentRegistry.get(task.assignedAgentId);
    }
    if (!agent) {
      // Auto-assign from matching capability
      if (task.requiredCapabilities.length > 0) {
        const matches = this.agentRegistry.findAgentsByCapability(task.requiredCapabilities[0]);
        if (matches.length > 0) {
          agent = matches[0];
          task.assignedAgentId = agent.id;
        }
      }
    }

    if (!agent) {
      task.status = 'failed';
      task.error = 'No agent available with required capabilities.';
      throw new Error(task.error);
    }

    // Budget check
    const costEstimate = task.estimatedCostUsd || 0.05;
    if ((agent.budgetUsedUsd + costEstimate) > agent.budgetLimitUsd) {
      task.status = 'blocked';
      task.error = `Agent '${agent.id}' exceeded budget limit ($${agent.budgetLimitUsd}).`;
      throw new Error(task.error);
    }

    // Concurrency / Worker acquisition
    const worker = this.agentFactory.acquireIdleWorker(agent.id);
    if (worker) {
      worker.assignTask(task.id);
    }

    task.status = 'running';
    task.startedAt = new Date().toISOString();
    task.logAudit(`Execution started with Agent '${agent.id}' (Worker: ${worker?.workerId || 'none'})`);
    this.taskQueue.registerActive(task, worker);

    try {
      let output = null;
      if (this.provider) {
        output = await this.provider.executePrompt({
          taskTitle: task.title,
          description: task.description,
          capabilities: task.requiredCapabilities,
          agentId: agent.id
        });
      } else {
        // Fallback default output
        output = {
          success: true,
          content: `Task '${task.title}' executed successfully.`,
          costUsd: costEstimate
        };
      }

      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.actualCostUsd = output.costUsd || costEstimate;
      agent.budgetUsedUsd += task.actualCostUsd;
      agent.metrics.tasksCompleted++;
      agent.metrics.lastActiveAt = task.completedAt;

      task.deliverables.push({
        type: 'report',
        title: `${task.title} Deliverable`,
        content: output.content,
        timestamp: task.completedAt
      });
      task.logAudit(`Completed successfully. Cost: $${task.actualCostUsd}`);

      this.eventBus.publish(EventTypes.TASK_COMPLETED, {
        taskId: task.id,
        agentId: agent.id,
        costUsd: task.actualCostUsd
      });

      return task;
    } catch (err) {
      task.retries++;
      task.error = err.message;
      agent.metrics.tasksFailed++;
      task.logAudit(`Execution attempt failed (attempt ${task.retries}): ${err.message}`);

      if (task.retries <= task.maxRetries) {
        task.status = 'pending';
        this.eventBus.publish(EventTypes.TASK_RETRIED, {
          taskId: task.id,
          attempt: task.retries,
          error: err.message
        });
      } else {
        task.status = 'failed';
        this.eventBus.publish(EventTypes.TASK_FAILED, {
          taskId: task.id,
          error: err.message
        });
      }
      throw err;
    } finally {
      this.taskQueue.releaseActive(task.id);
      if (worker) {
        worker.releaseTask();
      }
    }
  }

  recoverInterruptedTasks() {
    const recovered = [];
    for (const task of this.tasks.values()) {
      if (task.status === 'running') {
        task.status = 'pending';
        task.logAudit('Recovered from interrupted running state after restart/crash.');
        this.eventBus.publish(EventTypes.TASK_RECOVERED, { taskId: task.id });
        recovered.push(task);
      }
    }
    return recovered;
  }
}

export const globalTaskEngine = new TaskEngine();
