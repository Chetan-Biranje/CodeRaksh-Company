# Google Gemini & Antigravity Integration Guide

This package integrates the **Universal AI Workforce** with Google Gemini and the Antigravity IDE agentic environment.

## Integration Methods

### 1. Antigravity IDE / Gemini Extension
This repository acts as an Antigravity Plugin directly located in `.gemini/config/plugins/universal-ai-workforce` or registered via `plugin.json`.
- Skills are automatically detected and indexed by the Antigravity agent.
- MCP tools can interface with `node bin/workforce.mjs`.

### 2. Standalone Gemini CLI / API
Set your Google Gemini API Key:
```bash
export GEMINI_API_KEY="AIzaSy..."
```
Configure `config/defaults.json` to use Gemini adapter:
```json
"providers": {
  "default": "google",
  "model": "gemini-2.0-flash"
}
```
All agent prompts and DAG tasks will be dispatched to Gemini 2.0 Flash via `providers/google/index.js`.
