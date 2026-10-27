/**
 * Universal AI Workforce - AI CEO Central Orchestrator
 * High-level goal decomposition, hierarchical delegation, DAG plan execution, and executive briefing.
 */

import { EventTypes } from '../event-system/events.js';
import { globalEventBus } from '../event-system/event-bus.js';
import { globalOrganizationHierarchy } from './hierarchy.js';
import { globalAgentRegistry } from '../agent-factory/agent-registry.js';
import { globalAgentFactory } from '../agent-factory/agent-factory.js';
import { globalTaskEngine } from '../task-engine/task-engine.js';
import { TaskDAG } from '../task-engine/task-dag.js';

export class AIChiefExecutiveOrchestrator {
  constructor(options = {}) {
    this.hierarchy = options.hierarchy || globalOrganizationHierarchy;
    this.agentRegistry = options.agentRegistry || globalAgentRegistry;
    this.agentFactory = options.agentFactory || globalAgentFactory;
    this.taskEngine = options.taskEngine || globalTaskEngine;
    this.eventBus = options.eventBus || globalEventBus;
  }

  /**
   * Translates a business objective into an autonomous multi-department project plan
   */
  async submitGoal(goalObjective, options = {}) {
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    this.eventBus.publish(EventTypes.GOAL_SUBMITTED, {
      goalId,
      objective: goalObjective,
      submittedBy: options.submittedBy || 'owner'
    });

    // 1. Decompose Goal into Subtasks
    const subtaskBlueprints = this.decomposeObjective(goalObjective);
    const dag = new TaskDAG();
    const createdTasks = [];

    // 2. Map tasks to departments and agents (or create specialist if missing)
    for (const blueprint of subtaskBlueprints) {
      const assignedAgent = this._resolveOrAssignAgent(blueprint);

      const task = this.taskEngine.createTask({
        id: `${goalId}_${blueprint.slug}`,
        title: blueprint.title,
        description: blueprint.description,
        goalId,
        departmentId: blueprint.departmentId,
        assignedAgentId: assignedAgent.id,
        requiredCapabilities: blueprint.requiredCapabilities,
        dependencies: blueprint.dependsOn ? blueprint.dependsOn.map(slug => `${goalId}_${slug}`) : [],
        priority: blueprint.priority || 'medium',
        estimatedCostUsd: blueprint.estimatedCostUsd || 0.1
      });

      dag.addTask(task);
      createdTasks.push(task);
    }

    // 3. Validate DAG and execute tiers
    const executionBatches = dag.getExecutionBatches();
    const completedResults = [];
    const errors = [];

    for (let batchIndex = 0; batchIndex < executionBatches.length; batchIndex++) {
      const batchTaskIds = executionBatches[batchIndex];

      // Execute ready tasks in batch
      const batchPromises = batchTaskIds.map(async (taskId) => {
        try {
          return await this.taskEngine.executeTask(taskId);
        } catch (err) {
          errors.push({ taskId, error: err.message });
          return null;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      for (const res of batchResults) {
        if (res) completedResults.push(res);
      }

      if (errors.length > 0 && options.stopOnError) {
        break;
      }
    }

    // 4. Synthesize Executive Briefing Report
    const report = this.generateExecutiveBriefing({
      goalId,
      objective: goalObjective,
      totalTasks: createdTasks.length,
      completedTasks: completedResults.length,
      failedTasks: errors.length,
      tasks: createdTasks,
      errors
    });

    return {
      goalId,
      status: errors.length === 0 ? 'completed' : (completedResults.length > 0 ? 'partial' : 'failed'),
      tasks: createdTasks,
      completedCount: completedResults.length,
      failedCount: errors.length,
      report
    };
  }

  decomposeObjective(objective) {
    const text = objective.toLowerCase();

    // Smart goal template generator based on intent keywords
    if (/store|ecommerce|shop|cart|sell online/i.test(text)) {
      return [
        {
          slug: 'market_research',
          title: 'E-Commerce Market & Competitor Analysis',
          description: 'Analyze target market, competitors, pricing strategies, and buyer personas.',
          departmentId: 'marketing',
          requiredCapabilities: ['market_analysis', 'competitor_intel'],
          priority: 'high'
        },
        {
          slug: 'store_architecture',
          title: 'Store Architecture & Payment Setup',
          description: 'Design store frontend, backend API, product database schema, and payment gateways.',
          departmentId: 'engineering',
          requiredCapabilities: ['fullstack_architecture', 'database_schema'],
          dependsOn: ['market_research'],
          priority: 'urgent'
        },
        {
          slug: 'security_audit',
          title: 'Pre-Launch Security Audit & PCI Scan',
          description: 'Audit store endpoints for OWASP Top 10 vulnerabilities and secure checkout.',
          departmentId: 'cybersecurity',
          requiredCapabilities: ['owasp_audit', 'vulnerability_scan'],
          dependsOn: ['store_architecture'],
          priority: 'critical'
        },
        {
          slug: 'launch_campaign',
          title: 'GTM Launch Campaign & SEO Indexing',
          description: 'Deploy launch announcement, social outreach, and search engine indexing.',
          departmentId: 'sales',
          requiredCapabilities: ['sales_outreach', 'gtm_launch'],
          dependsOn: ['security_audit'],
          priority: 'high'
        }
      ];
    }

    if (/security|audit|pentest|vulnerability|bug/i.test(text)) {
      return [
        {
          slug: 'surface_recon',
          title: 'Target Attack Surface Reconnaissance',
          description: 'Enumerate subdomains, open ports, tech stack, and API endpoints.',
          departmentId: 'cybersecurity',
          requiredCapabilities: ['reconnaissance', 'surface_mapping'],
          priority: 'high'
        },
        {
          slug: 'vulnerability_scan',
          title: 'Automated SAST & DAST Vulnerability Sweep',
          description: 'Scan codebase and active endpoints for OWASP vulnerabilities and secret leaks.',
          departmentId: 'cybersecurity',
          requiredCapabilities: ['vulnerability_scan', 'secret_scanning'],
          dependsOn: ['surface_recon'],
          priority: 'critical'
        },
        {
          slug: 'remediation_plan',
          title: 'Generate Remediation Patches & CVSS Report',
          description: 'Create concrete fix diffs and CVSS 4.0 executive security briefing.',
          departmentId: 'engineering',
          requiredCapabilities: ['code_review', 'patch_generation'],
          dependsOn: ['vulnerability_scan'],
          priority: 'high'
        }
      ];
    }

    // Default universal decomposition
    return [
      {
        slug: 'scope_analysis',
        title: `Analyze Scope: ${objective.slice(0, 50)}`,
        description: `Analyze business requirements and constraints for: ${objective}`,
        departmentId: 'operations',
        requiredCapabilities: ['project_planning', 'scope_analysis'],
        priority: 'high'
      },
      {
        slug: 'implementation_plan',
        title: `Execute Implementation: ${objective.slice(0, 50)}`,
        description: `Implement deliverables for: ${objective}`,
        departmentId: 'engineering',
        requiredCapabilities: ['engineering_execution'],
        dependsOn: ['scope_analysis'],
        priority: 'medium'
      },
      {
        slug: 'review_and_delivery',
        title: 'Review Quality & Deliver Executive Summary',
        description: 'Verify deliverables against acceptance criteria and publish results.',
        departmentId: 'operations',
        requiredCapabilities: ['quality_assurance', 'executive_briefing'],
        dependsOn: ['implementation_plan'],
        priority: 'medium'
      }
    ];
  }

  _resolveOrAssignAgent(blueprint) {
    // 1. Try finding existing active agent with required capabilities
    for (const cap of blueprint.requiredCapabilities) {
      const candidates = this.agentRegistry.findAgentsByCapability(cap);
      if (candidates.length > 0) {
        return candidates[0];
      }
    }

    // 2. Try finding existing agent in target department
    const deptAgents = this.agentRegistry.findAgentsByDepartment(blueprint.departmentId);
    if (deptAgents.length > 0) {
      return deptAgents[0];
    }

    // 3. If no agent exists, dynamically create a specialist agent for this task
    return this.agentFactory.createSpecialistAgent({
      domain: blueprint.slug,
      domainTitle: blueprint.title,
      departmentId: blueprint.departmentId,
      capabilities: blueprint.requiredCapabilities
    });
  }

  generateExecutiveBriefing(data) {
    const lines = [
      `# 🏢 EXECUTIVE STATUS BRIEFING — AI CEO`,
      `**Objective**: ${data.objective}`,
      `**Goal ID**: \`${data.goalId}\``,
      `**Timestamp**: ${new Date().toISOString()}`,
      `**Progress**: ${data.completedTasks}/${data.totalTasks} Tasks Completed (${Math.round((data.completedTasks / data.totalTasks) * 100)}%)`,
      ``,
      `## 📋 Task Execution Status:`,
      ...data.tasks.map(t => `- [${t.status === 'completed' ? 'x' : ' '}] **${t.title}** (${t.departmentId}) — Status: \`${t.status}\`${t.actualCostUsd ? ` (Cost: $${t.actualCostUsd.toFixed(3)})` : ''}`),
      ``
    ];

    if (data.errors.length > 0) {
      lines.push(`## ⚠️ Exceptions & Escalations:`);
      for (const err of data.errors) {
        lines.push(`- Task \`${err.taskId}\`: ${err.error}`);
      }
      lines.push(``);
    }

    lines.push(
      `## 🎯 Next Steps:`,
      `- All verified deliverables staged for founder sign-off.`,
      `- Continuous health telemetry monitored by Chief of Staff.`
    );

    return lines.join('\n');
  }
}

export const globalAIChiefExecutiveOrchestrator = new AIChiefExecutiveOrchestrator();
