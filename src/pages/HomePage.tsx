import { Camera, Search } from "lucide-react";

import type { DeleteMode } from "../../shared/types";
import { DropZone } from "../components/DropZone";
import { ModeSelector } from "../components/ModeSelector";
import { WarningPanel } from "../components/WarningPanel";

interface HomePageProps {
  rootPath?: string;
  mode: DeleteMode;
  error?: string;
  scanning: boolean;
  onModeChange: (mode: DeleteMode) => void;
  onBrowse: () => void;
  onDropFile: (file: File) => void;
  onStartScan: () => void;
}

export function HomePage({ rootPath, mode, error, scanning, onModeChange, onBrowse, onDropFile, onStartScan }: HomePageProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="min-h-0 flex-1 overflow-auto pr-1">
        <div className="space-y-6 pb-6">
          <section className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-panel">
              <Camera className="h-9 w-9" />
            </div>
            <div>
              <h1 className="type-page-title text-slate-950">RAW Pair Cleaner / 底片清理器</h1>
              <p className="type-page-subtitle mt-2 text-slate-500">智能识别 RAW 与 JPG 匹配关系，安全清理冗余文件</p>
            </div>
          </section>

          {error && (
            <WarningPanel title="操作未完成" tone="red">
              {error}
            </WarningPanel>
          )}

          <DropZone rootPath={rootPath} disabled={scanning} onBrowse={onBrowse} onDropFile={onDropFile} />
          <ModeSelector value={mode} onChange={onModeChange} />
        </div>
      </div>

      <div className="shrink-0 border-t border-[#e5dccc] bg-[#fffdf8]/95 pt-4">
        <div className="flex justify-end">
          <button
            className="type-ui inline-flex h-11 min-w-52 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            disabled={!rootPath || scanning}
            onClick={onStartScan}
          >
            <Search className="h-4 w-4" />
            {scanning ? "正在扫描" : "开始扫描"}
          </button>
        </div>
      </div>
    </div>
  );
}
