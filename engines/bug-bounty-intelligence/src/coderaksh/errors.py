"""Exception types. Every guard in the engine fails closed by raising one of these."""


class CodeRakshError(Exception):
    """Base class."""


class ConfigError(CodeRakshError):
    """Missing or invalid configuration (for example an unverified REST base URL)."""


class ScopeError(CodeRakshError):
    """The scope file is invalid or an asset is outside the authorized scope."""


class PolicyViolation(CodeRakshError):
    """A request was blocked by the call policy (excluded endpoint, off-scope query, ...)."""


class ApprovalRequired(CodeRakshError):
    """Live mode was requested without a confirmed authorization and pilot approval."""


class BudgetExceeded(CodeRakshError):
    """The credit cap for this run or program would be exceeded."""


class CircuitOpen(BudgetExceeded):
    """Spend passed the circuit-breaker threshold; only essential calls may continue."""


class EgressDenied(CodeRakshError):
    """An outbound HTTP request targeted a host that is not on the egress allowlist."""


class RunInProgress(CodeRakshError):
    """Another live run holds the lock. Live runs are serialised so the credit cap cannot race."""


class SourceRateLimited(CodeRakshError):
    """A public data source reported that its rate limit is exhausted."""
