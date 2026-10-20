# Validation — 20 October 2026

- Existing research workspace: 109 automated tests passed.
- Clean skeleton: 108 tests passed, one optional upstream-checkout fixture test skipped, zero failures.
- TypeScript checks and production compilation passed for both the workspace and skeleton.
- Browser checks with temporary data passed: onboarding, saving, topic switching, recovery of saved topic content, five-topic limit, and no browser exceptions.
- New desktop/topic files passed focused ESLint. Full-project lint remains unsuccessful: 40 errors in existing components, mainly React hook rules. This release does not claim a clean full-project lint result.
- Native macOS app compiled; bundle signature and Info.plist validation passed. Startup, stop, port release, and native relaunch were checked. The app includes a Node 24 runtime and its own icon. Public binary signing/notarisation has not been performed.
- Package manifest hashes checked. No research databases, papers, research folders, credentials, machine-specific integration/paper mappings, or absolute private machine paths were packaged.
- Skeleton checks reused installed dependencies through a temporary ignored symlink, removed before Git staging. A fresh network-only dependency installation was not repeated.
- AI service tests use mock Codex; no new paid paper-analysis jobs were run for validation.
