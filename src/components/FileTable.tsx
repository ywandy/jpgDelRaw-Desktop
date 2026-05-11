import { CheckSquare, Square } from "lucide-react";

import type { MatchedPair, MediaFile } from "../../shared/types";
import { formatBytes } from "../lib/format";

interface FileTableProps {
  files: MediaFile[];
  matchedPairs: MatchedPair[];
  selectedPaths: Set<string>;
  onToggleFile: (path: string) => void;
  onToggleAll: () => void;
}

export function FileTable({ files, matchedPairs, selectedPaths, onToggleFile, onToggleAll }: FileTableProps) {
  const allSelected = files.length > 0 && files.every((file) => selectedPaths.has(file.path));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full table-fixed border-collapse text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="w-12 px-4 py-3">
              <button className="text-slate-600 hover:text-indigo-600" onClick={onToggleAll} aria-label="全选">
                {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              </button>
            </th>
            <th className="w-48 px-4 py-3">文件名</th>
            <th className="px-4 py-3">路径</th>
            <th className="w-28 px-4 py-3">大小</th>
            <th className="w-36 px-4 py-3">匹配文件</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {files.map((file) => {
            const selected = selectedPaths.has(file.path);
            return (
              <tr key={file.path} className={selected ? "bg-indigo-50/40" : "bg-white"}>
                <td className="px-4 py-3">
                  <button className="text-slate-600 hover:text-indigo-600" onClick={() => onToggleFile(file.path)} aria-label="选择文件">
                    {selected ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4" />}
                  </button>
                </td>
                <td className="truncate px-4 py-3 font-medium text-slate-900" title={file.name}>
                  {file.name}
                </td>
                <td className="truncate px-4 py-3 text-slate-500" title={file.path}>
                  {file.path}
                </td>
                <td className="px-4 py-3 text-slate-700">{formatBytes(file.size)}</td>
                <td className="truncate px-4 py-3 text-slate-500" title={getMatchedName(file, matchedPairs)}>
                  {getMatchedName(file, matchedPairs)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function getMatchedName(file: MediaFile, matchedPairs: MatchedPair[]): string {
  const pair = matchedPairs.find((item) => item.key === file.key);
  const other = file.kind === "raw" ? pair?.image : pair?.raw;
  return other?.name ?? "未匹配";
}
