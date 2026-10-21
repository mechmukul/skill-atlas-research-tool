# Security policy

## Version 1.0 scope

Skill Atlas 1.0.0 is a local, single-researcher application. Keep it bound to loopback; do not expose the UI, gateway or worker ports to a public network. Research topics organise one researcher's work and are not authenticated multi-user tenants. Codex is optional and uses the researcher's own configured account and permissions.

The existing UI is retained for v1.0. The alternative UI previews are not part of this release.

## Review status

A source-only review on **21 October 2026** produced **zero confirmed vulnerabilities and seven conditional leads requiring validation** in the maintained working project. This is not a claim that the application is vulnerability-free, a completed penetration test or an independent security certification. Each retained lead received separate candidate and final-record source reviews. Both structured-report validators passed.

Runtime reproduction, browser/OS boundary tests, dependency/CVE database scans and installed-binary verification were not performed. The required isolated execution environment was unavailable. Some leads concern legacy scripts omitted from this clean skeleton. See [review scope and applicability](docs/security-review-2026-10-21.md).

Known conditional areas include local API peer identity, health/stop process identity, PDF resource bounds, and legacy artifact import/export symlink handling. No security fixes or runtime verification are claimed by this documentation release.

## Reporting a concern

Use this repository's **private vulnerability reporting** feature if it is enabled. If it is unavailable, arrange a private reporting channel with the repository owner before sharing sensitive details. Do not post credentials, personal research, private PDFs or exploit details in public issues.

Include the version/commit, affected source path, expected boundary, actual result, and a minimal reproduction using dummy data. Distinguish source observations from tests actually performed. Never test against someone else's installation or data.

Version 1.0 is the current documented baseline. No support or remediation response-time guarantee is made.
