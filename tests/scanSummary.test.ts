import path from "node:path";
import { describe, expect, test } from "vitest";

import type { CompareResult, MediaFile, ScanResult } from "../shared/types";
import { buildDirectoryDistribution, countFirstLevelDirectories } from "../src/lib/scanSummary";

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

function scanResult(files: { images: MediaFile[]; raws: MediaFile[] }): ScanResult {
  return {
    rootPath: "/Photos",
    directoryMode: "mixed_dir",
    imageFiles: files.images,
    rawFiles: files.raws,
    sidecarFiles: [],
    unknownFiles: []
  };
}

function compareResult(scan: ScanResult, deleteCandidates: MediaFile[]): CompareResult {
  return {
    mode: "jpg_as_source_delete_raw",
    directoryMode: scan.directoryMode,
    imageFiles: scan.imageFiles,
    rawFiles: scan.rawFiles,
    matchedPairs: [],
    deleteCandidates,
    conflicts: [],
    totalDeleteSize: deleteCandidates.reduce((total, file) => total + file.size, 0)
  };
}

describe("scan result summary helpers", () => {
  test("counts first-level directories under the scanned root", () => {
    const scan = scanResult({
      images: [mediaFile("/Photos/澳门/jpg/A.jpg", "image"), mediaFile("/Photos/香港/jpg/B.jpg", "image")],
      raws: [mediaFile("/Photos/澳门/raw/A.ARW", "raw"), mediaFile("/Photos/回程/C.ARW", "raw")]
    });

    expect(countFirstLevelDirectories(scan)).toBe(3);
  });

  test("builds first-level directory distribution for RAW, JPG, and delete candidates", () => {
    const macauDelete = mediaFile("/Photos/澳门/raw/B.ARW", "raw");
    const hongKongDelete = mediaFile("/Photos/香港/jpg/C.jpg", "image");
    const scan = scanResult({
      images: [mediaFile("/Photos/澳门/jpg/A.jpg", "image"), hongKongDelete],
      raws: [mediaFile("/Photos/澳门/raw/A.ARW", "raw"), macauDelete]
    });
    const compare = compareResult(scan, [macauDelete, hongKongDelete]);

    expect(buildDirectoryDistribution(scan, compare)).toEqual([
      { name: "澳门", imageCount: 1, rawCount: 2, deleteCount: 1, totalCount: 3 },
      { name: "香港", imageCount: 1, rawCount: 0, deleteCount: 1, totalCount: 1 }
    ]);
  });
});
