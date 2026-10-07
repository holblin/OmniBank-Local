## Project

**OmniBank Local**

Local-first personal finance app with optional AI assistant (Ollama). Zero cloud — SQLite DB lives on-device, everything runs offline. Modern mobile-first UI wrapping spreadsheet-level financial control. Supports Organisation Mode for small teams/associations under a paid license key.

Target: Privacy-conscious individuals; French associations/CSE needing lightweight shared finance tools without external hosting costs or privacy tradeoffs.

**Core Value:** Financial data sovereignty — your records never leave your machine — while still getting intelligent decision support from a local LLM (RAG chat, smart categorisation, trend analysis) entirely offline.

### Constraints

- **Privacy**: No external API calls beyond user-configured Ollama endpoint — zero telemetry, zero tracking
- **Language**: French primary language throughout; English translation mandatory for every new i18n key
- **Tech stack**: Python FastAPI backend, SQLite (SQLAlchemy), Tauri (Rust) desktop wrapper. V1 uses vanilla JS and Chart.js; V2 uses React, Vite, Astryx and TanStack Charts.
- **Accounting precision**: Round-trip CSV benchmark must pass exactly against reference image — decimal accuracy is non-negotiable
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
| Frontend V2 | React 19 + Vite + Astryx | TanStack Charts + Router; StyleX; opt-in dashboard, budgets, summaries and history |
| Desktop | Tauri 2.x (Rust) | PyInstaller --onedir bundle |
| AI | Ollama local API | Auto-detect via /api/tags |
| Container | Docker + Nginx | SSE streaming via X-Accel-Buffering: no |
| I18n | JSON (fr.json, en.json) | UTF-8-sig BOM, Python-side writes only |

## Migration boundaries

- V2 migration is explicitly authorized. Keep V1 available while moving screens to the isolated V2 frontend.
- No Postgres migration — SQLite sufficient for local-first


## Conventions

**IMPORTANT (user rule):** NEVER automatically commit changes. Always wait for explicit user instruction before committing to git.

- **Changelog (`CHANGELOG.md`)** : Doit toujours être rédigé en anglais, concis et orienté utilisateur (fonctionnalités visibles et bugs corrigés perceptibles).
- **GitHub Releases** : Les notes détaillées et techniques exhaustives doivent être intégrées dans les notes de release GitHub lors de la publication.

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.

## Project skills

Skills are installed in `.agents/skills/` from `mattpocock/skills` and `theclaymethod/unslop`.
Use a skill when relevant to the task. GSD has been removed: do not require GSD commands, planning artifacts, or a GSD bypass before working.

## UI V2

See `ui-v2/README.md` for setup and `docs/UI-V2-PLAN.md` for scope and verification.
Use TypeScript for all V2 source, configuration, and tests, with strict checking across the entire frontend. Use compiled StyleX, typed Astryx tokens, Astryx controls and local API calls. Keep legacy V1 assets available for comparison until feature parity is verified.
