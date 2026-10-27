/**
 * Universal AI Workforce - Policy & Security Engine
 * Enforces zero-trust boundaries, sensitive action approvals, RBAC, and kill switches.
 */

import { EventTypes } from '../event-system/events.js';
import { globalEventBus } from '../event-system/event-bus.js';

export class PolicyEngine {
  constructor(policies = {}, eventBus = globalEventBus) {
    this.eventBus = eventBus;
    this.killSwitchActive = Boolean(policies.killSwitchActive);
    this.sensitiveActions = new Set(policies.sensitiveActionTypes || [
      'external_email',
      'external_post',
      'spend_money',
      'delete_data',
      'permission_change',
      'destructive_command',
      'access_production_db',
      'export_customer_data'
    ]);
    this.roles = policies.roles || {
      founder: { permissions: ['*'], canBypassApproval: true },
      ai_ceo: { permissions: ['orchestrate', 'delegate', 'view_all', 'request_approval'], canBypassApproval: false },
      department_manager: { permissions: ['manage_department', 'assign_task', 'review_deliverable'], canBypassApproval: false },
      specialist_agent: { permissions: ['execute_assigned_task'], canBypassApproval: false },
      task_worker: { permissions: ['execute_assigned_task'], canBypassApproval: false }
    };
  }

  setKillSwitch(active, reason = 'Operator command') {
    this.killSwitchActive = Boolean(active);
    const eventType = this.killSwitchActive ? EventTypes.KILL_SWITCH_ENGAGED : EventTypes.KILL_SWITCH_DISENGAGED;
    this.eventBus.publish(eventType, { active: this.killSwitchActive, reason });
    return this.killSwitchActive;
  }

  isKillSwitchEngaged() {
    return this.killSwitchActive;
  }

  assertExecutionAllowed(context = {}) {
    if (this.killSwitchActive) {
      const err = new Error(`Execution blocked: Global Kill Switch is active. ${JSON.stringify(context)}`);
      err.code = 'KILL_SWITCH_ACTIVE';
      this.eventBus.publish(EventTypes.SECURITY_VIOLATION_BLOCKED, {
        reason: 'Kill switch engaged',
        context
      });
      throw err;
    }
  }

  requiresApproval(actionType, params = {}) {
    if (this.sensitiveActions.has(actionType)) {
      return true;
    }
    // High dollar amounts or destructive patterns
    if (actionType === 'spend' || params.costUsd > 10.0) {
      return true;
    }
    if (params.destructive || params.isExternal) {
      return true;
    }
    return false;
  }

  checkPermission(role, permission) {
    const roleConfig = this.roles[role];
    if (!roleConfig) return false;
    if (roleConfig.permissions.includes('*')) return true;
    return roleConfig.permissions.includes(permission);
  }

  validateToolExecution(agent, toolName, parameters = {}) {
    this.assertExecutionAllowed({ agentId: agent?.id, toolName });

    // Check if tool implies sensitive action
    const isDestructive = /(rm|del|drop|delete|kill|truncate|format)/i.test(toolName);
    const isExternalComms = /(email|tweet|post|slack|telegram|whatsapp|publish)/i.test(toolName);
    const isPayment = /(buy|pay|order|charge|invoice_send|transfer)/i.test(toolName);

    let requiredAction = null;
    if (isDestructive) requiredAction = 'destructive_command';
    else if (isExternalComms) requiredAction = 'external_post';
    else if (isPayment) requiredAction = 'spend_money';

    if (requiredAction && this.requiresApproval(requiredAction, parameters)) {
      return {
        allowed: false,
        requiresApproval: true,
        actionType: requiredAction,
        reason: `Action '${toolName}' is classified as '${requiredAction}' and requires explicit human approval.`
      };
    }

    return { allowed: true, requiresApproval: false };
  }
}

export const globalPolicyEngine = new PolicyEngine();
