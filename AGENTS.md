# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm install` - install dependencies; this repository uses pnpm and has a committed `pnpm-lock.yaml`.
- `pnpm dev` - run the Vite renderer, watch-compile Electron TypeScript with `tsconfig.node.json`, then launch Electron when `http://127.0.0.1:5173` and `dist-electron/electron/main.js` are ready.
- `pnpm build` - compile Electron/shared code, type-check the React renderer with `tsconfig.json --noEmit`, and build the Vite renderer into `dist/`.
- `pnpm start` - launch Electron from the built `dist-electron/electron/main.js` entrypoint.
- `pnpm test` - run the Vitest suite once in Node mode.
- `pnpm test tests/core.test.ts` - run the current single test file; add `-t "test name"` to target one test case.

There is no `lint` script configured in `package.json`.

## Architecture

This is an Electron + React + TypeScript desktop app for safely finding unmatched JPG-like and RAW photo files and moving selected redundancies to the system trash.

- The renderer lives in `src/` and is a Vite React app. `src/App.tsx` owns the application state machine: selected root directory, delete mode, scan/compare results, selected delete candidates, settings, platform, and delete results. Page navigation is local state rather than React Router.
- Electron code lives in `electron/`. `electron/main.ts` creates the frameless `BrowserWindow`, loads Vite in development or `dist/index.html` in production, and registers all IPC handlers.
- The preload bridge in `electron/preload.ts` exposes `window.rawPairCleaner`. Renderer code should go through `src/lib/api.ts` and must not import Node filesystem APIs directly.
- Shared types, constants, file extensions, and filename-key helpers live in `shared/`. Both Electron services and renderer code import from here to keep IPC payloads consistent.
- Main-process services in `electron/services/` implement the file workflow: `scanService.ts` walks directories and detects media kinds/directory mode; `compareService.ts` groups by extensionless lowercase keys and creates matches, conflicts, and delete candidates; `trashService.ts` moves files via Electron trash APIs and optionally writes logs; `settingsService.ts` reads/writes app settings under Electron `userData`.
- UI components are split between reusable pieces in `src/components/` and page-level screens in `src/pages/`. The layout includes a custom title bar and sidebar; platform-specific title bar behavior depends on `platform:get` from IPC.
- Tests live in `tests/` and use Vitest's Node environment. Existing coverage focuses on shared file utilities, directory scanning, compare logic, and trash/log behavior with injected dependencies.

## Core Product Rules

From `RAW_PAIR_CLEANER_DEV_DOC.md`, preserve these constraints when changing behavior:

- Deletion must be safe: show scan results and the pending-delete list before deleting, require second confirmation when enabled, and never auto-delete conflicts.
- User files must be moved to the system trash with `shell.trashItem`; do not hard-delete user photo files with `fs.unlink`, `fs.rm`, or sync variants.
- After deletion, generate a JSON operation log when settings enable it. Logs are written under `app.getPath("userData")/logs/` with `delete-log-YYYY-MM-DD-HH-mm-ss.json` names.
- The renderer process must not call Node filesystem APIs directly; file scanning, comparison, trash, logging, settings, and directory dialogs belong behind Electron IPC.
- JPG is product terminology for common image/preview files, not only `.jpg`. Extension lists are centralized in `shared/fileExtensions.ts`.
- Sidecar files such as `.xmp`, `.dop`, `.cos`, `.on1`, and `.pp3` are recognized but are not deleted by default.

## File Matching Model

- Delete modes are `jpg_as_source_delete_raw` and `raw_as_source_delete_jpg`.
- File matching uses `getFileKey()` from `shared/fileUtils.ts`: basename without extension, lowercased.
- If exactly one image and one RAW share a key, they are a matched pair.
- If multiple images or multiple RAW files share a key, `compareService.ts` reports a conflict (`duplicate_image`, `duplicate_raw`, or `ambiguous_match`) and excludes those files from delete candidates.
- Directory detection prefers root-level JPG/RAW-like folders for `separate_dirs`; otherwise directories containing both image and RAW files are treated as `mixed_dir`; unresolved cases become `manual`.

## IPC Surface

The preload exposes these APIs on `window.rawPairCleaner`:

- `selectDirectory()` -> `dialog:select-directory`
- `scanDirectory(rootPath, options)` -> `files:scan-directory`
- `compareFiles(scanResult, mode)` -> `files:compare`
- `moveToTrash(files, context)` -> `files:move-to-trash`
- `getSettings()` / `saveSettings(settings)` -> `settings:get` / `settings:save`
- `getPlatform()` -> `platform:get`
- `getPathForFile(file)` uses Electron `webUtils.getPathForFile` for dropped files
- `windowMinimize()`, `windowMaximize()`, `windowClose()` -> window control IPC handlers

Keep `src/types/global.d.ts`, `electron/preload.ts`, and `electron/main.ts` in sync when changing this surface.
