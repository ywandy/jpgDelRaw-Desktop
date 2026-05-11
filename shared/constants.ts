import type { AppSettings } from "./types.js";
import { SIDECAR_EXTENSIONS } from "./fileExtensions.js";

export const APP_NAME = "RAW Pair Cleaner";
export const APP_TITLE = "RAW Pair Cleaner / 底片清理器";
export const APP_VERSION = "1.0.0";
export const CONFIRM_DELETE_TEXT = "确认删除";

export const DEFAULT_SETTINGS: AppSettings = {
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
  }
};
