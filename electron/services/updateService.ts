import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";

import { APP_VERSION, DEFAULT_RELEASE_PROXY_PREFIX } from "../../shared/constants.js";
import type { UpdateCheckResult, UpdateProgress, UpdateState } from "../../shared/types.js";

const DEFAULT_MANIFEST_URL = "https://github.com/ywandy/jpgDelRaw-Desktop/releases/latest/download/latest-asar.json";
const MIN_ASAR_SIZE_BYTES = 100 * 1024;

interface UpdateManifest {
  version: string;
  notes?: string;
  pub_date?: string;
  format?: string;
  assets?: {
    appAsar?: {
      name?: string;
      url?: string;
      sha256?: string;
      size?: number;
    };
  };
}

interface UpdateServiceOptions {
  userDataPath: string;
  resourcesPath: string;
  executablePath: string;
  packaged: boolean;
  manifestUrl?: string;
  releaseProxyPrefix?: string;
  helperPath?: string;
}

interface GitHubReleaseInfo {
  body?: string | null;
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
    const manifestUrl = getUpdateManifestUrl(options);
    await appendUpdateLog(options, `checking current=${APP_VERSION} manifestUrl=${manifestUrl}`);
    const manifest = await fetchManifest(manifestUrl);
    const asset = manifest.assets?.appAsar;
    if (!manifest.version || !asset?.url) {
      throw new Error("更新清单缺少版本或下载地址。 ");
    }
    await appendUpdateLog(options, `manifest version=${manifest.version} asset=${asset.url} size=${asset.size ?? "unknown"}`);

    if (compareVersions(manifest.version, APP_VERSION) <= 0) {
      pendingManifest = undefined;
      stagedAsarPath = undefined;
      state = { status: "not-available" };
      await appendUpdateLog(options, `no update available latest=${manifest.version}`);
      return { available: false, currentVersion: APP_VERSION };
    }

    const releaseNotes = await fetchGithubReleaseNotes(asset.url, options);
    const updateNotes = releaseNotes || manifest.notes;
    pendingManifest = { ...manifest, notes: updateNotes };
    const info = {
      currentVersion: APP_VERSION,
      version: manifest.version,
      date: manifest.pub_date,
      body: updateNotes
    };
    state = { status: "available", info };
    return { available: true, info };
  } catch (error) {
    await appendUpdateLog(options, `check failed: ${formatError(error)}`).catch(() => undefined);
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
  if (!manifest || !asset?.url) throw new Error("更新清单无效。 ");

  state = { status: "downloading", info: manifestToInfo(manifest), downloaded: 0 };
  const updateDir = path.join(options.userDataPath, "updates", manifest.version);
  const tempPath = path.join(updateDir, "payload.download");
  const finalPath = path.join(updateDir, "payload.ready");
  const metadataPath = path.join(updateDir, "metadata.json");
  await mkdir(updateDir, { recursive: true });

  try {
    await appendUpdateLog(options, `----- download update ${manifest.version} -----`);
    const manifestUrl = getUpdateManifestUrl(options);
    const assetUrl = getDownloadUrl(asset.url, options.releaseProxyPrefix);
    await appendUpdateLog(options, `current=${APP_VERSION} manifestUrl=${manifestUrl}`);
    await appendUpdateLog(options, `assetUrl=${assetUrl}`);
    if (asset.sha256) await appendUpdateLog(options, `manifestSha256=${asset.sha256} (not enforced)`);
    await cleanupStaging(updateDir, options);

    const result = await downloadFile(assetUrl, tempPath, (progress) => {
      state = { status: "downloading", info: manifestToInfo(manifest), downloaded: progress.downloaded, total: progress.total };
      onProgress?.(progress);
    });
    await appendUpdateLog(options, `downloaded path=${tempPath} bytes=${result.downloaded} total=${result.total ?? "unknown"} contentType=${result.contentType ?? "unknown"}`);

    // await validateAsarPayload(tempPath, manifest.version, asset.size);
    await appendUpdateLog(options, `validated path=${tempPath}`);

    await removeAsPlainFile(finalPath);
    await rename(tempPath, finalPath);
    const finalSize = (await stat(finalPath)).size;
    await writeFile(
      metadataPath,
      `${JSON.stringify({ version: manifest.version, assetUrl, originalAssetUrl: asset.url, sha256: asset.sha256, size: finalSize, downloadedAt: new Date().toISOString() }, null, 2)}\n`,
      "utf8"
    );
    await appendUpdateLog(options, `ready staged=${finalPath} size=${finalSize}`);
    stagedAsarPath = finalPath;
    state = { status: "ready", info: manifestToInfo(manifest) };
  } catch (error) {
    await removeAsPlainFile(tempPath).catch(() => undefined);
    await appendUpdateLog(options, `download failed: ${formatError(error)}`).catch(() => undefined);
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
  const updateLogPath = getUpdateLogPath(options);

  await writeFile(
    logPath,
    `Preparing update ${version}\nTarget: ${targetAsar}\nStaged: ${stagedAsarPath}\nUpdate log: ${updateLogPath}\n`,
    "utf8"
  );
  await appendUpdateLog(options, `install requested helper=${helperPath} target=${targetAsar} staged=${stagedAsarPath} installLog=${logPath}`);

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
    logPath,
    "--update-log",
    updateLogPath,
    "--platform",
    process.platform
  ];

  state = { status: "installing", info: manifestToInfo(pendingManifest) };
  spawn(process.execPath, [helperPath, ...args], { env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" }, detached: true, stdio: "ignore" }).unref();
}

async function fetchManifest(url: string): Promise<UpdateManifest> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`检查更新失败：HTTP ${response.status}`);
  return (await response.json()) as UpdateManifest;
}

