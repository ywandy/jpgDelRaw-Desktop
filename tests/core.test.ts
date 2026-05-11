import { describe, expect, test } from "vitest";

import { APP_WINDOW_BOUNDS } from "../shared/constants";
import { getFileKey, getMediaKind } from "../shared/fileUtils";
import type { CompareConflictReason, CompareResult, DeleteMode, MediaFile, ScanResult } from "../shared/types";

function mediaFile(name: string, kind: MediaFile["kind"], size = 10): MediaFile {
  const ext = name.includes(".") ? `.${name.split(".").pop() ?? ""}`.toLowerCase() : "";

  return {
    path: `/photos/${kind}/${name}`,
    name,
    ext,
    key: getFileKey(name),
    kind,
    size,
    modifiedAt: 1
  };
}

function compareFiles(scanResult: ScanResult, mode: DeleteMode): CompareResult {
  const imageGroups = groupByKey(scanResult.imageFiles);
  const rawGroups = groupByKey(scanResult.rawFiles);
  const keys = new Set([...imageGroups.keys(), ...rawGroups.keys()]);
  const matchedPairs: CompareResult["matchedPairs"] = [];
  const conflicts: CompareResult["conflicts"] = [];
  const deleteCandidates: MediaFile[] = [];

  for (const key of keys) {
    const images = imageGroups.get(key) ?? [];
    const raws = rawGroups.get(key) ?? [];
    const conflictReason = getConflictReason(images, raws);

    if (conflictReason) {
      conflicts.push({ key, reason: conflictReason, files: [...images, ...raws] });
      continue;
    }

    const image = images[0];
    const raw = raws[0];

    if (image && raw) {
      matchedPairs.push({ key, image, raw });
      continue;
    }

    if (mode === "jpg_as_source_delete_raw" && raw && !image) {
      deleteCandidates.push(raw);
    }

    if (mode === "raw_as_source_delete_jpg" && image && !raw) {
      deleteCandidates.push(image);
    }
  }

  return {
    mode,
    directoryMode: scanResult.directoryMode,
    imageFiles: scanResult.imageFiles,
    rawFiles: scanResult.rawFiles,
    matchedPairs,
    deleteCandidates,
    conflicts,
    totalDeleteSize: deleteCandidates.reduce((total, file) => total + file.size, 0)
  };
}

function groupByKey(files: MediaFile[]): Map<string, MediaFile[]> {
  const groups = new Map<string, MediaFile[]>();

  for (const file of files) {
    const current = groups.get(file.key) ?? [];
    current.push(file);
    groups.set(file.key, current);
  }

  return groups;
}

function getConflictReason(images: MediaFile[], raws: MediaFile[]): CompareConflictReason | undefined {
  if (images.length > 1 && raws.length > 1) return "ambiguous_match";
  if (images.length > 1) return "duplicate_image";
  if (raws.length > 1) return "duplicate_raw";
  return undefined;
}

describe("shared file utilities", () => {
  test("normalizes file keys without extension and ignores case", () => {
    expect(getFileKey("/Photos/IMG_0042.CR3")).toBe("img_0042");
    expect(getFileKey("Vacation.Final.JPG")).toBe("vacation.final");
  });

  test("classifies image, raw, sidecar, and unknown extensions", () => {
    expect(getMediaKind("photo.HEIC")).toBe("image");
    expect(getMediaKind("photo.CR3")).toBe("raw");
    expect(getMediaKind("photo.XMP")).toBe("sidecar");
    expect(getMediaKind("photo.txt")).toBe("unknown");
  });
});

describe("app window bounds", () => {
  test("uses a 1200px desktop minimum width", () => {
    expect(APP_WINDOW_BOUNDS.width).toBe(1200);
    expect(APP_WINDOW_BOUNDS.minWidth).toBe(1200);
    expect(APP_WINDOW_BOUNDS.height).toBe(820);
    expect(APP_WINDOW_BOUNDS.minHeight).toBe(720);
  });
});

describe("compareFiles", () => {
  test("uses JPG as source and excludes duplicate-key conflicts from delete candidates", () => {
    const image = mediaFile("IMG_0001.jpg", "image");
    const rawMatch = mediaFile("IMG_0001.CR3", "raw", 100);
    const rawOrphan = mediaFile("IMG_0002.CR3", "raw", 200);
    const duplicateA = mediaFile("IMG_0003.CR3", "raw", 300);
    const duplicateB = mediaFile("IMG_0003.NEF", "raw", 400);

    const scanResult: ScanResult = {
      rootPath: "/photos",
      directoryMode: "mixed_dir",
      imageFiles: [image],
      rawFiles: [rawMatch, rawOrphan, duplicateA, duplicateB],
      sidecarFiles: [],
      unknownFiles: []
    };

    const result = compareFiles(scanResult, "jpg_as_source_delete_raw");

    expect(result.matchedPairs).toHaveLength(1);
    expect(result.deleteCandidates).toEqual([rawOrphan]);
    expect(result.totalDeleteSize).toBe(200);
    expect(result.conflicts).toEqual([
      {
        key: "img_0003",
        reason: "duplicate_raw",
        files: [duplicateA, duplicateB]
      }
    ]);
  });
});
