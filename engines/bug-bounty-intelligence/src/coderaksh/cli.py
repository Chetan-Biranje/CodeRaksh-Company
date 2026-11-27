"""Command line interface: `coderaksh --help`."""

from __future__ import annotations

import json
from pathlib import Path

import typer

from . import __version__
from .config import PILOT_HARD_CAP, Settings
from .errors import ApprovalRequired, CodeRakshError
from .ledger import Ledger
from .pipeline import Engine, cve_lookup, get_balance, plan_calls, plan_cost
from .scope import load_scope

app = typer.Typer(help="CodeRaksh Bug Bounty Intelligence Engine (passive, scope-enforced).",
                  no_args_is_help=True)
scope_app = typer.Typer(help="Scope file tools.", no_args_is_help=True)
app.add_typer(scope_app, name="scope")


def _fail(exc: CodeRakshError) -> None:
    typer.secho(f"error: {exc}", fg=typer.colors.RED, err=True)
    raise typer.Exit(3 if isinstance(exc, ApprovalRequired) else 1)


@app.command()
def version() -> None:
    """Print the version."""
    typer.echo(__version__)


@scope_app.command("validate")
def scope_validate(path: Path) -> None:
    """Validate a program scope file and print its summary."""
    try:
        typer.echo(json.dumps(load_scope(path).summary(), indent=2))
    except CodeRakshError as exc:
        _fail(exc)


@app.command()
def plan(path: Path) -> None:
    """Show the Tapline calls a run would make and their credit cost. Makes no calls."""
    try:
        scope = load_scope(path)
    except CodeRakshError as exc:
        _fail(exc)
    calls = plan_calls(scope)
    cap = min(Settings.from_env().run_budget, scope.pilot.max_credits, PILOT_HARD_CAP)
    for c in calls:
        typer.echo(f"{c.cost:>3}  {c.path}  {json.dumps(c.query)}  # {c.purpose}")
    total = plan_cost(calls)
    typer.echo(f"\nplanned cost: {total} credits | cap: {cap}")
    if total > cap:
        typer.secho("planned cost exceeds the cap; optional calls would be skipped", fg="yellow")


@app.command()
def run(
    path: Path,
    mode: str = typer.Option(None, help="mock or live (default: CODERAKSH_MODE, else mock)"),
    approve_pilot: str = typer.Option(
        None, "--approve-pilot",
        help="Type the program id to approve the pilot. Required for live mode.",
    ),
) -> None:
    """Run the research pipeline and write Markdown and JSON reports."""
    try:
        settings = Settings.from_env()
        scope = load_scope(path)
        report = Engine(settings, scope, scope_path=path, mode=mode, approval=approve_pilot).run()
    except CodeRakshError as exc:
        _fail(exc)
    out = settings.reports_dir / report.program_id
    typer.echo(f"run {report.run_id} ({report.mode}): spent {report.credits_spent}/"
               f"{report.credits_budget} credits"
               f"{' (simulated)' if report.credits_simulated else ''}")
    typer.echo(f"{len(report.tech_signals)} technologies, {len(report.hypotheses)} hypotheses, "
               f"{len(report.intel)} watchlist entries")
    typer.echo(f"report: {out / (report.run_id + '.md')}")
    for w in report.warnings:
        typer.secho(f"warning: {w}", fg="yellow", err=True)


@app.command()
def credits(mode: str = typer.Option(None)) -> None:
    """Show the Tapline credit balance (free endpoint)."""
    try:
        typer.echo(json.dumps(get_balance(Settings.from_env(), mode), indent=2))
    except CodeRakshError as exc:
        _fail(exc)


@app.command()
def ledger(program: str = typer.Option(None)) -> None:
    """Show credits spent per endpoint."""
    settings = Settings.from_env()
    settings.ensure_dirs()
    led = Ledger(settings.db_path)
    typer.echo(json.dumps(led.summary(program=program), indent=2))
    led.close()


@app.command()
def cve(ids: list[str], mode: str = typer.Option(None)) -> None:
    """KEV and EPSS lookup for CVE ids (free public sources)."""
    try:
        typer.echo(json.dumps(cve_lookup(Settings.from_env(), ids, mode), indent=2))
    except CodeRakshError as exc:
        _fail(exc)


@app.command()
def serve(host: str = "127.0.0.1", port: int = 8000) -> None:
    """Start the FastAPI backend. Needs CODERAKSH_API_TOKEN."""
    import uvicorn

    uvicorn.run("coderaksh.api:create_app", factory=True, host=host, port=port)
