## Project

**OmniBank Local**

Local-first personal finance app with optional AI assistant (Ollama). Zero cloud â€” SQLite DB lives on-device, everything runs offline. Modern mobile-first UI wrapping spreadsheet-level financial control. Supports Organisation Mode for small teams/associations under a paid license key.

Target: Privacy-conscious individuals; French associations/CSE needing lightweight shared finance tools without external hosting costs or privacy tradeoffs.

**Core Value:** Financial data sovereignty â€” your records never leave your machine â€” while still getting intelligent decision support from a local LLM (RAG chat, smart categorisation, trend analysis) entirely offline.

### Constraints

- **Privacy**: No external API calls beyond user-configured Ollama endpoint â€” zero telemetry, zero tracking
- **Language**: French primary language throughout; English translation mandatory for every new i18n key
- **Tech stack**: Python FastAPI backend, SQLite (SQLAlchemy), Tauri (Rust) desktop wrapper. V1 uses vanilla JS and Chart.js; V2 uses React, Vite, Astryx and TanStack Charts.
- **Accounting precision**: Round-trip CSV benchmark must pass exactly against reference image â€” decimal accuracy is non-negotiable
- **Debug logs**: Backend/frontend debug output written in French per rule G-04 Construction Plan.yaml
- **LLM prompts**: System prompts for Ollama must be English for function calling stability; response language injected dynamically by backend


## Technology Stack

## Current Stack (Production)

| Layer | Technology | Notes |
|-------|-----------|-------|
| Backend | Python FastAPI + Uvicorn | uvloop/httptools under Docker |
| ORM | SQLAlchemy + SQLite | 30s busy timeout, PRAGMAs tuned |
| Data | Pandas | CSV parsing only |
| Frontend V1 | Vanilla HTML5/CSS3/JS | Chart.js, VirtualTable for large data |
| Frontend V2 | React 19 + Vite + Astryx | TanStack Charts + Router; CSS modules; opt-in dashboard |
| Desktop | Tauri 2.x (Rust) | PyInstaller --onedir bundle |
| AI | Ollama local API | Auto-detect via /api/tags |
| Container | Docker + Nginx | SSE streaming via X-Accel-Buffering: no |
| I18n | JSON (fr.json, en.json) | UTF-8-sig BOM, Python-side writes only |

## Migration boundaries

- V2 migration is explicitly authorized. Keep V1 available while moving screens to the isolated V2 frontend.
- No Postgres migration â€” SQLite sufficient for local-first


## Conventions

**IMPORTANT (user rule):** NEVER automatically commit changes. Always wait for explicit user instruction before committing to git.

- **Changelog (`CHANGELOG.md`)** : Doit toujours Ãªtre rÃ©digÃ© en anglais, concis et orientÃ© utilisateur (fonctionnalitÃ©s visibles et bugs corrigÃ©s perceptibles).
- **GitHub Releases** : Les notes dÃ©taillÃ©es et techniques exhaustives doivent Ãªtre intÃ©grÃ©es dans les notes de release GitHub lors de la publication.

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.

## Project skills

Skills are installed in `.agents/skills/` from `mattpocock/skills` and `theclaymethod/unslop`.
Use a skill when relevant to the task; no GSD workflow is required.

## UI V2

See `ui-v2/README.md` for setup and `docs/UI-V2-PLAN.md` for scope and verification.
Use scoped CSS modules, shared tokens, Astryx controls and local API calls.
