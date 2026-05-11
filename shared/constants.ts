import type { AppSettings } from "./types.js";
import { SIDECAR_EXTENSIONS } from "./fileExtensions.js";

export const APP_NAME = "RAW Pair Cleaner";
export const APP_TITLE = "RAW Pair Cleaner / 底片清理器";
export const APP_VERSION = "1.0.1";
export const CONFIRM_DELETE_TEXT = "确认删除";
export const APP_WINDOW_BOUNDS = {
  width: 1200,
  height: 820,
  minWidth: 1200,
  minHeight: 720
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  appearance: {
    fontScale: "medium"
  },
  scan: {
    recursive: true,
    includeHiddenFiles: false,
    ignoreCase: true
  },
  delete: {
    requireConfirmText: true,
    generateLog: true
  },
  sidecar: {
    deleteWithRaw: false,
    extensions: SIDECAR_EXTENSIONS
  },
  updates: {
    autoCheckOnStartup: true
  }
};
