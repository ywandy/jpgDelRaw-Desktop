import { DEFAULT_SETTINGS } from "../../shared/constants";

function missingPreload(): Promise<never> {
  return Promise.reject(new Error("Electron preload 未就绪，请在桌面应用窗口中使用。"));
}

export const api: Window["rawPairCleaner"] =
  window.rawPairCleaner ?? {
    selectDirectory: () => Promise.resolve(null),
    scanDirectory: () => missingPreload(),
    compareFiles: () => missingPreload(),
    moveToTrash: () => missingPreload(),
    showItemInFolder: () => missingPreload(),
    getSettings: () => Promise.resolve(DEFAULT_SETTINGS),
    saveSettings: () => missingPreload(),
    getPlatform: () => Promise.resolve("darwin"),
    getPathForFile: () => "",
    getUpdateState: () => Promise.resolve({ status: "idle" }),
    checkForUpdates: () => Promise.resolve({ available: false, currentVersion: "0.0.0" }),
    downloadUpdate: () => missingPreload(),
    installUpdate: () => missingPreload(),
    onUpdateProgress: () => () => undefined,
    windowMinimize: () => Promise.resolve(),
    windowMaximize: () => Promise.resolve(),
    windowClose: () => Promise.resolve()
  };
