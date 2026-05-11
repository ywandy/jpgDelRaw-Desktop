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

declare global {
  interface Window {
    rawPairCleaner: {
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
    };
  }
}

export {};
