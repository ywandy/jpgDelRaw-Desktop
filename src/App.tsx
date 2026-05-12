import { useEffect, useMemo, useState } from "react";

import { DEFAULT_SETTINGS } from "../shared/constants";
import type { AppSettings, CompareResult, DeleteMode, DeleteResult, PlatformName, ScanResult, UpdateInfo, UpdateProgress, UpdateState } from "../shared/types";
import { AppLayout } from "./components/AppLayout";
import { UpdateDialog } from "./components/UpdateDialog";
import { api } from "./lib/api";
import { AboutPage } from "./pages/AboutPage";
import { HomePage } from "./pages/HomePage";
import { PendingDeletePage, selectedMediaFiles } from "./pages/PendingDeletePage";
import { ScanResultPage } from "./pages/ScanResultPage";
import { SettingsPage } from "./pages/SettingsPage";
import type { PageKey } from "./types/navigation";

const AUTO_UPDATE_CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageKey>("home");
  const [platform, setPlatform] = useState<PlatformName>("darwin");
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [rootPath, setRootPath] = useState<string>();
  const [mode, setMode] = useState<DeleteMode>("jpg_as_source_delete_raw");
  const [scanResult, setScanResult] = useState<ScanResult>();
  const [compareResult, setCompareResult] = useState<CompareResult>();
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [deleteResult, setDeleteResult] = useState<DeleteResult>();
  const [error, setError] = useState<string>();
  const [scanning, setScanning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo>();
  const [updateState, setUpdateState] = useState<UpdateState>({ status: "idle" });
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [pendingUpdatePrompt, setPendingUpdatePrompt] = useState(false);
  const updateBusy = updateState.status === "checking" || updateState.status === "downloading" || updateState.status === "installing";
  const appBusyForUpdatePrompt = scanning || deleting || confirmOpen;

  useEffect(() => {
    void api
      .getSettings()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS))
      .finally(() => setSettingsLoaded(true));
    void api
      .getPlatform()
      .then(setPlatform)
      .catch(() => setPlatform("darwin"));

    const dispose = api.onUpdateProgress((progress) => {
      setUpdateState((current) => ({ ...current, status: "downloading", downloaded: progress.downloaded, total: progress.total }));
    });
    return dispose;
  }, []);

  useEffect(() => {
    if (!settingsLoaded || !settings.updates.autoCheckOnStartup || !shouldAutoCheck(settings.updates.lastCheckedAt)) return;

    const timer = window.setTimeout(() => {
      void runUpdateCheck({ manual: false });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [settingsLoaded, settings.updates.autoCheckOnStartup, settings.updates.lastCheckedAt]);

  useEffect(() => {
    if (!pendingUpdatePrompt || appBusyForUpdatePrompt) return;
    setUpdateDialogOpen(true);
    setPendingUpdatePrompt(false);
  }, [appBusyForUpdatePrompt, pendingUpdatePrompt]);

  const selectedSize = useMemo(() => {
    return selectedMediaFiles(compareResult, selectedPaths).reduce((total, file) => total + file.size, 0);
  }, [compareResult, selectedPaths]);

  async function browseDirectory(): Promise<void> {
    const directory = await api.selectDirectory();
    if (directory) {
      setRootPath(directory);
      setError(undefined);
    }
  }

  function acceptDroppedFile(file: File): void {
    const filePath = api.getPathForFile(file);
    if (!filePath) {
      setError("无法读取拖入目录路径，请点击选择目录。");
      return;
    }
    setRootPath(filePath);
    setError(undefined);
  }

  async function startScan(): Promise<void> {
    if (!rootPath) {
      setError("请先选择照片目录。");
      return;
    }
    if (updateState.status === "downloading" || updateState.status === "installing") {
      setError("正在处理更新，请等待完成后再扫描。");
      return;
    }

    setScanning(true);
    setError(undefined);
    setDeleteResult(undefined);

    try {
      const nextScanResult = await api.scanDirectory(rootPath, settings.scan);

      if (nextScanResult.imageFiles.length === 0 || nextScanResult.rawFiles.length === 0) {
        setScanResult(nextScanResult);
        setCompareResult(undefined);
        setSelectedPaths(new Set());
        setError(getNoComparableFilesMessage(nextScanResult));
        setCurrentPage("home");
        return;
      }

      const nextCompareResult = await api.compareFiles(nextScanResult, mode);
      setScanResult(nextScanResult);
      setCompareResult(nextCompareResult);
      setSelectedPaths(new Set(nextCompareResult.deleteCandidates.map((file) => file.path)));
      setCurrentPage("scanResult");
    } catch (scanError) {
      setError(getErrorMessage(scanError));
      setCurrentPage("home");
    } finally {
      setScanning(false);
    }
  }

  function toggleFile(filePath: string): void {
    setSelectedPaths((current) => {
      const next = new Set(current);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  }

  function toggleAll(): void {
    if (!compareResult) return;
    const allPaths = compareResult.deleteCandidates.map((file) => file.path);
    const allSelected = allPaths.every((filePath) => selectedPaths.has(filePath));
    setSelectedPaths(allSelected ? new Set() : new Set(allPaths));
  }

  function setFilesSelected(paths: string[], selected: boolean): void {
    setSelectedPaths((current) => {
      const next = new Set(current);
      for (const filePath of paths) {
        if (selected) {
          next.add(filePath);
        } else {
          next.delete(filePath);
        }
      }
      return next;
    });
  }

  async function confirmDelete(): Promise<void> {
    if (!compareResult || !scanResult || selectedSize < 0) return;
    if (updateState.status === "downloading" || updateState.status === "installing") {
      setError("正在处理更新，请等待完成后再删除文件。");
      return;
    }
    const files = selectedMediaFiles(compareResult, selectedPaths);
    if (files.length === 0) return;

    setDeleting(true);
    try {
      const result = await api.moveToTrash(files, {
        mode,
        rootPath: scanResult.rootPath
      });
      setDeleteResult(result);
      setSelectedPaths(new Set(result.items.filter((item) => item.status === "failed").map((item) => item.path)));
      setConfirmOpen(false);
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setDeleting(false);
    }
  }

  async function saveSettings(nextSettings: AppSettings): Promise<void> {
    setSavingSettings(true);
    setError(undefined);
    try {
      await api.saveSettings(nextSettings);
      setSettings(nextSettings);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSavingSettings(false);
    }
  }

  async function runUpdateCheck({ manual }: { manual: boolean }): Promise<void> {
    if (updateBusy) return;
    setUpdateState({ status: "checking" });
    if (manual) setError(undefined);

    try {
      const result = await api.checkForUpdates();
      const checkedAt = new Date().toISOString();
      await persistUpdateLastCheckedAt(checkedAt);

      if (!result.available || !result.info) {
        setUpdateInfo(undefined);
        setUpdateState({ status: manual ? "not-available" : "idle" });
        return;
      }

      setUpdateInfo(result.info);
      setUpdateState({ status: "available", info: result.info });
      if (manual || !appBusyForUpdatePrompt) {
        setUpdateDialogOpen(true);
      } else {
        setPendingUpdatePrompt(true);
      }
    } catch (updateError) {
      if (manual) {
        setUpdateState({ status: "error", error: getErrorMessage(updateError) });
      } else {
        setUpdateState({ status: "idle" });
      }
    }
  }

  async function persistUpdateLastCheckedAt(lastCheckedAt: string): Promise<void> {
    const nextSettings = { ...settings, updates: { ...settings.updates, lastCheckedAt } };
    setSettings(nextSettings);
    await api.saveSettings(nextSettings);
  }

  async function downloadUpdate(): Promise<void> {
    if (!updateInfo) return;
    if (scanning || deleting || confirmOpen) {
      setUpdateState({ status: "error", info: updateInfo, error: "请等待当前扫描或删除操作完成后再下载更新。" });
      return;
    }

    setUpdateState({ status: "downloading", info: updateInfo, downloaded: 0 });
    try {
      await api.downloadUpdate();
      setUpdateState({ status: "ready", info: updateInfo });
    } catch (downloadError) {
      setUpdateState({ status: "error", info: updateInfo, error: getErrorMessage(downloadError) });
    }
  }

  async function installUpdate(): Promise<void> {
    if (!updateInfo) return;
    if (scanning || deleting || confirmOpen) {
      setUpdateState({ status: "error", info: updateInfo, error: "请等待当前扫描或删除操作完成后再重启安装。" });
      return;
    }

    setUpdateState({ status: "installing", info: updateInfo });
    try {
      await api.installUpdate();
    } catch (installError) {
      setUpdateState({ status: "error", info: updateInfo, error: getErrorMessage(installError) });
    }
  }

  return (
    <AppLayout currentPage={currentPage} platform={platform} fontScale={settings.appearance.fontScale} onNavigate={setCurrentPage}>
      <UpdateDialog
        open={updateDialogOpen}
        info={updateInfo}
        state={updateState}
        onCancel={() => setUpdateDialogOpen(false)}
        onDownload={() => void downloadUpdate()}
        onInstall={() => void installUpdate()}
      />
      {currentPage === "home" && (
        <HomePage
          rootPath={rootPath}
          mode={mode}
          error={error}
          scanning={scanning}
          onModeChange={setMode}
          onBrowse={() => void browseDirectory()}
          onDropFile={acceptDroppedFile}
          onStartScan={() => void startScan()}
        />
      )}
      {currentPage === "scanResult" && (
        <ScanResultPage
          scanResult={scanResult}
          compareResult={compareResult}
          onRescan={() => void startScan()}
          onViewPending={() => setCurrentPage("pendingDelete")}
          onGoHome={() => setCurrentPage("home")}
        />
      )}
      {currentPage === "pendingDelete" && (
        <PendingDeletePage
          compareResult={compareResult}
          selectedPaths={selectedPaths}
          requireConfirmText={settings.delete.requireConfirmText}
          deleting={deleting}
          deleteResult={deleteResult}
          confirmOpen={confirmOpen}
          mode={mode}
          onToggleFile={toggleFile}
          onToggleAll={toggleAll}
          onSetFilesSelected={setFilesSelected}
          onOpenConfirm={() => setConfirmOpen(true)}
          onCloseConfirm={() => setConfirmOpen(false)}
          onConfirmDelete={() => void confirmDelete()}
          onCancel={() => setCurrentPage("scanResult")}
        />
      )}
      {currentPage === "settings" && (
        <SettingsPage
          settings={settings}
          saving={savingSettings}
          updateInfo={updateInfo}
          updateState={updateState}
          onSave={(nextSettings) => void saveSettings(nextSettings)}
          onCheckUpdate={() => void runUpdateCheck({ manual: true })}
        />
      )}
      {currentPage === "about" && (
        <AboutPage
          updateInfo={updateInfo}
          updateState={updateState}
          onCheckUpdate={() => void runUpdateCheck({ manual: true })}
          onShowUpdate={() => setUpdateDialogOpen(true)}
        />
      )}
    </AppLayout>
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "操作失败，请重试。";
}

function shouldAutoCheck(lastCheckedAt?: string): boolean {
  if (!lastCheckedAt) return true;
  const checkedAt = new Date(lastCheckedAt).getTime();
  if (Number.isNaN(checkedAt)) return true;
  return Date.now() - checkedAt >= AUTO_UPDATE_CHECK_INTERVAL_MS;
}

function getNoComparableFilesMessage(scanResult: ScanResult): string {
  const imageCount = scanResult.imageFiles.length;
  const rawCount = scanResult.rawFiles.length;
  const modeLabel = scanResult.directoryMode === "separate_dirs" ? "已识别为双目录" : "已完成目录扫描";

  if (imageCount === 0 && rawCount === 0) {
    return `${modeLabel}，但没有找到可识别的 JPG 类图片或 RAW 文件。请检查文件扩展名、隐藏文件设置或目录层级。`;
  }

  if (imageCount === 0) {
    return `${modeLabel}，但没有找到可识别的 JPG 类图片文件；当前 RAW 文件 ${rawCount} 个。请检查 JPG 目录内容或扩展名。`;
  }

  return `${modeLabel}，但没有找到可识别的 RAW 文件；当前 JPG 类图片 ${imageCount} 个。请检查 RAW 目录内容或扩展名。`;
}
