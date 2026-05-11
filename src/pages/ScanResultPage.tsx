import { Eye, RefreshCw, Trash2 } from "lucide-react";

import type { CompareResult, ScanResult } from "../../shared/types";
import { DirectoryModeBadge } from "../components/DirectoryModeBadge";
import { EmptyState } from "../components/EmptyState";
import { StatCard } from "../components/StatCard";
import { WarningPanel } from "../components/WarningPanel";
import { formatBytes } from "../lib/format";

interface ScanResultPageProps {
  scanResult?: ScanResult;
  compareResult?: CompareResult;
  onRescan: () => void;
  onViewPending: () => void;
  onGoHome: () => void;
}

export function ScanResultPage({ scanResult, compareResult, onRescan, onViewPending, onGoHome }: ScanResultPageProps) {
  if (!scanResult || !compareResult) {
    return (
      <EmptyState
        title="还没有扫描结果"
        description="选择照片目录并完成扫描后，结果会显示在这里。"
        action={
          <button className="h-10 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-700" onClick={onGoHome}>
            返回首页
          </button>
        }
      />
    );
  }

  const hasCandidates = compareResult.deleteCandidates.length > 0;

  return (
    <div className="space-y-6">
      <section className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600 ring-1 ring-green-200">
              ✓
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">扫描完成</h1>
              <p className="mt-1 text-sm text-slate-500">自动识别：JPG / RAW 双目录或混合目录模式</p>
            </div>
          </div>
          <DirectoryModeBadge mode={scanResult.directoryMode} />
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50" onClick={onRescan}>
          <RefreshCw className="h-4 w-4" />
          重新扫描
        </button>
      </section>

      <div className="grid grid-cols-5 gap-4">
        <StatCard label="JPG 类文件" value={compareResult.imageFiles.length} helper="个文件" tone="blue" />
        <StatCard label="RAW 类文件" value={compareResult.rawFiles.length} helper="个文件" tone="purple" />
        <StatCard label="匹配成功" value={compareResult.matchedPairs.length} helper="对文件" tone="green" />
        <StatCard label="待删除" value={compareResult.deleteCandidates.length} helper="个文件" tone={hasCandidates ? "orange" : "green"} />
        <StatCard label="预计释放" value={formatBytes(compareResult.totalDeleteSize)} helper="可释放空间" tone="purple" />
      </div>

      {compareResult.conflicts.length > 0 && (
        <WarningPanel title="检测到同名冲突文件" tone="orange">
          已跳过 {compareResult.conflicts.length} 组冲突，冲突文件不会自动加入待删除列表。
        </WarningPanel>
      )}

      {!hasCandidates && (
        <WarningPanel title="未发现需要删除的冗余文件" tone="blue">
          当前模式下没有待删除候选文件。
        </WarningPanel>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-900">扫描目录</h2>
        <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">
          <DirectoryRow label="根目录" value={scanResult.rootPath} />
          {scanResult.jpgDirectory && <DirectoryRow label="JPG 目录" value={scanResult.jpgDirectory} />}
          {scanResult.rawDirectory && <DirectoryRow label="RAW 目录" value={scanResult.rawDirectory} />}
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <button
          className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!hasCandidates}
          onClick={onViewPending}
        >
          <Eye className="h-4 w-4" />
          查看待删除文件
        </button>
        <button
          className="inline-flex h-11 items-center gap-2 rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
          disabled={!hasCandidates}
          onClick={onViewPending}
        >
          <Trash2 className="h-4 w-4" />
          执行删除
        </button>
      </div>
    </div>
  );
}

function DirectoryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-4 py-3 text-sm">
      <div className="font-medium text-slate-600">{label}</div>
      <div className="truncate text-slate-900" title={value}>
        {value}
      </div>
    </div>
  );
}
