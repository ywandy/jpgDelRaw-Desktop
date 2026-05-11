import { FolderSearch } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-center">
      <FolderSearch className="h-10 w-10 text-slate-400" />
      <h2 className="mt-4 text-lg font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
