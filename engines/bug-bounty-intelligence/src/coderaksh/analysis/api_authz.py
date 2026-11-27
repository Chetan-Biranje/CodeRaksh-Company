"""API authorization research: BOLA, IDOR, BFLA and property-level hypotheses.

Inputs are public: API documentation text found by passive search, or an OpenAPI file you
downloaded yourself and listed in the scope file. Output is a ranked list of hypotheses.
"""

from __future__ import annotations

import re
from urllib.parse import urlparse

from ..models import Hypothesis, SourceDoc
from ..scope import ScopePolicy
from .evidence import EvidenceStore, _sha, snippet_around
from .oauth_jwt import SAFE_NOTE

METHODS = ("get", "post", "put", "patch", "delete")
PRIVILEGED = re.compile(
    r"/(admin|internal|manage|management|moderat\w*|superuser|impersonat\w*|export|bulk|import|"
    r"billing|roles?|permissions?|invites?|audit|debug)(/|$)", re.IGNORECASE)
SENSITIVE_PROPS = {"role", "roles", "isadmin", "is_admin", "admin", "permissions", "scope",
                   "owner_id", "ownerid", "tenant_id", "tenantid", "price", "balance", "status",
                   "verified", "is_verified", "plan"}
OWNER_PARAMS = {"user_id", "userid", "account_id", "accountid", "org_id", "orgid", "tenant_id",
                "tenantid", "customer_id", "customerid", "owner_id", "ownerid"}
_ID_PARAM = re.compile(r"^(id|uuid|guid|\w*_?id|\w*Id|key)$")
_PATH_PARAM = re.compile(r"\{([^}/]+)\}|:([A-Za-z_]\w*)|<([^>/]+)>")
_TEXT_ENDPOINT = re.compile(
    r"\b(GET|POST|PUT|PATCH|DELETE)\s+(/[A-Za-z0-9_\-./{}:<>]+)", re.IGNORECASE)
_NUMERIC_SEG = re.compile(r"/\d{2,}(?=/|$)")


def normalize_path(path: str) -> str:
    path = _PATH_PARAM.sub("{id}", path)
    path = _NUMERIC_SEG.sub("/{id}", path)
    return path.rstrip("/") or "/"


def _params(path: str) -> list[str]:
    return [next(g for g in m.groups() if g) for m in _PATH_PARAM.finditer(path)]


def _classify(method: str, path: str, *, numeric_example: bool = False,
              open_op: bool = False, props: set[str] | None = None,
              extra_params: set[str] | None = None) -> list[tuple[str, str, str, str]]:
    """Return (category, title, rationale, check) tuples for one operation."""
    method = method.upper()
    found = []
    ps = _params(path)
    has_id = any(_ID_PARAM.match(p) or p.lower() in ("id", "uuid") for p in ps) or bool(
        _NUMERIC_SEG.search(path)) or numeric_example
    if has_id:
        cat = "IDOR" if numeric_example or _NUMERIC_SEG.search(path) else "BOLA"
        why = "Object identifier in the path."
        if numeric_example or _NUMERIC_SEG.search(path):
            why = "A numeric, possibly sequential identifier appears in a public example."
        if len(ps) >= 2:
            why += " Nested resources: check that the parent and child belong to the same owner."
        if open_op:
            why += " The spec marks the operation as requiring no authentication."
        found.append((cat, f"{method} {path}: object-level access control", why,
                      "With two accounts you own, request an object that belongs to the other "
                      "account and confirm the server rejects it."))
    if extra_params and extra_params & OWNER_PARAMS:
        found.append(("IDOR", f"{method} {path}: owner identifier in parameters",
                      "A user/account/tenant identifier is accepted as a parameter.",
                      "Check that the server ignores or validates a client-supplied owner value."))
    if PRIVILEGED.search(path):
        found.append(("BFLA", f"{method} {path}: privileged function",
                      "Path suggests an administrative or high-impact function in public docs.",
                      "With a low-privilege account you own, check that the function is denied."))
    elif method in ("DELETE", "PUT", "PATCH") and not ps:
        found.append(("BFLA", f"{method} {path}: write on a collection",
                      "A state-changing method is documented on a collection route.",
                      "Check whether ordinary roles can call it."))
    if props and (props & SENSITIVE_PROPS) and method in ("POST", "PUT", "PATCH"):
        found.append(("BOPLA", f"{method} {path}: sensitive writable properties",
                      f"Request schema includes {sorted(props & SENSITIVE_PROPS)}.",
                      "Check mass assignment: send an extra privileged property on your own "
                      "object and confirm the server ignores or rejects it."))
    return found


