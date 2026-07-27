#!/usr/bin/env python3
"""Inventory dirty and untracked paths in the QLLaw worktree and produce a
classification with action plan. Pure read-only — never deletes anything.

Outputs:
  docs/audit/final-213-customer-ready/release-integration/worktree-inventory.json
  docs/audit/final-213-customer-ready/release-inventory/worktree-inventory.md
  docs/audit/final-213-customer-ready/release-integration/cleanup-candidates.json
  docs/audit/final-213-customer-ready/release-integration/release-blockers.json
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"d:\Study\Project\QLLaw-main")
AUDIT_DIR = ROOT / "docs" / "audit" / "final-213-customer-ready" / "release-integration"


def run_git(args: list[str], check: bool = True) -> str:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), *args],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    if check and proc.returncode != 0:
        raise RuntimeError(f"git {args} failed: {proc.stderr.strip()}")
    return proc.stdout


MAX_SHA_BYTES = 5 * 1024 * 1024  # Only hash files <= 5 MB


def sha256_of(path: Path) -> str | None:
    try:
        if path.is_dir() or not path.exists():
            return None
        if path.stat().st_size > MAX_SHA_BYTES:
            return None
        h = hashlib.sha256()
        with path.open("rb") as fh:
            for chunk in iter(lambda: fh.read(65536), b""):
                h.update(chunk)
        return h.hexdigest()
    except OSError:
        return None


def classify(path: str, status_code: str, tracked: bool) -> tuple[str, str, str]:
    """Return (category, action, rationale) for the given path."""
    p = path.replace("\\", "/").lower()
    name = Path(path).name

    # Locked contracts and source DOCX are explicitly preserved
    if "audit/docx/contracts/locked" in p:
        return ("LOCKED_CONTRACT", "KEEP_AND_COMMIT", "Locked form contracts — source of truth")
    if "storage/templates/source" in p:
        return ("ORIGINAL_DOCX_SOURCE", "KEEP_AND_COMMIT", "Original DOCX template sources")
    if "storage/templates/normalized-docx" in p:
        return ("NORMALIZED_DOCX_CANONICAL", "KEEP_AND_COMMIT", "Canonical normalized DOCX artifacts")

    # Forbidden paths
    if name in {".env", "playwright/.clerk/admin.json"} or p.endswith("/.env"):
        return ("BLOCK_RELEASE_SECRET", "BLOCK_RELEASE_SECRET", "Contains or may contain secrets")

    # Probe scripts (untracked)
    if name.startswith("_probe-") and name.endswith(".mjs"):
        return ("SCRATCH_PROBE", "DELETE_SAFE", "Untracked throwaway probe script")

    # .tmp-* dirs
    if "/.tmp-" in p or p.startswith(".tmp-"):
        return ("TEMPORARY_RENDER_OUTPUT", "DELETE_SAFE", "Throwaway mutation sidecar")

    # test-results, screenshots, etc.
    if p.startswith("test-results/") or "playwright-report" in p:
        return ("CACHE_OR_BUILD_OUTPUT", "DELETE_SAFE", "Playwright test results")
    if "/screenshots/" in p:
        return ("PLAYWRIGHT_OUTPUT", "REVIEW_REQUIRED", "Playwright screenshot — review first")

    # Forensic scripts under apps/api/scripts
    if p.startswith("apps/api/scripts/forensic-") or p.startswith("apps/api/scripts/audit-docx-"):
        return ("OBSOLETE_SCRIPT", "DELETE_SAFE", "Untracked forensic script — diagnostics already in canonical audit")
    if p.startswith("apps/api/scripts/probe-") or p.startswith("apps/api/scripts/render-via-"):
        return ("OBSOLETE_SCRIPT", "DELETE_SAFE", "Untracked probe script — diagnostics already captured")

    # Stray shell command artifact at root
    if name.startswith("{") and "/" not in path:
        return ("SCRATCH_PROBE", "DELETE_SAFE", "Stray shell command fragment")

    # Cursor hook configs (untracked local state)
    if p.startswith(".cursor/hooks/") and not tracked:
        return ("LOCAL_RUNTIME_DATA", "KEEP_UNTRACKED_LOCAL", "Operator-installed local Cursor hook")
    if p == ".cursor/hook-smoke-results.json" or p == ".cursor/hooks.json":
        return ("CACHE_OR_BUILD_OUTPUT", "DELETE_SAFE", "Local hook smoke artifact")
    if p == ".cursor/qllaw-goal-state.pre-overnight.json":
        return ("REPRODUCIBLE_GENERATED_ARTIFACT", "DELETE_SAFE", "Pre-overnight goal-state snapshot — current goal-state covers this")

    # Tracked product source changes — keep and commit
    if tracked and status_code.strip() not in ("D", "!!"):
        if p.startswith("apps/api/prisma/") and p.endswith(".sql"):
            return ("DATABASE_SCHEMA_OR_MIGRATION", "KEEP_AND_COMMIT", "Prisma migration SQL")
        if p.startswith("apps/api/prisma/"):
            return ("DATABASE_SCHEMA_OR_MIGRATION", "KEEP_AND_COMMIT", "Prisma schema/baseline")
        if p.startswith("apps/") or p.startswith("packages/") or p.startswith("scripts/") or p.startswith("test/") or p.startswith("tests/"):
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Tracked product source change")
        if p.startswith("docker/") or p.startswith("docker-compose."):
            return ("PRODUCT_CONFIG", "KEEP_AND_COMMIT", "Tracked Docker config")
        if p.startswith("docs/audit/final-213-customer-ready/"):
            return ("CANONICAL_AUDIT_EVIDENCE", "KEEP_AND_COMMIT", "Canonical audit evidence")
        if p.startswith("docs/audit/") or p.startswith("docs/operations/"):
            return ("CANONICAL_AUDIT_EVIDENCE", "KEEP_AND_COMMIT", "Tracked audit/operations evidence")
        if p.startswith("docs/"):
            return ("CANONICAL_RELEASE_DOCUMENTATION", "KEEP_AND_COMMIT", "Documentation change")
        if p == ".gitignore":
            return ("PRODUCT_CONFIG", "KEEP_AND_COMMIT", "Tracked .gitignore change")
        if p == "package.json" or p.endswith("pnpm-lock.yaml"):
            return ("PRODUCT_CONFIG", "KEEP_AND_COMMIT", "Tracked package manifest / lockfile")
        if p.endswith(".yml") or p.endswith(".yaml") or p.endswith("Dockerfile"):
            return ("PRODUCT_CONFIG", "KEEP_AND_COMMIT", "Tracked Docker / compose config")
        if p.startswith(".env") and not p.endswith(("/", ".env", ".env.example", ".env.e2e.example", ".env.docker.example", ".env.docker.demo.example")):
            return ("SECRET_OR_ENV", "BLOCK_RELEASE_SECRET", "Tracked env file (not an example)")
        if p == ".env.example":
            return ("PRODUCT_CONFIG", "KEEP_AND_COMMIT", "Tracked env example")
        if p == "docker-compose.demo.yml" or p == "docker-compose.prod.yml" or p.startswith("infra/"):
            return ("PRODUCT_CONFIG", "KEEP_AND_COMMIT", "Tracked infrastructure config")
        if p.startswith("storage/bootstrap-artifacts/"):
            return ("REPRODUCIBLE_GENERATED_ARTIFACT", "KEEP_AND_COMMIT", "Bootstrap artifact — kept for reproducibility")
        if p.startswith(".ai/"):
            return ("CANONICAL_AUDIT_EVIDENCE", "KEEP_AND_COMMIT", "Harness AI artifacts")

    # Untracked but legitimate product code
    if not tracked:
        if p.startswith("apps/api/src/"):
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Untracked product source — new code")
        if p.startswith("apps/web/src/"):
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Untracked web product source — new code")
        if p.startswith("packages/form-contracts/src/"):
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Untracked form-contracts source — new code")
        if p.startswith("apps/api/prisma/"):
            return ("DATABASE_SCHEMA_OR_MIGRATION", "KEEP_AND_COMMIT", "Untracked prisma schema/migration")
        if p.startswith("docs/"):
            return ("CANONICAL_RELEASE_DOCUMENTATION", "KEEP_AND_COMMIT", "Untracked documentation")
        if p == ".env.docker.demo.example":
            return ("PRODUCT_CONFIG", "KEEP_AND_COMMIT", "Untracked demo env example")
        if p == ".cursor/qllaw-goal-state.json":
            return ("CANONICAL_AUDIT_EVIDENCE", "KEEP_AND_COMMIT", "Cursor goal-state — local evidence")
        if p == ".cursor/rules/qllaw-autonomous-goal.mdc":
            return ("CANONICAL_RELEASE_DOCUMENTATION", "KEEP_AND_COMMIT", "Cursor rule — autonomous goal contract")
        if p.startswith("tests/e2e/") and (name.endswith(".auth.spec.ts") or name.endswith(".spec.ts")):
            return ("PRODUCT_TEST", "KEEP_AND_COMMIT", "Untracked e2e spec — keep")
        if p.startswith("tests/e2e/helpers/"):
            return ("PRODUCT_TEST", "KEEP_AND_COMMIT", "Untracked test helper — keep")
        if p.startswith("test/") and (name.endswith(".test.ts") or name.endswith(".test.mjs") or name.endswith(".test.cjs")):
            return ("PRODUCT_TEST", "KEEP_AND_COMMIT", "Untracked Node test — keep")
        if p.startswith("test/") or p.startswith("scripts/document-fidelity/") or p.startswith("scripts/stage-a/") or p.startswith("scripts/runtime-rollout/") or p.startswith("test/document-fidelity/") or p.startswith("test/forms/") or p.startswith("test/runtime-readiness/") or p.startswith("test/stage-a/"):
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Untracked test/script directory — keep")
        if p.startswith("scripts/") and (name.endswith(".mjs") or name.endswith(".cjs") or name.endswith(".ts") or name.endswith(".ps1")):
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Untracked script — keep")
        if p.startswith("batches/"):
            return ("CANONICAL_AUDIT_EVIDENCE", "KEEP_AND_COMMIT", "Batch evidence directory — keep")
        if p.startswith("docs/audit/"):
            return ("CANONICAL_AUDIT_EVIDENCE", "KEEP_AND_COMMIT", "Untracked audit evidence — keep")
        if p.startswith("infra/mariadb/"):
            return ("PRODUCT_CONFIG", "KEEP_AND_COMMIT", "Untracked infra config — keep")
        if p == "docker-compose.demo.yml" or p == "playwright.213-audit.config.ts":
            return ("PRODUCT_CONFIG", "KEEP_AND_COMMIT", "Untracked compose/Playwright config — keep")
        if p.startswith("storage/bootstrap-artifacts/bootstrap-20"):
            return ("REPRODUCIBLE_GENERATED_ARTIFACT", "DELETE_SAFE", "Timestamped untracked bootstrap snapshot — only latest kept")
        if p.startswith("storage/bootstrap-artifacts/"):
            return ("REPRODUCIBLE_GENERATED_ARTIFACT", "REVIEW_REQUIRED", "Untracked bootstrap artifact — review")
        if p.startswith("storage/tmp/"):
            return ("TEMPORARY_RENDER_OUTPUT", "DELETE_SAFE", "Untracked storage tmp dir")
        if name.startswith("_tmp_") or name == "_extract_audit_summary.mjs":
            return ("SCRATCH_PROBE", "DELETE_SAFE", "Untracked throwaway scratch script")
        if p == "scripts/audit/audit-213-semantic-ui-maturity.mjs" or p == "scripts/audit/browser-213-audit.mjs" or p == "scripts/audit/generate-213-artifacts.mjs" or p == "scripts/audit/structural-213-validator.mjs":
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Referenced 213 audit script")
        if p == "apps/api/scripts/get-clerk-ticket.mjs":
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Clerk ticket helper for E2E")
        if p.startswith("packages/form-contracts/test/"):
            return ("PRODUCT_TEST", "KEEP_AND_COMMIT", "Untracked form-contracts test")
        if p.startswith("scripts/release/"):
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Untracked release helper script")

    # Tracked deletions — investigate further
    if tracked and status_code.strip() == "D":
        if "templates/normalized-docx" in p:
            return ("NORMALIZED_DOCX_CANONICAL", "REVIEW_REQUIRED", "Tracked normalized DOCX deletion — must investigate")
        if p.startswith("apps/") or p.startswith("packages/") or p.startswith("tests/"):
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Tracked deletion — commit")
        if p.startswith("scripts/"):
            return ("PRODUCT_SOURCE", "KEEP_AND_COMMIT", "Tracked script deletion — commit")
        return ("PRODUCT_SOURCE", "REVIEW_REQUIRED", "Tracked deletion — investigate")

    return ("UNKNOWN_REVIEW_REQUIRED", "REVIEW_REQUIRED", "Path needs operator review")


def main() -> int:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat()

    # Collect dirty paths from porcelain v1 (no recurse, no ignored, no --untracked-files=all)
    # Format: "XY PATH" or "XY ORIG -> PATH"
    porcelain = run_git(["status", "--porcelain=v1", "-z", "--untracked-files=normal", "--ignored=no"])
    records: list[dict] = []
    parts = porcelain.split("\x00")
    i = 0
    while i < len(parts):
        chunk = parts[i]
        if not chunk:
            i += 1
            continue
        if chunk.startswith("??"):
            path = chunk[3:]
            records.append({
                "status": "??",
                "path": path,
                "tracked": False,
                "originalPath": None,
            })
            i += 1
            continue
        if chunk.startswith("!!"):
            path = chunk[3:]
            records.append({
                "status": "!!",
                "path": path,
                "tracked": False,
                "originalPath": None,
            })
            i += 1
            continue
        # Tracked changes: "XY PATH" or "XY ORIG\0PATH"
        code = chunk[:2]
        rest = chunk[3:]
        original = None
        # Renamed/copied entries: "XY ORIG -> PATH" or "XY ORIG\0PATH"
        if code[0] in ("R", "C"):
            # Could be space-separated "ORIG -> PATH" or NUL-separated
            if "\x00" not in chunk:
                # "ORIG -> PATH" form
                if " -> " in rest:
                    orig, _, path = rest.partition(" -> ")
                    original = orig
                else:
                    path = rest
            else:
                # NUL-separated: chunk was "XY ORIG" then path in next chunk
                original = rest
                i += 1
                path = parts[i]
        else:
            path = rest
        tracked = True
        records.append({
            "status": code,
            "path": path,
            "tracked": tracked,
            "originalPath": original,
        })
        i += 1

    # Build full inventory
    items = []
    for rec in records:
        path = rec["path"]
        abs_path = ROOT / path
        size = abs_path.stat().st_size if abs_path.exists() and abs_path.is_file() else 0
        sha = sha256_of(abs_path) if abs_path.is_file() else None
        last_write = (
            datetime.fromtimestamp(abs_path.stat().st_mtime, timezone.utc).isoformat()
            if abs_path.exists() else None
        )
        extension = abs_path.suffix.lower() if abs_path.is_file() else ""
        category, action, rationale = classify(path, rec["status"], rec["tracked"])
        items.append({
            "path": path,
            "gitStatus": rec["status"],
            "tracked": rec["tracked"],
            "sizeBytes": size,
            "sha256": sha,
            "extension": extension,
            "lastWriteTime": last_write,
            "category": category,
            "action": action,
            "rationale": rationale,
        })

    # Counts
    counts: dict[str, int] = {}
    action_counts: dict[str, int] = {}
    for it in items:
        counts[it["category"]] = counts.get(it["category"], 0) + 1
        action_counts[it["action"]] = action_counts.get(it["action"], 0) + 1

    # Save inventory
    out = {
        "schema": "qllaw.worktree_inventory/v1",
        "generatedAt": generated_at,
        "head": run_git(["rev-parse", "HEAD"]).strip(),
        "branch": run_git(["branch", "--show-current"]).strip(),
        "totalItems": len(items),
        "categoryCounts": counts,
        "actionCounts": action_counts,
        "items": items,
    }
    (AUDIT_DIR / "worktree-inventory.json").write_text(
        json.dumps(out, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Cleanup candidates
    cleanup_items = [it for it in items if it["action"] in {"DELETE_SAFE", "ADD_TO_GITIGNORE", "KEEP_AND_COMMIT"}]
    cleanup_out = {
        "schema": "qllaw.cleanup_candidates/v1",
        "generatedAt": generated_at,
        "totalCandidates": len(cleanup_items),
        "deleteSafeCount": action_counts.get("DELETE_SAFE", 0),
        "keepAndCommitCount": action_counts.get("KEEP_AND_COMMIT", 0),
        "items": cleanup_items,
    }
    (AUDIT_DIR / "cleanup-candidates.json").write_text(
        json.dumps(cleanup_out, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Release blockers
    blockers = [it for it in items if it["action"] in {"BLOCK_RELEASE_SECRET", "BLOCK_RELEASE_UNKNOWN", "REVIEW_REQUIRED"}]
    blocker_out = {
        "schema": "qllaw.release_blockers/v1",
        "generatedAt": generated_at,
        "totalBlockers": len(blockers),
        "items": blockers,
    }
    (AUDIT_DIR / "release-blockers.json").write_text(
        json.dumps(blocker_out, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Markdown summary
    lines = [
        "# Worktree Inventory",
        "",
        f"- Generated at: `{generated_at}`",
        f"- Branch: `{out['branch']}`",
        f"- Head: `{out['head']}`",
        f"- Total dirty/untracked items: **{len(items)}**",
        "",
        "## Category Counts",
        "",
        "| Category | Count |",
        "|---|---:|",
    ]
    for cat, n in sorted(counts.items(), key=lambda kv: -kv[1]):
        lines.append(f"| {cat} | {n} |")
    lines += [
        "",
        "## Action Counts",
        "",
        "| Action | Count |",
        "|---|---:|",
    ]
    for act, n in sorted(action_counts.items(), key=lambda kv: -kv[1]):
        lines.append(f"| {act} | {n} |")
    lines += [
        "",
        "## Top 20 Delete-Safe Candidates",
        "",
        "| Path | Size |",
        "|---|---:|",
    ]
    for it in sorted([i for i in items if i["action"] == "DELETE_SAFE"], key=lambda x: -x["sizeBytes"])[:20]:
        lines.append(f"| `{it['path']}` | {it['sizeBytes']:,} |")
    (AUDIT_DIR / "worktree-inventory.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

    print(f"Inventory: {len(items)} items")
    print(f"Action counts: {action_counts}")
    print(f"Category counts: {counts}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
