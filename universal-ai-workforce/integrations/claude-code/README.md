# Claude Code Integration Guide

This package enables seamless integration between **Claude Code** and the **Universal AI Workforce**.

## Installation into Claude Code

1. In your Claude Code environment or workspace config (`~/.claude/plugins` or project directory), clone or link this repository:
   ```bash
   git clone https://github.com/coderaksh/universal-ai-workforce.git
   cd universal-ai-workforce
   npm install
   ```

2. Register the Claude Code plugin:
   ```bash
   claude plugin add ./integrations/claude-code
   ```

3. Export your Anthropic API Key (or rely on Claude Code's session context):
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-api..."
   ```

## Supported Slash Commands in Claude Code
- `/workforce status` — Inspect all logical agents, workers, and tasks.
- `/workforce tree` — View the 12-department organizational hierarchy and C-suite leads.
- `/workforce goal "objective"` — AI CEO decomposes the goal into a DAG plan executed across specialist agents.
- `/workforce kill-switch on|off` — Emergency pause or resume of all agent actions.
