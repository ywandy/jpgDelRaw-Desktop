import { constants as fsConstants } from "node:fs";
import { access, readFile, stat, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { writeDeleteLog } from "./logService.js";
import type { DeleteContext, DeleteResult, DeleteResultItem, MediaFile, TrashCapability } from "../../shared/types.js";

export interface TrashServiceDependencies {
  trashItem?: (filePath: string) => Promise<void>;
  deleteFile?: (filePath: string) => Promise<void>;
  userDataPath?: string;
  generateLog?: boolean;
  now?: () => Date;
}

export interface TrashCapabilityDependencies {
  platform?: NodeJS.Platform;
  homeDir?: string;
  uid?: number;
  accessPath?: (targetPath: string, mode?: number) => Promise<void>;
  statPath?: (targetPath: string) => Promise<{ dev: number; isDirectory: () => boolean }>;
  readTextFile?: (targetPath: string) => Promise<string>;
}

export async function moveFilesToTrash(
  files: MediaFile[],
  context: DeleteContext,
  dependencies: TrashServiceDependencies = {}
): Promise<DeleteResult> {
  const now = dependencies.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const operation = context.operation ?? "trash";
  const trashItem = operation === "trash" ? dependencies.trashItem ?? (await getElectronTrashItem()) : undefined;
  const deleteFile = operation === "permanent" ? dependencies.deleteFile ?? unlink : undefined;
  const items: DeleteResultItem[] = [];

  for (const file of files) {
    try {
      if (operation === "trash") {
        await trashItem?.(file.path);
      } else {
        await deleteFile?.(file.path);
      }
      items.push({
        path: file.path,
        size: file.size,
        status: operation === "trash" ? "moved_to_trash" : "deleted_permanently"
      });
    } catch (error) {
      items.push({
        path: file.path,
        size: file.size,
        status: "failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  const finishedAt = now().toISOString();
  const result: DeleteResult = {
    startedAt,
    finishedAt,
    mode: context.mode,
    rootPath: context.rootPath,
    operation,
    total: files.length,
    success: items.filter((item) => item.status === "moved_to_trash" || item.status === "deleted_permanently").length,
    failed: items.filter((item) => item.status === "failed").length,
    items
  };

  if (dependencies.generateLog ?? true) {
    const userDataPath = dependencies.userDataPath ?? (await getElectronUserDataPath());
    result.logPath = await writeDeleteLog(result, userDataPath);
  }

  return result;
}

export async function getTrashCapability(targetPath: string, dependencies: TrashCapabilityDependencies = {}): Promise<TrashCapability> {
  const checkedPath = targetPath;
  if (typeof targetPath !== "string" || targetPath.length === 0) {
    return {
      status: "unavailable",
      checkedPath,
      reason: "路径无效，无法判断是否支持系统回收站。"
    };
  }

  const platform = dependencies.platform ?? process.platform;
  const accessPath = dependencies.accessPath ?? access;
  const statPath = dependencies.statPath ?? stat;

  if (platform === "win32") {
    if (isWindowsNetworkPath(targetPath)) {
      return {
        status: "unavailable",
        checkedPath,
        reason: "当前路径是 Windows 网络共享位置，通常不支持系统回收站。"
      };
    }

    return {
      status: "unknown",
      checkedPath,
      reason: "Windows 本地磁盘通常支持回收站；如目标是映射网络盘，请谨慎确认。"
    };
  }

  if (platform === "darwin") {
    const resolvedPath = path.posix.resolve(targetPath);
    if (!resolvedPath.startsWith("/Volumes/")) {
      return {
        status: "available",
        checkedPath,
        reason: "本机磁盘使用系统回收站。"
      };
    }

    const volumeRoot = getDarwinVolumeRoot(resolvedPath);
    const uid = String(dependencies.uid ?? os.userInfo().uid);
    const volumeTrashRoot = path.join(volumeRoot, ".Trashes");
    const userTrash = path.join(volumeTrashRoot, uid);

    if ((await canAccess(accessPath, userTrash, fsConstants.W_OK)) || (await canAccess(accessPath, volumeTrashRoot, fsConstants.W_OK))) {
      return {
        status: "available",
        checkedPath,
        reason: "已检测到当前卷的系统回收站目录。"
      };
    }

    return {
      status: "unavailable",
      checkedPath,
      reason: "当前卷未检测到可写的 .Trashes 回收站目录，NAS 或网络盘可能会直接永久删除。"
    };
  }

  if (platform === "linux") {
    const resolvedPath = path.posix.resolve(targetPath);
    const homeDir = dependencies.homeDir ?? os.homedir();
    if (isPathInside(resolvedPath, homeDir)) {
      return {
        status: "available",
        checkedPath,
        reason: "主目录内文件使用系统回收站。"
      };
    }

    const mountRoot = await findLinuxMountRoot(resolvedPath, {
      readTextFile: dependencies.readTextFile,
      statPath
    });
    const uid = String(dependencies.uid ?? os.userInfo().uid);
    const sharedTrash = path.join(mountRoot, ".Trash", uid);
    const userTrash = path.join(mountRoot, `.Trash-${uid}`);

    if ((await canAccess(accessPath, sharedTrash, fsConstants.W_OK)) || (await canAccess(accessPath, userTrash, fsConstants.W_OK))) {
      return {
        status: "available",
        checkedPath,
        reason: "已检测到当前挂载点的系统回收站目录。"
      };
    }

    return {
      status: "unavailable",
      checkedPath,
      reason: "当前挂载点未检测到可写回收站目录，NAS 或外部挂载可能会直接永久删除。"
    };
  }

  return {
    status: "unknown",
    checkedPath,
    reason: "当前平台无法预先确认回收站能力，请在确认弹窗中选择删除方式。"
  };
}

async function getElectronTrashItem(): Promise<(filePath: string) => Promise<void>> {
  const electron = await import("electron");
  return electron.shell.trashItem.bind(electron.shell);
}

async function getElectronUserDataPath(): Promise<string> {
  const electron = await import("electron");
  return electron.app.getPath("userData");
}

function isWindowsNetworkPath(targetPath: string): boolean {
  return targetPath.startsWith("\\\\") || targetPath.startsWith("//");
}

function getDarwinVolumeRoot(resolvedPath: string): string {
  const segments = resolvedPath.split(path.posix.sep).filter(Boolean);
  if (segments[0] !== "Volumes" || !segments[1]) return path.posix.parse(resolvedPath).root;
  return path.posix.join(path.posix.sep, segments[0], segments[1]);
}

function isPathInside(targetPath: string, parentPath: string): boolean {
  const relativePath = path.posix.relative(parentPath, targetPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.posix.isAbsolute(relativePath));
}

async function canAccess(accessPath: (targetPath: string, mode?: number) => Promise<void>, targetPath: string, mode: number): Promise<boolean> {
  try {
    await accessPath(targetPath, mode);
    return true;
  } catch {
    return false;
  }
}

async function findLinuxMountRoot(
  targetPath: string,
  dependencies: {
    readTextFile?: (targetPath: string) => Promise<string>;
    statPath: (targetPath: string) => Promise<{ dev: number; isDirectory: () => boolean }>;
  }
): Promise<string> {
  const readTextFile = dependencies.readTextFile ?? ((filePath: string) => readFile(filePath, "utf8"));

  try {
    const mounts = await readTextFile("/proc/mounts");
    const mountPoints = mounts
      .split("\n")
      .map((line) => line.split(" ")[1])
      .filter((mountPoint): mountPoint is string => Boolean(mountPoint))
      .map(unescapeLinuxMountPath)
      .sort((a, b) => b.length - a.length);
    const match = mountPoints.find((mountPoint) => isPathInside(targetPath, mountPoint));
    if (match) return match;
  } catch {
    // Fall back to device-bound parent traversal below.
  }

  try {
    const targetStat = await dependencies.statPath(targetPath);
    let currentPath = targetStat.isDirectory() ? targetPath : path.posix.dirname(targetPath);

    while (currentPath !== path.posix.parse(currentPath).root) {
      const parentPath = path.posix.dirname(currentPath);
      const parentStat = await dependencies.statPath(parentPath);
      if (parentStat.dev !== targetStat.dev) return currentPath;
      currentPath = parentPath;
    }
  } catch {
    // If stat traversal fails, use the filesystem root as the safest fallback.
  }

  return path.posix.parse(targetPath).root;
}

function unescapeLinuxMountPath(mountPath: string): string {
  return mountPath.replace(/\\040/g, " ");
}
