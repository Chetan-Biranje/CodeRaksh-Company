---
name: camel-ai
description: The comprehensive guide and autonomous workflow system for CAMEL-AI (Communicative Agents for 'Mind' Exploration of Large Scale Information Societies). Use when designing, building, or orchestrating multi-agent systems, workforce collaboration, communicative role-playing agents, toolkits, and scalable agent societies.
---

# 🐫 CAMEL-AI: Autonomous Multi-Agent & Workforce Framework

CAMEL (Communicative Agents for "Mind" Exploration) is the premier open-source multi-agent framework dedicated to scaling laws of agents, collaborative role-playing, and enterprise workforce orchestration.

---

## 1. Core Architecture & Mental Model

```
+-------------------------------------------------------------+
|                     CAMEL WORKFORCE                         |
|     (Hierarchical Coordinator + Dynamic Task Decomposition)  |
+-------------------------------------------------------------+
         |                         |                        |
         v                         v                        v
+------------------+     +------------------+     +------------------+
|   ChatAgent A    |     |   ChatAgent B    |     |   CriticAgent    |
| (Domain Expert)  |     |   (Code / Tool)  |     |  (Verifier / QA) |
+------------------+     +------------------+     +------------------+
         |                         |                        |
         +------------+------------+------------------------+
                      |
                      v
+-------------------------------------------------------------+
|              SHARED ENVIRONMENT & TOOLKITS                  |
| (Search, Terminal, GitHub, CodeExecution, Memory, VectorDB)  |
+-------------------------------------------------------------+
```

### Key Pillars:
1. **ChatAgent**: Base conversational agent holding stateful memory, persona prompt, tools, and model client.
2. **RolePlaying (Society of Mind)**: Cooperative dialogue where two agents autonomously communicate to solve a task from inception to completion without human-in-the-loop babysitting.
3. **Workforce**: Scalable enterprise orchestration engine. Decomposes high-level human tasks into atomic sub-tasks, delegates to specialized SingleAgentWorkers, aggregates results, and logs KPIs.
4. **CriticAgent**: Evaluates outputs against constraints, standards, or rubrics (e.g., security checks, factuality).
5. **Toolkits**: Native integrations for Web Search (DuckDuckGo, Google), Code Execution, Terminal, File I/O, Git, and MCP (Model Context Protocol).

---

## 2. Quick Installation & Setup

```bash
# Core package
pip install camel-ai

# With optional web and search toolkits
pip install 'camel-ai[web_tools]'

# All toolkits and dependencies
pip install 'camel-ai[all]'
```

### Environment Configuration (`.env`)
```bash
# Supported LLM providers:
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
GEMINI_API_KEY="..."
GROQ_API_KEY="gsk_..."
OLLAMA_BASE_URL="http://localhost:11434"

# Optional CAMEL telemetry & logging
CAMEL_MODEL_LOG_ENABLED=true
CAMEL_LOG_DIR="camel_logs"
```

---

## 3. Pattern 1: Basic ChatAgent with Tools

```python
from camel.agents import ChatAgent
from camel.messages import BaseMessage
from camel.models import ModelFactory
from camel.types import ModelPlatformType, ModelType
from camel.toolkits import SearchToolkit

# 1. Model Configuration
model = ModelFactory.create(
    model_platform=ModelPlatformType.OPENAI,
    model_type=ModelType.GPT_4O_MINI,
    model_config_dict={"temperature": 0.2},
)

# 2. System Message (Persona)
system_msg = BaseMessage.make_assistant_message(
    role_name="Cyber Security Lead",
    content="You are a senior DevSecOps auditor inspecting code for OWASP vulnerabilities.",
)

# 3. Agent Creation
search_tool = SearchToolkit().search_duckduckgo
agent = ChatAgent(
    system_message=system_msg,
    model=model,
    tools=[search_tool],
)

# 4. Execution Step
response = agent.step("What are the most recent CVEs for JWT header algorithm confusion?")
print(response.msgs[0].content)
```

---

## 4. Pattern 2: Enterprise Workforce Orchestration

Use `Workforce` when coordinating multiple agents to accomplish complex, multi-stage enterprise deliverables.

