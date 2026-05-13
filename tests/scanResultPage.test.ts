import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";

import type { CompareResult, MediaFile, ScanResult } from "../shared/types";
import { FileTable } from "../src/components/FileTable";
import { ScanResultPage } from "../src/pages/ScanResultPage";

function mediaFile(filePath: string, kind: MediaFile["kind"], size = 10): MediaFile {
  const segments = filePath.split("/");
  const name = segments[segments.length - 1] || filePath;
  const dotIndex = name.lastIndexOf(".");

  return {
    path: filePath,
    name,
    ext: dotIndex >= 0 ? name.slice(dotIndex).toLowerCase() : "",
    key: dotIndex >= 0 ? name.slice(0, dotIndex).toLowerCase() : name.toLowerCase(),
    kind,
    size,
    modifiedAt: 1
  };
}

describe("ScanResultPage", () => {
  test("renders pending delete files directly under the scan summary", () => {
    const image = mediaFile("/Photos/JPG/IMG_0001.JPG", "image", 20);
    const raw = mediaFile("/Photos/RAW/IMG_0001.CR3", "raw", 200);
    const scanResult: ScanResult = {
      rootPath: "/Photos",
      directoryMode: "mixed_dir",
      imageFiles: [image],
      rawFiles: [raw],
      sidecarFiles: [],
      unknownFiles: []
    };
    const compareResult: CompareResult = {
      mode: "jpg_as_source_delete_raw",
      directoryMode: scanResult.directoryMode,
      imageFiles: scanResult.imageFiles,
      rawFiles: scanResult.rawFiles,
      matchedPairs: [{ key: "img_0001", image, raw }],
      deleteCandidates: [raw],
      conflicts: [],
      totalDeleteSize: raw.size
    };
    const noop = () => undefined;

    const props: React.ComponentProps<typeof ScanResultPage> = {
      rootPath: scanResult.rootPath,
      scanResult,
      compareResult,
      selectedPaths: new Set([raw.path]),
      scanning: false,
      deleting: false,
      deleteResult: undefined,
      confirmOpen: false,
      mode: "jpg_as_source_delete_raw",
      trashCapability: { status: "available", checkedPath: raw.path },
      deleteOperation: "trash",
      checkingTrashCapability: false,
      onRescan: noop,
      onGoHome: noop,
      onToggleFile: noop,
      onToggleAll: noop,
      onSetFilesSelected: noop,
      onOpenConfirm: noop,
      onCloseConfirm: noop,
      onDeleteOperationChange: noop,
      onConfirmDelete: noop,
      onOpenFileLocation: noop,
      onDropFile: noop,
      onBrowse: noop
    };

    const markup = renderToStaticMarkup(React.createElement(ScanResultPage, props));

    expect(markup).toContain("扫描完成");
    expect(markup).toContain("拖入目录或选择目录重新扫描");
    expect(markup).toContain("选择目录");
    expect(markup).toContain("重新扫描");
    expect(markup).toContain("JPG -&gt; RAW（删除 RAW）");
    expect(markup).not.toContain("以 JPG 为准删除 RAW");
    expect(markup).toContain("JPG 类文件");
    expect(markup).toContain("IMG_0001.CR3");
    expect(markup).toContain("默认优先移动到系统回收站");
    expect(markup).toContain("打开文件位置：IMG_0001.CR3");
    expect(markup).not.toContain("展开全部");
    expect(markup).not.toContain("收起全部");
    expect(markup).not.toContain("查看待删除文件");
  });

  test("only renders open-location actions for RAW delete candidates", () => {
    const image = mediaFile("/Photos/JPG/IMG_0002.JPG", "image", 20);
    const raw = mediaFile("/Photos/RAW/IMG_0002.CR3", "raw", 200);
    const scanResult: ScanResult = {
      rootPath: "/Photos",
      directoryMode: "mixed_dir",
      imageFiles: [image],
      rawFiles: [raw],
      sidecarFiles: [],
      unknownFiles: []
    };
    const compareResult: CompareResult = {
      mode: "raw_as_source_delete_jpg",
      directoryMode: scanResult.directoryMode,
      imageFiles: scanResult.imageFiles,
      rawFiles: scanResult.rawFiles,
      matchedPairs: [{ key: "img_0002", image, raw }],
      deleteCandidates: [image],
      conflicts: [],
      totalDeleteSize: image.size
    };
    const noop = () => undefined;

    const props: React.ComponentProps<typeof ScanResultPage> = {
      rootPath: scanResult.rootPath,
      scanResult,
      compareResult,
      selectedPaths: new Set([image.path]),
      error: undefined,
      scanning: false,
      deleting: false,
      deleteResult: undefined,
      confirmOpen: false,
      mode: "raw_as_source_delete_jpg",
      trashCapability: { status: "available", checkedPath: image.path },
      deleteOperation: "trash",
      checkingTrashCapability: false,
      onRescan: noop,
      onGoHome: noop,
      onToggleFile: noop,
      onToggleAll: noop,
      onSetFilesSelected: noop,
      onOpenConfirm: noop,
      onCloseConfirm: noop,
      onDeleteOperationChange: noop,
      onConfirmDelete: noop,
      onOpenFileLocation: noop,
      onDropFile: noop,
      onBrowse: noop
    };

    const markup = renderToStaticMarkup(React.createElement(ScanResultPage, props));

    expect(markup).toContain("IMG_0002.JPG");
    expect(markup).toContain("RAW -&gt; JPG（删除 JPG）");
    expect(markup).not.toContain("以 RAW 为准删除 JPG");
    expect(markup).not.toContain("打开文件位置：IMG_0002.JPG");
  });

  test("renders simplified file items without repeated status labels", () => {
    const image = mediaFile("/Photos/JPG/IMG_0003.JPG", "image", 20);
    const raw = mediaFile("/Photos/RAW/IMG_0003.CR3", "raw", 200);
    const noop = () => undefined;

    const markup = renderToStaticMarkup(
      React.createElement(FileTable, {
        files: [raw],
        matchedPairs: [{ key: "img_0003", image, raw }],
        selectedPaths: new Set([raw.path]),
        onToggleFile: noop,
        onToggleAll: noop,
        onSetFilesSelected: noop,
        onOpenFileLocation: noop
      })
    );

    expect(markup).toContain("IMG_0003.CR3");
    expect(markup).toContain("RAW");
    expect(markup).toContain("打开文件位置：IMG_0003.CR3");
    expect(markup).not.toMatch(/>已匹配</);
    expect(markup).not.toMatch(/>待删除</);
  });
});
