import { CheckCircle2, Database, Eye, FileImage, Folder, RefreshCw, Trash2, type LucideIcon } from "lucide-react";

import type { CompareResult, ScanResult } from "../../shared/types";
import { EmptyState } from "../components/EmptyState";
import { WarningPanel } from "../components/WarningPanel";
import { formatBytes, formatDirectoryMode } from "../lib/format";
import { buildDirectoryDistribution, countFirstLevelDirectories, type DirectoryDistributionItem } from "../lib/scanSummary";

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
          <button className="type-ui h-10 rounded-lg bg-[#7ba17c] px-5 text-white hover:bg-[#6c926d]" onClick={onGoHome}>
            返回首页
          </button>
        }
      />
    );
  }

  const hasCandidates = compareResult.deleteCandidates.length > 0;
  const subfolderCount = countFirstLevelDirectories(scanResult);
  const distribution = buildDirectoryDistribution(scanResult, compareResult).slice(0, 6);
  const maxDistributionTotal = Math.max(...distribution.map((entry) => entry.totalCount + entry.deleteCount), 1);

  return (
    <div className="flex h-full min-h-0 flex-col text-[#312c27]">
      <div className="min-h-0 flex-1 overflow-auto pr-1">
        <div className="mx-auto max-w-[1320px] space-y-6 pb-6 min-[1200px]:space-y-7">
          <section className="flex flex-col items-start justify-between gap-4 min-[1200px]:flex-row min-[1200px]:gap-6">
        <div className="flex min-w-0 items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e8f1e5] text-[#7ba17c] min-[1200px]:h-20 min-[1200px]:w-20">
            <CheckCircle2 className="h-8 w-8 min-[1200px]:h-10 min-[1200px]:w-10" />
          </div>
          <div className="min-w-0">
            <h1 className="type-page-title text-[#28231f]">扫描完成</h1>
            <div className="type-page-subtitle mt-3 flex flex-wrap items-center gap-3 text-[#7d7469]">
              <span>自动识别为</span>
              <span className="type-ui rounded-full bg-[#e8f1e5] px-4 py-1.5 text-[#4f7b52]">{formatDirectoryMode(scanResult.directoryMode)}</span>
            </div>
          </div>
        </div>
        <button className="type-ui inline-flex h-12 shrink-0 items-center gap-3 rounded-2xl border border-[#e1d7c8] bg-white px-5 text-[#3f372f] shadow-sm transition hover:bg-[#fbf7ef] min-[1200px]:h-14 min-[1200px]:px-7" onClick={onRescan}>
          <RefreshCw className="h-6 w-6" />
          重新扫描
        </button>
      </section>

      <section className="grid grid-cols-2 gap-4 min-[1200px]:grid-cols-5">
        <ResultMetric label="JPG 类文件" value={compareResult.imageFiles.length} helper="个文件" tone="jpg" />
        <ResultMetric label="RAW 类文件" value={compareResult.rawFiles.length} helper="个文件" tone="raw" />
        <ResultMetric label="匹配成功" value={compareResult.matchedPairs.length} helper="对文件" tone="match" />
        <ResultMetric label="待删除" value={compareResult.deleteCandidates.length} helper="个文件" tone={hasCandidates ? "pending" : "match"} />
        <ResultMetric label="预计释放" value={formatBytes(compareResult.totalDeleteSize)} helper="可释放空间" tone="release" />
      </section>

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

      <section className="rounded-[22px] border border-[#e5dccc] bg-white p-5 shadow-[0_12px_40px_rgba(87,75,58,0.06)] min-[1200px]:p-7">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div className="type-section-title flex items-center gap-3 text-[#28231f]">
            <Folder className="h-7 w-7 text-[#6d6459]" />
            扫描目录
          </div>
          <div className="type-ui font-mono text-[#9a9185]">{subfolderCount} subfolders</div>
        </div>
        <div className="space-y-3 rounded-2xl bg-[#fbf7ef] p-5">
          <DirectoryRow label="根目录" value={scanResult.rootPath} />
          {scanResult.jpgDirectory && <DirectoryRow label="JPG 目录" value={scanResult.jpgDirectory} />}
          {scanResult.rawDirectory && <DirectoryRow label="RAW 目录" value={scanResult.rawDirectory} />}
        </div>
      </section>

      <section className="rounded-[22px] border border-[#e5dccc] bg-white p-5 shadow-[0_12px_40px_rgba(87,75,58,0.06)] min-[1200px]:p-7">
        <div className="mb-7 flex items-center justify-between gap-4">
          <h2 className="type-section-title text-[#28231f]">子目录分布</h2>
          <div className="type-caption flex items-center gap-5 text-[#6d6459]">
            <LegendDot className="bg-[#82b6d6]" label="RAW" />
            <LegendDot className="bg-[#db7e5b]" label="JPG" />
            <LegendDot className="bg-[#efb052]" label="待删" />
          </div>
        </div>
        {distribution.length === 0 ? (
          <div className="type-ui rounded-2xl border border-dashed border-[#e5dccc] bg-[#fbf7ef] py-12 text-center text-[#8b8175]">暂无可展示的子目录分布</div>
        ) : (
          <div className="space-y-5">
            {distribution.map((item) => (
              <DistributionRow key={item.name} item={item} maxTotal={maxDistributionTotal} />
            ))}
          </div>
        )}
      </section>

        </div>
      </div>

      <section className="shrink-0 border-t border-[#e5dccc] bg-[#fffdf8]/95 pt-4">
        <div className="mx-auto flex w-full max-w-[1320px] flex-wrap justify-end gap-4 min-[1200px]:gap-5">
        <button
          className="type-ui inline-flex h-12 items-center gap-3 rounded-2xl border border-[#e1d7c8] bg-white px-6 text-[#28231f] shadow-sm transition hover:bg-[#fbf7ef] disabled:cursor-not-allowed disabled:opacity-50 min-[1200px]:h-14 min-[1200px]:px-8"
          disabled={!hasCandidates}
          onClick={onViewPending}
        >
          <Eye className="h-6 w-6" />
          查看待删除文件
        </button>
        <button
          className="type-ui inline-flex h-12 items-center gap-3 rounded-2xl bg-[#c95f64] px-6 text-white shadow-sm transition hover:bg-[#b54d52] disabled:cursor-not-allowed disabled:bg-[#ddb1b3] min-[1200px]:h-14 min-[1200px]:px-8"
          disabled={!hasCandidates}
          onClick={onViewPending}
        >
          <Trash2 className="h-6 w-6" />
          执行删除
        </button>
        </div>
      </section>
    </div>
  );
}

