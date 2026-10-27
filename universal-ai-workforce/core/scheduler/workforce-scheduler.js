/**
 * Universal AI Workforce - Workforce Scheduler
 * Manages recurring scheduled jobs, periodic heartbeats, deadline enforcement, and background queue dispatching.
 */

import { EventTypes } from '../event-system/events.js';
import { globalEventBus } from '../event-system/event-bus.js';
import { globalTaskQueue } from '../task-engine/task-queue.js';
import { globalTaskEngine } from '../task-engine/task-engine.js';

export class WorkforceScheduler {
  constructor(options = {}) {
    this.taskQueue = options.taskQueue || globalTaskQueue;
    this.taskEngine = options.taskEngine || globalTaskEngine;
    this.eventBus = options.eventBus || globalEventBus;
    this.tickIntervalMs = options.tickIntervalMs || 1000;
    this.recurringJobs = new Map(); // jobId -> JobDefinition
    this.timerHandle = null;
    this.isRunning = false;
  }

  /**
   * Registers a recurring scheduled job (e.g. daily standup, hourly security sweep)
   */
  registerRecurringJob(job) {
    if (!job.id || !job.name || !job.intervalMs) {
      throw new Error("Recurring job must have 'id', 'name', and 'intervalMs'.");
    }

    const record = {
      id: job.id,
      name: job.name,
      departmentId: job.departmentId || 'operations',
      taskBlueprint: job.taskBlueprint || {},
      intervalMs: job.intervalMs,
      lastRunAt: null,
      nextRunAt: Date.now() + (job.initialDelayMs || 0),
      enabled: job.enabled !== false,
      runCount: 0
    };

    this.recurringJobs.set(job.id, record);
    return record;
  }

  listRecurringJobs() {
    return Array.from(this.recurringJobs.values());
  }

  disableJob(jobId) {
    const job = this.recurringJobs.get(jobId);
    if (!job) throw new Error(`Job '${jobId}' not found.`);
    job.enabled = false;
    return job;
  }

  enableJob(jobId) {
    const job = this.recurringJobs.get(jobId);
    if (!job) throw new Error(`Job '${jobId}' not found.`);
    job.enabled = true;
    job.nextRunAt = Date.now() + job.intervalMs;
    return job;
  }

  /**
   * Evaluates scheduled jobs and dispatches ready tasks from the queue
   */
  async tick() {
    const now = Date.now();
    const triggeredJobs = [];

    // 1. Check recurring jobs
    for (const job of this.recurringJobs.values()) {
      if (!job.enabled) continue;

      if (now >= job.nextRunAt) {
        job.lastRunAt = new Date(now).toISOString();
        job.nextRunAt = now + job.intervalMs;
        job.runCount++;

        // Spawn task from recurring job blueprint
        const task = this.taskEngine.createTask({
          title: `[Scheduled] ${job.name} (#${job.runCount})`,
          description: job.taskBlueprint.description || `Automated recurring run for ${job.name}`,
          departmentId: job.departmentId,
          requiredCapabilities: job.taskBlueprint.requiredCapabilities || [],
          priority: job.taskBlueprint.priority || 'medium',
          estimatedCostUsd: job.taskBlueprint.estimatedCostUsd || 0.01
        });

        this.taskQueue.enqueue(task);
        triggeredJobs.push({ jobId: job.id, taskId: task.id });
      }
    }

    // 2. Dispatch queued tasks to engine if concurrency allows
    const dispatched = [];
    while (this.taskQueue.activeCount() < this.taskQueue.maxConcurrency && this.taskQueue.size() > 0) {
      const nextTask = this.taskQueue.getNextReadyTask();
      if (!nextTask) break;

      dispatched.push(nextTask.id);
      // Run execution asynchronously
      this.taskEngine.executeTask(nextTask.id).catch(err => {
        // Error logged to task audit trail in taskEngine
      });
    }

    // 3. Watchdog: check deadline expirations
    const expiredCount = this.checkDeadlines(now);

    return {
      timestamp: new Date(now).toISOString(),
      triggeredJobs,
      dispatchedTasks: dispatched,
      expiredDeadlines: expiredCount
    };
  }

  checkDeadlines(now = Date.now()) {
    let expired = 0;
    for (const task of this.taskEngine.listTasks()) {
      if ((task.status === 'pending' || task.status === 'running') && task.deadline) {
        const deadlineTime = new Date(task.deadline).getTime();
        if (now > deadlineTime) {
          task.status = 'failed';
          task.error = `Task exceeded deadline: ${task.deadline}`;
          task.logAudit(`Deadline watchdog failed task due to deadline expiration.`);
          expired++;
        }
      }
    }
    return expired;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.timerHandle = setInterval(() => {
      this.tick().catch(err => {
        console.error(`[WorkforceScheduler] Tick error: ${err.message}`);
      });
    }, this.tickIntervalMs);
  }

  stop() {
    if (this.timerHandle) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
    this.isRunning = false;
  }
}

export const globalWorkforceScheduler = new WorkforceScheduler();
