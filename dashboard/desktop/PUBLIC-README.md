# Skill Atlas

A local research workspace for your own papers, evidence, notes and writing. Create a researcher profile and up to five separate research topics. Each topic has its own SQLite database, source files, reading progress, drafts and Codex conversations. New installations start empty; no research papers or personal data are included.

## Start

Requires Node.js 24+ and npm. Install dependencies, then launch:

```sh
npm ci --prefix dashboard
npm start
```

Open http://127.0.0.1:4310. Keep this process open. Stop with Control-C or `npm run stop` in another Terminal. The interface uses a local Vite server; this release is for local use, not public web hosting.

## Mac application

On macOS with Apple's command-line developer tools installed:

```sh
npm run app:mac
```

Open `output/Skill Atlas.app` from Finder, or double-click `Start Skill Atlas.command`. The app includes its own Node runtime, a native window, edit shortcuts, file dialogs, persistent browser storage and logs. The build copies the local runtime and its non-system dynamic libraries; use `ATLAS_NODE_RUNTIME` to select another Node 24+ executable. This is a locally signed app for the current Mac architecture; public binary distribution needs the developer's signing/notarisation and dependency-license review.

Quit from Skill Atlas → Quit Skill Atlas or Command-Q. Quit stops the workspace services and active analysis; saved conversations can be explicitly continued later. Closing the window keeps the application running, as on other Mac apps. Logs: `~/Library/Logs/Skill Atlas/atlas.log`. Rebuild after moving the source folder. `Stop Skill Atlas.command` also stops the services.

## Research workflow

1. Enter your name, role, optional institution and first research topic.
2. Import a local PDF folder in Paper review, supplying the research question for that collection. The task workbench also accepts supporting file attachments (up to 20 files / 30 MB per upload).
3. Install and authenticate the Codex CLI separately; set `CODEX_BIN` if it is not on your PATH. Click Connect in the app. A running ChatGPT application is unnecessary. AI processing uses your configured Codex account and sends task context to the configured AI service.
4. Analyse individual papers using the included source-grounded research workflows. Additional skill collections are optional imports.
5. Inspect original pages, appraisals, screening decisions and your notes. Continue saved tasks through Task history.
6. Save the review brief, editable writing outline and drafts; export your writing and workspace backup.

PDF extraction and source previews require Python 3 with the packages in `dashboard/requirements.txt`. Set `RESEARCH_PYTHON` and `RESEARCH_SEARCH_PYTHON` to the Python environment's executable. Scanned PDFs need separate OCR. Long documents require a scoped range of at most 100 PDF pages for analysis.

Researcher review, full reading, AI analysis and source verification are separate states. The app does not certify findings or automate acceptance decisions. The generic workspace supports arbitrary research questions and writing sections. Additional advanced legacy SLR tools remain in the code as an optional study-specific template; they are not prefilled research for a new user.

## Storage and checks

The first topic uses `dashboard/.local/` and `research/`. Additional topics use isolated directories under `dashboard/.local/topics/`. Back these up along with any externally registered project folders. Save work before switching topics. Browser recovery drafts are scoped per topic; saved data is authoritative, and stale saves are rejected.

```sh
npm run typecheck
npm run build
npm test
```

Tests include temporary research state and mock Codex; they do not run real AI jobs. Tests of optional upstream skill collections require those checkouts. The app is for one trusted local user. Topic separation is an organisational boundary, not access control between users of the same computer.

## GitHub and redistribution

Keep `.local`, `research`, `upstream`, credentials, generated outputs and `.env` files out of Git. `MANIFEST.json` records the exact packaged source files. Source packaging excludes research state, account files, PDFs, drafts, machine-specific mappings, downloaded skill repositories and compiled binaries.

Created by Mukul Mech. Existing third-party attribution is retained. No blanket open-source license has been assigned: choose a repository license after reviewing component provenance and dependency licenses. In particular, review any commercial design-component adaptations before public redistribution.
