# RAW Pair Cleaner / 底片清理器

<p align="center">
  <img src="src-tauri/icons/icon.png" width="112" height="112" alt="RAW Pair Cleaner icon" />
</p>

<p align="center">
  A safe desktop cleaner for matching JPG-like previews and RAW photo files.
</p>

<p align="center">
  <a href="README.md">简体中文</a>
  ·
  <strong>English</strong>
</p>

<p align="center">
  <img alt="Tauri" src="https://img.shields.io/badge/Tauri-v2-24C8DB?style=flat-square&logo=tauri&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=1f2937" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-required-F69220?style=flat-square&logo=pnpm&logoColor=white" />
</p>

![Application overview](docs/assets/readme-app-overview.svg)

## Overview

RAW Pair Cleaner is built for photographers who keep RAW originals while exporting JPG-like previews or finished images. It scans a selected photo directory, compares JPG-like files and RAW files by extensionless lowercase basename, and highlights unmatched files according to the selected cleanup mode.

The default behavior is intentionally conservative: every pending deletion is shown before execution, conflict files are never auto-deleted, the renderer process does not access the filesystem directly, and deletion moves files to the system trash/recycle bin.

## Features

- **Two cleanup modes**
  - Use JPG-like files as the source of truth and remove unmatched RAW files.
  - Use RAW files as the source of truth and remove unmatched JPG-like files.
- **Safe review flow**
  - Shows scan results, matched pairs, conflicts, pending delete candidates, and estimated reclaimable size.
  - Allows individual or batch deselection before deletion.
- **Conflict protection**
  - Duplicate JPG keys, duplicate RAW keys, and ambiguous matches are reported as conflicts and excluded from delete candidates.
- **Trash-first deletion**
  - Files are moved to the system trash/recycle bin through the Tauri backend.
  - User photo files are not hard-deleted.
- **Operation logs**
  - Optional JSON delete logs are written under the Tauri app data directory.
- **Desktop-focused UI**
  - Tauri v2 desktop shell, React renderer, custom title bar, sidebar navigation, and desktop-oriented layout.

## Workflow

![Cleanup workflow](docs/assets/readme-workflow.svg)

1. Select or drag in a photo directory.
2. Choose a cleanup mode.
3. Scan JPG-like, RAW, sidecar, and unknown files.
4. Compare groups by extensionless lowercase basename.
5. Review delete candidates and conflicts.
6. Confirm, then move selected files to the system trash.
7. Write a JSON operation log when logging is enabled.

## Safety Model

![Safety model](docs/assets/readme-safety-model.svg)

The product safety rules are:

- Deletion candidates must be visible before deletion.
- Confirmation UI is required when enabled in settings.
- Conflicts are never deleted automatically.
- Sidecar files such as `.xmp`, `.dop`, `.cos`, `.on1`, and `.pp3` are recognized but are not deleted by default.
- Renderer code must go through `src/lib/api.ts` for desktop capabilities.
- User photo files must be moved to the system trash/recycle bin, not removed with hard-delete filesystem APIs.

## Matching Rules

File matching uses a normalized key:

```txt
IMG_0001.JPG -> img_0001
IMG_0001.CR3 -> img_0001
```

If exactly one JPG-like file and one RAW file share a key, they are treated as a matched pair. If multiple files of either kind share the same key, the group is marked as a conflict and excluded from automatic cleanup.

## Supported File Types

JPG-like files include common image and preview formats such as `.jpg`, `.jpeg`, `.png`, `.heic`, `.heif`, `.hif`, `.tif`, `.tiff`, `.webp`, `.avif`, and `.bmp`.

RAW files include common camera RAW formats such as `.cr2`, `.cr3`, `.nef`, `.arw`, `.raf`, `.rw2`, `.orf`, `.dng`, `.3fr`, `.iiq`, `.srw`, `.r3d`, and more.

The canonical extension lists live in [`shared/fileExtensions.ts`](shared/fileExtensions.ts) and should stay aligned with the Rust service-side types.

## Tech Stack

- [Tauri v2](https://tauri.app/) for the desktop shell and native commands.
- [React](https://react.dev/) and [TypeScript](https://www.typescriptlang.org/) for the renderer.
- [Vite](https://vite.dev/) for frontend development and builds.
- [Tailwind CSS](https://tailwindcss.com/) for UI styling.
- [Vitest](https://vitest.dev/) for the TypeScript test suite.
- Rust services under `src-tauri/src/services/` for scanning, comparison, trash, logs, and settings.

## Getting Started

### Prerequisites

- Node.js compatible with the project dependencies.
- pnpm.
- Rust and the Tauri system prerequisites for your operating system.

See the official Tauri setup guide for platform-specific dependencies: <https://tauri.app/start/prerequisites/>

### Install

```bash
pnpm install
```

### Run In Development

```bash
pnpm dev
```

This starts the Vite renderer and launches the Tauri desktop app.

### Build Renderer

```bash
pnpm build
```

This runs TypeScript checking with `tsconfig.json --noEmit` and builds the Vite renderer into `dist/`.

### Build Desktop Bundle

```bash
pnpm dist
```

The current script builds a macOS DMG when run on macOS.

### Run Tests

```bash
pnpm test
```

Run a single test file:

```bash
pnpm test tests/core.test.ts
```

## Project Structure

```txt
.
├── shared/                  # Shared TypeScript types, constants, extensions, and file helpers
├── src/                     # React renderer
│   ├── components/          # Reusable UI components
│   ├── lib/api.ts           # Renderer facade for Tauri desktop capabilities
│   └── pages/               # Page-level screens
├── src-tauri/               # Tauri application shell and Rust backend
│   ├── icons/               # Generated app icons
│   ├── src/main.rs          # Command registration and app bootstrap
│   └── src/services/        # Scanner, compare, trash, log, settings services
├── tests/                   # Vitest tests
└── RAW_PAIR_CLEANER_DEV_DOC.md
```

## Development Notes

- Keep `src/lib/api.ts`, `src-tauri/src/main.rs`, and `src-tauri/src/services/types.rs` in sync when changing the Tauri command surface.
- Keep file extension constants aligned between `shared/fileExtensions.ts` and the Rust service types.
- There is currently no `lint` script in `package.json`; use `pnpm build` and `pnpm test` as the baseline verification commands.
- Do not introduce direct filesystem access in the renderer process.

## Privacy

RAW Pair Cleaner is a local desktop utility. File scanning, comparison, deletion, settings, and logs are handled locally through the Tauri application. The core workflow does not require cloud sync or remote image processing.

## Contributing

Contributions are welcome. For a clean change:

1. Open an issue or describe the problem the pull request solves.
2. Keep behavior changes aligned with the safety model above.
3. Add focused tests for compare logic, renderer helpers, or backend services when behavior changes.
4. Run `pnpm build` and `pnpm test` before opening a pull request.

## Roadmap

- Add Rust-side tests for scanner, compare, trash, log, and settings services.
- Improve conflict explanations and batch review ergonomics.
- Add optional sidecar handling flows without making sidecar deletion the default.
- Add release artifacts for more desktop platforms.

## License

This repository does not currently include a license file. Before publishing as an open-source project, choose and add an explicit license such as MIT, Apache-2.0, or GPL-3.0.
