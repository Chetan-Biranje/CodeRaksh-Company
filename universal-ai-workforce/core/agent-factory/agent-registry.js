/**
 * Universal AI Workforce - Agent Registry
 * High-performance indexed storage capable of managing 1,000+ logical agents.
 */

import { EventTypes } from '../event-system/events.js';
import { globalEventBus } from '../event-system/event-bus.js';
import { AgentConfiguration } from './agent-data-model.js';

export class AgentRegistry {
  constructor(options = {}, eventBus = globalEventBus) {
    this.agents = new Map();
    this.departmentIndex = new Map();
    this.capabilityIndex = new Map();
    this.roleIndex = new Map();
    this.statusIndex = new Map();
    this.eventBus = eventBus;
  }

  register(agentData) {
    const agent = agentData instanceof AgentConfiguration ? agentData : new AgentConfiguration(agentData);
    const isUpdate = this.agents.has(agent.id);

    // If updating, clean up old index entries
    if (isUpdate) {
      this._removeFromIndexes(this.agents.get(agent.id));
    }

    this.agents.set(agent.id, agent);
    this._addToIndexes(agent);

    const eventType = isUpdate ? EventTypes.AGENT_UPDATED : EventTypes.AGENT_CREATED;
    this.eventBus.publish(eventType, {
      agentId: agent.id,
      name: agent.name,
      role: agent.roleId,
      departmentId: agent.departmentId,
      capabilities: agent.capabilities
    });

    return agent;
  }

  _addToIndexes(agent) {
    // Department Index
    if (agent.departmentId) {
      if (!this.departmentIndex.has(agent.departmentId)) {
        this.departmentIndex.set(agent.departmentId, new Set());
      }
      this.departmentIndex.get(agent.departmentId).add(agent.id);
    }

    // Role Index
    if (agent.roleId) {
      if (!this.roleIndex.has(agent.roleId)) {
        this.roleIndex.set(agent.roleId, new Set());
      }
      this.roleIndex.get(agent.roleId).add(agent.id);
    }

    // Status Index
    const status = agent.status || 'idle';
    if (!this.statusIndex.has(status)) {
      this.statusIndex.set(status, new Set());
    }
    this.statusIndex.get(status).add(agent.id);

    // Capabilities Index
    for (const cap of agent.capabilities || []) {
      const normCap = cap.toLowerCase().trim();
      if (!this.capabilityIndex.has(normCap)) {
        this.capabilityIndex.set(normCap, new Set());
      }
      this.capabilityIndex.get(normCap).add(agent.id);
    }
  }

  _removeFromIndexes(agent) {
    if (!agent) return;
    if (agent.departmentId && this.departmentIndex.has(agent.departmentId)) {
      this.departmentIndex.get(agent.departmentId).delete(agent.id);
    }
    if (agent.roleId && this.roleIndex.has(agent.roleId)) {
      this.roleIndex.get(agent.roleId).delete(agent.id);
    }
    if (agent.status && this.statusIndex.has(agent.status)) {
      this.statusIndex.get(agent.status).delete(agent.id);
    }
    for (const cap of agent.capabilities || []) {
      const normCap = cap.toLowerCase().trim();
      if (this.capabilityIndex.has(normCap)) {
        this.capabilityIndex.get(normCap).delete(agent.id);
      }
    }
  }

  get(id) {
    return this.agents.get(id);
  }

  has(id) {
    return this.agents.has(id);
  }

  count() {
    return this.agents.size;
  }

  findAgentsByCapability(capability) {
    const norm = capability.toLowerCase().trim();
    const ids = this.capabilityIndex.get(norm);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.agents.get(id))
      .filter(a => a && a.status !== 'paused' && a.status !== 'retired');
  }

  findAgentsByDepartment(departmentId) {
    const ids = this.departmentIndex.get(departmentId);
    if (!ids) return [];
    return Array.from(ids).map(id => this.agents.get(id)).filter(Boolean);
  }

  list(filter = {}, pagination = { page: 1, pageSize: 50 }) {
    let result = Array.from(this.agents.values());

    if (filter.departmentId) {
      result = result.filter(a => a.departmentId === filter.departmentId);
    }
    if (filter.status) {
      result = result.filter(a => a.status === filter.status);
    }
    if (filter.roleId) {
      result = result.filter(a => a.roleId === filter.roleId);
    }
    if (filter.capability) {
      const norm = filter.capability.toLowerCase().trim();
      result = result.filter(a => (a.capabilities || []).some(c => c.toLowerCase().trim() === norm));
    }

    const total = result.length;
    const page = Math.max(1, pagination.page || 1);
    const pageSize = Math.max(1, pagination.pageSize || 50);
    const startIndex = (page - 1) * pageSize;
    const items = result.slice(startIndex, startIndex + pageSize);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  pauseAgent(id, reason = 'Operator paused') {
    const agent = this.agents.get(id);
    if (!agent) throw new Error(`Agent '${id}' not found.`);
    this._removeFromIndexes(agent);
    agent.status = 'paused';
    agent.pauseReason = reason;
    this._addToIndexes(agent);
    this.eventBus.publish(EventTypes.AGENT_PAUSED, { agentId: id, reason });
    return agent;
  }

  resumeAgent(id) {
    const agent = this.agents.get(id);
    if (!agent) throw new Error(`Agent '${id}' not found.`);
    this._removeFromIndexes(agent);
    agent.status = 'idle';
    delete agent.pauseReason;
    this._addToIndexes(agent);
    this.eventBus.publish(EventTypes.AGENT_RESUMED, { agentId: id });
    return agent;
  }

  retireAgent(id, reason = 'Operator retired') {
    const agent = this.agents.get(id);
    if (!agent) throw new Error(`Agent '${id}' not found.`);
    this._removeFromIndexes(agent);
    agent.status = 'retired';
    agent.retireReason = reason;
    this._addToIndexes(agent);
    this.eventBus.publish(EventTypes.AGENT_RETIRED, { agentId: id, reason });
    return agent;
  }
}

export const globalAgentRegistry = new AgentRegistry();
