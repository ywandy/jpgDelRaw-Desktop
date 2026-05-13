import { DownloadCloud, X } from "lucide-react";

import type { UpdateInfo, UpdateState } from "../../shared/types";
import { formatBytes } from "../lib/format";

interface UpdateDialogProps {
  open: boolean;
  info?: UpdateInfo;
  state: UpdateState;
  onCancel: () => void;
  onDownload: () => void;
  onInstall: () => void;
}

export function UpdateDialog({ open, info, state, onCancel, onDownload, onInstall }: UpdateDialogProps) {
  if (!open || !info) return null;

  const busy = state.status === "downloading" || state.status === "installing";
  const percent = state.total && state.total > 0 ? Math.min(100, Math.round(((state.downloaded ?? 0) / state.total) * 100)) : undefined;

  return (
    <div className="modal-scrim">
      <div className="modal-panel max-w-xl border-[#d4e3ec] bg-[#fbfdff]">
        <div className="flex items-center justify-between border-b border-[#d4e3ec] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[#e5f2fb] text-[#2f688b]">
              <DownloadCloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="type-section-title text-[#1f3340]">发现新版本 {info.version}</h2>
              <p className="type-caption mt-1 text-[#6f8796]">当前版本 v{info.currentVersion}</p>
            </div>
          </div>
          <button className="icon-btn text-[#7b919f] hover:bg-[#e8f2f8] hover:text-[#1f3340]" disabled={busy} onClick={onCancel} aria-label="关闭">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {info.date && <div className="type-caption text-[#6f8796]">发布时间：{formatDate(info.date)}</div>}
          <div className="type-body max-h-40 overflow-auto whitespace-pre-wrap rounded-[var(--radius-md)] border border-[#d4e3ec] bg-white p-3 text-[#385469]">
            {info.body || "此版本包含稳定性改进。建议在没有进行扫描或删除操作时安装更新。"}
          </div>

          {(state.status === "downloading" || state.status === "ready" || state.status === "installing") && (
            <div className="space-y-2">
              <div className="flex justify-between type-caption text-[#6f8796]">
                <span>{state.status === "ready" ? "更新已下载，重启后生效。" : state.status === "installing" ? "正在准备重启安装" : "正在下载更新"}</span>
                <span>{percent !== undefined ? `${percent}%` : formatBytes(state.downloaded ?? 0)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#dbeaf2]">
                <div className="h-full rounded-full bg-[#2f688b] transition-all" style={{ width: `${state.status === "ready" ? 100 : percent ?? 30}%` }} />
              </div>
            </div>
          )}

          {state.status === "error" && state.error && <div className="type-body alert-panel alert-red">{state.error}</div>}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#d4e3ec] px-5 py-4">
          <button className="btn btn-secondary border-[#c8d9e3] text-[#385469] hover:bg-[#f1f7fb]" disabled={busy} onClick={onCancel}>
            稍后
          </button>
          {state.status === "ready" ? (
            <button className="btn btn-blue" onClick={onInstall}>
              <DownloadCloud className="h-4 w-4" />
              重启后生效
            </button>
          ) : (
            <button
              className="btn btn-blue"
              disabled={busy}
              onClick={onDownload}
            >
              <DownloadCloud className="h-4 w-4" />
              {busy ? "正在下载" : "下载更新"}
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
