/**
 * Universal AI Workforce - Event Definitions
 * Standardized lifecycle and operational events across the enterprise system.
 */

export const EventTypes = {
  // Skill Lifecycle Events
  SKILL_ADDED: 'SKILL_ADDED',
  SKILL_UPDATED: 'SKILL_UPDATED',
  SKILL_VALIDATED: 'SKILL_VALIDATED',
  SKILL_APPROVED: 'SKILL_APPROVED',
  SKILL_ACTIVATED: 'SKILL_ACTIVATED',
  SKILL_DISABLED: 'SKILL_DISABLED',
  SKILL_REMOVED: 'SKILL_REMOVED',
  SKILL_REJECTED: 'SKILL_REJECTED',

  // Agent Lifecycle & Worker Scaling Events
  AGENT_CREATED: 'AGENT_CREATED',
  AGENT_UPDATED: 'AGENT_UPDATED',
  AGENT_PAUSED: 'AGENT_PAUSED',
  AGENT_RESUMED: 'AGENT_RESUMED',
  AGENT_RETIRED: 'AGENT_RETIRED',
  WORKER_SCALED_UP: 'WORKER_SCALED_UP',
  WORKER_SCALED_DOWN: 'WORKER_SCALED_DOWN',

  // Task & Orchestration Events
  GOAL_SUBMITTED: 'GOAL_SUBMITTED',
  TASK_CREATED: 'TASK_CREATED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  TASK_QUEUED: 'TASK_QUEUED',
  TASK_STARTED: 'TASK_STARTED',
  TASK_APPROVAL_REQUESTED: 'TASK_APPROVAL_REQUESTED',
  TASK_APPROVED: 'TASK_APPROVED',
  TASK_REJECTED: 'TASK_REJECTED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_FAILED: 'TASK_FAILED',
  TASK_RETRIED: 'TASK_RETRIED',
  TASK_RECOVERED: 'TASK_RECOVERED',

  // Governance & Security Events
  KILL_SWITCH_ENGAGED: 'KILL_SWITCH_ENGAGED',
  KILL_SWITCH_DISENGAGED: 'KILL_SWITCH_DISENGAGED',
  SECURITY_VIOLATION_BLOCKED: 'SECURITY_VIOLATION_BLOCKED',
  AUDIT_LOG_ENTRY: 'AUDIT_LOG_ENTRY'
};

export class WorkforceEvent {
  constructor(type, payload = {}, metadata = {}) {
    this.id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.type = type;
    this.timestamp = new Date().toISOString();
    this.payload = payload;
    this.metadata = {
      source: 'workforce_core',
      ...metadata
    };
  }
}
