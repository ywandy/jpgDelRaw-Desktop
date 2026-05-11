# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `pnpm install` - install dependencies; this repository uses pnpm and has a committed `pnpm-lock.yaml`.
- `pnpm dev` - run the Tauri v2 desktop app in development mode with the Vite renderer.
- `pnpm build` - type-check the React renderer with `tsconfig.json --noEmit` and build the Vite renderer into `dist/`.
- `pnpm dist` - build the production Tauri desktop bundle. Current script targets a macOS DMG when run on macOS.
- `pnpm start` - alias for `pnpm dev`.
- `pnpm test` - run the Vitest suite once in Node mode.
- `pnpm test tests/core.test.ts` - run the current single test file; add `-t "test name"` to target one test case.

There is no `lint` script configured in `package.json`.

## Architecture

This is a Tauri v2 + React + TypeScript desktop app for safely finding unmatched JPG-like and RAW photo files and moving selected redundancies to the system trash.

- The renderer lives in `src/` and is a Vite React app. `src/App.tsx` owns the application state machine: selected root directory, delete mode, scan/compare results, selected delete candidates, settings, platform, and delete results. Page navigation is local state rather than React Router.
- Tauri code lives in `src-tauri/`. `src-tauri/src/main.rs` registers Tauri commands and plugins, and `src-tauri/tauri.conf.json` configures the native window and bundle targets.
- Renderer code should go through `src/lib/api.ts` for desktop capabilities and must not import Node filesystem APIs directly.
- Shared renderer types, constants, file extensions, and filename-key helpers live in `shared/`. Keep these aligned with equivalent Rust structs and constants in `src-tauri/src/services/types.rs`.
- Rust services in `src-tauri/src/services/` implement the file workflow: scanning directories, comparing JPG/RAW groups, moving files to the system trash, writing delete logs, and reading/writing settings under the Tauri app data directory.
- UI components are split between reusable pieces in `src/components/` and page-level screens in `src/pages/`. The layout includes a custom title bar and sidebar; platform-specific title bar behavior depends on `get_platform` from Tauri.
- Tests live in `tests/` and use Vitest's Node environment. Existing coverage focuses on shared file utilities, compare logic, and renderer helpers. Rust service behavior should be validated with Tauri/Rust tests when expanded.

## Core Product Rules

From `RAW_PAIR_CLEANER_DEV_DOC.md`, preserve these constraints when changing behavior:

- Deletion must be safe: show scan results and the pending-delete list before deleting, require confirmation UI when enabled, and never auto-delete conflicts.
- User files must be moved to the system trash/recycle bin. Do not hard-delete user photo files with `fs.unlink`, `fs.rm`, Rust `remove_file`, or sync variants.
- After deletion, generate a JSON operation log when settings enable it. Logs are written under the Tauri app data directory in `logs/` with `delete-log-YYYY-MM-DD-HH-mm-ss.json` names.
- The renderer process must not call filesystem APIs directly; file scanning, comparison, trash, logging, settings, and directory dialogs belong behind the Tauri API facade in `src/lib/api.ts`.
- JPG is product terminology for common image/preview files, not only `.jpg`. Extension lists are centralized in `shared/fileExtensions.ts` and mirrored in `src-tauri/src/services/types.rs`.
- Sidecar files such as `.xmp`, `.dop`, `.cos`, `.on1`, and `.pp3` are recognized but are not deleted by default.

## File Matching Model

- Delete modes are `jpg_as_source_delete_raw` and `raw_as_source_delete_jpg`.
- File matching uses an extensionless lowercase basename key.
- If exactly one image and one RAW share a key, they are a matched pair.
- If multiple images or multiple RAW files share a key, compare logic reports a conflict (`duplicate_image`, `duplicate_raw`, or `ambiguous_match`) and excludes those files from delete candidates.
- Directory detection prefers root-level JPG/RAW-like folders for `separate_dirs`; otherwise directories containing both image and RAW files are treated as `mixed_dir`; unresolved cases become `manual`.

## Tauri API Surface

The renderer facade in `src/lib/api.ts` exposes these methods:

- `selectDirectory()` -> Tauri dialog plugin directory picker.
- `scanDirectory(rootPath, options)` -> `scan_directory` Rust command.
- `compareFiles(scanResult, mode)` -> `compare_files` Rust command.
- `moveToTrash(files, context)` -> `move_to_trash` Rust command using system trash/recycle bin.
- `getSettings()` / `saveSettings(settings)` -> `get_settings` / `save_settings` Rust commands.
- `getPlatform()` -> `get_platform` Rust command, mapped to existing renderer platform names.
- Dragged paths come from Tauri webview drag/drop events in `src/components/DropZone.tsx`.
- `windowMinimize()`, `windowMaximize()`, `windowClose()`, `windowStartDragging()` -> Tauri window commands/API.

Keep `src/lib/api.ts`, `src-tauri/src/main.rs`, and `src-tauri/src/services/types.rs` in sync when changing this surface.
