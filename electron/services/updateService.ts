import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";

import { APP_VERSION } from "../../shared/constants.js";
import type { UpdateCheckResult, UpdateProgress, UpdateState } from "../../shared/types.js";

const DEFAULT_MANIFEST_URL = "https://github.com/ywandy/jpgDelRaw-Desktop/releases/latest/download/latest-asar.json";

interface UpdateManifest {
  version: string;
  notes?: string;
  pub_date?: string;
  assets?: {
    appAsar?: {
      url?: string;
      sha256?: string;
    };
  };
}

interface UpdateServiceOptions {
  userDataPath: string;
  resourcesPath: string;
  executablePath: string;
  packaged: boolean;
  manifestUrl?: string;
  helperPath?: string;
}

let pendingManifest: UpdateManifest | undefined;
let stagedAsarPath: string | undefined;
let state: UpdateState = { status: "idle" };

export function getUpdateState(): UpdateState {
  return state;
}

export async function checkForUpdates(options: UpdateServiceOptions): Promise<UpdateCheckResult> {
  state = { status: "checking" };
  try {
    const manifest = await fetchManifest(options.manifestUrl ?? DEFAULT_MANIFEST_URL);
    const asset = manifest.assets?.appAsar;
    if (!manifest.version || !asset?.url || !asset.sha256) {
      throw new Error("更新清单缺少版本、下载地址或 SHA-256。 ");
    }

    if (compareVersions(manifest.version, APP_VERSION) <= 0) {
      pendingManifest = undefined;
      stagedAsarPath = undefined;
      state = { status: "not-available" };
      return { available: false, currentVersion: APP_VERSION };
    }

    pendingManifest = manifest;
    const info = {
      currentVersion: APP_VERSION,
      version: manifest.version,
      date: manifest.pub_date,
      body: manifest.notes
    };
    state = { status: "available", info };
    return { available: true, info };
  } catch (error) {
    state = { status: "error", error: getErrorMessage(error) };
    throw error;
  }
}

export async function downloadUpdate(options: UpdateServiceOptions, onProgress?: (progress: UpdateProgress) => void): Promise<void> {
  if (!options.packaged) {
    throw new Error("开发模式不支持安装 app.asar 更新，请使用打包后的应用测试。 ");
  }
  if (!pendingManifest) {
    const result = await checkForUpdates(options);
    if (!result.available) throw new Error("没有可下载的更新。 ");
  }

  const manifest = pendingManifest;
  const asset = manifest?.assets?.appAsar;
  if (!manifest || !asset?.url || !asset.sha256) throw new Error("更新清单无效。 ");

  state = { status: "downloading", info: manifestToInfo(manifest), downloaded: 0 };
  const updateDir = path.join(options.userDataPath, "updates", manifest.version);
  const tempPath = path.join(updateDir, "app.asar.tmp");
  const finalPath = path.join(updateDir, "app.asar");
  await mkdir(updateDir, { recursive: true });
  await rm(tempPath, { force: true });

  try {
    await downloadFile(asset.url, tempPath, (progress) => {
      state = { status: "downloading", info: manifestToInfo(manifest), downloaded: progress.downloaded, total: progress.total };
      onProgress?.(progress);
    });

    const actualHash = await sha256File(tempPath);
    if (actualHash.toLowerCase() !== asset.sha256.toLowerCase()) {
      await rm(tempPath, { force: true });
      throw new Error("更新包校验失败，请稍后重试。 ");
    }

    await rm(finalPath, { force: true });
    await rename(tempPath, finalPath);
    stagedAsarPath = finalPath;
    state = { status: "ready", info: manifestToInfo(manifest) };
  } catch (error) {
    await rm(tempPath, { force: true }).catch(() => undefined);
    state = { status: "error", info: manifestToInfo(manifest), error: getErrorMessage(error) };
    throw error;
  }
}

export async function installStagedUpdate(options: UpdateServiceOptions): Promise<void> {
  if (!options.packaged) throw new Error("开发模式不支持安装更新。 ");
  if (!pendingManifest || !stagedAsarPath) throw new Error("没有已下载的更新。 ");

  const helperPath = options.helperPath ?? path.join(options.resourcesPath, "updater", "updater-helper.mjs");
  const version = pendingManifest.version;
  const updateDir = path.join(options.userDataPath, "updates", version);
  const targetAsar = path.join(options.resourcesPath, "app.asar");
  const backupAsar = path.join(updateDir, "app.asar.backup");
  const logPath = path.join(updateDir, "install.log");

  await writeFile(
    logPath,
    `Preparing update ${version}\nTarget: ${targetAsar}\nStaged: ${stagedAsarPath}\n`,
    "utf8"
  );

  const args = [
    "--parent-pid",
    String(process.pid),
    "--app-asar",
    targetAsar,
    "--staged-asar",
    stagedAsarPath,
    "--backup-asar",
    backupAsar,
    "--executable",
    options.executablePath,
    "--log",
    logPath
  ];

  state = { status: "installing", info: manifestToInfo(pendingManifest) };
  spawn(process.execPath, [helperPath, ...args], { env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }, detached: true, stdio: "ignore" }).unref();
}

async function fetchManifest(url: string): Promise<UpdateManifest> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`检查更新失败：HTTP ${response.status}`);
  return (await response.json()) as UpdateManifest;
}

async function downloadFile(url: string, destination: string, onProgress: (progress: UpdateProgress) => void): Promise<void> {
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`下载更新失败：HTTP ${response.status}`);

  const total = Number(response.headers.get("content-length")) || undefined;
  let downloaded = 0;
  const chunks: Uint8Array[] = [];
  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    downloaded += value.byteLength;
    onProgress({ downloaded, total });
  }

  await writeFile(destination, Buffer.concat(chunks));
}

async function sha256File(filePath: string): Promise<string> {
  const hash = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", resolve);
  });
  return hash.digest("hex");
}

function manifestToInfo(manifest: UpdateManifest) {
  return {
    currentVersion: APP_VERSION,
    version: manifest.version,
    date: manifest.pub_date,
    body: manifest.notes
  };
}

function compareVersions(a: string, b: string): number {
  const left = normalizeVersion(a);
  const right = normalizeVersion(b);
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const diff = (left[index] ?? 0) - (right[index] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function normalizeVersion(version: string): number[] {
  return version.replace(/^v/, "").split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function recoverBackupForTests(targetPath: string, backupPath: string): Promise<void> {
  await copyFile(backupPath, targetPath);
}
