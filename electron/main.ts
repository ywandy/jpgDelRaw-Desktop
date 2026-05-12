import { app, BrowserWindow, dialog, ipcMain } from "electron";
import path from "node:path";

import { APP_TITLE, APP_WINDOW_BOUNDS } from "../shared/constants.js";
import type { DeleteContext, DeleteMode, MediaFile, ScanOptions, ScanResult } from "../shared/types.js";
import { compareFiles } from "./services/compareService.js";
import { scanDirectory } from "./services/scanService.js";
import { getSettings, saveSettings } from "./services/settingsService.js";
import { moveFilesToTrash } from "./services/trashService.js";
import { checkForUpdates, downloadUpdate, getUpdateState, installStagedUpdate } from "./services/updateService.js";

const devServerUrl = process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173";

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    ...APP_WINDOW_BOUNDS,
    title: APP_TITLE,
    frame: false,
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
    backgroundColor: "#f4efe8",
    trafficLightPosition: { x: 18, y: 17 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  if (!app.isPackaged) {
    void mainWindow.loadURL(devServerUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerIpcHandlers(): void {
  ipcMain.handle("dialog:select-directory", async () => {
    const result = await dialog.showOpenDialog(getActiveWindow(), {
      properties: ["openDirectory"],
      title: "选择照片目录"
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle("files:scan-directory", (_event, rootPath: string, options: ScanOptions) => {
    return scanDirectory(rootPath, options);
  });

  ipcMain.handle("files:compare", (_event, scanResult: ScanResult, mode: DeleteMode) => {
    return compareFiles(scanResult, mode);
  });

  ipcMain.handle("files:move-to-trash", async (_event, files: MediaFile[], context: DeleteContext) => {
    const settings = await getSettings();
    return moveFilesToTrash(files, context, {
      generateLog: settings.delete.generateLog
    });
  });

  ipcMain.handle("settings:get", () => getSettings());

  ipcMain.handle("settings:save", (_event, settings) => saveSettings(settings));

  ipcMain.handle("platform:get", () => process.platform);

  ipcMain.handle("updates:state", () => getUpdateState());

  ipcMain.handle("updates:check", () => checkForUpdates(getUpdateOptions()));

  ipcMain.handle("updates:download", async (event) => {
    return downloadUpdate(getUpdateOptions(), (progress) => event.sender.send("updates:progress", progress));
  });

  ipcMain.handle("updates:install", async () => {
    await installStagedUpdate(getUpdateOptions());
    app.quit();
  });

  ipcMain.handle("window:minimize", () => {
    getActiveWindow().minimize();
  });

  ipcMain.handle("window:maximize", () => {
    const window = getActiveWindow();
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  });

  ipcMain.handle("window:close", () => {
    getActiveWindow().close();
  });
}

function getActiveWindow(): BrowserWindow {
  return BrowserWindow.getFocusedWindow() ?? mainWindow ?? BrowserWindow.getAllWindows()[0];
}

function getUpdateOptions() {
  return {
    userDataPath: app.getPath("userData"),
    resourcesPath: process.resourcesPath,
    executablePath: process.execPath,
    packaged: app.isPackaged,
    manifestUrl: process.env.RAW_PAIR_CLEANER_UPDATE_URL
  };
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
