import { writeDeleteLog } from "./logService.js";
import type { DeleteContext, DeleteResult, DeleteResultItem, MediaFile } from "../../shared/types.js";

export interface TrashServiceDependencies {
  trashItem?: (filePath: string) => Promise<void>;
  userDataPath?: string;
  generateLog?: boolean;
  now?: () => Date;
}

export async function moveFilesToTrash(
  files: MediaFile[],
  context: DeleteContext,
  dependencies: TrashServiceDependencies = {}
): Promise<DeleteResult> {
  const now = dependencies.now ?? (() => new Date());
  const startedAt = now().toISOString();
  const trashItem = dependencies.trashItem ?? (await getElectronTrashItem());
  const items: DeleteResultItem[] = [];

  for (const file of files) {
    try {
      await trashItem(file.path);
      items.push({
        path: file.path,
        size: file.size,
        status: "moved_to_trash"
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
    total: files.length,
    success: items.filter((item) => item.status === "moved_to_trash").length,
    failed: items.filter((item) => item.status === "failed").length,
    items
  };

  if (dependencies.generateLog ?? true) {
    const userDataPath = dependencies.userDataPath ?? (await getElectronUserDataPath());
    result.logPath = await writeDeleteLog(result, userDataPath);
  }

  return result;
}

async function getElectronTrashItem(): Promise<(filePath: string) => Promise<void>> {
  const electron = await import("electron");
  return electron.shell.trashItem.bind(electron.shell);
}

async function getElectronUserDataPath(): Promise<string> {
  const electron = await import("electron");
  return electron.app.getPath("userData");
}
