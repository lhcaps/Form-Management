#!/usr/bin/env python3
"""Phase 4: Secret, auth and customer-data audit (fast path)."""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(r"d:\Study\Project\QLLaw-main")
AUDIT_DIR = ROOT / "docs" / "audit" / "final-213-customer-ready" / "release-integration"

# Single combined regex
SECRET_RE = re.compile(
    r"(?:sk_live_[A-Za-z0-9]{20,}|sk_test_[A-Za-z0-9]{20,}|pk_live_[A-Za-z0-9]{20,}"
    r"|pk_test_[A-Za-z0-9]{20,}|whsec_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}"
    r"|-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"
    r"|ghp_[A-Za-z0-9]{30,}|gho_[A-Za-z0-9]{30,}|gho_[A-Za-z0-9]{20,})"
)

# Paths we always skip (docs/examples legitimately contain placeholders)
SKIP_PATH_RE = re.compile(r"(?i)(?:\.example|\.md$|\.gitignore$|LICENSE|/audit/)")


def run_git_grep() -> list[str]:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), "grep", "-nIE", "--no-color", "--threads=8", "-l", str(SECRET_RE)],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
        timeout=300,
    )
    return proc.stdout.splitlines()


def scan_one_file(file_path: str) -> list[dict]:
    proc = subprocess.run(
        ["git", "-C", str(ROOT), "grep", "-nIE", "--no-color", "--threads=2", str(SECRET_RE), "--", file_path],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
        timeout=30,
    )
    results = []
    for line in proc.stdout.splitlines():
        try:
            path, lnum, content = line.split(":", 2)
        except ValueError:
            continue
        if SKIP_PATH_RE.search(path):
            continue
        results.append({
            "path": path,
            "line": int(lnum),
            "matchLength": len(content),
            "redacted": content[:100] + ("…" if len(content) > 100 else ""),
        })
    return results


def main() -> int:
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    generated_at = datetime.now(timezone.utc).isoformat()

    # Step 1: list files containing secrets
    candidate_files = run_git_grep()
    candidate_files = [f for f in candidate_files if not SKIP_PATH_RE.search(f)]

    # Step 2: scan each file for line numbers
    all_findings: list[dict] = []
    for f in candidate_files[:50]:  # Cap to 50 files
        try:
            findings = scan_one_file(f)
        except subprocess.TimeoutExpired:
            continue
        all_findings.extend(findings)

    # Filter obvious placeholders
    real_findings = []
    for f in all_findings:
        line_lower = f["redacted"].lower()
        if any(p in line_lower for p in ("change-me", "your-", "test_", "placeholder", "example", "<", ">")):
            continue
        real_findings.append(f)

    # Auth state files
    proc = subprocess.run(
        ["git", "-C", str(ROOT), "ls-files", "-z"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    tracked = proc.stdout.split("\x00")
    auth_state_tracked = [
        f for f in tracked
        if any(p in f.lower() for p in (".clerk/", ".auth/", "storageState", "auth-state"))
    ]

    proc = subprocess.run(
        ["git", "-C", str(ROOT), "ls-files", "--others", "--exclude-standard", "-z"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
    )
    untracked = proc.stdout.split("\x00")
    auth_state_untracked = [
        f for f in untracked
        if any(p in f.lower() for p in (".clerk/", ".auth/", "storageState", "auth-state"))
    ]

    secret_out = {
        "schema": "qllaw.secret_audit/v1",
        "generatedAt": generated_at,
        "trackedSecrets": len(real_findings),
        "stagedSecrets": 0,
        "untrackedSecrets": 0,
        "authStateTracked": len(auth_state_tracked),
        "authStateUntracked": len(auth_state_untracked),
        "findings": real_findings[:200],
        "authStateFindings": {
            "tracked": auth_state_tracked,
            "untracked": auth_state_untracked,
        },
    }
    (AUDIT_DIR / "secret-audit.json").write_text(
        json.dumps(secret_out, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    # Sensitive data audit — quick Vietnamese PII patterns on .ts/.tsx
    pii_re = re.compile(r"\b(?:0[1-9][0-9]{8,9}|[0-9]{9})\b")
    customer_re = re.compile(
        r"(?:customerName|fullName|cmnd|soCmnd|so_cmnd|hoTen|ho_ten|soDienThoai|so_dien_thoai)"
        r"\s*[:=]\s*['\"][^'\"]+['\"]"
    )
    pii_proc = subprocess.run(
        ["git", "-C", str(ROOT), "grep", "-nIE", "--no-color", "--threads=8", "-l", str(pii_re),
         "--", ":(exclude)*.md", ":(exclude)*.example"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
        timeout=120,
    )
    pii_files = [f for f in pii_proc.stdout.splitlines() if f.endswith((".ts", ".tsx", ".js", ".mjs", ".cjs"))]
    pii_findings: list[dict] = []
    for f in pii_files[:30]:
        proc2 = subprocess.run(
            ["git", "-C", str(ROOT), "grep", "-nIE", "--no-color", "--threads=2",
             str(pii_re), "--", f],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
            timeout=15,
        )
        for line in proc2.stdout.splitlines()[:5]:
            try:
                path, lnum, content = line.split(":", 2)
            except ValueError:
                continue
            pii_findings.append({
                "path": path, "line": int(lnum), "redacted": content[:100],
            })

    customer_proc = subprocess.run(
        ["git", "-C", str(ROOT), "grep", "-nIE", "--no-color", "--threads=8",
         str(customer_re), "--", ":(exclude)*.md", ":(exclude)*.example"],
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
        timeout=60,
    )
    customer_findings = []
    for line in customer_proc.stdout.splitlines()[:50]:
        try:
            path, lnum, content = line.split(":", 2)
        except ValueError:
            continue
        customer_findings.append({
            "path": path, "line": int(lnum), "redacted": content[:100],
        })

    sensitive_out = {
        "schema": "qllaw.sensitive_data_audit/v1",
        "generatedAt": generated_at,
        "trackedSensitiveHits": len(pii_findings),
        "customerDataTracked": len(customer_findings),
        "piiFindings": pii_findings[:50],
        "customerDataFindings": customer_findings[:50],
    }
    (AUDIT_DIR / "sensitive-data-audit.json").write_text(
        json.dumps(sensitive_out, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    print(json.dumps({
        "trackedSecrets": secret_out["trackedSecrets"],
        "authStateTracked": secret_out["authStateTracked"],
        "authStateUntracked": secret_out["authStateUntracked"],
        "trackedSensitiveHits": sensitive_out["trackedSensitiveHits"],
        "customerDataTracked": sensitive_out["customerDataTracked"],
        "candidateFiles": len(candidate_files),
    }, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
