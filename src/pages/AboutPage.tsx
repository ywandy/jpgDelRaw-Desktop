import { Camera, CheckCircle2 } from "lucide-react";

import { APP_TITLE, APP_VERSION } from "../../shared/constants";

export function AboutPage() {
  const capabilities = ["JPG / RAW 文件匹配", "多余文件识别", "移动到系统回收站", "删除日志记录"];

  return (
    <div className="flex min-h-full w-full flex-col items-center justify-center space-y-6 py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-panel">
        <Camera className="h-11 w-11" />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-slate-950">{APP_TITLE}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">一个用于对比 JPG 与 RAW 文件关系的安全清理工具。</p>
        <p className="mt-2 text-sm font-semibold text-slate-700">版本：v{APP_VERSION}</p>
      </div>
      <div className="grid w-full grid-cols-2 gap-3">
        {capabilities.map((item) => (
          <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left text-sm font-medium text-slate-700 shadow-sm">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
