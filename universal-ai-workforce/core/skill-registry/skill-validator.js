/**
 * Universal AI Workforce - Skill Validator
 * Validates skill structures, parses markdown frontmatter, checks dependencies, and evaluates risk levels.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execSync } from 'node:child_process';

export class SkillValidator {
  constructor(options = {}) {
    this.allowedRiskLevels = ['low', 'medium', 'high', 'critical'];
  }

  parseYamlFrontmatter(content) {
    const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---/;
    const match = content.match(frontmatterRegex);
    if (!match) return { metadata: {}, body: content };

    const yamlBlock = match[1];
    const body = content.replace(frontmatterRegex, '').trim();
    const metadata = {};

    const lines = yamlBlock.split(/\r?\n/);
    let currentKey = null;
    let inArray = false;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      if (line.startsWith('- ') && currentKey && inArray) {
        metadata[currentKey].push(line.replace('- ', '').trim().replace(/^['"]|['"]$/g, ''));
        continue;
      }

      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const key = line.slice(0, colonIdx).trim();
        const value = line.slice(colonIdx + 1).trim();

        if (value === '') {
          metadata[key] = [];
          currentKey = key;
          inArray = true;
        } else {
          currentKey = key;
          inArray = false;
          let parsedVal = value.replace(/^['"]|['"]$/g, '');
          if (parsedVal === 'true') parsedVal = true;
          else if (parsedVal === 'false') parsedVal = false;
          metadata[key] = parsedVal;
        }
      }
    }

    return { metadata, body };
  }

  async loadFromPath(skillPath) {
    const stats = await fs.stat(skillPath);
    let skillFile = skillPath;
    let directory = skillPath;

    if (stats.isDirectory()) {
      const candidate = path.join(skillPath, 'SKILL.md');
      try {
        await fs.access(candidate);
        skillFile = candidate;
        directory = skillPath;
      } catch {
        const jsonCandidate = path.join(skillPath, 'skill.json');
        await fs.access(jsonCandidate);
        skillFile = jsonCandidate;
      }
    } else {
      directory = path.dirname(skillPath);
    }

    const raw = await fs.readFile(skillFile, 'utf8');
    if (skillFile.endsWith('.json')) {
      const parsed = JSON.parse(raw);
      return { definition: parsed, directory, raw };
    }

    // Markdown file with YAML frontmatter
    const { metadata, body } = this.parseYamlFrontmatter(raw);
    const id = metadata.name || path.basename(directory);
    const definition = {
      id: id.toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
      name: metadata.name || id,
      version: metadata.version || '1.0.0',
      description: metadata.description || body.slice(0, 200).replace(/\n/g, ' '),
      industry: metadata.industry || 'universal',
      capabilities: Array.isArray(metadata.capabilities) ? metadata.capabilities : [id],
      dependencies: {
        node: metadata['requires-node'] || '>=18.0.0',
        tools: Array.isArray(metadata.tools) ? metadata.tools : [],
        env: Array.isArray(metadata.env) ? metadata.env : [],
        skills: Array.isArray(metadata.requires_skills) ? metadata.requires_skills : []
      },
      riskLevel: metadata.riskLevel || (metadata.risk || 'low').toLowerCase(),
      sensitiveActions: Array.isArray(metadata.sensitiveActions) ? metadata.sensitiveActions : [],
      body
    };

    return { definition, directory, raw };
  }

  validateStructure(definition) {
    const errors = [];
    if (!definition.id || typeof definition.id !== 'string') {
      errors.push("Missing or invalid 'id'");
    }
    if (!definition.name || typeof definition.name !== 'string') {
      errors.push("Missing or invalid 'name'");
    }
    if (!definition.description) {
      errors.push("Missing 'description'");
    }
    if (!Array.isArray(definition.capabilities) || definition.capabilities.length === 0) {
      errors.push("'capabilities' must be a non-empty array");
    }
    if (definition.riskLevel && !this.allowedRiskLevels.includes(definition.riskLevel)) {
      errors.push(`Invalid riskLevel: ${definition.riskLevel}. Must be one of: ${this.allowedRiskLevels.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  checkDependencies(dependencies = {}) {
    const missing = {
      tools: [],
      env: [],
      skills: []
    };

    // Check environment variables
    if (Array.isArray(dependencies.env)) {
      for (const envVar of dependencies.env) {
        if (!process.env[envVar]) {
          missing.env.push(envVar);
        }
      }
    }

    // Check system tools
    if (Array.isArray(dependencies.tools)) {
      for (const tool of dependencies.tools) {
        try {
          const cmd = process.platform === 'win32' ? `where ${tool}` : `which ${tool}`;
          execSync(cmd, { stdio: 'ignore' });
        } catch {
          missing.tools.push(tool);
        }
      }
    }

    const hasMissing = missing.tools.length > 0 || missing.env.length > 0 || missing.skills.length > 0;
    return {
      satisfied: !hasMissing,
      missing
    };
  }
}
