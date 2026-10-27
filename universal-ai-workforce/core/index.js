/**
 * Universal AI Workforce - Core Module Entry Point
 * Exports all subsystems and handles snapshot persistence & recovery.
 */

import { globalOrganizationHierarchy } from './orchestrator/hierarchy.js';
import { globalSkillRegistry } from './skill-registry/skill-registry.js';
import { globalSkillLifecycleManager } from './skill-registry/skill-lifecycle.js';
import { SkillValidator } from './skill-registry/skill-validator.js';
import { globalAgentRegistry } from './agent-factory/agent-registry.js';
import { globalAgentFactory } from './agent-factory/agent-factory.js';
import { globalTaskEngine } from './task-engine/task-engine.js';
import { globalTaskQueue } from './task-engine/task-queue.js';
import { TaskDAG } from './task-engine/task-dag.js';
import { globalPolicyEngine } from './policy-engine/policy-engine.js';
import { globalEventBus } from './event-system/event-bus.js';
import { globalAIChiefExecutiveOrchestrator } from './orchestrator/ceo-orchestrator.js';
import { globalStorage } from '../storage/file-storage.js';
import { WorkforceScheduler, globalWorkforceScheduler } from './scheduler/workforce-scheduler.js';

export {
  globalOrganizationHierarchy,
  globalSkillRegistry,
  globalSkillLifecycleManager,
  SkillValidator,
  globalAgentRegistry,
  globalAgentFactory,
  globalTaskEngine,
  globalTaskQueue,
  TaskDAG,
  globalPolicyEngine,
  globalEventBus,
  globalAIChiefExecutiveOrchestrator,
  globalStorage,
  WorkforceScheduler,
  globalWorkforceScheduler
};

export async function saveWorkforceState() {
  const snapshot = {
    timestamp: new Date().toISOString(),
    departments: globalOrganizationHierarchy.listDepartments(),
    skills: globalSkillRegistry.list(),
    agents: globalAgentRegistry.list({}, { page: 1, pageSize: 10000 }).items,
    tasks: globalTaskEngine.listTasks(),
    killSwitchActive: globalPolicyEngine.isKillSwitchEngaged()
  };
  await globalStorage.saveState(snapshot);
  return snapshot;
}

export async function loadWorkforceState() {
  const state = await globalStorage.loadState();
  if (!state) return false;

  // Restore skills
  if (Array.isArray(state.skills)) {
    for (const sk of state.skills) {
      globalSkillRegistry.register(sk);
    }
  }

  // Restore agents
  if (Array.isArray(state.agents)) {
    for (const ag of state.agents) {
      globalAgentRegistry.register(ag);
    }
  }

  // Restore tasks
  if (Array.isArray(state.tasks)) {
    for (const tk of state.tasks) {
      globalTaskEngine.createTask(tk);
    }
  }

  // Restore policy engine state
  if (typeof state.killSwitchActive === 'boolean') {
    globalPolicyEngine.setKillSwitch(state.killSwitchActive);
  }

  return true;
}
