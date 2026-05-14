# AGENTS.md

This file gives coding agents shared guidance for working in this repository. It is intentionally tool-neutral: follow it when using Codex, Claude Code, or another agentic coding workflow.

## Commands

- `pnpm install` - install dependencies. This repository uses pnpm and has a committed `pnpm-lock.yaml`.
- `pnpm dev` - run the Vite renderer, watch-compile Electron TypeScript with `tsconfig.node.json`, then launch Electron when `http://127.0.0.1:5173` and `dist-electron/electron/main.js` are ready.
- `pnpm build` - compile Electron/shared code, type-check the React renderer with `tsconfig.json --noEmit`, and build the Vite renderer into `dist/`.
- `pnpm start` - launch Electron from the built `dist-electron/electron/main.js` entrypoint.
- `pnpm test` - run the Vitest suite once in Node mode.
- `pnpm test tests/core.test.ts` - run the core test file; add `-t "test name"` to target one test case.
- `pnpm version:check` - verify that `package.json` and `shared/constants.ts` agree on the application version.

There is no `lint` script configured in `package.json`.

## Repository Map

This is an Electron + React + TypeScript desktop app for safely finding unmatched JPG-like and RAW photo files and moving selected redundancies to the system trash.

- The renderer lives in `src/` and is a Vite React app. `src/App.tsx` owns the application state machine: selected root directory, delete mode, scan/compare results, selected delete candidates, settings, update state, and delete results. Page navigation is local state rather than React Router.
- Electron code lives in `electron/`. `electron/main.ts` creates the frameless `BrowserWindow`, loads Vite in development or `dist/index.html` in production, and registers IPC handlers.
- The preload bridge in `electron/preload.ts` exposes `window.rawPairCleaner`. Renderer code should go through `src/lib/api.ts` and must not import Node filesystem APIs directly.
- Shared types, constants, file extensions, and filename-key helpers live in `shared/`. Both Electron services and renderer code import from here to keep IPC payloads consistent.
- Main-process services in `electron/services/` implement app workflows: `scanService.ts` walks directories and detects media kinds/directory mode; `compareService.ts` groups files and creates matches, conflicts, and delete candidates; `trashService.ts` moves files to trash and writes delete logs; `settingsService.ts` reads/writes settings under Electron `userData`; `updateService.ts` checks, downloads, and stages app updates; `logService.ts` writes operation metadata.
- UI components are split between reusable pieces in `src/components/` and page-level screens in `src/pages/`.
- Tests live in `tests/` and use Vitest's Node environment. Existing coverage focuses on shared file utilities, directory scanning, compare logic, trash/log behavior, settings, update helpers, and renderer behavior.

## How To Find Things

- Use `rg` first. Start with domain words, IPC channel names, exported type names, or UI text. Examples: `rg -n "updates:check|checkForUpdates"`, `rg -n "DeleteMode|delete candidates"`, `rg -n "shell.trashItem|moveToTrash"`.
- To understand a renderer-to-main workflow, trace it in this order: UI/page in `src/pages/` or state handler in `src/App.tsx` -> `src/lib/api.ts` -> `src/types/global.d.ts` -> `electron/preload.ts` -> `electron/main.ts` -> the relevant service in `electron/services/`.
- Treat `src/types/global.d.ts`, `electron/preload.ts`, and `electron/main.ts` as the source trail for the current IPC surface. Do not copy a stale IPC list from documentation; inspect these files before changing or using an IPC API.
- For shared behavior, check `shared/` before adding renderer-only or main-only helpers. File extensions, app constants, shared types, and filename-key logic belong there when both sides need them.
- For tests, search `tests/` for the service or shared helper you are touching, then add focused coverage near the closest existing cases.

## File Conventions

