/**
 * Universal AI Workforce - Event Bus and Audit Logger
 * Manages synchronous/asynchronous events, subscriber dispatch, and secure audit recording.
 */

import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import path from 'node:path';
import { EventTypes, WorkforceEvent } from './events.js';

export class EventBus extends EventEmitter {
  constructor(options = {}) {
    super();
    this.auditFilePath = options.auditFilePath || path.resolve(process.cwd(), 'storage/audit.jsonl');
    this.memoryAuditLog = [];
    this.maxMemoryLogs = options.maxMemoryLogs || 500;
    this.secretPatterns = [
      /sk-[a-zA-Z0-9\-_]{15,}/g,
      /AIza[0-9A-Za-z\-_]{20,}/g,
      /ghp_[a-zA-Z0-9]{36}/g,
      /Bearer\s+[a-zA-Z0-9.\-_]+/gi,
      /(password|secret|apiKey|api_key)\s*[:=]\s*["']?[^"'\s,]+["']?/gi
    ];
  }

  redactSecrets(value) {
    if (typeof value === 'string') {
      let redacted = value;
      for (const pattern of this.secretPatterns) {
        redacted = redacted.replace(pattern, '[REDACTED_SECRET]');
      }
      return redacted;
    }
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map(item => this.redactSecrets(item));
      }
      const cleanObj = {};
      for (const [k, v] of Object.entries(value)) {
        if (/password|secret|token|apikey|privatekey|credential/i.test(k)) {
          cleanObj[k] = '[REDACTED_SECRET]';
        } else {
          cleanObj[k] = this.redactSecrets(v);
        }
      }
      return cleanObj;
    }
    return value;
  }

  async publish(eventType, payload = {}, metadata = {}) {
    const cleanPayload = this.redactSecrets(payload);
    const event = new WorkforceEvent(eventType, cleanPayload, metadata);

    // Emit event to active in-process listeners
    this.emit(eventType, event);
    this.emit('*', event);

    // Record in memory buffer
    this.memoryAuditLog.push(event);
    if (this.memoryAuditLog.length > this.maxMemoryLogs) {
      this.memoryAuditLog.shift();
    }

    // Persist to audit log file asynchronously
    await this.recordAudit(event);
    return event;
  }

  async recordAudit(event) {
    try {
      const line = JSON.stringify(event) + '\n';
      const dir = path.dirname(this.auditFilePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.appendFile(this.auditFilePath, line, 'utf8');
    } catch (err) {
      // Non-fatal fallback for audit failure
      console.error(`[EventBus] Failed to append audit log: ${err.message}`);
    }
  }

  getRecentLogs(limit = 50) {
    return this.memoryAuditLog.slice(-limit);
  }

  clearMemory() {
    this.memoryAuditLog = [];
  }
}

// Global singleton instance for easy cross-module dispatch
export const globalEventBus = new EventBus();
