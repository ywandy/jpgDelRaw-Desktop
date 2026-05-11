import type { FontScale, PlatformName } from "../../shared/types";
import { AppSidebar } from "./AppSidebar";
import { AppTitleBar } from "./AppTitleBar";
import type { PageKey } from "../types/navigation";

interface AppLayoutProps {
  currentPage: PageKey;
  platform: PlatformName;
  fontScale: FontScale;
  onNavigate: (page: PageKey) => void;
  children: React.ReactNode;
}

export function AppLayout({ currentPage, platform, fontScale, onNavigate, children }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen min-w-[1200px] bg-[#f4efe8]" data-font-scale={fontScale}>
      <div className="flex h-full w-full min-w-[1200px] flex-col overflow-hidden bg-[#f4efe8]">
        <AppTitleBar platform={platform} />
        <div className="flex min-h-0 flex-1 gap-4 p-4 pt-3 min-[1200px]:gap-5 min-[1200px]:p-5 min-[1200px]:pt-4">
          <AppSidebar currentPage={currentPage} onNavigate={onNavigate} />
          <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[#e5dccc] bg-[#fffdf8] p-6 shadow-[0_12px_44px_rgba(87,75,58,0.05)] min-[1200px]:p-8">
            <div className="min-h-0 flex-1">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
