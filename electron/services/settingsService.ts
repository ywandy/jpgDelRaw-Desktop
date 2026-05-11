import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { DEFAULT_SETTINGS } from "../../shared/constants.js";
import type { AppSettings } from "../../shared/types.js";

export async function getSettings(userDataPath?: string): Promise<AppSettings> {
  const settingsPath = await getSettingsPath(userDataPath);

  try {
    const content = await readFile(settingsPath, "utf8");
    const parsed = JSON.parse(content) as Partial<AppSettings>;
    return mergeSettings(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return DEFAULT_SETTINGS;
    }
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings, userDataPath?: string): Promise<void> {
  const settingsPath = await getSettingsPath(userDataPath);
  await mkdir(path.dirname(settingsPath), { recursive: true });
  await writeFile(settingsPath, `${JSON.stringify(mergeSettings(settings), null, 2)}\n`, "utf8");
}

function mergeSettings(settings: Partial<AppSettings>): AppSettings {
  return {
    appearance: {
      ...DEFAULT_SETTINGS.appearance,
      ...settings.appearance
    },
    scan: {
      ...DEFAULT_SETTINGS.scan,
      ...settings.scan
    },
    delete: {
      ...DEFAULT_SETTINGS.delete,
      ...settings.delete
    },
    sidecar: {
      ...DEFAULT_SETTINGS.sidecar,
      ...settings.sidecar
    }
  };
}

async function getSettingsPath(userDataPath?: string): Promise<string> {
  const basePath = userDataPath ?? (await getElectronUserDataPath());
  return path.join(basePath, "settings.json");
}

async function getElectronUserDataPath(): Promise<string> {
  const electron = await import("electron");
  return electron.app.getPath("userData");
}
