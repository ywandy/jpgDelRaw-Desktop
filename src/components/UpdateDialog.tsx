import { DownloadCloud, RefreshCw, X } from "lucide-react";

import { APP_VERSION } from "../../shared/constants";
import { formatBytes } from "../lib/format";
import type { UpdateInfo } from "../lib/updater";

interface UpdateDialogProps {
  open: boolean;
  info?: UpdateInfo;
  status: "available" | "downloading" | "ready" | "error";
  downloaded: number;
  contentLength?: number;
  error?: string;
  onCancel: () => void;
  onInstall: () => void;
  onRelaunch: () => void;
}

export function UpdateDialog({ open, info, status, downloaded, contentLength, error, onCancel, onInstall, onRelaunch }: UpdateDialogProps) {
  if (!open || !info) return null;

  const progressPercent = contentLength && contentLength > 0 ? Math.min(100, Math.round((downloaded / contentLength) * 100)) : undefined;
  const busy = status === "downloading";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d2823]/45 p-6 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[22px] border border-[#d4e3ec] bg-[#fbfdff] shadow-window">
        <div className="flex items-center justify-between border-b border-[#d4e3ec] px-7 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f2fb] text-[#2f688b]">
              <DownloadCloud className="h-6 w-6" />
            </div>
            <div>
              <h2 className="type-section-title text-[#1f3340]">发现新版本 {info.version}</h2>
              <p className="type-caption mt-1 text-[#6f8796]">当前版本 v{info.currentVersion || APP_VERSION}</p>
            </div>
          </div>
          <button className="rounded-xl p-2 text-[#7b919f] transition hover:bg-[#e8f2f8] hover:text-[#1f3340]" disabled={busy} onClick={onCancel} aria-label="关闭">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-7 py-6">
          {info.date && <div className="type-caption text-[#6f8796]">发布时间：{formatDate(info.date)}</div>}
          <div className="type-body max-h-44 overflow-auto whitespace-pre-wrap rounded-2xl border border-[#d4e3ec] bg-white p-4 text-[#385469]">
            {info.body || "此版本包含稳定性改进。建议在没有进行扫描或删除操作时安装更新。"}
          </div>

          {(status === "downloading" || status === "ready") && (
            <div className="space-y-2">
              <div className="flex justify-between type-caption text-[#6f8796]">
                <span>{status === "ready" ? "更新已安装，重启后生效。" : "正在下载并安装更新"}</span>
                <span>{progressPercent !== undefined ? `${progressPercent}%` : formatBytes(downloaded)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#dbeaf2]">
                <div className="h-full rounded-full bg-[#2f688b] transition-all" style={{ width: `${status === "ready" ? 100 : progressPercent ?? 30}%` }} />
              </div>
            </div>
          )}

          {status === "error" && error && <div className="type-body rounded-2xl border border-[#f0c6bd] bg-[#fff0df] p-4 text-[#9d3f44]">{error}</div>}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#d4e3ec] px-7 py-5">
          <button className="type-ui h-11 rounded-xl border border-[#c8d9e3] bg-white px-6 text-[#385469] transition hover:bg-[#f1f7fb] disabled:opacity-60" disabled={busy} onClick={onCancel}>
            稍后
          </button>
          {status === "ready" ? (
            <button className="type-ui inline-flex h-11 items-center gap-2 rounded-xl bg-[#2f688b] px-6 text-white shadow-sm transition hover:bg-[#255774]" onClick={onRelaunch}>
              <RefreshCw className="h-4 w-4" />
              立即重启
            </button>
          ) : (
            <button
              className="type-ui inline-flex h-11 items-center gap-2 rounded-xl bg-[#2f688b] px-6 text-white shadow-sm transition hover:bg-[#255774] disabled:cursor-not-allowed disabled:bg-[#9bb8c8]"
              disabled={busy}
              onClick={onInstall}
            >
              <DownloadCloud className="h-4 w-4" />
              {busy ? "正在更新" : "下载并安装"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString();
}
