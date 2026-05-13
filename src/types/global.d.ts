import type {
  AppSettings,
  CompareResult,
  DeleteContext,
  DeleteMode,
  DeleteResult,
  MediaFile,
  PlatformName,
  ScanOptions,
  ScanResult,
  UpdateCheckResult,
  UpdateProgress,
  UpdateState
} from "../../shared/types";

declare global {
  interface Window {
    rawPairCleaner: {
      selectDirectory: () => Promise<string | null>;
      scanDirectory: (rootPath: string, options: ScanOptions) => Promise<ScanResult>;
      compareFiles: (scanResult: ScanResult, mode: DeleteMode) => Promise<CompareResult>;
      moveToTrash: (files: MediaFile[], context: DeleteContext) => Promise<DeleteResult>;
      showItemInFolder: (filePath: string) => Promise<void>;
      getSettings: () => Promise<AppSettings>;
      saveSettings: (settings: AppSettings) => Promise<void>;
      getPlatform: () => Promise<PlatformName>;
      getPathForFile: (file: File) => string;
      getUpdateState: () => Promise<UpdateState>;
      checkForUpdates: () => Promise<UpdateCheckResult>;
      downloadUpdate: () => Promise<void>;
      installUpdate: () => Promise<void>;
      onUpdateProgress: (callback: (progress: UpdateProgress) => void) => () => void;
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<void>;
      windowClose: () => Promise<void>;
    };
  }
}

export {};
