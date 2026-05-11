export type DeleteMode = "jpg_as_source_delete_raw" | "raw_as_source_delete_jpg";

export type DirectoryMode = "auto" | "separate_dirs" | "mixed_dir" | "manual";

export type MediaKind = "image" | "raw" | "sidecar" | "unknown";

export type CompareConflictReason = "duplicate_image" | "duplicate_raw" | "ambiguous_match";

export type PlatformName = "darwin" | "win32" | "linux" | NodeJS.Platform;

export type FontScale = "small" | "medium" | "large";

export interface MediaFile {
  path: string;
  name: string;
  ext: string;
  key: string;
  kind: MediaKind;
  size: number;
  modifiedAt: number;
}

export interface ScanOptions {
  recursive: boolean;
  includeHiddenFiles: boolean;
  ignoreCase: boolean;
}

export interface ScanResult {
  rootPath: string;
  directoryMode: DirectoryMode;
  imageFiles: MediaFile[];
  rawFiles: MediaFile[];
  sidecarFiles: MediaFile[];
  unknownFiles: MediaFile[];
  jpgDirectory?: string;
  rawDirectory?: string;
}

export interface MatchedPair {
  key: string;
  image?: MediaFile;
  raw?: MediaFile;
}

export interface CompareConflict {
  key: string;
  reason: CompareConflictReason;
  files: MediaFile[];
}

export interface CompareResult {
  mode: DeleteMode;
  directoryMode: DirectoryMode;
  imageFiles: MediaFile[];
  rawFiles: MediaFile[];
  matchedPairs: MatchedPair[];
  deleteCandidates: MediaFile[];
  conflicts: CompareConflict[];
  totalDeleteSize: number;
}

export interface DeleteContext {
  mode: DeleteMode;
  rootPath: string;
}

export interface DeleteResultItem {
  path: string;
  size: number;
  status: "moved_to_trash" | "failed";
  error?: string;
}

export interface DeleteResult {
  startedAt: string;
  finishedAt: string;
  mode: DeleteMode;
  rootPath: string;
  total: number;
  success: number;
  failed: number;
  logPath?: string;
  items: DeleteResultItem[];
}

export interface AppSettings {
  appearance: {
    fontScale: FontScale;
  };
  scan: {
    recursive: boolean;
    includeHiddenFiles: boolean;
    ignoreCase: boolean;
  };
  delete: {
    requireConfirmText: boolean;
    generateLog: boolean;
  };
  sidecar: {
    deleteWithRaw: boolean;
    extensions: string[];
  };
}
