import { Camera, CheckCircle2, RefreshCw } from "lucide-react";

import { APP_TITLE, APP_VERSION } from "../../shared/constants";
import type { UpdateInfo, UpdateState } from "../../shared/types";

interface AboutPageProps {
  updateInfo?: UpdateInfo;
  updateState: UpdateState;
  onCheckUpdate: () => void;
  onShowUpdate: () => void;
}

export function AboutPage({ updateInfo, updateState, onCheckUpdate, onShowUpdate }: AboutPageProps) {
  const capabilities = ["JPG / RAW 文件匹配", "多余文件识别", "移动到系统回收站", "删除日志记录"];
  const checking = updateState.status === "checking";

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center space-y-4 py-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-lg)] bg-[var(--color-primary)] text-white shadow-panel">
        <Camera className="h-8 w-8" />
      </div>
      <div>
        <h1 className="type-page-title page-title">{APP_TITLE}</h1>
        <p className="type-body mt-2 text-[var(--color-muted)]">一个用于对比 JPG 与 RAW 文件关系的安全清理工具。</p>
        <p className="type-ui mt-1 text-[var(--color-text)]">版本：v{APP_VERSION}</p>
      </div>

      <div className="panel-compact w-full text-left">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="type-card-title text-[var(--color-heading)]">应用更新</div>
            <div className="type-body mt-1 text-[var(--color-muted)]">{getUpdateMessage(updateState, updateInfo)}</div>
          </div>
          <div className="flex gap-3">
            {updateInfo && (
              <button className="btn btn-secondary border-[#b8d1e0] text-[#2f688b] hover:bg-[#f4fbff]" onClick={onShowUpdate}>
                查看更新
              </button>
            )}
            <button
              className="btn btn-blue"
              disabled={checking || updateState.status === "downloading" || updateState.status === "installing"}
              onClick={onCheckUpdate}
            >
              <RefreshCw className={`h-4 w-4 ${checking ? "animate-spin" : ""}`} />
              {checking ? "检查中" : "检查更新"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-3">
        {capabilities.map((item) => (
          <div key={item} className="type-body panel-compact flex items-center gap-3 text-left text-[var(--color-text)]">
            <CheckCircle2 className="h-5 w-5 text-[var(--color-primary)]" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function getUpdateMessage(state: UpdateState, info?: UpdateInfo): string {
  if (state.status === "checking") return "正在检查是否有新版本。";
  if (state.status === "available" && info) return `发现新版本 ${info.version}，可下载并安装。`;
  if (state.status === "downloading") return "正在下载更新，请稍候。";
  if (state.status === "ready") return "更新已下载，重启应用后生效。";
  if (state.status === "not-available") return "当前已是最新版本。";
  if (state.status === "error") return state.error || "检查更新失败，请稍后重试。";
  return "可手动检查更新；启动自动检查可在设置中调整。";
}