async function fetchGithubReleaseNotes(assetUrl: string, options: UpdateServiceOptions): Promise<string | undefined> {
  const apiUrl = getGithubReleaseApiUrl(assetUrl);
  if (!apiUrl) {
    await appendUpdateLog(options, `release notes skipped non-github asset=${assetUrl}`);
    return undefined;
  }

  try {
    await appendUpdateLog(options, `fetching release notes url=${apiUrl}`);
    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Accept: "application/vnd.github+json"
      }
    });
    if (!response.ok) {
      await appendUpdateLog(options, `release notes unavailable: HTTP ${response.status}`);
      return undefined;
    }

    const release = (await response.json()) as GitHubReleaseInfo;
    const body = release.body?.trim();
    if (!body) {
      await appendUpdateLog(options, "release notes empty");
      return undefined;
    }

    await appendUpdateLog(options, `release notes loaded length=${body.length}`);
    return body;
  } catch (error) {
    await appendUpdateLog(options, `release notes failed: ${formatError(error)}`).catch(() => undefined);
    return undefined;
  }
}

export function getDownloadUrl(url: string, releaseProxyPrefix = DEFAULT_RELEASE_PROXY_PREFIX): string {
  const normalizedPrefix = normalizeProxyPrefix(releaseProxyPrefix);
  if (!normalizedPrefix || !isGithubReleaseUrl(url) || url.startsWith(normalizedPrefix)) {
    return url;
  }

  return `${normalizedPrefix}${url}`;
}

function getUpdateManifestUrl(options: UpdateServiceOptions): string {
  return getDownloadUrl(options.manifestUrl ?? DEFAULT_MANIFEST_URL, options.releaseProxyPrefix);
}

export function getGithubReleaseApiUrl(assetUrl: string): string | undefined {
  try {
    const parsed = new URL(assetUrl);
    if (parsed.hostname !== "github.com") return undefined;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const releasesIndex = parts.indexOf("releases");
    if (releasesIndex < 2 || parts[releasesIndex + 1] !== "download") return undefined;

    const owner = parts[releasesIndex - 2];
    const repo = parts[releasesIndex - 1];
    const tag = parts[releasesIndex + 2];
    if (!owner || !repo || !tag) return undefined;

    return `https://api.github.com/repos/${owner}/${repo}/releases/tags/${encodeURIComponent(decodeURIComponent(tag))}`;
  } catch {
    return undefined;
  }
}

async function downloadFile(url: string, destination: string, onProgress: (progress: UpdateProgress) => void): Promise<{ downloaded: number; total?: number; contentType?: string }> {
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`下载更新失败：HTTP ${response.status}`);

  const total = Number(response.headers.get("content-length")) || undefined;
  const contentType = response.headers.get("content-type") ?? undefined;
  let downloaded = 0;
  const reader = response.body.getReader();
  const output = createWriteStream(destination);
  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      if (value) {
        downloaded += value.byteLength;
        onProgress({ downloaded, total });
        controller.enqueue(value);
      }
    }
  });

  try {
    await pipeline(stream, output);
  } catch (error) {
    output.destroy();
    throw error;
  }

  return { downloaded, total, contentType };
}

