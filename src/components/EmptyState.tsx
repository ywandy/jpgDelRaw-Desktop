import { FolderSearch } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-strong)] bg-white text-center">
      <FolderSearch className="h-9 w-9 text-[var(--color-subtle)]" />
      <h2 className="type-section-title mt-3 text-[var(--color-heading)]">{title}</h2>
      {description && <p className="type-body mt-2 max-w-md text-[var(--color-muted)]">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
