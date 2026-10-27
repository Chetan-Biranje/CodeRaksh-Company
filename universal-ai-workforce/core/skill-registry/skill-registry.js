/**
 * Universal AI Workforce - Skill Registry
 * In-memory and persistent catalog of skills with capability indexing and duplicate detection.
 */

import { EventTypes } from '../event-system/events.js';
import { globalEventBus } from '../event-system/event-bus.js';

export class SkillRegistry {
  constructor(options = {}, eventBus = globalEventBus) {
    this.skills = new Map();
    this.capabilityIndex = new Map();
    this.eventBus = eventBus;
  }

  register(skillDefinition) {
    const existing = this.skills.get(skillDefinition.id);
    const isUpdate = Boolean(existing);

    // Save skill
    this.skills.set(skillDefinition.id, {
      ...skillDefinition,
      status: skillDefinition.status || 'registered',
      registeredAt: existing?.registeredAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    // Index capabilities
    for (const cap of skillDefinition.capabilities || []) {
      const normalizedCap = cap.toLowerCase().trim();
      if (!this.capabilityIndex.has(normalizedCap)) {
        this.capabilityIndex.set(normalizedCap, new Set());
      }
      this.capabilityIndex.get(normalizedCap).add(skillDefinition.id);
    }

    const eventType = isUpdate ? EventTypes.SKILL_UPDATED : EventTypes.SKILL_ADDED;
    this.eventBus.publish(eventType, {
      skillId: skillDefinition.id,
      name: skillDefinition.name,
      capabilities: skillDefinition.capabilities,
      isUpdate
    });

    return this.skills.get(skillDefinition.id);
  }

  findDuplicates(capabilities = [], excludeSkillId = null) {
    const duplicates = [];
    const normalizedNew = new Set(capabilities.map(c => c.toLowerCase().trim()));

    for (const [id, skill] of this.skills.entries()) {
      if (id === excludeSkillId || skill.status === 'disabled' || skill.status === 'removed') continue;
      const existingCaps = new Set((skill.capabilities || []).map(c => c.toLowerCase().trim()));

      // Check overlap
      let overlapCount = 0;
      for (const cap of normalizedNew) {
        if (existingCaps.has(cap)) overlapCount++;
      }

      if (overlapCount > 0 && overlapCount === normalizedNew.size && normalizedNew.size === existingCaps.size) {
        duplicates.push({ skillId: id, name: skill.name, type: 'exact_duplicate' });
      } else if (overlapCount > 0) {
        duplicates.push({
          skillId: id,
          name: skill.name,
          type: 'partial_overlap',
          sharedCapabilities: [...normalizedNew].filter(c => existingCaps.has(c))
        });
      }
    }

    return duplicates;
  }

  get(id) {
    return this.skills.get(id);
  }

  has(id) {
    return this.skills.has(id);
  }

  list(filter = {}) {
    let result = Array.from(this.skills.values());
    if (filter.status) {
      result = result.filter(s => s.status === filter.status);
    }
    if (filter.industry) {
      result = result.filter(s => s.industry === filter.industry);
    }
    if (filter.capability) {
      const target = filter.capability.toLowerCase().trim();
      result = result.filter(s => (s.capabilities || []).some(c => c.toLowerCase().trim() === target));
    }
    return result;
  }

  findByCapability(capability) {
    const normalized = capability.toLowerCase().trim();
    const skillIds = this.capabilityIndex.get(normalized);
    if (!skillIds) return [];
    return Array.from(skillIds)
      .map(id => this.skills.get(id))
      .filter(s => s && s.status === 'active');
  }

  setStatus(id, status, reason = '') {
    const skill = this.skills.get(id);
    if (!skill) throw new Error(`Skill '${id}' not found in registry.`);
    const oldStatus = skill.status;
    skill.status = status;
    skill.statusReason = reason;
    skill.updatedAt = new Date().toISOString();

    let eventType = null;
    if (status === 'validated') eventType = EventTypes.SKILL_VALIDATED;
    else if (status === 'approved') eventType = EventTypes.SKILL_APPROVED;
    else if (status === 'active') eventType = EventTypes.SKILL_ACTIVATED;
    else if (status === 'disabled') eventType = EventTypes.SKILL_DISABLED;
    else if (status === 'removed') eventType = EventTypes.SKILL_REMOVED;
    else if (status === 'rejected') eventType = EventTypes.SKILL_REJECTED;

    if (eventType) {
      this.eventBus.publish(eventType, { skillId: id, oldStatus, newStatus: status, reason });
    }
    return skill;
  }

  disable(id, reason = 'Operator disabled') {
    return this.setStatus(id, 'disabled', reason);
  }

  remove(id, reason = 'Operator removed') {
    const skill = this.skills.get(id);
    if (!skill) throw new Error(`Skill '${id}' not found.`);

    // Remove from capability index
    for (const cap of skill.capabilities || []) {
      const set = this.capabilityIndex.get(cap.toLowerCase().trim());
      if (set) set.delete(id);
    }

    this.setStatus(id, 'removed', reason);
    return skill;
  }
}

export const globalSkillRegistry = new SkillRegistry();
