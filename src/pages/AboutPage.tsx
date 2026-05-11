import { Camera, CheckCircle2, RefreshCw } from "lucide-react";

import { APP_TITLE, APP_VERSION } from "../../shared/constants";
import type { UpdateInfo } from "../lib/updater";

interface AboutPageProps {
  updateInfo?: UpdateInfo;
  updateStatus?: "idle" | "checking" | "available" | "not-available" | "downloading" | "ready" | "error";
  updateError?: string;
  onCheckUpdate: () => void;
  onShowUpdate: () => void;
}

export function AboutPage({ updateInfo, updateStatus = "idle", updateError, onCheckUpdate, onShowUpdate }: AboutPageProps) {
  const capabilities = ["JPG / RAW 文件匹配", "多余文件识别", "移动到系统回收站", "删除日志记录"];
  const checking = updateStatus === "checking";

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center space-y-6 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-panel">
        <Camera className="h-11 w-11" />
      </div>
      <div>
        <h1 className="type-page-title text-slate-950">{APP_TITLE}</h1>
        <p className="type-body mt-3 text-slate-500">一个用于对比 JPG 与 RAW 文件关系的安全清理工具。</p>
        <p className="type-ui mt-2 text-slate-700">版本：v{APP_VERSION}</p>
      </div>

      <div className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="type-card-title text-slate-950">应用更新</div>
            <div className="type-body mt-1 text-slate-500">{getUpdateMessage(updateStatus, updateInfo, updateError)}</div>
          </div>
          <div className="flex gap-3">
            {updateInfo && (
              <button className="type-ui rounded-xl border border-[#b8d1e0] bg-white px-4 py-2 text-[#2f688b] transition hover:bg-[#f4fbff]" onClick={onShowUpdate}>
                查看更新
              </button>
            )}
            <button
              className="type-ui inline-flex items-center gap-2 rounded-xl bg-[#2f688b] px-4 py-2 text-white transition hover:bg-[#255774] disabled:cursor-not-allowed disabled:bg-[#9bb8c8]"
              disabled={checking || updateStatus === "downloading"}
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
          <div key={item} className="type-body flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left text-slate-700 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function getUpdateMessage(status: AboutPageProps["updateStatus"], info?: UpdateInfo, error?: string): string {
  if (status === "checking") return "正在检查是否有新版本。";
  if (status === "available" && info) return `发现新版本 ${info.version}，可下载并安装。`;
  if (status === "downloading") return "正在下载并安装更新，请稍候。";
  if (status === "ready") return "更新已安装，重启应用后生效。";
  if (status === "not-available") return "当前已是最新版本。";
  if (status === "error") return error || "检查更新失败，请稍后重试。";
  return "可手动检查更新；启动自动检查可在设置中调整。";
}
