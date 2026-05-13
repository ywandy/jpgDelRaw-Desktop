import { ChevronDown, ChevronRight, File, FileImage, Folder, FolderOpen, MapPin, Search } from "lucide-react";
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
  onOpenFileLocation: (path: string) => void;
}

export function FileTable({ files, matchedPairs, selectedPaths, onToggleFile, onToggleAll, onSetFilesSelected, onOpenFileLocation }: FileTableProps) {
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
    <div className="panel flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--color-surface)]">
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface-tint)] px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            className="btn btn-secondary min-h-9 px-3"
            disabled={hasSearch && visiblePaths.length === 0}
            onClick={toggleToolbarSelection}
          >
            <TreeCheckbox state={toolbarSelectionState} onChange={toggleToolbarSelection} ariaLabel="全选待删除文件" />
            全选
          </button>
          <button className="btn btn-secondary min-h-9 px-3" onClick={expandAll}>
            <ChevronDown className="h-4 w-4" />
            展开全部
          </button>
          <button className="btn btn-secondary min-h-9 px-3" onClick={collapseAll}>
            <ChevronRight className="h-4 w-4" />
            收起全部
          </button>
          <label className="relative min-w-[220px] flex-1 min-[1200px]:ml-auto min-[1200px]:min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-subtle)]" />
            <input
              className="input-compact type-ui pl-9 pr-3 placeholder:text-[var(--color-subtle)]"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索文件名或路径"
            />
          </label>
        </div>
        <div className="type-caption mt-2 flex flex-wrap items-center gap-1.5 text-[var(--color-subtle)]">
          <span className="status-pill max-w-[720px] truncate" title={tree.basePath}>
            基准路径：{tree.basePath}
          </span>
          <span className="status-pill">已选 {selectedCount}/{files.length}</span>
          {hasSearch && <span className="status-pill bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]">匹配 {visiblePaths.length} 个文件</span>}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-3 py-3">
        {visibleTree.nodes.length === 0 ? (
          <div className="type-ui flex h-full min-h-40 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-white/70 text-[var(--color-muted)]">
            没有匹配的待删除文件
          </div>
        ) : (
          <div className="space-y-1.5">
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
                onOpenFileLocation={onOpenFileLocation}
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
  onOpenFileLocation: (path: string) => void;
}

function TreeNodeRow({ node, depth, selectedPaths, expandedIds, onToggleFile, onSetFilesSelected, onToggleExpanded, onOpenFileLocation }: TreeNodeRowProps) {
  if (node.type === "file") {
    return <FileRow node={node} depth={depth} selected={selectedPaths.has(node.path)} onToggleFile={onToggleFile} onOpenFileLocation={onOpenFileLocation} />;
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
        <div className="ml-4 space-y-1.5 border-l border-dashed border-[var(--color-border)] pl-4">
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
              onOpenFileLocation={onOpenFileLocation}
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
    <div className="flex items-center gap-2 rounded-[var(--radius-md)] px-1 py-1.5 text-[var(--color-text)]" style={{ paddingLeft: `${Math.min(depth, 6) * 8}px` }}>
      <TreeCheckbox state={selectionState} onChange={onToggleSelected} ariaLabel={`选择文件夹 ${node.name}`} />
      <button className="icon-btn min-h-7 min-w-7 text-[var(--color-subtle)] hover:bg-[#f1ece4] hover:text-[var(--color-text)]" onClick={() => onToggleExpanded(node.id)} aria-label={expanded ? `收起文件夹 ${node.name}` : `展开文件夹 ${node.name}`}>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {expanded ? <FolderOpen className="h-5 w-5 shrink-0 text-[#f2a84f]" /> : <Folder className="h-5 w-5 shrink-0 text-[#f2a84f]" />}
        <span className="type-ui truncate" title={node.path}>
          {node.name}
        </span>
        <span className="status-pill shrink-0">
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
  onOpenFileLocation: (path: string) => void;
}

function FileRow({ node, depth, selected, onToggleFile, onOpenFileLocation }: FileRowProps) {
  const KindIcon = node.file.kind === "image" ? FileImage : File;
  const kindLabel = node.file.kind === "image" ? "JPG" : node.file.kind === "raw" ? "RAW" : node.file.kind.toUpperCase();
  const kindClass = node.file.kind === "image" ? "bg-[#e0eff8] text-[#6ea2c5]" : "bg-[#dfeafb] text-[#5787c6]";
  const matchLabel = node.matchedFile ? "已匹配" : "未匹配";
  const canOpenFileLocation = node.file.kind === "raw";

  return (
    <div className="py-0.5" style={{ paddingLeft: `${Math.min(depth, 6) * 8}px` }}>
      <div
        className={[
          "flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 shadow-sm transition",
          selected ? "border-[var(--color-border-strong)] bg-[var(--color-surface-soft)]" : "border-[var(--color-border)] bg-white hover:border-[var(--color-border-strong)]"
        ].join(" ")}
      >
        <TreeCheckbox state={selected ? "checked" : "unchecked"} onChange={() => onToggleFile(node.path)} ariaLabel={`选择文件 ${node.name}`} />
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white text-[#78a9c9]">
          <KindIcon className="h-5 w-5" />
        </div>
        <div className="min-w-[220px] flex-1 pr-2">
          <div className="type-ui truncate text-[var(--color-text)]" title={node.path}>
            {node.name}
          </div>
          <div className="type-caption mt-0.5 truncate text-[var(--color-subtle)]" title={node.path}>
            {node.relativePath}
          </div>
        </div>
        <span className="status-pill shrink-0">{formatBytes(node.file.size)}</span>
        {canOpenFileLocation && (
          <button
            type="button"
            className="icon-btn min-h-8 min-w-8 shrink-0 border border-[var(--color-border)] bg-white text-[var(--color-muted)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary-strong)]"
            aria-label={`打开文件位置：${node.name}`}
            title="打开文件位置"
            onClick={(event) => {
              event.stopPropagation();
              onOpenFileLocation(node.path);
            }}
          >
            <MapPin className="h-4 w-4" />
          </button>
        )}
        <span className={`status-pill shrink-0 ${kindClass}`}>{kindLabel}</span>
        <span className="status-pill shrink-0 bg-[var(--color-danger-soft)] text-[var(--color-danger)]">{matchLabel}</span>
        <span className="status-pill shrink-0 bg-[#fff0d8] text-[#d3842e]">待删除</span>
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
      className="form-check shrink-0 focus:ring-[var(--color-primary-ring)]"
      checked={state === "checked"}
      onClick={(event) => event.stopPropagation()}
      onChange={onChange}
      aria-label={ariaLabel}
    />
  );
}