type MetricTone = "jpg" | "raw" | "match" | "pending" | "release";

const METRIC_TONES: Record<MetricTone, { accent: string; wash: string; icon: LucideIcon }> = {
  jpg: { accent: "text-[#d87959]", wash: "bg-[#f9e8df]", icon: FileImage },
  raw: { accent: "text-[#7fb4d6]", wash: "bg-[#e6f1f8]", icon: Database },
  match: { accent: "text-[#7ba17c]", wash: "bg-[#e8f1e5]", icon: CheckCircle2 },
  pending: { accent: "text-[#edae4f]", wash: "bg-[#fff0d8]", icon: Trash2 },
  release: { accent: "text-[#c95f64]", wash: "bg-[#f7e2e3]", icon: Database }
};

function ResultMetric({ label, value, helper, tone }: { label: string; value: string | number; helper: string; tone: MetricTone }) {
  const style = METRIC_TONES[tone];
  const Icon = style.icon;

  return (
    <div className="relative overflow-hidden rounded-[18px] border border-[#e5dccc] bg-white p-4 shadow-[0_12px_40px_rgba(87,75,58,0.06)] min-[1200px]:p-5">
      <div className={`absolute -right-5 -top-5 h-16 w-16 rounded-full ${style.wash}`} />
      <div className="relative z-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="type-card-title text-[#6d6459]">{label}</div>
          <Icon className={`h-5 w-5 ${style.accent}`} />
        </div>
        <div className={`type-stat break-words tracking-tight ${style.accent}`}>{value}</div>
        <div className="type-ui mt-3 text-[#9a9185]">{helper}</div>
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${className}`} />
      {label}
    </span>
  );
}

function DistributionRow({ item, maxTotal }: { item: DirectoryDistributionItem; maxTotal: number }) {
  const barTotal = Math.max(item.rawCount + item.imageCount + item.deleteCount, 1);
  const width = Math.max((barTotal / maxTotal) * 100, 4);

  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)_54px] items-center gap-3 min-[1200px]:grid-cols-[120px_minmax(0,1fr)_64px] min-[1200px]:gap-5">
      <div className="type-ui truncate text-[#3f372f]" title={item.name}>
        {item.name}
      </div>
      <div className="h-4 rounded-full bg-[#ede6dc]">
        <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${width}%` }}>
          <BarSegment count={item.rawCount} total={barTotal} className="bg-[#82b6d6]" />
          <BarSegment count={item.imageCount} total={barTotal} className="bg-[#db7e5b]" />
          <BarSegment count={item.deleteCount} total={barTotal} className="bg-[#efb052]" />
        </div>
      </div>
      <div className="type-ui text-right font-mono text-[#9a9185]">{item.totalCount}</div>
    </div>
  );
}

function BarSegment({ count, total, className }: { count: number; total: number; className: string }) {
  if (count === 0) return null;
  return <div className={className} style={{ width: `${(count / total) * 100}%` }} />;
}

function DirectoryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="type-ui grid grid-cols-[80px_minmax(0,1fr)] items-center gap-3 rounded-xl bg-white/70 px-4 py-3 min-[1200px]:grid-cols-[90px_minmax(0,1fr)] min-[1200px]:gap-4 min-[1200px]:px-5">
      <div className="text-[#9a9185]">{label}</div>
      <div className="truncate font-mono text-[#312c27]" title={value}>
        {value}
      </div>
    </div>
  );
}
