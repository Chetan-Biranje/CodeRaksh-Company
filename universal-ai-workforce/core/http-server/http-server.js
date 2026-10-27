/**
 * Universal AI Workforce — HTTP REST API Server
 * Lightweight zero-dependency HTTP server exposing RESTful endpoints
 * for OpenAI ChatGPT Custom Actions, web dashboards, webhooks, and third-party integrations.
 */

import http from 'node:http';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs/promises';

import { globalSkillRegistry } from '../skill-registry/skill-registry.js';
import { globalSkillLifecycleManager } from '../skill-registry/skill-lifecycle.js';
import { globalAgentRegistry } from '../agent-factory/agent-registry.js';
import { globalAgentFactory } from '../agent-factory/agent-factory.js';
import { globalOrganizationHierarchy } from '../orchestrator/hierarchy.js';
import { globalAIChiefExecutiveOrchestrator } from '../orchestrator/ceo-orchestrator.js';
import { globalTaskEngine } from '../task-engine/task-engine.js';
import { globalPolicyEngine } from '../policy-engine/policy-engine.js';
import { loadWorkforceState, saveWorkforceState } from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

export class WorkforceHttpServer {
  constructor(options = {}) {
    this.port = options.port || process.env.PORT || 3456;
    this.host = options.host || '0.0.0.0';
    this.server = null;
  }

  async parseJsonBody(req) {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
        if (body.length > 1e6) { // 1MB limit
          req.destroy();
          reject(new Error('Payload too large'));
        }
      });
      req.on('end', () => {
        if (!body.trim()) return resolve({});
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(new Error('Invalid JSON: ' + err.message));
        }
      });
      req.on('error', reject);
    });
  }

  sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data, null, 2));
  }

  async handleRequest(req, res) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });
      return res.end();
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method.toUpperCase();

    try {
      await loadWorkforceState();

      // Health check
      if (pathname === '/health' || pathname === '/') {
        return this.sendJson(res, 200, {
          status: 'ok',
          service: 'Universal AI Workforce OS',
          version: '1.0.0'
        });
      }

      // OpenAPI Spec for ChatGPT
      if (pathname === '/v1/openapi.json' || pathname === '/openapi.json') {
        const specPath = path.join(rootDir, 'integrations/chatgpt/openapi.json');
        const specData = await fs.readFile(specPath, 'utf8');
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        return res.end(specData);
      }

      // GET /v1/status
      if (method === 'GET' && (pathname === '/v1/status' || pathname === '/status')) {
        const agents = globalAgentRegistry.list({}, { page: 1, pageSize: 2000 }).items;
        const skills = globalSkillRegistry.list();
        const killSwitch = globalPolicyEngine.isKillSwitchEngaged();
        const departments = globalOrganizationHierarchy.listDepartments();
        let totalBudgetUsed = 0.0;
        for (const a of agents) {
          totalBudgetUsed += (a.budgetUsedUsd || 0.0);
        }

        return this.sendJson(res, 200, {
          status: killSwitch ? 'HALTED_BY_KILL_SWITCH' : 'OPERATIONAL',
          totalLogicalAgents: agents.length,
          activeWorkers: 0,
          registeredSkills: skills.length,
          killSwitchActive: killSwitch,
          totalBudgetSpentUsd: totalBudgetUsed,
          departments: departments.map(d => ({
            id: d.id,
            name: d.name,
            agentCount: globalAgentRegistry.findAgentsByDepartment(d.id).length
          }))
        });
      }

      // POST /v1/goals
      if (method === 'POST' && (pathname === '/v1/goals' || pathname === '/goals')) {
        const body = await this.parseJsonBody(req);
        if (!body.objective) {
          return this.sendJson(res, 400, { error: 'Missing required field: objective' });
        }
        const result = await globalAIChiefExecutiveOrchestrator.submitGoal(body.objective, {
          priority: body.priority || 'medium'
        });
        await saveWorkforceState();
        return this.sendJson(res, 200, result);
      }

      // GET /v1/skills
      if (method === 'GET' && (pathname === '/v1/skills' || pathname === '/skills')) {
        const industry = parsedUrl.searchParams.get('industry');
        const skills = globalSkillRegistry.list();
        const filtered = industry 
          ? skills.filter(s => s.industry.toLowerCase() === industry.toLowerCase())
          : skills;
        return this.sendJson(res, 200, { total: filtered.length, skills: filtered });
      }

      // GET /v1/agents
      if (method === 'GET' && (pathname === '/v1/agents' || pathname === '/agents')) {
        const department = parsedUrl.searchParams.get('department');
        const limit = parseInt(parsedUrl.searchParams.get('limit') || '50', 10);
        const agents = department
          ? globalAgentRegistry.findAgentsByDepartment(department)
          : globalAgentRegistry.list({}, { page: 1, pageSize: limit }).items;

        return this.sendJson(res, 200, {
          total: agents.length,
          returned: Math.min(agents.length, limit),
          agents: agents.slice(0, limit)
        });
      }

      // POST /v1/tasks
      if (method === 'POST' && (pathname === '/v1/tasks' || pathname === '/tasks')) {
        const body = await this.parseJsonBody(req);
        if (!body.title || !body.department) {
          return this.sendJson(res, 400, { error: 'Missing title or department' });
        }
        const task = globalTaskEngine.createTask({
          title: body.title,
          description: body.description || body.title,
          department: body.department,
          priority: body.priority || 'medium',
          input: { prompt: body.description || body.title }
        });
        const executed = await globalTaskEngine.executeTask(task.id);
        await saveWorkforceState();
        return this.sendJson(res, 200, executed);
      }

      // POST /v1/tasks/:id/approve
      if (method === 'POST' && pathname.includes('/approve')) {
        const parts = pathname.split('/');
        const taskId = parts[parts.indexOf('approve') - 1];
        const body = await this.parseJsonBody(req);
        const task = globalTaskEngine.getTask(taskId);
        if (!task) return this.sendJson(res, 404, { error: `Task not found: ${taskId}` });
        const approved = globalTaskEngine.approveTask(taskId, body.approved !== false, body.feedback || 'Approved via HTTP API');
        await saveWorkforceState();
        return this.sendJson(res, 200, approved);
      }

      // GET /v1/departments
      if (method === 'GET' && (pathname === '/v1/departments' || pathname === '/departments')) {
        const departments = globalOrganizationHierarchy.listDepartments();
        return this.sendJson(res, 200, { departments });
      }

      // 404 Not Found
      return this.sendJson(res, 404, { error: `Endpoint not found: ${method} ${pathname}` });

    } catch (err) {
      return this.sendJson(res, 500, { error: err.message || 'Internal server error' });
    }
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));
      this.server.listen(this.port, this.host, () => {
        resolve({ host: this.host, port: this.port });
      });
      this.server.on('error', reject);
    });
  }

  async stop() {
    if (this.server) {
      return new Promise(resolve => this.server.close(resolve));
    }
  }
}
