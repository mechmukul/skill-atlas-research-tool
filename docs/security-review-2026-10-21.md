# Source security review — 21 October 2026

## Outcome and limits

The maintained Skill Atlas working project received a **standard, source-only audit workflow**: four reconnaissance assignments, three hunting waves, independent coverage critics, and separate candidate and final-record verifiers. The final ledger contains **29 units: 19 source-covered, 7 candidate units and 3 runtime-blocked units**. Final record checks referenced 71 distinct source paths.

**Result: 0 confirmed vulnerabilities; 7 conditional leads requiring validation; 0 rejected candidates.** A source-covered unit records a checked invariant, not proof of exhaustive runtime safety. Candidate validation and final-record verification check source accuracy and uncertainty; they do not establish exploitability.

The review followed [Cloudflare's security-audit skill](https://github.com/cloudflare/security-audit-skill). Target execution was prohibited because the available environment did not establish isolated networking, read-only target/toolchain access, scratch-only writes and all required resource/time limits. No real research, credentials, live service, paid AI task or external endpoint was used for reproduction.

## Applicability to this GitHub release

The audit target was the maintained local working project, not this generated clean package or an installed binary. Before the v1.0 metadata/documentation update, **253 snapshot files present in the clean package matched the audited files exactly**; the two differing present files were the workspace README and root package manifest. Twenty working-project files were omitted by the package allowlist. The v1.0 update changes documentation, packaging/version metadata and manifest hashes; it makes no UI or security-behaviour change.

The detailed local audit artifacts are retained privately by the maintainer. This publication is a sanitised summary without machine-specific paths, private research or reproduction payloads.

| Conditional lead | Applicability and unresolved fact |
| --- | --- |
| Local API peer identity | Gateway and workers use loopback and browser-header guards, without a source-visible per-launch capability or OS peer identity. A distinct lower-trust OS/app principal's reachability and access to a service-readable dummy file denied by filesystem permissions remain untested. Same-account process access alone is not a finding. |
| Health/Stop launcher identity | The Stop client accepts app/workspace health strings and a returned launcher PID. A separate lower-trust principal's ability to impersonate that endpoint and affect a harmless victim-owned process remains untested. No process was signalled during the audit. |
| PDF raster area | Width scaling is source-visible; a total pixel-area cap is not. Actual PyMuPDF/MuPDF geometry/allocation safeguards and meaningful resource impact remain untested. Existing timeouts, source-size and concurrency limits are real controls. |
| PDF text-offset cost | Source repeatedly encodes growing/full text to calculate UTF-16 offsets. A bounded operation-count observation and material impact remain untested; no denial of service is confirmed. |
| Legacy preparation service request checks | This alternate source entry point checks Origin more weakly than the current gateway. It is not started by the normal launcher; its supporting prepare-research script is omitted from the clean package. Actual supported enablement and browser/network behaviour remain unknown. |
| Legacy supplied-artifact import symlinks | import-synthesis.py follows supplied links into local synthesis data. This CLI is omitted from the clean package. Use with third-party link-preserving artifact folders and a bounded dummy-file result require validation; external disclosure was not established. |
| Offline workspace export symlinks | export-workspace.py follows research-tree links when copying an export. This CLI is omitted from the clean package. A distinct restricted writer and actual unintended inclusion remain unestablished; researcher-created links alone are not a vulnerability. |

Three additional coverage units remain blocked without a finding: indirect PDF instruction-to-action binding, resumed Codex policy/approval lifecycle behaviour, and sensitive-UI framing. Source alone did not establish the relevant provider/browser/OS behaviour.

## Positive source patterns and next work

Main APIs apply loopback binding and Host/Origin/Fetch-Site checks. Generic file access validates lexical and resolved containment; uploads use bounded inputs and exclusive file creation. SQLite queries use prepared statements in the reviewed paths. New Codex threads explicitly request user-reviewed approvals and workspace-write; research text is displayed through React escaping in the reviewed reachable paths.

Validation should start with local service/Stop identity using isolated dummy principals, then link-confined import/export fixtures and small instrumented PDF cost checks. Keep browser/OS, provider and parser safeguards in the analysis rather than assuming they are absent. Runtime checks must never use live research or stress the running app.

Potential hardening includes per-launch service authentication; link-rejecting/confined file traversal; bounded PDF output area/text and incremental offset accounting; explicit framing policy; resumed-thread policy verification; and release provenance controls. These are recommendations, not implemented fixes or severity-rated vulnerabilities.

Excluded from this review: private state/research, upstream and dependency internals, current vulnerability-database status, generated release trees, installed binaries, experimental UI prototypes, external model execution and deployed/cloud systems. No fresh package installation, app build or application test suite was run as part of this source-only security audit. Historical functional checks remain separately recorded in [VALIDATION.md](../VALIDATION.md).
