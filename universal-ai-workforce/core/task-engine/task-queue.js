/**
 * Universal AI Workforce - Task Queue
 * Bounded priority queue with concurrency enforcement, backoff, and workload triggers.
 */

import { EventTypes } from '../event-system/events.js';
import { globalEventBus } from '../event-system/event-bus.js';

const PRIORITY_SCORES = {
  critical: 5,
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1
};

export class TaskQueue {
  constructor(options = {}, eventBus = globalEventBus) {
    this.maxConcurrency = options.maxConcurrency || 10;
    this.maxQueueDepth = options.maxQueueDepth || 10000;
    this.queue = [];
    this.activeExecutions = new Map(); // taskId -> { task, worker, startedAt }
    this.eventBus = eventBus;
  }

  enqueue(task) {
    if (this.queue.length >= this.maxQueueDepth) {
      throw new Error(`Task Queue depth limit reached (${this.maxQueueDepth}). Backpressure triggered.`);
    }

    task.status = 'queued';
    this.queue.push(task);

    // Sort by priority (highest first), then FIFO by creation time
    this.queue.sort((a, b) => {
      const pA = PRIORITY_SCORES[a.priority] || 2;
      const pB = PRIORITY_SCORES[b.priority] || 2;
      if (pA !== pB) return pB - pA;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    this.eventBus.publish(EventTypes.TASK_QUEUED, {
      taskId: task.id,
      priority: task.priority,
      queueDepth: this.queue.length
    });

    return task;
  }

  getNextReadyTask() {
    if (this.activeExecutions.size >= this.maxConcurrency || this.queue.length === 0) {
      return null;
    }
    return this.queue.shift();
  }

  registerActive(task, worker = null) {
    this.activeExecutions.set(task.id, {
      task,
      worker,
      startedAt: Date.now()
    });
  }

  releaseActive(taskId) {
    this.activeExecutions.delete(taskId);
  }

  size() {
    return this.queue.length;
  }

  activeCount() {
    return this.activeExecutions.size;
  }

  clear() {
    this.queue = [];
    this.activeExecutions.clear();
  }
}

export const globalTaskQueue = new TaskQueue();
