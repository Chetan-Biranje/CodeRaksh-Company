"""CodeRaksh Bug Bounty Intelligence Engine: public SDK surface."""

__version__ = "0.1.0"

from .config import PILOT_HARD_CAP, Settings  # noqa: E402
from .models import RunReport  # noqa: E402
from .pipeline import Engine, cve_lookup, get_balance, plan_calls, plan_cost  # noqa: E402
from .scope import ScopePolicy, load_scope  # noqa: E402
from .sources.tapline import McpTransport, MockTransport, RestTransport  # noqa: E402

__all__ = [
    "PILOT_HARD_CAP", "Settings", "RunReport", "Engine", "cve_lookup", "get_balance",
    "plan_calls", "plan_cost", "ScopePolicy", "load_scope",
    "McpTransport", "MockTransport", "RestTransport", "__version__",
]
