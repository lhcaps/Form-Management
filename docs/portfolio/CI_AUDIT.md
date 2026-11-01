# CI audit

Baseline `8861eb966a608b035ec7a7b457c7074e6490119e`. On 2026-11-02, `gh run list --repo lhcaps/Form-Management --limit 3 --json databaseId,displayTitle,status,conclusion,headSha,workflowName,createdAt,url` identified [CI run 30346727737](https://github.com/lhcaps/Form-Management/actions/runs/30346727737) at this SHA as the latest run, completed with failure on 2026-07-28.

`gh run view 30346727737 --repo lhcaps/Form-Management --json jobs` identified failures in **Run deterministic CI verification**, **Run migration regression gate**, and **Build and probe production images**. `gh run view 30346727737 --repo lhcaps/Form-Management --log-failed` returned HTTP 410, so historical log text and root causes could not be confirmed from GitHub. A failed job is not a diagnosis.

The independent local corpus and consistency checks, environment and exact outcomes are recorded in [CORPUS_EVIDENCE.md](CORPUS_EVIDENCE.md). The fresh verifier found 11 extraction-hash blockers after an initial stale-report failure; neither observation proves the historical CI failure's cause. No migration or Docker production job was executed: `docker info --format '{{.ServerVersion}}'` could not connect to the Docker Desktop Linux engine. No CI configuration or test gate was weakened.

Next: investigate the 11 extraction-hash mismatches without changing locked contracts or original templates, then rerun the complete `pnpm verify:ci` job and capture its output in an isolated environment. Run the migration regression and Docker image probes against isolated services. Hosted CI for a new commit remains unverified until an authorized push and a matching-SHA run.
