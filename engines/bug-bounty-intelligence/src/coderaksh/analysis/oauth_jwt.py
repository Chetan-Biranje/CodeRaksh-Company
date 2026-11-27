"""OAuth 2.0 / OIDC / JWT research: observations from public text become test hypotheses.

Nothing here probes a target. Each hypothesis says what to check manually, with accounts you
own, once you have confirmed the host is in scope and the program rules allow it.
"""

from __future__ import annotations

import re
from urllib.parse import urlparse

from ..models import Hypothesis, SourceDoc
from ..scope import ScopePolicy
from .evidence import EvidenceStore, _sha, snippet_around

SAFE_NOTE = (
    "Manual check only: use accounts and OAuth clients you own, stay on in-scope hosts, respect "
    "rate limits and prohibited actions in the program policy, and stop if real user data appears."
)

OBSERVATIONS: dict[str, str] = {
    "oauth2": r"\boauth ?2(?:\.0)?\b",
    "auth_code": r"authorization[_ ]code",
    "implicit": r"implicit (?:flow|grant)|response_type=token",
    "pkce": r"\bpkce\b|code_challenge",
    "redirect_uri": r"redirect[_ ]uri|callback url|redirect url",
    "oidc": r"openid connect|\boidc\b|\.well-known/openid-configuration",
    "jwks": r"\bjwks\b|jwks\.json",
    "jwt": r"\bjwt\b|json web token",
    "hs256": r"\bhs256\b",
    "rs256": r"\brs256\b|\bes256\b",
    "refresh": r"refresh[_ ]token",
    "client_credentials": r"client[_ ]credentials",
    "scopes": r"\boauth\b.{0,60}\bscopes?\b|\bscopes?\b.{0,60}\boauth\b",
}
_RX = {k: re.compile(v, re.IGNORECASE) for k, v in OBSERVATIONS.items()}

# (id, category, required observations, forbidden observations, title, rationale, what to check)
RULES = [
    ("redirect-uri", "OAUTH", {"redirect_uri"}, set(),
     "Redirect URI validation",
     "Public text mentions redirect/callback URIs.",
     "Check exact-match enforcement of registered redirect URIs, open redirects on allowed "
     "hosts, and scheme/port/path handling."),
    ("state-nonce", "OAUTH", {"oauth2"}, set(),
     "State and nonce handling in the authorization flow",
     "OAuth 2.0 is referenced.",
     "Check that state is required and bound to the session, and nonce is validated for OIDC."),
    ("pkce-gap", "OAUTH", {"auth_code"}, {"pkce"},
     "PKCE enforcement for public clients",
     "Authorization code flow is mentioned and no PKCE mention was found in the collected text. "
     "Absence in public text is weak evidence.",
     "Check whether a public client can complete the code flow without code_challenge."),
    ("implicit-flow", "OAUTH", {"implicit"}, set(),
     "Implicit flow still offered",
     "Implicit flow or response_type=token is mentioned.",
     "Check token leakage via fragments, referrers and redirect handling."),
    ("scope-escalation", "OAUTH", {"scopes"}, set(),
     "Scope escalation and consent",
     "OAuth scopes are described publicly.",
     "Check whether a token can be used beyond its consented scopes, and whether requested "
     "scopes are validated server-side."),
    ("refresh-rotation", "OAUTH", {"refresh"}, set(),
     "Refresh token rotation and reuse detection",
     "Refresh tokens are mentioned.",
     "Check rotation, reuse detection, revocation on logout and password change."),
    ("client-credentials", "OAUTH", {"client_credentials"}, set(),
     "Machine-to-machine token audience and scope separation",
     "Client credentials grant is mentioned.",
     "Check audience restriction and whether M2M tokens reach user-level endpoints."),
    ("jwt-validation", "JWT", {"jwt"}, set(),
     "JWT claim and signature validation",
     "JWT usage is mentioned.",
     "Check alg handling (including none), iss, aud, exp and nbf validation, and signature "
     "verification on every endpoint."),
    ("jwt-alg-confusion", "JWT", {"jwt", "hs256", "rs256"}, set(),
     "Algorithm confusion between HS256 and RS256/ES256",
     "Both symmetric and asymmetric JWT algorithms are mentioned.",
     "Check whether the server pins the algorithm per key, and whether a public key can be "
     "accepted as an HMAC secret."),
    ("jwt-weak-secret", "JWT", {"hs256"}, set(),
     "HS256 secret strength",
     "HS256 is mentioned, which means a shared secret exists.",
     "Only if the program allows it: check for weak or default signing secrets on tokens you "
     "were issued. Do not attempt to forge tokens for other users."),
    ("jwks-kid", "JWT", {"jwks"}, set(),
     "JWKS and key identifier handling",
     "A JWKS endpoint is mentioned.",
     "Check kid, jku and x5u header handling, key rotation, and caching behaviour."),
    ("oidc-config", "OAUTH", {"oidc"}, set(),
     "OIDC discovery and issuer validation",
     "OpenID Connect is mentioned.",
     "Check issuer matching, discovery document trust, and ID token audience validation."),
]


def analyze(docs: list[SourceDoc], store: EvidenceStore, scope: ScopePolicy) -> list[Hypothesis]:
    observed: dict[str, list[tuple[SourceDoc, str]]] = {}
    for doc in docs:
        hay = f"{doc.title}. {doc.text}"
        for key, rx in _RX.items():
            m = rx.search(hay)
            if m:
                observed.setdefault(key, []).append((doc, snippet_around(hay, m.start(), m.end())))
    out: list[Hypothesis] = []
    for hid, cat, need, forbid, title, why, check in RULES:
        if not need <= observed.keys() or (forbid & observed.keys()):
            continue
        ev_ids: list[str] = []
        for key in sorted(need):
            doc, snip = observed[key][0]
            ev_ids.append(store.add(f"authn:{key}", doc, snip).id)
        host = next((urlparse(observed[k][0][0].url).hostname or "" for k in sorted(need)), "")
        status = scope.classify_host(host) if host else "unlisted"
        out.append(Hypothesis(
            id=f"hyp-{cat.lower()}-{hid}-{_sha(hid + host)[:6]}",
            category=cat, title=title, asset=host,
            scope_status=status if status in ("in_scope", "out_of_scope", "unlisted") else "unlisted",
            rationale=why, evidence_ids=sorted(set(ev_ids)),
            manual_test_notes=f"{check} {SAFE_NOTE}",
        ))
    return out
