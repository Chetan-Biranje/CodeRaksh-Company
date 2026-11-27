import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "src" / "coderaksh"
SECRET_PATTERNS = [r"sk-[A-Za-z0-9]{20,}", r"ghp_[A-Za-z0-9]{30,}", r"AKIA[0-9A-Z]{16}",
                   r"(?i)api[_-]?key\s*=\s*['\"][A-Za-z0-9]{16,}"]


def test_no_hardcoded_secrets():
    for f in list(SRC.rglob("*.py")) + list(ROOT.glob("*.md")) + list((ROOT / "n8n").rglob("*.json")):
        text = f.read_text()
        for p in SECRET_PATTERNS:
            assert not re.search(p, text), f"possible secret in {f}"


def test_http_clients_only_built_in_one_place():
    offenders = [f.name for f in SRC.rglob("*.py")
                 if f.name != "http.py" and re.search(r"httpx\.(Client|AsyncClient)\(", f.read_text())]
    assert offenders == []


def test_excluded_sources_not_in_code_paths():
    allowed = {"policy.py"}  # the only file allowed to name the excluded prefixes
    for f in SRC.rglob("*.py"):
        if f.name in allowed:
            continue
        assert "/v1/indeed" not in f.read_text(), f.name


def test_n8n_workflows_are_valid_json_without_secrets():
    files = list((ROOT / "n8n" / "workflows").glob("*.json"))
    assert files
    for f in files:
        data = json.loads(f.read_text())
        assert data["nodes"] and "connections" in data
        assert "Bearer test" not in f.read_text()


KNOWN_N8N_TYPES = {
    "n8n-nodes-base.scheduleTrigger", "n8n-nodes-base.manualTrigger", "n8n-nodes-base.webhook",
    "n8n-nodes-base.set", "n8n-nodes-base.httpRequest", "n8n-nodes-base.if", "n8n-nodes-base.noOp",
    "n8n-nodes-base.wait", "n8n-nodes-base.code",
}
TRIGGERS = {"n8n-nodes-base.scheduleTrigger", "n8n-nodes-base.manualTrigger", "n8n-nodes-base.webhook"}


def _workflows():
    return sorted((ROOT / "n8n" / "workflows").glob("*.json"))


def test_n8n_workflow_structure():
    for f in _workflows():
        data = json.loads(f.read_text())
        names = [n["name"] for n in data["nodes"]]
        assert len(names) == len(set(names)), f"duplicate node names in {f.name}"
        types = {n["name"]: n["type"] for n in data["nodes"]}
        assert set(types.values()) <= KNOWN_N8N_TYPES, f"unknown node type in {f.name}"
        edges = {}
        for src, outs in data["connections"].items():
            assert src in names, f"{f.name}: connection from unknown node {src}"
            for branch in outs.get("main", []):
                for e in branch:
                    assert e["node"] in names, f"{f.name}: connection to unknown node {e['node']}"
                    edges.setdefault(src, []).append(e["node"])
        starts = [n for n, t in types.items() if t in TRIGGERS]
        assert starts, f"{f.name} has no trigger"
        seen, stack = set(), list(starts)
        while stack:
            cur = stack.pop()
            if cur not in seen:
                seen.add(cur)
                stack.extend(edges.get(cur, []))
        assert seen == set(names), f"{f.name}: unreachable nodes {set(names) - seen}"


def test_n8n_credentials_by_reference_only():
    for f in _workflows():
        data = json.loads(f.read_text())
        for n in data["nodes"]:
            p = n["parameters"]
            if n["type"] == "n8n-nodes-base.httpRequest":
                assert p.get("authentication") == "genericCredentialType", f"{f.name}:{n['name']}"
            blob = json.dumps(p).lower()
            assert "authorization" not in blob and "x-api-key" not in blob, f"{f.name}:{n['name']}"
            assert "http://" not in blob or "http://coderaksh:" in blob, f"{f.name}:{n['name']}"


def _github_dir() -> Path | None:
    """Workflows live at the repository root when the engine sits in engines/<name>/."""
    for base in (ROOT, *ROOT.parents[:2]):
        if (base / ".github" / "workflows").is_dir():
            return base / ".github"
    return None


def test_actions_and_docker_base_are_pinned():
    gh = _github_dir()
    assert gh is not None, "no .github directory found"
    for f in gh.glob("workflows/bounty-engine-*.yml"):
        for line in f.read_text().splitlines():
            if "uses:" in line:
                assert re.search(r"@[0-9a-f]{40}(\s|$)", line), f"unpinned action in {f.name}: {line.strip()}"
        assert "@master" not in f.read_text() and "@main" not in f.read_text()
    docker = (ROOT / "Dockerfile").read_text()
    assert all("@sha256:" in ln for ln in docker.splitlines() if ln.startswith("FROM"))
