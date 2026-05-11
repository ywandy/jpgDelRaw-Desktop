import type { DirectoryMode } from "../../shared/types";
import { formatDirectoryMode } from "../lib/format";

export function DirectoryModeBadge({ mode }: { mode: DirectoryMode }) {
  const className =
    mode === "separate_dirs"
      ? "bg-blue-50 text-blue-700 ring-blue-200"
      : mode === "mixed_dir"
        ? "bg-green-50 text-green-700 ring-green-200"
        : "bg-orange-50 text-orange-700 ring-orange-200";

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${className}`}>
      {formatDirectoryMode(mode)}
    </span>
  );
}
