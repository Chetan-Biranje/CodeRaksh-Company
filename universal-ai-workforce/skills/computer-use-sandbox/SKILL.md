---
name: computer-use-sandbox
version: 1.0.0
description: Infrastructure and automation driver for computer-use agents, executing non-intrusive desktop interactions, OS-level virtualization sandboxes, and accessibility tree navigation without hijacking the physical cursor.
industry: engineering
capabilities:
  - background_desktop_virtualization
  - accessibility_tree_automation
  - non_intrusive_gui_control
  - os_level_sandbox_dispatch
riskLevel: high
sensitiveActions:
  - spawn_vm_sandbox
  - execute_desktop_automation
---

# Computer-Use Sandbox Skill

Inspired by isolated desktop virtualization, accessibility drivers, and non-intrusive computer-use agent infrastructure (such as the open-source `cua` platform).

## Role
Acts as the Lead Computer-Use Automation & Sandbox Infrastructure Engineer. Enables AI agents to operate full graphical desktop applications, native legacy software, mobile emulators, and complex browsers within isolated virtual sandboxes, interacting with interfaces smoothly without hijacking the operator's physical display or mouse cursor.

## Core Architectural Modules

### 1. Isolated Virtualization Sandboxes
- **Ephemeral Workspaces**: Launches lightweight local or remote virtual machines (Linux, macOS via hypervisor frameworks, Windows, Android) in headless mode.
- **Resource Containment**: Enforces strict CPU, memory, and disk quotas per sandbox instance, terminating environments immediately upon task completion.
- **State Checkpoints**: Takes instant VM snapshots before running uncertain workflows, enabling instant rollbacks if an application encounters an error.

### 2. Non-Intrusive Background GUI Automation
- **Virtual Framebuffer & Headless Desktops**: Renders virtual displays in memory (via Xvfb, Wayland, or hypervisor display buffers).
- **Zero Cursor Conflict**: Operates synthetic mouse pointers and keystrokes exclusively within the virtual screen context, leaving the developer's physical cursor and active workspace completely undisturbed.

### 3. Accessibility Tree & Semantic UI Navigation
- Rather than relying solely on raw pixel coordinate guessing (which breaks on DPI scale changes or window resizes), queries native OS accessibility trees (AT-SPI, UI Automation, AXUIElement).
- Identifies clickable buttons, form fields, tab controls, and status banners by semantic role and label.

### 4. Protocol & MCP Tool Integration
- Exposes standardized tool endpoints: `click(x, y, selector)`, `type(text)`, `key_combo(keys)`, `get_screenshot()`, `read_accessibility_tree()`, `exec_terminal(cmd)`.
- Connects transparently to local agents via the Model Context Protocol (MCP).

## Operational Workflow
1. **Sandbox Provisioning**: Launch an isolated VM or container sandbox with the target application pre-installed.
2. **Context & Accessibility Inspection**: Capture virtual screenshot and query the active window's accessibility hierarchy.
3. **Action Execution with Human Oversight**: Request approval for critical OS-level operations (file deletion, credential entry, network proxy reconfiguration).
4. **Result Extraction & Teardown**: Extract generated artifacts, capture final verification video/screenshot, and destroy ephemeral VM.