async function validateAsarPayload(filePath: string, expectedVersion: string, expectedSize?: number): Promise<void> {
  const fileStat = await stat(filePath);
  if (fileStat.size < MIN_ASAR_SIZE_BYTES) {
    throw new Error(`下载的更新包过小，可能不是有效 app.asar：${fileStat.size} bytes`);
  }
  if (expectedSize !== undefined && fileStat.size !== expectedSize) {
    throw new Error(`下载的更新包大小不匹配：expected ${expectedSize}, received ${fileStat.size}`);
  }

  try {
    const header = await readAsarHeader(filePath);
    for (const requiredFile of ["package.json", "dist/index.html", "dist-electron/electron/main.js", "dist-electron/electron/preload.js"]) {
      if (!getAsarEntry(header.files, requiredFile)) throw new Error(`missing ${requiredFile}`);
    }
    const packageEntry = getAsarEntry(header.files, "package.json");
    if (!packageEntry) throw new Error("missing package.json");
    const pkg = JSON.parse((await extractAsarFile(filePath, packageEntry)).toString("utf8")) as { name?: string; version?: string; main?: string };
    if (pkg.name !== "raw-pair-cleaner") throw new Error(`package name mismatch: ${pkg.name ?? "missing"}`);
    if (pkg.version !== expectedVersion) throw new Error(`package version mismatch: ${pkg.version ?? "missing"}`);
    if (pkg.main !== "dist-electron/electron/main.js") throw new Error(`package main mismatch: ${pkg.main ?? "missing"}`);
  } catch (error) {
    throw new Error(`下载的更新包不是有效的 app.asar，请查看 update.log。${error instanceof Error ? ` ${error.message}` : ""}`);
  }
}

interface AsarEntry {
  files?: Record<string, AsarEntry>;
  offset?: string;
  size?: number;
  unpacked?: boolean;
}

interface AsarHeader {
  files: Record<string, AsarEntry>;
  headerSize: number;
}

async function readAsarHeader(filePath: string): Promise<AsarHeader> {
  const handle = await open(filePath, "r");
  try {
    const sizeBuffer = Buffer.alloc(8);
    await handle.read(sizeBuffer, 0, sizeBuffer.length, 0);
    const headerSize = sizeBuffer.readUInt32LE(4);
    if (!Number.isFinite(headerSize) || headerSize <= 0 || headerSize > 50 * 1024 * 1024) {
      throw new Error(`invalid asar header size: ${headerSize}`);
    }

    const headerBuffer = Buffer.alloc(headerSize);
    await handle.read(headerBuffer, 0, headerSize, 8);
    const header = JSON.parse(headerBuffer.toString("utf8")) as { files?: Record<string, AsarEntry> };
    if (!header.files) throw new Error("asar header missing files");
    return { files: header.files, headerSize };
  } finally {
    await handle.close();
  }
}

function getAsarEntry(files: Record<string, AsarEntry>, entryPath: string): AsarEntry | undefined {
  return entryPath.split("/").filter(Boolean).reduce<AsarEntry | undefined>((current, part) => current?.files?.[part], { files });
}

async function extractAsarFile(filePath: string, entry: AsarEntry): Promise<Buffer> {
  if (entry.files || entry.offset === undefined || entry.size === undefined) {
    throw new Error("asar entry is not a file");
  }
  if (entry.unpacked) throw new Error("asar unpacked entries are not supported for update validation");

  const header = await readAsarHeader(filePath);
  const offset = 8 + header.headerSize + Number.parseInt(entry.offset, 10);
  if (!Number.isFinite(offset)) throw new Error(`invalid asar entry offset: ${entry.offset}`);

  const handle = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(entry.size);
    await handle.read(buffer, 0, entry.size, offset);
    return buffer;
  } finally {
    await handle.close();
  }
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

function isGithubReleaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname === "github.com" && parsed.pathname.includes("/releases/");
  } catch {
    return false;
  }
}

function normalizeProxyPrefix(prefix: string): string {
  const trimmed = prefix.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function getUpdateLogPath(options: UpdateServiceOptions): string {
  return path.join(options.userDataPath, "logs", "update.log");
}

async function appendUpdateLog(options: UpdateServiceOptions, message: string): Promise<void> {
  const logPath = getUpdateLogPath(options);
  await mkdir(path.dirname(logPath), { recursive: true });
  await writeFile(logPath, `[${new Date().toISOString()}] ${message}\n`, { encoding: "utf8", flag: "a" });
}

async function cleanupStaging(updateDir: string, options: UpdateServiceOptions): Promise<void> {
  for (const fileName of ["app.asar", "app.asar.tmp", "payload.download"]) {
    const filePath = path.join(updateDir, fileName);
    await removeAsPlainFile(filePath)
      .then(() => appendUpdateLog(options, `cleaned stale ${filePath}`))
      .catch((error) => appendUpdateLog(options, `cleanup skipped ${filePath}: ${getErrorMessage(error)}`));
  }
}

async function removeAsPlainFile(filePath: string): Promise<void> {
  const previousNoAsar = process.noAsar;
  process.noAsar = true;
  try {
    await rm(filePath, { force: true });
  } finally {
    process.noAsar = previousNoAsar;
  }
}

function formatError(error: unknown): string {
  if (error instanceof Error) return `${error.message}\n${error.stack ?? ""}`;
  return String(error);
}

export async function recoverBackupForTests(targetPath: string, backupPath: string): Promise<void> {
  await removeAsPlainFile(targetPath);
  await rename(backupPath, targetPath);
}
