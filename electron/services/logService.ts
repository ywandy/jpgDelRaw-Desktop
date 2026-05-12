import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { APP_NAME, APP_VERSION } from "../../shared/constants.js";
import type { DeleteResult } from "../../shared/types.js";

export async function writeDeleteLog(result: DeleteResult, userDataPath: string): Promise<string> {
  const logsDirectory = path.join(userDataPath, "logs");
  await mkdir(logsDirectory, { recursive: true });

  const logPath = path.join(logsDirectory, `delete-log-${formatLogDate(new Date(result.startedAt))}.json`);
  const payload = {
    app: APP_NAME,
    version: APP_VERSION,
    mode: result.mode,
    rootPath: result.rootPath,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    total: result.total,
    success: result.success,
    failed: result.failed,
    items: result.items
  };

  await writeFile(logPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return logPath;
}

function formatLogDate(date: Date): string {
  const parts = [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  ];

  return parts.map((part, index) => (index === 0 ? `${part}` : `${part}`.padStart(2, "0"))).join("-");
}
