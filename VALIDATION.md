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

## Layout refinement — 20 October 2026

- Reading/evidence metric tiles use equal columns and aligned label, value, bar and count rows; narrow layouts stack without horizontal overflow.
- Welcome layout checked at 1440, 1280, 1024, 768 and 390 CSS pixels in both light and dark themes.
- Reader docking, fit-width PDF rendering and in-flow strand toolbar checked at five widths in both themes.
- Twelve main application screens checked at 1440, 768 and 390 pixels with zero page-level horizontal overflow or browser exceptions.
- Statement actions, metadata layout and collapsed-header docking checked at a 1152-pixel viewport with 1.25 device scale, equivalent to 125% browser zoom on a 1440-pixel display.
- All 109 regression tests, TypeScript checks and production compilation passed. The existing full-project lint limitations above still apply.
- Layout checks were read-only: no papers, saved notes, screening decisions or verification results were changed.

## Collapsible progress and compact controls — 20 October 2026

- Reading/evidence widgets collapse to a summary, support keyboard activation, and remember open/closed state per topic and placement.
- Compact and Comfortable control sizes persist as a browser appearance preference; source and evidence text size is unchanged.
- Reader navigation, collapse/expand and close controls use a short toolbar. Secondary actions and the size switch are in More; Escape and outside clicks dismiss the menu.
- Browser checks passed for persisted widget state, control-size persistence, More/Escape, reader collapse/reopen, and PDF rendering at 1440, 1152, 768 and 390 pixels in both themes with zero page/PDF horizontal overflow.
- Resize measurements are scheduled outside observer delivery; a regression test covers coalescing and cancellation. All 110 automated tests, TypeScript checks, focused lint for new functionality, and production compilation passed.

- Touch-emulation checks also passed with 40-pixel minimum targets and no horizontal overflow. The final cross-screen audit passed again with compact controls enabled.
- Final clean skeleton: 109 tests passed, one optional upstream-fixture test skipped; zero failures. TypeScript checks also passed.

## Expanded PDF controls and highlight markers — 20 October 2026

- Expanded controls now use grouped page navigation, equal-height reading-mode/zoom fields and a separate tool row. Reading coverage and category filters are in a dedicated disclosure rather than filling the toolbar.
- Numbered category/evidence markers remain visible beside the original page in embedded readers. Each marker is tied to an exact text anchor and opens its source passage; no marker is invented for page-only or unresolved analysis items.
- Narrow-reader navigation and inspector panes sit below the PDF instead of covering it. Source-passage navigation scrolls inside the PDF, preserving the surrounding workspace position.
- Browser checks passed for page and continuous modes at 1440, 1152, 768 and 390 pixels; mode/zoom fields aligned, marker selection worked with pointer and keyboard, and the highlight toggle hid/restored overlays. No page/PDF/control overflow or browser exceptions occurred.
- The same Agile Research Framework paper supplied in the screenshot was checked in dark mode. Touch-emulation checks passed with 40-pixel mode/zoom fields and accessible progress controls.
- All 110 automated tests passed; TypeScript and production compilation passed. Existing full-project lint limitations remain documented above.
- README now explains the product, research workflow, centralised materials, source traceability, marker legend and the role of researcher judgement.

## Version 1.0 documentation and security review — 21 October 2026

- Current production UI retained; exploratory layouts excluded from the release.
- Security review: 29 coverage units, zero confirmed vulnerabilities and seven conditional needs-validation records; candidate and final source-record reviews performed separately. Findings and coverage schema validators passed. Runtime tests were not executed under this audit. See docs/security-review-2026-10-21.md for clean-package applicability.
- This release changes documentation, version/packaging metadata and manifest hashes. Historical application tests above are not represented as freshly rerun. No new signed/notarised binary or fresh network dependency install is claimed.
