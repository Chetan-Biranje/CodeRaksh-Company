# Python SDK

```python
from pathlib import Path
from coderaksh import Engine, Settings, load_scope, plan_calls, plan_cost

path = Path("programs/example-pilot.yaml")
scope = load_scope(path)
print(plan_cost(plan_calls(scope)))          # credits, no calls made

report = Engine(Settings.from_env(), scope, scope_path=path).run()   # mock unless CODERAKSH_MODE=live
print(report.credits_spent, len(report.hypotheses))
```

Custom transport (for example an authenticated MCP session you manage):

```python
from coderaksh import McpTransport
engine = Engine(settings, scope, scope_path=path, mode="live", approval="my-program",
                tapline_transport=McpTransport(my_call_tool))
```

`my_call_tool(name, arguments)` must return `{"status_code": int, "credits_charged": int, "body": ...}`.
