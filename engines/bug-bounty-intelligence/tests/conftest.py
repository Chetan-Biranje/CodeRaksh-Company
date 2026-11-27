import shutil
import socket
from pathlib import Path

import pytest

from coderaksh.config import Settings

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture(autouse=True)
def no_network(monkeypatch):
    """Any real outbound connection fails the test. Proves mock runs make no network calls."""
    def blocked(*a, **kw):
        raise AssertionError("network access attempted during a test")
    monkeypatch.setattr(socket.socket, "connect", blocked)
    monkeypatch.setattr(socket, "create_connection", blocked)
    monkeypatch.setattr(socket, "getaddrinfo", blocked)


@pytest.fixture
def programs_dir(tmp_path):
    d = tmp_path / "programs"
    d.mkdir()
    for f in (ROOT / "programs").glob("example-*"):
        shutil.copy(f, d / f.name)
    return d


@pytest.fixture
def scope_path(programs_dir):
    return programs_dir / "example-pilot.yaml"


@pytest.fixture
def settings(tmp_path, programs_dir):
    return Settings(data_dir=tmp_path / "data", programs_dir=programs_dir,
                    api_token="test-token-0123456789-abcdefgh")


def approved_yaml(path: Path) -> Path:
    """Copy of the example scope with authorization and pilot approval filled in."""
    text = path.read_text()
    text = text.replace("confirmed: false", "confirmed: true").replace(
        'confirmed_by: ""', 'confirmed_by: "tester"').replace(
        "approved: false", "approved: true").replace('approved_by: ""', 'approved_by: "tester"')
    out = path.with_name("example-approved.yaml")
    out.write_text(text.replace("id: example-pilot", "id: example-approved"))
    return out
