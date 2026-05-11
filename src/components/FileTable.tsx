import { ChevronDown, ChevronRight, File, FileImage, Folder, FolderOpen, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import type { MatchedPair, MediaFile } from "../../shared/types";
import {
  buildFileTree,
  collectFilePaths,
  collectVisibleFilePaths,
  countSelected,
  filterFileTree,
  getSelectionState,
  type FileTreeDirectoryNode,
  type FileTreeFileNode,
  type FileTreeNode,
  type SelectionState
} from "../lib/fileTree";
import { formatBytes } from "../lib/format";

interface FileTableProps {
  files: MediaFile[];
  matchedPairs: MatchedPair[];
  selectedPaths: Set<string>;
  onToggleFile: (path: string) => void;
  onToggleAll: () => void;
  onSetFilesSelected: (paths: string[], selected: boolean) => void;
}

export function FileTable({ files, matchedPairs, selectedPaths, onToggleFile, onToggleAll, onSetFilesSelected }: FileTableProps) {
  const tree = useMemo(() => buildFileTree(files, matchedPairs), [files, matchedPairs]);
  const [searchQuery, setSearchQuery] = useState("");
  const visibleTree = useMemo(() => filterFileTree(tree, searchQuery), [tree, searchQuery]);
  const visiblePaths = useMemo(() => collectVisibleFilePaths(visibleTree.nodes), [visibleTree.nodes]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(tree.allDirectoryIds));
  const allSelected = files.length > 0 && files.every((file) => selectedPaths.has(file.path));
  const selectedCount = files.filter((file) => selectedPaths.has(file.path)).length;
  const hasSearch = searchQuery.trim().length > 0;
  const selectedVisibleCount = countSelected(visiblePaths, selectedPaths);
  const allVisibleSelected = visiblePaths.length > 0 && selectedVisibleCount === visiblePaths.length;
  const toolbarSelectionState: SelectionState = hasSearch
    ? allVisibleSelected
      ? "checked"
      : selectedVisibleCount > 0
        ? "indeterminate"
        : "unchecked"
    : allSelected
      ? "checked"
      : selectedCount > 0
        ? "indeterminate"
        : "unchecked";
  const visibleDirectoryIdsKey = visibleTree.allDirectoryIds.join("\u0000");

  useEffect(() => {
    setExpandedIds(new Set(tree.allDirectoryIds));
  }, [tree]);

  useEffect(() => {
    if (hasSearch) {
      setExpandedIds(new Set(visibleTree.allDirectoryIds));
    }
  }, [hasSearch, visibleDirectoryIdsKey, visibleTree.allDirectoryIds]);

  function toggleExpanded(directoryId: string): void {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(directoryId)) {
        next.delete(directoryId);
      } else {
        next.add(directoryId);
      }
      return next;
    });
  }

  function expandAll(): void {
    setExpandedIds(new Set(hasSearch ? visibleTree.allDirectoryIds : tree.allDirectoryIds));
  }

  function collapseAll(): void {
    setExpandedIds(new Set());
  }

  function toggleToolbarSelection(): void {
    if (hasSearch) {
      onSetFilesSelected(visiblePaths, !allVisibleSelected);
      return;
    }

    onToggleAll();
  }

  return (
    <div className="overflow-hidden rounded-[18px] border border-[#e5dccc] bg-[#fffdf8] shadow-[0_18px_50px_rgba(87,75,58,0.08)]">
      <div className="border-b border-[#eadfce] bg-[#fffaf2] px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="type-ui inline-flex h-10 items-center gap-2 rounded-xl border border-[#e1d7c8] bg-white px-4 text-[#3f372f] shadow-sm transition hover:border-[#7ea17f] hover:text-[#315b35] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={hasSearch && visiblePaths.length === 0}
            onClick={toggleToolbarSelection}
          >
            <TreeCheckbox state={toolbarSelectionState} onChange={toggleToolbarSelection} ariaLabel="全选待删除文件" />
            全选
          </button>
          <button className="type-ui inline-flex h-10 items-center gap-2 rounded-xl border border-[#e1d7c8] bg-white px-4 text-[#6d6459] shadow-sm transition hover:border-[#7ea17f] hover:text-[#315b35]" onClick={expandAll}>
            <ChevronDown className="h-4 w-4" />
            展开全部
          </button>
          <button className="type-ui inline-flex h-10 items-center gap-2 rounded-xl border border-[#e1d7c8] bg-white px-4 text-[#6d6459] shadow-sm transition hover:border-[#7ea17f] hover:text-[#315b35]" onClick={collapseAll}>
            <ChevronRight className="h-4 w-4" />
            收起全部
          </button>
          <label className="relative min-w-[220px] flex-1 min-[1200px]:ml-auto min-[1200px]:min-w-[260px]">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a59b8e]" />
            <input
              className="type-ui h-10 w-full rounded-xl border border-[#e1d7c8] bg-white pl-10 pr-4 text-[#3f372f] outline-none transition placeholder:text-[#a59b8e] focus:border-[#7fa383] focus:ring-4 focus:ring-[#dfeade]"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索文件名或路径"
            />
          </label>
        </div>
        <div className="type-caption mt-3 flex flex-wrap items-center gap-2 text-[#8b8175]">
          <span className="rounded-full bg-[#f1ece4] px-2.5 py-1">基准路径：{tree.basePath}</span>
          <span className="rounded-full bg-[#f1ece4] px-2.5 py-1">已选 {selectedCount}/{files.length}</span>
          {hasSearch && <span className="rounded-full bg-[#e7f0e4] px-2.5 py-1 text-[#4b744e]">匹配 {visiblePaths.length} 个文件</span>}
        </div>
      </div>

      <div className="min-h-[440px] px-5 py-4">
        {visibleTree.nodes.length === 0 ? (
          <div className="type-ui flex h-52 items-center justify-center rounded-2xl border border-dashed border-[#e5dccc] bg-white/70 text-[#8b8175]">
            没有匹配的待删除文件
          </div>
        ) : (
          <div className="space-y-2">
            {visibleTree.nodes.map((node) => (
              <TreeNodeRow
                key={node.id}
                node={node}
                depth={0}
                selectedPaths={selectedPaths}
                expandedIds={expandedIds}
                onToggleFile={onToggleFile}
                onSetFilesSelected={onSetFilesSelected}
                onToggleExpanded={toggleExpanded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TreeNodeRowProps {
  node: FileTreeNode;
  depth: number;
  selectedPaths: Set<string>;
  expandedIds: Set<string>;
  onToggleFile: (path: string) => void;
  onSetFilesSelected: (paths: string[], selected: boolean) => void;
  onToggleExpanded: (directoryId: string) => void;
}

function TreeNodeRow({ node, depth, selectedPaths, expandedIds, onToggleFile, onSetFilesSelected, onToggleExpanded }: TreeNodeRowProps) {
  if (node.type === "file") {
    return <FileRow node={node} depth={depth} selected={selectedPaths.has(node.path)} onToggleFile={onToggleFile} />;
  }

  const expanded = expandedIds.has(node.id);
  const descendantPaths = collectFilePaths(node);
  const selectionState = getSelectionState(descendantPaths, selectedPaths);
  const selectedCount = countSelected(descendantPaths, selectedPaths);

  return (
    <div className="relative">
      <DirectoryRow
        node={node}
        depth={depth}
        expanded={expanded}
        selectionState={selectionState}
        selectedCount={selectedCount}
        onToggleExpanded={onToggleExpanded}
        onToggleSelected={() => onSetFilesSelected(descendantPaths, selectionState !== "checked")}
      />
      {expanded && (
        <div className="ml-5 space-y-2 border-l border-dashed border-[#e5d8c6] pl-5">
          {node.children.map((child) => (
            <TreeNodeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedPaths={selectedPaths}
              expandedIds={expandedIds}
              onToggleFile={onToggleFile}
              onSetFilesSelected={onSetFilesSelected}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface DirectoryRowProps {
  node: FileTreeDirectoryNode;
  depth: number;
  expanded: boolean;
  selectionState: SelectionState;
  selectedCount: number;
  onToggleExpanded: (directoryId: string) => void;
  onToggleSelected: () => void;
}

function DirectoryRow({ node, depth, expanded, selectionState, selectedCount, onToggleExpanded, onToggleSelected }: DirectoryRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl px-1 py-2 text-[#312c27]" style={{ paddingLeft: `${Math.min(depth, 6) * 10}px` }}>
      <TreeCheckbox state={selectionState} onChange={onToggleSelected} ariaLabel={`选择文件夹 ${node.name}`} />
      <button className="rounded-lg p-1 text-[#9a9185] transition hover:bg-[#f1ece4] hover:text-[#3f372f]" onClick={() => onToggleExpanded(node.id)} aria-label={expanded ? `收起文件夹 ${node.name}` : `展开文件夹 ${node.name}`}>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {expanded ? <FolderOpen className="h-5 w-5 shrink-0 text-[#f2a84f]" /> : <Folder className="h-5 w-5 shrink-0 text-[#f2a84f]" />}
        <span className="type-ui truncate" title={node.path}>
          {node.name}
        </span>
        <span className="type-caption shrink-0 rounded-full bg-[#f1ece4] px-2.5 py-1 text-[#8b8175]">
          {selectedCount}/{node.fileCount} 项 · {formatBytes(node.totalSize)}
        </span>
      </div>
    </div>
  );
}

interface FileRowProps {
  node: FileTreeFileNode;
  depth: number;
  selected: boolean;
  onToggleFile: (path: string) => void;
}

function FileRow({ node, depth, selected, onToggleFile }: FileRowProps) {
  const KindIcon = node.file.kind === "image" ? FileImage : File;
  const kindLabel = node.file.kind === "image" ? "JPG" : node.file.kind === "raw" ? "RAW" : node.file.kind.toUpperCase();
  const kindClass = node.file.kind === "image" ? "bg-[#e0eff8] text-[#6ea2c5]" : "bg-[#dfeafb] text-[#5787c6]";
  const matchLabel = node.matchedFile ? "已匹配" : "未匹配";

  return (
    <div className="py-1.5" style={{ paddingLeft: `${Math.min(depth, 6) * 10}px` }}>
      <div
        className={[
          "flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm transition",
          selected ? "border-[#d9ccb8] bg-[#fbf7ef]" : "border-[#eadfce] bg-white hover:border-[#d9ccb8]"
        ].join(" ")}
      >
        <TreeCheckbox state={selected ? "checked" : "unchecked"} onChange={() => onToggleFile(node.path)} ariaLabel={`选择文件 ${node.name}`} />
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#eadfce] bg-white text-[#78a9c9]">
          <KindIcon className="h-6 w-6" />
        </div>
        <div className="min-w-[220px] flex-1 pr-2">
          <div className="type-ui truncate text-[#312c27]" title={node.path}>
            {node.name}
          </div>
          <div className="type-caption mt-1 truncate text-[#9a9185]" title={node.path}>
            {node.relativePath}
          </div>
        </div>
        <span className="type-caption shrink-0 rounded-full bg-[#f1ece4] px-3 py-1 text-[#6d6459]">{formatBytes(node.file.size)}</span>
        <span className={`type-caption shrink-0 rounded-full px-3 py-1 ${kindClass}`}>{kindLabel}</span>
        <span className="type-caption shrink-0 rounded-full bg-[#f7dddd] px-3 py-1 text-[#c95f64]">{matchLabel}</span>
        <span className="type-caption shrink-0 rounded-full bg-[#fff0d8] px-3 py-1 text-[#d3842e]">待删除</span>
      </div>
    </div>
  );
}

interface TreeCheckboxProps {
  state: SelectionState;
  onChange: () => void;
  ariaLabel: string;
}

function TreeCheckbox({ state, onChange, ariaLabel }: TreeCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = state === "indeterminate";
    }
  }, [state]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="h-5 w-5 shrink-0 rounded-md border-[#d9ccb8] text-[#7fabcc] focus:ring-[#d8e8f1]"
      checked={state === "checked"}
      onClick={(event) => event.stopPropagation()}
      onChange={onChange}
      aria-label={ariaLabel}
    />
  );
}
