---
name: reverse-api-engineer
version: 1.0.0
description: Autonomous API reverse engineering, browser network traffic capture analysis, payload schema extraction, and typed API client synthesis.
industry: engineering
capabilities:
  - traffic_capture_analysis
  - payload_schema_extraction
  - typed_client_synthesis
  - endpoint_documentation
riskLevel: medium
sensitiveActions: []
---

# Reverse API Engineer Skill

Inspired by automated network traffic interception and client generation pipelines.

## Role
Analyze captured HTTP/WebSocket network traces (HAR files, proxy logs), reconstruct undocumented request/response schemas, and synthesize clean, typed API client libraries with robust retry mechanisms.

## Operational Routines
1. **Network Trace Ingestion**: Parse HAR files or raw request/response logs to identify authentication handshakes and recurring REST/GraphQL patterns.
2. **Schema Reconstruction**: Infer parameter types, required fields, headers, query strings, and error status conventions.
3. **Typed Client Code Generation**: Output production-ready TypeScript/Python client code with type annotations, docstrings, exponential backoff, and unit tests.
4. **Contract Verification**: Validate that generated SDKs handle pagination, token refreshing, and rate-limiting gracefully.
