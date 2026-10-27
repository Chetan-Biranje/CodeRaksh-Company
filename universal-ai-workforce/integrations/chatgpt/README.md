# OpenAI ChatGPT Integration Guide

This package provides the schema and instructions for connecting **ChatGPT Plus / Team / Enterprise Custom GPTs** to your Universal AI Workforce deployment.

## Custom GPT Action Setup

1. In OpenAI ChatGPT, navigate to **Explore GPTs** -> **Create a GPT**.
2. Under **Configure**, scroll to **Actions** and click **Create new action**.
3. Import the OpenAPI specification located at `integrations/chatgpt/openapi.json`.
4. Configure Authentication:
   - Select **API Key** (Bearer token or Custom header).
   - Point the server URL to your running Universal AI Workforce server endpoint.
5. In Instructions, paste:
   ```
   You are connected to the Universal AI Workforce Operating System.
   When the user submits an enterprise goal or business plan, invoke the 'submitGoal' action.
   When the user asks for staffing numbers, hierarchy, or department health, invoke 'getWorkforceStatus'.
   Enforce human approval rules for sensitive operations.
   ```
6. Save and publish the GPT internally.
