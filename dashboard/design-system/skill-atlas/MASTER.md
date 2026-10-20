# Skill Atlas — local skill library

## Design provenance

Uses nextlevelbuilder/ui-ux-pro-max-skill, read from the local clone under upstream/ui-ux-pro-max-skill/.claude/skills/ui-ux-pro-max/SKILL.md.

Searched `developer tool skill library dashboard` and retried with `internal productivity dashboard` using --design-system, density 8, motion 2. Flat Design, dashboard density, restrained motion, teal productivity accents, readable typography, and keyboard accessibility fit this product. Generated landing-page patterns (FAQ and product demo) did not fit a working library and were not persisted or implemented. The library/task-workbench layout is an application-specific choice based on the skill's general navigation and progressive-disclosure guidance.

React search `search filter catalog` recommended deferred input and derived filtering. Quick-reference priorities 1–3 informed accessibility and performance checks.

## Product layout

- Skill Atlas is an extensible local library, not a claim of complete internet coverage.
- Compact navy navigation, bright neutral workspace, teal primary actions, orange accents for new collections.
- Library first: prominent search, actual inventory metrics, domain filters, grid/list toggle, sorting, and pagination (24 items/page).
- Cards expose domain, provenance, compatibility, saved state, and selection independently.
- Task workbench opens in an accessible sheet; keeps project, selected skills, request, and attachments together.
- Imports use two steps: inspect GitHub/local folder, then add the reviewed collection. Instructions are indexed without running install scripts.
- Existing Codex history, approval flows, attachments, and artifacts remain available.

## Tokens

Background #F7F9FC; card #FFFFFF; text #182B3E; muted text #53657A; nav #102334.
Primary #0F766E with white text; primary subtle #E8F5F1; highlight #C2410C on #FFF1E8.
System sans-serif stack for fully local rendering, with SFMono/Menlo for metadata. No runtime font CDN.
Body 16px; UI 14px; secondary metadata 12px. 4/8px spacing rhythm. 8–16px corner radii.

## Interaction and accessibility

One primary action per working section. Icon controls have names and >= 32px desktop targets, 44px touch targets. Keyboard focus is visible; dialogs trap focus and support Escape. Errors appear in the import form. Search input stays responsive with useDeferredValue; render at most 24 catalog items per page. Empty, loading, importing, error, and success states are explicit. Reduced motion disables animation. No horizontal page overflow at 375, 768, 1024, or 1440px.

## Paper review extension

The paper workspace follows a three-part reading flow: searchable queue, source-grounded analysis, and a visually separate warm-toned human notes panel. At narrow widths these stack; the notes panel stays beside the analysis on wider displays. Review state is explicitly human-owned. Imported, analysed, and human-reviewed counts remain distinct. Long volumes require scope selection. Source files open independently so the researcher can compare evidence against the draft.
