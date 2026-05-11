import { FileWarning, Home, Info, ListChecks, Settings, Trash2 } from "lucide-react";

import { APP_VERSION } from "../../shared/constants";
import type { PageKey } from "../types/navigation";

interface AppSidebarProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
}

const NAV_ITEMS = [
  { key: "home", label: "首页", icon: Home },
  { key: "scanResult", label: "扫描结果", icon: ListChecks },
  { key: "pendingDelete", label: "待删除文件", icon: Trash2 },
  { key: "settings", label: "设置", icon: Settings },
  { key: "about", label: "关于", icon: Info }
] satisfies Array<{ key: PageKey; label: string; icon: typeof FileWarning }>;

export function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  return (
    <aside className="flex w-40 shrink-0 flex-col border-r border-slate-200 bg-white/72 px-3 py-5">
      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.key === currentPage;
          return (
            <button
              key={item.key}
              className={[
                "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium transition",
                active ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              ].join(" ")}
              onClick={() => onNavigate(item.key)}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="mt-auto px-3 text-xs text-slate-500">v{APP_VERSION}</div>
    </aside>
  );
}
