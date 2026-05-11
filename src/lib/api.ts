import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { DEFAULT_SETTINGS } from "../../shared/constants";
import type {
  AppSettings,
  CompareResult,
  DeleteContext,
  DeleteMode,
  DeleteResult,
  MediaFile,
  PlatformName,
  ScanOptions,
  ScanResult
} from "../../shared/types";

export interface DesktopApi {
  selectDirectory: () => Promise<string | null>;
  scanDirectory: (rootPath: string, options: ScanOptions) => Promise<ScanResult>;
  compareFiles: (scanResult: ScanResult, mode: DeleteMode) => Promise<CompareResult>;
  moveToTrash: (files: MediaFile[], context: DeleteContext) => Promise<DeleteResult>;
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<void>;
  getPlatform: () => Promise<PlatformName>;
  getPathForFile: (file: File) => string;
  windowMinimize: () => Promise<void>;
  windowMaximize: () => Promise<void>;
  windowClose: () => Promise<void>;
  windowStartDragging: () => Promise<void>;
}

function missingTauri(): Promise<never> {
  return Promise.reject(new Error("Tauri 后端未就绪，请在桌面应用窗口中使用。"));
}

function hasTauriRuntime(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export const api: DesktopApi = hasTauriRuntime()
  ? {
      selectDirectory: async () => {
        const selected = await open({ directory: true, multiple: false });
        return typeof selected === "string" ? selected : null;
      },
      scanDirectory: (rootPath, options) => invoke("scan_directory", { rootPath, options }),
      compareFiles: (scanResult, mode) => invoke("compare_files", { scanResult, mode }),
      moveToTrash: (files, context) => invoke("move_to_trash", { files, context }),
      getSettings: () => invoke("get_settings"),
      saveSettings: (settings) => invoke("save_settings", { settings }),
      getPlatform: () => invoke("get_platform"),
      getPathForFile: () => "",
      windowMinimize: () => invoke("window_minimize"),
      windowMaximize: () => invoke("window_maximize"),
      windowClose: () => invoke("window_close"),
      windowStartDragging: () => getCurrentWindow().startDragging()
    }
  : {
      selectDirectory: () => Promise.resolve(null),
      scanDirectory: () => missingTauri(),
      compareFiles: () => missingTauri(),
      moveToTrash: () => missingTauri(),
      getSettings: () => Promise.resolve(DEFAULT_SETTINGS),
      saveSettings: () => missingTauri(),
      getPlatform: () => Promise.resolve("darwin"),
      getPathForFile: () => "",
      windowMinimize: () => Promise.resolve(),
      windowMaximize: () => Promise.resolve(),
      windowClose: () => Promise.resolve(),
      windowStartDragging: () => Promise.resolve()
    };
