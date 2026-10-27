# 🩺 Universal AI Workforce — Troubleshooting & Recovery Guide

Common issues, diagnostic commands, and recovery procedures.

---

## 1. Quick Diagnostics
Run the automated system health check:
```bash
workforce doctor
```

---

## 2. Common Issues & Solutions

### Issue A: "Execution blocked: Global Kill Switch is active"
- **Cause**: An operator or security policy triggered the emergency halt.
- **Fix**: Inspect recent audit logs with `workforce status`, then disengage:
  ```bash
  workforce kill-switch off
  ```

### Issue B: "Task held in 'waiting_approval'"
- **Cause**: The task involves a sensitive operation (e.g., sending an external email, deleting records, spending money).
- **Fix**: Inspect the pending action:
  ```bash
  workforce task inspect <taskId>
  ```
  Approve it if legitimate:
  ```bash
  workforce task approve <taskId>
  ```

### Issue C: "Skill activation pending_deps"
- **Cause**: The skill requires an environment variable or CLI tool not installed on the system.
- **Fix**: Run `workforce skill validate <skillPath>` to see the exact missing dependencies. Install the missing tool or export the environment variable, then re-import:
  ```bash
  workforce skill add <skillPath>
  ```

### Issue D: Crash or System Restart Recovery
- If the node process or machine abruptly shuts down during an execution:
  ```bash
  workforce task list
  ```
  Tasks left in the `running` state are automatically recovered and restored to `pending` status upon startup.

---

## 3. Safe Upgrade & Rollback

- **Upgrade**: Overwrite core engine files; your configuration in `config/` and data in `storage/` are preserved.
- **Rollback**: Replace engine files with the previous release; `storage/state.json` maintains schema version backward-compatibility.
