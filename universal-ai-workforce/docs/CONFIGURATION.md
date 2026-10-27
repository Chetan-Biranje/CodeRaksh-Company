# ⚙️ Universal AI Workforce — Configuration Guide

All configuration options are defined in the `config/` directory.

---

## 1. System Defaults (`config/defaults.json`)

```json
{
  "system": {
    "organizationName": "CodeRaksh Company",
    "version": "1.0.0",
    "timezone": "Asia/Kolkata"
  },
  "limits": {
    "maxLogicalAgents": 10000,
    "maxConcurrentWorkers": 20,
    "maxTaskRetries": 3,
    "taskTimeoutMs": 60000,
    "defaultBudgetLimitUsd": 500.0,
    "maxQueueDepth": 10000
  },
  "scaling": {
    "tasksPerWorkerToScaleUp": 3,
    "idleSecondsToScaleDown": 60,
    "minWorkersPerRole": 0,
    "maxWorkersPerRole": 10
  }
}
```

- **`maxLogicalAgents`**: Maximum number of lightweight agent records allowed in registry (supports 10,000+).
- **`maxConcurrentWorkers`**: Hard ceiling on simultaneously active model executions to prevent local machine saturation.
- **`tasksPerWorkerToScaleUp`**: When the queue for an agent role reaches this ratio, an additional worker instance is spun up.
- **`idleSecondsToScaleDown`**: Inactive worker instances are terminated after this duration.

---

## 2. Policy & Security Engine (`config/policies.json`)

```json
{
  "killSwitchActive": false,
  "defaultApprovalRequired": true,
  "sensitiveActionTypes": [
    "external_email",
    "external_post",
    "spend_money",
    "delete_data",
    "permission_change",
    "destructive_command"
  ]
}
```

### Emergency Kill Switch
To immediately pause all running and queued tasks:
```bash
workforce kill-switch on
```
To resume:
```bash
workforce kill-switch off
```

---

## 3. Providers (`config/providers.example.json`)

Set your preferred provider by configuring environment variables:

| Provider | Environment Variable | Model Example |
|---|---|---|
| **Deterministic Mock** | *(None needed)* | `deterministic-mock-v1` |
| **Anthropic Claude** | `ANTHROPIC_API_KEY` | `claude-3-7-sonnet-20250219` |
| **Google Gemini** | `GEMINI_API_KEY` | `gemini-2.0-flash` |
| **OpenAI** | `OPENAI_API_KEY` | `gpt-4o` |