```python
from camel.agents import ChatAgent
from camel.messages import BaseMessage
from camel.models import ModelFactory
from camel.societies.workforce import Workforce
from camel.tasks import Task
from camel.types import ModelPlatformType, ModelType

def build_enterprise_workforce() -> Workforce:
    # Worker 1: Security Sentinel
    sec_agent = ChatAgent(
        system_message=BaseMessage.make_assistant_message(
            role_name="Security Auditor",
            content="Audit pull requests for secret leaks, injection bugs, and misconfigurations.",
        ),
        model=ModelFactory.create(ModelPlatformType.DEFAULT, ModelType.DEFAULT),
    )

    # Worker 2: DevOps Doctor
    devops_agent = ChatAgent(
        system_message=BaseMessage.make_assistant_message(
            role_name="DevOps Doctor",
            content="Analyze CI/CD pipeline failures and generate git diff patches to fix builds.",
        ),
        model=ModelFactory.create(ModelPlatformType.DEFAULT, ModelType.DEFAULT),
    )

    # Worker 3: Tech Lead
    lead_agent = ChatAgent(
        system_message=BaseMessage.make_assistant_message(
            role_name="Tech Lead",
            content="Synthesize technical findings into an executive Scope of Work (SOW) and action plan.",
        ),
        model=ModelFactory.create(ModelPlatformType.DEFAULT, ModelType.DEFAULT),
    )

    # Initialize Workforce
    workforce = Workforce('CodeRaksh Defense Team', graceful_shutdown_timeout=30.0)
    
    workforce.add_single_agent_worker(
        "Audits source code and PRs for security risks.", worker=sec_agent
    ).add_single_agent_worker(
        "Diagnoses build failures and provides automated diff fixes.", worker=devops_agent
    ).add_single_agent_worker(
        "Synthesizes deliverables and architectural documentation.", worker=lead_agent
    )

    return workforce

if __name__ == "__main__":
    wf = build_enterprise_workforce()
    task = Task(
        content="Review repo changes, detect any token leaks, and produce a hardened patch report.",
        id="task-001",
    )
    wf.process_task(task)
    print("Workforce KPIs:", wf.get_workforce_kpis())
```

---

## 5. Pattern 3: Autonomous Role-Playing (Society of Mind)

Two agents (e.g. Red Team Attacker & Blue Team Defender) cooperate through conversational turns until a mutual consensus or solution is achieved.

```python
from camel.societies import RolePlaying
from camel.types import ModelPlatformType, ModelType, TaskType

role_play = RolePlaying(
    assistant_role_name="Security Researcher",
    user_role_name="DevSecOps Engineer",
    task_prompt="Find a bypass for an SSRF filter and write a secure validator patch.",
    task_type=TaskType.AI_SOCIETY,
    assistant_model_platform=ModelPlatformType.DEFAULT,
    user_model_platform=ModelPlatformType.DEFAULT,
)

input_msg = role_play.init_chat()
for step in range(5):
    assistant_response, user_response = role_play.step(input_msg)
    print(f"\n[Security Researcher]:\n{assistant_response.msg.content}")
    print(f"\n[DevSecOps Engineer]:\n{user_response.msg.content}")
    
    if "TASK_COMPLETE" in assistant_response.msg.content or "TASK_COMPLETE" in user_response.msg.content:
        break
    input_msg = assistant_response.msg
```

---

## 6. Model Providers Matrix

CAMEL supports unified switching via `ModelFactory`:

| Provider | `model_platform` | Default Model | Required Key |
|---|---|---|---|
| **OpenAI** | `ModelPlatformType.OPENAI` | `gpt-4o`, `gpt-4o-mini` | `OPENAI_API_KEY` |
| **Anthropic** | `ModelPlatformType.ANTHROPIC` | `claude-3-5-sonnet`, `claude-3-opus` | `ANTHROPIC_API_KEY` |
| **Google Gemini** | `ModelPlatformType.GEMINI` | `gemini-1.5-pro`, `gemini-1.5-flash` | `GEMINI_API_KEY` |
| **Groq** | `ModelPlatformType.GROQ` | `llama-3.3-70b-versatile` | `GROQ_API_KEY` |
| **Ollama (Local)** | `ModelPlatformType.OLLAMA` | `llama3.2`, `qwen2.5` | None (Local server) |

---

## 7. Best Practices & Design Principles
- **Keep Personas Narrow:** Give each worker agent a singular, distinct responsibility (Analyst, Coder, Critic, Reporter).
- **Use Critic Agents for Quality Gating:** Never let a creator agent evaluate its own security patches or code.
- **Log KPI Trees:** Use `workforce.dump_workforce_logs("logs.json")` for audit trails and performance metrics.
- **Graceful Fallbacks:** Always handle network/API outages by structuring agents with timeouts and retry handlers.
