# 🚀 Universal AI Workforce — Installation & Setup Guide

This guide explains how to install, configure, and register the Universal AI Workforce Plugin across Antigravity, Claude Code, and terminal CLI environments.

---

## 📋 Prerequisites
- **Node.js**: `v18.0.0` or higher (verified on `v24.22.1`).
- **Operating System**: Windows, macOS, or Linux.
- **Git**: (Optional, for version control).

---

## 📦 1. Installation

### Route A: Global Antigravity Plugin Installation (Recommended)
To make the Universal AI Workforce available globally across all your workspaces:

1. Copy or link this plugin directory into `~/.gemini/config/plugins/`:
   ```bash
   # On Windows (PowerShell)
   Copy-Item -Recurse "universal-ai-workforce" "$HOME\.gemini\config\plugins\universal-ai-workforce"
   ```
2. Verify discovery in Antigravity:
   The plugin manifest `plugin.json` will be automatically detected by the Antigravity agent runtime.

### Route B: Workspace-Specific Installation
To keep the workforce scoped to the current project:
```bash
# In your workspace root:
mkdir -p .agents/plugins
cp -r universal-ai-workforce .agents/plugins/
```

### Route C: Global CLI Link
Install the CLI command globally on your machine:
```bash
cd universal-ai-workforce
npm link
```
Now you can run `workforce` from any terminal directory.

---

## 🛠️ 2. First-Run Setup Wizard

Run the initialization command:
```bash
workforce init
```
This will:
1. Verify system prerequisites.
2. Provision all 12 core corporate departments.
3. Ingest and validate all built-in starter skills through the 10-step lifecycle manager.
4. Auto-scale and provision initial logical agents.
5. Create atomic state records in `storage/state.json`.

---

## 🩺 3. System Diagnostics (Doctor)

Check your environment health at any time:
```bash
workforce doctor
```
Outputs runtime status, storage write permissions, audit logger status, and kill switch position.
