/**
 * Universal AI Workforce — Model Context Protocol (MCP) Server
 * Implements the official JSON-RPC 2.0 MCP standard over stdio.
 * Allows ANY MCP-compatible AI client (Claude Code, Claude Desktop, Cursor,
 * Windsurf, Gemini CLI, Google Antigravity, OpenClaw, Codex) to directly
 * manage 1,000+ AI agents, register skills, submit goals, and run workflows.
 */

import readline from 'node:readline';
import { globalSkillRegistry } from '../skill-registry/skill-registry.js';
import { globalSkillLifecycleManager } from '../skill-registry/skill-lifecycle.js';
import { globalAgentRegistry } from '../agent-factory/agent-registry.js';
import { globalOrganizationHierarchy } from '../orchestrator/hierarchy.js';
import { globalAIChiefExecutiveOrchestrator } from '../orchestrator/ceo-orchestrator.js';
import { globalTaskEngine } from '../task-engine/task-engine.js';
import { globalPolicyEngine } from '../policy-engine/policy-engine.js';
import { loadWorkforceState, saveWorkforceState } from '../index.js';

export class WorkforceMcpServer {
  constructor() {
    this.serverInfo = {
      name: 'universal-ai-workforce',
      version: '1.0.0'
    };
  }

  getToolDefinitions() {
    return [
      {
        name: 'workforce_status',
        description: 'Get operational status, agent counts, active workers, registered skills, and department roster of the Universal AI Workforce.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'workforce_submit_goal',
        description: 'Submit an autonomous high-level business objective to the Central AI CEO. The CEO plans, decomposes into subtasks across departments (Engineering, Marketing, Sales, Cyber, etc.), executes the Task DAG, and returns an Executive Status Briefing.',
        inputSchema: {
          type: 'object',
          required: ['objective'],
          properties: {
            objective: {
              type: 'string',
              description: 'The high-level commercial or technical objective to achieve.'
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              default: 'medium',
              description: 'Execution priority of the goal.'
            }
          }
        }
      },
      {
        name: 'workforce_list_skills',
        description: 'List all registered production skills across all corporate departments, including risk levels and capabilities.',
        inputSchema: {
          type: 'object',
          properties: {
            industry: {
              type: 'string',
              description: 'Optional filter by industry or department name.'
            }
          }
        }
      },
      {
        name: 'workforce_add_skill',
        description: 'Register a new skill into the workforce via the 10-step autonomous Skill Lifecycle Manager (validates frontmatter, detects duplicate capabilities, and assigns or provisions specialized agents).',
        inputSchema: {
          type: 'object',
          required: ['skillPath'],
          properties: {
            skillPath: {
              type: 'string',
              description: 'Absolute or relative path to the skill directory containing SKILL.md.'
            }
          }
        }
      },
      {
        name: 'workforce_list_agents',
        description: 'List logical AI employees from the 1,000+ indexed agent directory, optionally filtered by department or capabilities.',
        inputSchema: {
          type: 'object',
          properties: {
            department: {
              type: 'string',
              description: 'Optional department ID (e.g. engineering, cybersecurity, sales, marketing).'
            },
            limit: {
              type: 'integer',
              default: 20,
              description: 'Maximum number of agents to return.'
            }
          }
        }
      },
      {
        name: 'workforce_inspect_agent',
        description: 'Get detailed configuration, skills, capabilities, and performance metrics for a specific logical AI agent.',
        inputSchema: {
          type: 'object',
          required: ['agentId'],
          properties: {
            agentId: {
              type: 'string',
              description: 'Unique ID of the agent.'
            }
          }
        }
      },
      {
        name: 'workforce_create_task',
        description: 'Create and dispatch an individual task directly to an appropriate agent in the workforce.',
        inputSchema: {
          type: 'object',
          required: ['title', 'description', 'department'],
          properties: {
            title: { type: 'string', description: 'Title of the task.' },
            description: { type: 'string', description: 'Detailed instruction prompt.' },
            department: { type: 'string', description: 'Department to route task to.' },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' }
          }
        }
      },
      {
        name: 'workforce_approve_task',
        description: 'Grant human operator approval for a sensitive task currently held in waiting_approval state.',
        inputSchema: {
          type: 'object',
          required: ['taskId'],
          properties: {
            taskId: { type: 'string', description: 'Task ID requiring approval.' },
            decision: { type: 'string', enum: ['approved', 'rejected'], default: 'approved' },
            feedback: { type: 'string', default: 'Approved via MCP client' }
          }
        }
      },
      {
        name: 'workforce_tree',
        description: 'Display the complete executive organizational hierarchy from Founder & AI CEO down through C-suite, 12 departments, and worker pools.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      },
      {
        name: 'workforce_kill_switch',
        description: 'Engage or disengage the emergency workforce kill switch to instantly halt or resume all autonomous operations.',
        inputSchema: {
          type: 'object',
          required: ['active'],
          properties: {
            active: { type: 'boolean', description: 'Set true to halt all operations, false to resume.' },
            reason: { type: 'string', default: 'Operator MCP command' }
          }
        }
      }
    ];
  }

  async executeTool(name, args = {}) {
    await loadWorkforceState();

    switch (name) {
      case 'workforce_status': {
        const agents = globalAgentRegistry.list({}, { page: 1, pageSize: 2000 }).items;
        const skills = globalSkillRegistry.list();
        const killSwitch = globalPolicyEngine.isKillSwitchEngaged();
        const departments = globalOrganizationHierarchy.listDepartments();
        let totalBudgetUsed = 0.0;
        for (const a of agents) {
          totalBudgetUsed += (a.budgetUsedUsd || 0.0);
        }

        return {
          status: killSwitch ? 'HALTED_BY_KILL_SWITCH' : 'OPERATIONAL',
          totalLogicalAgents: agents.length,
          activeWorkers: 0,
          registeredSkills: skills.length,
          killSwitchActive: killSwitch,
          totalBudgetUsedUsd: totalBudgetUsed,
          departments: departments.map(d => ({
            id: d.id,
            name: d.name,
            agentCount: globalAgentRegistry.findAgentsByDepartment(d.id).length
          }))
        };
      }

      case 'workforce_submit_goal': {
        const { objective, priority = 'medium' } = args;
        const result = await globalAIChiefExecutiveOrchestrator.submitGoal(objective, { priority });
        await saveWorkforceState();
        return {
          goalId: result.goalId,
          objective: result.objective,
          executiveBriefing: result.briefing,
          taskCount: result.tasks.length,
          tasksSummary: result.tasks.map(t => ({
            id: t.id,
            title: t.title,
            department: t.department,
            status: t.status
          }))
        };
      }

      case 'workforce_list_skills': {
        const skills = globalSkillRegistry.list();
        const filtered = args.industry 
          ? skills.filter(s => s.industry.toLowerCase() === args.industry.toLowerCase())
          : skills;

        return {
          total: filtered.length,
          skills: filtered.map(s => ({
            id: s.id,
            name: s.name,
            version: s.version,
            industry: s.industry,
            description: s.description,
            riskLevel: s.riskLevel,
            capabilities: s.capabilities,
            status: s.status
          }))
        };
      }

      case 'workforce_add_skill': {
        const result = await globalSkillLifecycleManager.processSkill(args.skillPath);
        await saveWorkforceState();
        return {
          success: result.success,
          skillId: result.skillId,
          status: result.status,
          scalingAction: result.scalingAction,
          assignedAgents: result.assignedAgents
        };
      }

      case 'workforce_list_agents': {
        const { department, limit = 20 } = args;
        const agents = department
          ? globalAgentRegistry.findAgentsByDepartment(department)
          : globalAgentRegistry.list({}, { page: 1, pageSize: limit }).items;

        return {
          total: agents.length,
          returned: Math.min(agents.length, limit),
          agents: agents.slice(0, limit).map(a => ({
            id: a.id,
            name: a.name,
            role: a.roleId || a.role,
            department: a.departmentId || a.department,
            skills: a.skills,
            capabilities: a.capabilities
          }))
        };
      }

      case 'workforce_inspect_agent': {
        const agent = globalAgentRegistry.get(args.agentId);
        if (!agent) {
          throw new Error(`Agent not found with ID: ${args.agentId}`);
        }
        return agent;
      }

      case 'workforce_create_task': {
        const { title, description, department, priority = 'medium' } = args;
        const task = globalTaskEngine.createTask({
          title,
          description,
          department,
          priority,
          input: { prompt: description }
        });
        const executed = await globalTaskEngine.executeTask(task.id);
        await saveWorkforceState();
        return executed;
      }

      case 'workforce_approve_task': {
        const { taskId, decision = 'approved', feedback = 'Approved via MCP' } = args;
        const task = globalTaskEngine.getTask(taskId);
        if (!task) throw new Error(`Task not found: ${taskId}`);
        if (task.status !== 'waiting_approval') {
          return { message: `Task ${taskId} is not waiting for approval (Current status: ${task.status})` };
        }
        const approved = globalTaskEngine.approveTask(taskId, decision === 'approved', feedback);
        await saveWorkforceState();
        return approved;
      }

      case 'workforce_tree': {
        const tree = globalOrganizationHierarchy.getHierarchyTree();
        return tree;
      }

      case 'workforce_kill_switch': {
        if (args.active) {
          globalPolicyEngine.engageKillSwitch(args.reason || 'Operator MCP command');
        } else {
          globalPolicyEngine.disengageKillSwitch();
        }
        await saveWorkforceState();
        return {
          killSwitchActive: globalPolicyEngine.isKillSwitchEngaged(),
          reason: args.reason
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async handleMessage(message) {
    if (!message || typeof message !== 'object') return null;
    const { id, method, params } = message;

    // Handle JSON-RPC Notifications (no response required)
    if (id === undefined && method === 'notifications/initialized') {
      return null;
    }

    try {
      switch (method) {
        case 'initialize': {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              protocolVersion: '2024-11-05',
              serverInfo: this.serverInfo,
              capabilities: {
                tools: {}
              }
            }
          };
        }

        case 'ping': {
          return { jsonrpc: '2.0', id, result: {} };
        }

        case 'tools/list': {
          return {
            jsonrpc: '2.0',
            id,
            result: {
              tools: this.getToolDefinitions()
            }
          };
        }

        case 'tools/call': {
          const { name, arguments: toolArgs } = params || {};
          const result = await this.executeTool(name, toolArgs);
          return {
            jsonrpc: '2.0',
            id,
            result: {
              content: [
                {
                  type: 'text',
                  text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
                }
              ]
            }
          };
        }

        default:
          return {
            jsonrpc: '2.0',
            id,
            error: {
              code: -32601,
              message: `Method not found: ${method}`
            }
          };
      }
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32603,
          message: err.message || 'Internal MCP error'
        }
      };
    }
  }

  startStdio() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false
    });

    rl.on('line', async (line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const message = JSON.parse(trimmed);
        const response = await this.handleMessage(message);
        if (response) {
          process.stdout.write(JSON.stringify(response) + '\n');
        }
      } catch (err) {
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: { code: -32700, message: 'Parse error: ' + err.message }
        }) + '\n');
      }
    });

    process.stderr.write(`[Universal AI Workforce MCP Server] Initialized & listening on stdio\n`);
  }
}