def _hyp(cat, title, why, check, host, scope, ev_ids) -> Hypothesis:
    status = scope.classify_host(host) if host else "unlisted"
    return Hypothesis(
        id=f"hyp-{cat.lower()}-{_sha(title + host)[:8]}", category=cat, title=title, asset=host,
        scope_status=status, rationale=why, evidence_ids=ev_ids,
        manual_test_notes=f"{check} {SAFE_NOTE}"
        + ("" if status == "in_scope" else " The host is not confirmed in scope: do not test it."),
    )


def analyze_openapi(spec: dict, scope: ScopePolicy, doc: SourceDoc,
                    store: EvidenceStore) -> list[Hypothesis]:
    servers = [urlparse(s.get("url", "")).hostname or "" for s in spec.get("servers", [])]
    host = next((h for h in servers if h), "")
    ev = store.add("api:openapi-spec", doc, f"OpenAPI {spec.get('openapi', spec.get('swagger', ''))}")
    out: list[Hypothesis] = []
    for path, item in (spec.get("paths") or {}).items():
        shared = {p.get("name", "").lower() for p in item.get("parameters", []) if isinstance(p, dict)}
        for method in METHODS:
            op = item.get(method)
            if not isinstance(op, dict):
                continue
            names = shared | {p.get("name", "").lower() for p in op.get("parameters", [])
                              if isinstance(p, dict) and p.get("in") in ("query", "header")}
            props: set[str] = set()
            body = (op.get("requestBody") or {}).get("content", {})
            for media in body.values():
                props |= {k.lower() for k in ((media.get("schema") or {}).get("properties") or {})}
            open_op = op.get("security") == []
            for cat, title, why, check in _classify(
                method, path, open_op=open_op, props=props, extra_params=names
            ):
                out.append(_hyp(cat, title, why, check, host, scope, [ev.id]))
    return out


def analyze_text(docs: list[SourceDoc], scope: ScopePolicy, store: EvidenceStore) -> list[Hypothesis]:
    seen: set[tuple[str, str, str]] = set()
    out: list[Hypothesis] = []
    for doc in docs:
        hay = f"{doc.title}. {doc.text}"
        host = urlparse(doc.url).hostname or ""
        for m in _TEXT_ENDPOINT.finditer(hay):
            method, path = m.group(1).upper(), m.group(2).rstrip(".,;)")
            numeric = bool(_NUMERIC_SEG.search(path))
            key = (method, normalize_path(path), host)
            if key in seen:
                continue
            seen.add(key)
            ev = store.add(f"api:{method} {normalize_path(path)}", doc,
                           snippet_around(hay, m.start(), m.end()))
            for cat, title, why, check in _classify(method, path, numeric_example=numeric):
                out.append(_hyp(cat, title, why, check, host, scope, [ev.id]))
    return out


RANK = {"BOLA": 0, "IDOR": 1, "BFLA": 2, "BOPLA": 3}


def rank(hyps: list[Hypothesis], limit: int = 40) -> list[Hypothesis]:
    uniq = {h.id: h for h in hyps}
    order = {"in_scope": 0, "unlisted": 1, "out_of_scope": 2, "n/a": 3}
    return sorted(uniq.values(), key=lambda h: (order[h.scope_status], RANK.get(h.category, 9),
                                                h.title))[:limit]
