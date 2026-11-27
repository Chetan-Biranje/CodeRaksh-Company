"""Technology stack identification from public text (docs, job posts, announcements)."""

from __future__ import annotations

import re
from dataclasses import dataclass

from ..models import SourceDoc, TechSignal
from .evidence import EvidenceStore, snippet_around


@dataclass(frozen=True)
class Signature:
    name: str
    category: str
    patterns: tuple[str, ...]
    nvd: str | None = None  # NVD keyword for self-hosted software
    osv: tuple[str, str] | None = None  # (ecosystem, package)
    ghsa: tuple[str, str] | None = None
    kev: tuple[str, ...] = ()


def _s(name, cat, pats, **kw) -> Signature:
    return Signature(name, cat, tuple(pats), **kw)


SIGNATURES: tuple[Signature, ...] = (
    _s("Auth0", "identity", [r"\bauth0\b"]),
    _s("Okta", "identity", [r"\bokta\b"], kev=("okta",)),
    _s("Keycloak", "identity", [r"\bkeycloak\b"], nvd="Keycloak",
       osv=("Maven", "org.keycloak:keycloak-core")),
    _s("AWS Cognito", "identity", [r"\bcognito\b"]),
    _s("Firebase Auth", "identity", [r"firebase auth(?:entication)?\b"]),
    _s("SAML SSO", "identity", [r"\bsaml\b"]),
    _s("Kong", "gateway", [r"\bkong (?:gateway|api)\b", r"\bkong\b(?= api| gateway)"],
       nvd="Kong Gateway", kev=("kong",)),
    _s("Apigee", "gateway", [r"\bapigee\b"]),
    _s("AWS API Gateway", "gateway", [r"aws api gateway", r"amazon api gateway"]),
    _s("Envoy", "gateway", [r"\benvoy(?: proxy)?\b"], nvd="Envoy proxy"),
    _s("NGINX", "gateway", [r"\bnginx\b"], nvd="nginx", kev=("nginx",)),
    _s("Express", "framework", [r"\bexpress(?:\.js|js)\b"], osv=("npm", "express"),
       ghsa=("npm", "express")),
    _s("Django", "framework", [r"\bdjango\b"], osv=("PyPI", "django"), ghsa=("pip", "django")),
    _s("Flask", "framework", [r"\bflask\b"], osv=("PyPI", "flask")),
    _s("FastAPI", "framework", [r"\bfastapi\b"], osv=("PyPI", "fastapi")),
    _s("Spring", "framework", [r"\bspring (?:boot|framework|security)\b"],
       nvd="Spring Framework", kev=("spring",)),
    _s("Ruby on Rails", "framework", [r"\bruby on rails\b", r"\brails\b"],
       osv=("RubyGems", "rails"), ghsa=("rubygems", "rails")),
    _s("Laravel", "framework", [r"\blaravel\b"], osv=("Packagist", "laravel/framework")),
    _s("Next.js", "framework", [r"\bnext\.?js\b"], osv=("npm", "next"), ghsa=("npm", "next")),
    _s("GraphQL", "api-style", [r"\bgraphql\b"], osv=("npm", "graphql")),
    _s("gRPC", "api-style", [r"\bgrpc\b"]),
    _s("REST API", "api-style", [r"\brest(?:ful)? apis?\b"]),
    _s("jsonwebtoken", "library", [r"\bjsonwebtoken\b"], osv=("npm", "jsonwebtoken"),
       ghsa=("npm", "jsonwebtoken")),
    _s("PyJWT", "library", [r"\bpyjwt\b"], osv=("PyPI", "PyJWT"), ghsa=("pip", "PyJWT")),
    _s("jjwt", "library", [r"\bjjwt\b"], osv=("Maven", "io.jsonwebtoken:jjwt")),
    _s("AWS", "cloud", [r"\baws\b", r"\bamazon web services\b"]),
    _s("GCP", "cloud", [r"\bgcp\b", r"google cloud"]),
    _s("Azure", "cloud", [r"\bazure\b"]),
    _s("Kubernetes", "platform", [r"\bkubernetes\b", r"\bk8s\b"], nvd="Kubernetes"),
    _s("PostgreSQL", "database", [r"\bpostgres(?:ql)?\b"], nvd="PostgreSQL"),
    _s("MongoDB", "database", [r"\bmongodb\b"], nvd="MongoDB"),
    _s("Redis", "database", [r"\bredis\b"], nvd="Redis"),
    _s("Elasticsearch", "database", [r"\belasticsearch\b"], nvd="Elasticsearch"),
    _s("Cloudflare", "edge", [r"\bcloudflare\b"], kev=("cloudflare",)),
)
_COMPILED = [(s, [re.compile(p, re.IGNORECASE) for p in s.patterns]) for s in SIGNATURES]


def identify(docs: list[SourceDoc], store: EvidenceStore) -> list[TechSignal]:
    """Match signatures against every doc, record evidence, then verify each claim."""
    seen: dict[str, Signature] = {}
    for doc in docs:
        hay = f"{doc.title}. {doc.text}"
        for sig, rxs in _COMPILED:
            for rx in rxs:
                m = rx.search(hay)
                if m:
                    store.add(f"tech:{sig.name}", doc, snippet_around(hay, m.start(), m.end()))
                    seen[sig.name] = sig
                    break
    signals = []
    for name, sig in sorted(seen.items()):
        status, hosts = store.verify(f"tech:{name}")
        signals.append(TechSignal(
            name=name, category=sig.category, status=status,
            evidence_ids=[e.id for e in store.for_claim(f"tech:{name}")], source_domains=hosts,
        ))
    return signals


def signature_by_name(name: str) -> Signature | None:
    return next((s for s in SIGNATURES if s.name == name), None)
