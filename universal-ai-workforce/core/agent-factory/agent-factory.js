/**
 * Universal AI Workforce - Agent Factory & Worker Scaling Manager
 * Creates logical agents, attaches skills, manages worker lifecycle, and handles dynamic workload-based auto-scaling.
 */

import { EventTypes } from '../event-system/events.js';
import { globalEventBus } from '../event-system/event-bus.js';
import { globalAgentRegistry } from './agent-registry.js';
import { AgentConfiguration, WorkerInstance } from './agent-data-model.js';

export class AgentFactory {
  constructor(options = {}, agentRegistry = globalAgentRegistry, eventBus = globalEventBus) {
    this.registry = agentRegistry;
    this.eventBus = eventBus;
    this.workerPool = new Map(); // agentId -> Map(workerId -> WorkerInstance)
    this.scalingConfig = {
      tasksPerWorkerToScaleUp: options.tasksPerWorkerToScaleUp || 3,
      idleSecondsToScaleDown: options.idleSecondsToScaleDown || 60,
      minWorkersPerRole: options.minWorkersPerRole || 0,
      maxWorkersPerRole: options.maxWorkersPerRole || 10
    };
  }

  createAgent(agentConfig) {
    const id = agentConfig.id || `agt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const config = new AgentConfiguration({
      ...agentConfig,
      id
    });
    const saved = this.registry.register(config);
    this.workerPool.set(id, new Map());
    return saved;
  }

  createSpecialistAgent(params = {}) {
    const roleId = params.roleId || `specialist-${params.domain || 'general'}`;
    const id = `agt_${roleId}_${Math.random().toString(36).substring(2, 6)}`;
    const name = params.name || `${params.domainTitle || 'Specialist'} Agent`;

    const config = new AgentConfiguration({
      id,
      name,
      roleId,
      jobTitle: params.jobTitle || `${params.domainTitle || 'Domain'} Specialist`,
      departmentId: params.departmentId || 'engineering',
      reportingManagerId: params.reportingManagerId || 'cto',
      level: 'specialist',
      skills: params.skills || [],
      capabilities: params.capabilities || [],
      providerPreference: params.providerPreference || 'mock',
      permissions: ['execute_assigned_task'],
      approvalRequired: params.approvalRequired !== false,
      maxConcurrency: params.maxConcurrency || 2,
      budgetLimitUsd: params.budgetLimitUsd || 100.0
    });

    return this.registry.register(config);
  }

  attachSkillToAgent(agentId, skillDefinition) {
    const agent = this.registry.get(agentId);
    if (!agent) throw new Error(`Agent '${agentId}' not found.`);

    if (!agent.skills.includes(skillDefinition.id)) {
      agent.skills.push(skillDefinition.id);
    }

    // Merge new capabilities
    for (const cap of skillDefinition.capabilities || []) {
      if (!agent.capabilities.includes(cap)) {
        agent.capabilities.push(cap);
      }
    }

    // Update in registry to re-index capabilities
    this.registry.register(agent);
    return agent;
  }

  getWorkers(agentId) {
    if (!this.workerPool.has(agentId)) {
      this.workerPool.set(agentId, new Map());
    }
    return Array.from(this.workerPool.get(agentId).values());
  }

  scaleUpWorker(agentId, reason = 'Workload threshold exceeded') {
    const agent = this.registry.get(agentId);
    if (!agent) throw new Error(`Agent '${agentId}' not found.`);

    const workers = this.getWorkers(agentId);
    if (workers.length >= this.scalingConfig.maxWorkersPerRole) {
      return null; // Hit max scaling limit
    }

    const worker = new WorkerInstance({
      agentId,
      roleId: agent.roleId
    });

    this.workerPool.get(agentId).set(worker.workerId, worker);

    this.eventBus.publish(EventTypes.WORKER_SCALED_UP, {
      agentId,
      workerId: worker.workerId,
      activeWorkerCount: workers.length + 1,
      reason
    });

    return worker;
  }

  scaleDownWorker(agentId, workerId = null, reason = 'Workload decreased or idle timeout') {
    const pool = this.workerPool.get(agentId);
    if (!pool || pool.size <= this.scalingConfig.minWorkersPerRole) {
      return null;
    }

    let targetWorkerId = workerId;
    if (!targetWorkerId) {
      // Pick first idle worker
      for (const [id, worker] of pool.entries()) {
        if (worker.status === 'idle') {
          targetWorkerId = id;
          break;
        }
      }
    }

    if (!targetWorkerId) return null; // No idle worker to scale down safely

    const worker = pool.get(targetWorkerId);
    worker.status = 'stopped';
    pool.delete(targetWorkerId);

    this.eventBus.publish(EventTypes.WORKER_SCALED_DOWN, {
      agentId,
      workerId: targetWorkerId,
      activeWorkerCount: pool.size,
      reason
    });

    return worker;
  }

  evaluateWorkloadAndScale(agentId, queueLength) {
    const currentWorkers = this.getWorkers(agentId).length;
    const neededWorkers = Math.min(
      this.scalingConfig.maxWorkersPerRole,
      Math.max(1, Math.ceil(queueLength / this.scalingConfig.tasksPerWorkerToScaleUp))
    );

    if (neededWorkers > currentWorkers) {
      const added = [];
      for (let i = currentWorkers; i < neededWorkers; i++) {
        const wrk = this.scaleUpWorker(agentId, `Queue length is ${queueLength}, scaling to meet demand.`);
        if (wrk) added.push(wrk);
      }
      return { action: 'scaled_up', count: added.length, total: this.getWorkers(agentId).length };
    } else if (neededWorkers < currentWorkers && queueLength === 0) {
      const removed = [];
      for (let i = neededWorkers; i < currentWorkers; i++) {
        const wrk = this.scaleDownWorker(agentId, null, 'Queue is empty, scaling down idle workers.');
        if (wrk) removed.push(wrk);
      }
      return { action: 'scaled_down', count: removed.length, total: this.getWorkers(agentId).length };
    }

    return { action: 'unchanged', total: currentWorkers };
  }

  acquireIdleWorker(agentId) {
    const pool = this.workerPool.get(agentId);
    if (pool) {
      for (const worker of pool.values()) {
        if (worker.status === 'idle') {
          return worker;
        }
      }
    }
    // If no idle worker, try scaling up if allowed
    return this.scaleUpWorker(agentId, 'No idle worker available for immediate task');
  }
}

export const globalAgentFactory = new AgentFactory();
