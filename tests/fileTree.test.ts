import path from "node:path";
import { describe, expect, test } from "vitest";

import type { MatchedPair, MediaFile } from "../shared/types";
import {
  buildFileTree,
  collectFilePaths,
  collectVisibleFilePaths,
  createSelectedFileSummary,
  filterFileTree,
  getSelectionState,
  normalizePath,
  type FileTreeDirectoryNode
} from "../src/lib/fileTree";

function mediaFile(filePath: string, kind: MediaFile["kind"], size = 10): MediaFile {
  return {
    path: filePath,
    name: path.basename(filePath),
    ext: path.extname(filePath).toLowerCase(),
    key: path.basename(filePath, path.extname(filePath)).toLowerCase(),
    kind,
    size,
    modifiedAt: 1
  };
}

describe("file tree helpers", () => {
  test("normalizes Windows separators for tree grouping", () => {
    expect(normalizePath("C:\\Photos\\RAW\\IMG_0001.CR3").segments).toEqual(["C:", "Photos", "RAW", "IMG_0001.CR3"]);
  });

  test("builds a directory tree under the shared base path", () => {
    const files = [
      mediaFile("/Photos/Trip/RAW/IMG_0002.CR3", "raw", 200),
      mediaFile("/Photos/Trip/RAW/IMG_0001.CR3", "raw", 100),
      mediaFile("/Photos/Trip/JPG/IMG_0003.jpg", "image", 50)
    ];

    const tree = buildFileTree(files, []);

    expect(tree.basePath).toBe("Photos/Trip");
    expect(tree.nodes.map((node) => node.name)).toEqual(["JPG", "RAW"]);

    const rawNode = tree.nodes.find((node) => node.name === "RAW") as FileTreeDirectoryNode;
    expect(rawNode.fileCount).toBe(2);
    expect(rawNode.totalSize).toBe(300);
    expect(rawNode.children.map((node) => node.name)).toEqual(["IMG_0001.CR3", "IMG_0002.CR3"]);
  });

  test("collects descendant paths and derives indeterminate selection", () => {
    const rawFiles = [mediaFile("/Photos/Event/RAW/IMG_0001.CR3", "raw"), mediaFile("/Photos/Event/RAW/IMG_0002.CR3", "raw")];
    const files = [...rawFiles, mediaFile("/Photos/Event/JPG/IMG_0003.jpg", "image")];
    const tree = buildFileTree(files, []);
    const rawNode = tree.nodes.find((node) => node.name === "RAW") as FileTreeDirectoryNode;
    const paths = collectFilePaths(rawNode);

    expect(paths).toEqual(rawFiles.map((file) => file.path));
    expect(getSelectionState(paths, new Set())).toBe("unchecked");
    expect(getSelectionState(paths, new Set([rawFiles[0].path]))).toBe("indeterminate");
    expect(getSelectionState(paths, new Set(paths))).toBe("checked");
  });

  test("attaches matched counterpart files to delete candidates", () => {
    const raw = mediaFile("/Photos/Event/RAW/IMG_0001.CR3", "raw");
    const image = mediaFile("/Photos/Event/JPG/IMG_0001.jpg", "image");
    const matchedPairs: MatchedPair[] = [{ key: "img_0001", image, raw }];

    const tree = buildFileTree([raw, mediaFile("/Photos/Event/Other/IMG_0002.CR3", "raw")], matchedPairs);
    const rawDirectory = tree.nodes.find((node) => node.name === "RAW") as FileTreeDirectoryNode;
    const fileNode = rawDirectory.children[0];

    expect(fileNode.type).toBe("file");
    if (fileNode.type === "file") {
      expect(fileNode.matchedFile?.path).toBe(image.path);
      expect(fileNode.matchedFile?.name).toBe(image.name);
    }
  });

  test("filters the tree by file name or path while preserving ancestor folders", () => {
    const macauRaw = mediaFile("/Photos/澳门/raw/DSC05330.ARW", "raw", 37);
    const macauOther = mediaFile("/Photos/澳门/raw/DSC09999.ARW", "raw", 37);
    const hongKongRaw = mediaFile("/Photos/香港/raw/DSC05331.ARW", "raw", 37);
    const tree = buildFileTree([macauRaw, macauOther, hongKongRaw], []);

    const filtered = filterFileTree(tree, "澳门/raw/dsc05330");

    expect(collectVisibleFilePaths(filtered.nodes)).toEqual([macauRaw.path]);
    expect(filtered.nodes.map((node) => node.name)).toEqual(["澳门"]);

    const macauNode = filtered.nodes[0] as FileTreeDirectoryNode;
    expect(macauNode.children.map((node) => node.name)).toEqual(["raw"]);
    expect(collectVisibleFilePaths(filterFileTree(tree, "DSC05331").nodes)).toEqual([hongKongRaw.path]);
  });

  test("summarizes selected file count, size, and involved folders", () => {
    const macauFirst = mediaFile("/Photos/澳门/raw/DSC05330.ARW", "raw", 37);
    const macauSecond = mediaFile("/Photos/澳门/raw/DSC05331.ARW", "raw", 38);
    const hongKong = mediaFile("/Photos/香港/raw/DSC06000.ARW", "raw", 40);

    const summary = createSelectedFileSummary([macauFirst, macauSecond, hongKong], new Set([macauFirst.path, hongKong.path]));

    expect(summary).toEqual({
      count: 2,
      size: 77,
      folderCount: 2
    });
  });
});