- Renderer components and pages should not import Node APIs. Put filesystem, shell, settings, update, and trash behavior behind Electron IPC.
- Keep page-level workflow state in `src/App.tsx` unless an existing component already owns that local UI state.
- Keep reusable visual pieces in `src/components/` and route/page-sized screens in `src/pages/`.
- Keep main-process side effects in `electron/services/`; `electron/main.ts` should register windows and IPC handlers rather than contain workflow logic.
- When changing any preload API, update the global type declaration, preload exposure, main IPC handler, and renderer API usage together.
- Prefer existing constants and helpers over duplicating strings for extensions, app version, delete modes, update settings, or file matching keys.

## Frontend Theme And Tokens

- Treat `src/styles/themeTokens.ts` as the source of truth for design tokens: color, radius, shadow, spacing, control sizes, timing, typography, font scale overrides, and desktop media overrides.
- Treat `src/styles/globals.css` as the shared component-style layer: type classes (`type-*`), shell/page layout, panels, buttons, icon buttons, inputs, alerts, modals, tables, and common interaction states.
- Before adding a new color, radius, shadow, font size, or repeated layout value in a component, search for an existing token or class with `rg -n "--color-|--radius|--shadow|--font-|\\.btn|\\.panel|type-" src/styles src`.
- Prefer semantic tokens such as `--color-danger`, `--color-primary-soft`, `--color-border`, and `--font-ui` over one-off hex values or arbitrary font sizes in JSX.
- Prefer shared classes such as `btn`, `panel`, `panel-compact`, `alert-panel`, `type-body`, and `type-ui` over recreating the same Tailwind utility bundle in multiple components.
- Use local Tailwind utilities for component-specific layout and composition, but keep repeated visual decisions in tokens or global component classes.
- When changing font scale behavior, update `themeTokens.ts` and verify `data-font-scale` usage through `src/components/AppLayout.tsx` and settings UI.
- For visual changes, inspect the actual rendered desktop app when practical; at minimum verify that text still fits fixed-size controls and that focus/disabled/hover states remain legible.

## Core Product Rules

Preserve these constraints when changing behavior:

- Deletion must be safe: show scan results and the pending-delete list before deleting, require confirmation where configured, and never auto-delete conflicts.
- User photo files must be moved to the system trash with Electron trash APIs. Do not hard-delete user photos with `fs.unlink`, `fs.rm`, or sync variants.
- After deletion, generate a JSON operation log when settings enable it. Logs are written under `app.getPath("userData")/logs/` with `delete-log-YYYY-MM-DD-HH-mm-ss.json` names.
- The renderer process must not call Node filesystem APIs directly. File scanning, comparison, trash, logging, settings, updates, external links, and directory dialogs belong behind Electron IPC.
- JPG is product terminology for common image/preview files, not only `.jpg`. Extension lists are centralized in `shared/fileExtensions.ts`.
- Sidecar files such as `.xmp`, `.dop`, `.cos`, `.on1`, and `.pp3` are recognized but are not deleted by default.

## File Matching Model

- Delete modes are `jpg_as_source_delete_raw` and `raw_as_source_delete_jpg`.
- File matching uses `getFileKey()` from `shared/fileUtils.ts`: basename without extension, lowercased.
- If exactly one image and one RAW share a key, they are a matched pair.
- If multiple images or multiple RAW files share a key, `compareService.ts` reports a conflict (`duplicate_image`, `duplicate_raw`, or `ambiguous_match`) and excludes those files from delete candidates.
- Directory detection prefers root-level JPG/RAW-like folders for `separate_dirs`; otherwise directories containing both image and RAW files are treated as `mixed_dir`; unresolved cases become `manual`.

## Update And Release Rules

- Keep `package.json` version and `APP_VERSION` in `shared/constants.ts` synchronized. Use `pnpm version:check` to verify.
- Release tags must use `vX.Y.Z` format.
- `latest-asar.json` and release assets can both use the configured GitHub release proxy prefix.
- Before creating or pushing a release tag, run `pnpm version:check`, `pnpm test`, and `pnpm build`.
