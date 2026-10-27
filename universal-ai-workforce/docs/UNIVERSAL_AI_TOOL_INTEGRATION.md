# 🌐 Universal AI Tool Integration Guide (सर्व AI Tools सोबत वापरण्याची मार्गदर्शिका)

The **Universal AI Workforce** is built with a universal, provider-neutral architecture that runs seamlessly across **ANY** AI tool or assistant:
- **Anthropic Claude** (Claude Desktop, Claude Code)
- **Google Gemini** (Gemini CLI, Google Antigravity IDE, Google AI Studio)
- **OpenAI ChatGPT** (Custom GPT Actions, ChatGPT Desktop, OpenAI API)
- **Developer AI IDEs** (Cursor, Windsurf, VS Code / Copilot)

---

## ⚡ 1-Click Multi-Tool Installer

Run the automated installer to configure all your AI clients in one command:
```bash
# Configure all AI tools at once:
node bin/workforce.mjs install all

# Or configure a specific tool:
node bin/workforce.mjs install claude
node bin/workforce.mjs install gemini
node bin/workforce.mjs install cursor
node bin/workforce.mjs install chatgpt
```

---

## 1. 🤖 Anthropic Claude Integration

### A. Claude Desktop (Windows & macOS)
Claude Desktop connects natively via the **Model Context Protocol (MCP)** standard over stdio.

1. Open your Claude Desktop configuration file:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
2. Add the `universal-ai-workforce` server entry:
   ```json
   {
     "mcpServers": {
       "universal-ai-workforce": {
         "command": "node",
         "args": [
           "C:\\Users\\Mr Shadex\\Documents\\CodeRaksh Company\\universal-ai-workforce\\bin\\workforce.mjs",
           "mcp-server"
         ],
         "env": {
           "WORKFORCE_ENV": "production"
         }
       }
     }
   }
   ```
3. Restart Claude Desktop. You will see the hammer icon 🔨 with tools:
   - `workforce_status`
   - `workforce_submit_goal`
   - `workforce_list_skills`
   - `workforce_list_agents`
   - `workforce_create_task`
   - `workforce_tree`

### B. Claude Code (Terminal CLI)
The workforce automatically registers in `.claude/config.json`.
From your terminal:
```bash
claude
# In Claude Code chat:
> /mcp list
# You will see all workforce tools available directly to Claude Code!
```

---

## 2. 🌌 Google Gemini & Google Antigravity Integration

### A. Google Antigravity IDE
Antigravity automatically loads MCP servers defined in `mcp_config.json`:
```json
{
  "mcpServers": {
    "workforce-runtime": {
      "command": "node",
      "args": ["bin/workforce.mjs", "mcp-server"],
      "env": {
        "WORKFORCE_ENV": "production"
      }
    }
  }
}
```
In chat, Antigravity agents can invoke `workforce_status`, `workforce_submit_goal`, and `workforce_tree` automatically.

### B. Gemini CLI & Google AI Studio Adapter
Set your Gemini API key in your environment:
```bash
export GEMINI_API_KEY="your-gemini-api-key"
# On Windows PowerShell:
$env:GEMINI_API_KEY="your-gemini-api-key"
```
The internal provider adapter (`providers/gemini-adapter.js`) routes LLM reasoning through Gemini models (`gemini-2.5-pro`, `gemini-2.0-flash`).

---

## 3. 💬 OpenAI ChatGPT Integration

ChatGPT supports external integrations through **Custom GPT Actions** via standard OpenAPI 3.1 REST endpoints.

### Step 1: Start the Workforce HTTP Server
```bash
node bin/workforce.mjs server 3456
```
This runs a zero-dependency HTTP server exposing:
- `GET http://localhost:3456/v1/status` — Operational status & agent counts
- `GET http://localhost:3456/v1/openapi.json` — OpenAPI specification for ChatGPT
- `POST http://localhost:3456/v1/goals` — Submits autonomous goals to AI CEO
- `GET http://localhost:3456/v1/skills` — Lists registered production skills

### Step 2: Configure Custom GPT in ChatGPT
1. Go to [ChatGPT](https://chatgpt.com/) -> **Explore GPTs** -> **Create a GPT**.
2. Name your GPT: `Universal AI Workforce Orchestrator`.
3. Under **Configure**, scroll down and click **Create new action**.
4. In the Schema box, import your OpenAPI specification from `integrations/chatgpt/openapi.json` (or paste the JSON from `http://localhost:3456/v1/openapi.json`).
5. Save your GPT. You can now prompt ChatGPT:
   - *"Check workforce status and show me active agents."*
   - *"Submit a goal to launch an e-commerce store with 1,000 AI employees."*

---

## 4. 💻 Cursor & Windsurf (Developer AI IDEs)

Cursor and Windsurf support the Model Context Protocol natively.

1. The installer automatically generates `.cursor/mcp.json`:
   ```json
   {
     "mcpServers": {
       "universal-ai-workforce": {
         "command": "node",
         "args": [
           "C:\\Users\\Mr Shadex\\Documents\\CodeRaksh Company\\universal-ai-workforce\\bin\\workforce.mjs",
           "mcp-server"
         ]
       }
     }
   }
   ```
2. In Cursor or Windsurf, open **Settings -> Features -> MCP**, and verify `universal-ai-workforce` shows a green active indicator.
3. In Composer or Chat, mention `@universal-ai-workforce` to inspect agents, run tasks, or trigger the AI CEO.

---

## 📋 Summary of Available Tools Across All Platforms

| Tool / Endpoint | Purpose | Supported Clients |
|---|---|:---:|
| `workforce_status` / `GET /v1/status` | Real-time agent count, budget, active workers | Claude, Gemini, ChatGPT, Cursor |
| `workforce_submit_goal` / `POST /v1/goals` | AI CEO autonomous goal decomposition & DAG | Claude, Gemini, ChatGPT, Cursor |
| `workforce_list_skills` / `GET /v1/skills` | Lists all 34 production skills and risk ratings | Claude, Gemini, ChatGPT, Cursor |
| `workforce_list_agents` / `GET /v1/agents` | Explores 1,000+ indexed logical agents | Claude, Gemini, ChatGPT, Cursor |
| `workforce_inspect_agent` | Detailed agent capabilities & metrics | Claude, Gemini, Cursor |
| `workforce_create_task` / `POST /v1/tasks` | Dispatches task to designated department | Claude, Gemini, ChatGPT, Cursor |
| `workforce_approve_task` | Approves sensitive action held for sign-off | Claude, Gemini, ChatGPT, Cursor |
| `workforce_tree` | Full C-suite and department org chart | Claude, Gemini, Cursor |
| `workforce_kill_switch` | Emergency halt/resume of all operations | Claude, Gemini, Cursor |
