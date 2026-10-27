# 🔄 Universal AI Workforce — Safe Upgrade & Rollback Procedures

This document provides step-by-step instructions for performing zero-downtime upgrades and instant state rollbacks for the Universal AI Workforce operating system.

---

## 🛡️ 1. Safe Upgrade Workflow

The Universal AI Workforce uses an atomic snapshot architecture. Upgrading the plugin engine never destroys your configured departments, skills, or agent histories.

### Step 1: Create Pre-Upgrade Checkpoint
Before deploying new code or schema versions, run:
```bash
workforce upgrade
```
This command:
1. Performs atomic snapshot backup to `storage/state.backup.<timestamp>.json`.
2. Runs system diagnostics (`workforce doctor`) to ensure node compatibility and storage write permissions.
3. Validates existing agent registries and task queues.

### Step 2: Deploy New Engine Code
Pull or copy the new version files into your workforce installation directory:
```bash
git pull origin main
# or copy updated package files
```

### Step 3: Run Diagnostics & Verification
```bash
workforce doctor
workforce test
```
Ensure all 18 automated test suites pass without regression.

---

## ⏮️ 2. Rollback Procedures

If an upgrade or template application causes unexpected behavior, you can instantly restore your previous system state.

### Automatic CLI Rollback
Run:
```bash
workforce rollback
```
This automatically locates the most recent `storage/state.backup.*.json` snapshot and restores all:
- Departments and organizational hierarchy mappings
- Registered skills and active statuses
- Logical agent configurations and capability indexes
- Task execution histories and DAG states
- Policy engine settings and kill switch position

### Manual Rollback
If the CLI is inaccessible:
1. Locate your desired backup file in `storage/`:
   ```bash
   ls storage/state.backup.*.json
   ```
2. Copy it over `storage/state.json`:
   ```bash
   cp storage/state.backup.<timestamp>.json storage/state.json
   ```
3. Restart workforce CLI:
   ```bash
   workforce status
   ```

---

## 🔒 3. Storage Integrity Guarantees
- **Atomic Writes**: `storage/file-storage.js` writes to a temporary file (`state.json.tmp.<timestamp>`) first and uses `fs.rename` for atomic file replacement. This prevents corruption during sudden crashes or power loss.
- **Audit Log Append-Only**: `storage/audit.jsonl` is strictly append-only, preserving an unalterable record of all actions even across rollbacks.
