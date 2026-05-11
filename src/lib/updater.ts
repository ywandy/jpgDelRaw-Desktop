import { relaunch } from "@tauri-apps/plugin-process";
import { check, type DownloadEvent, type Update } from "@tauri-apps/plugin-updater";

export interface UpdateInfo {
  currentVersion: string;
  version: string;
  date?: string;
  body?: string;
}

export interface UpdateCheckResult {
  available: boolean;
  info?: UpdateInfo;
}

export type UpdateProgress =
  | { phase: "started"; contentLength?: number }
  | { phase: "progress"; downloaded: number; contentLength?: number }
  | { phase: "finished" };

let pendingUpdate: Update | undefined;
let downloadedBytes = 0;
let contentLength: number | undefined;

export async function checkForUpdate(): Promise<UpdateCheckResult> {
  if (!hasTauriRuntime()) return { available: false };

  const update = await check();
  if (!update) {
    pendingUpdate = undefined;
    return { available: false };
  }

  pendingUpdate = update;
  return {
    available: true,
    info: {
      currentVersion: update.currentVersion,
      version: update.version,
      date: update.date,
      body: update.body
    }
  };
}

export async function downloadAndInstallUpdate(onProgress?: (progress: UpdateProgress) => void): Promise<void> {
  if (!pendingUpdate) {
    const result = await checkForUpdate();
    if (!result.available) throw new Error("没有可安装的更新。");
  }

  downloadedBytes = 0;
  contentLength = undefined;
  await pendingUpdate?.downloadAndInstall((event) => {
    const progress = mapDownloadEvent(event);
    if (progress) onProgress?.(progress);
  });
}

export async function relaunchApp(): Promise<void> {
  if (!hasTauriRuntime()) return;
  await relaunch();
}

function mapDownloadEvent(event: DownloadEvent): UpdateProgress | undefined {
  if (event.event === "Started") {
    downloadedBytes = 0;
    contentLength = event.data.contentLength;
    return { phase: "started", contentLength };
  }

  if (event.event === "Progress") {
    downloadedBytes += event.data.chunkLength;
    return { phase: "progress", downloaded: downloadedBytes, contentLength };
  }

  if (event.event === "Finished") {
    return { phase: "finished" };
  }

  return undefined;
}

function hasTauriRuntime(): boolean {
  return "__TAURI_INTERNALS__" in window;
}
