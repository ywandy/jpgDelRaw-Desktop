import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, test } from "vitest";

import { compareFiles } from "../electron/services/compareService";
import { scanDirectory } from "../electron/services/scanService";
import { getSettings, saveSettings } from "../electron/services/settingsService";
import { moveFilesToTrash } from "../electron/services/trashService";
import { APP_WINDOW_BOUNDS, DEFAULT_SETTINGS } from "../shared/constants";
import { getFileKey, getMediaKind } from "../shared/fileUtils";
import type { DeleteContext, MediaFile, ScanResult } from "../shared/types";

async function withTempDir<T>(fn: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(path.join(os.tmpdir(), "raw-pair-cleaner-"));
  try {
    return await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function mediaFile(name: string, kind: MediaFile["kind"], size = 10): MediaFile {
  return {
    path: path.join("/photos", kind, name),
    name,
    ext: path.extname(name).toLowerCase(),
    key: getFileKey(name),
    kind,
    size,
    modifiedAt: 1
  };
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

describe("scanDirectory", () => {
  test("detects separate JPG and RAW directories and skips hidden files by default", async () => {
    await withTempDir(async (root) => {
      await mkdir(path.join(root, "JPG"));
      await mkdir(path.join(root, "RAW"));
      await writeFile(path.join(root, "JPG", "IMG_0001.JPG"), "");
      await writeFile(path.join(root, "JPG", ".hidden.jpg"), "");
      await writeFile(path.join(root, "RAW", "IMG_0001.CR3"), "raw");
      await writeFile(path.join(root, "RAW", "IMG_0002.CR3"), "rawraw");

      const result = await scanDirectory(root, {
        recursive: true,
        includeHiddenFiles: false,
        ignoreCase: true
      });

      expect(result.directoryMode).toBe("separate_dirs");
      expect(result.imageFiles.map((file) => file.name)).toEqual(["IMG_0001.JPG"]);
      expect(result.rawFiles).toHaveLength(2);
      expect(result.jpgDirectory).toBe(path.join(root, "JPG"));
      expect(result.rawDirectory).toBe(path.join(root, "RAW"));
    });
  });

  test("detects separate directory mode from root folder names before media counts", async () => {
    await withTempDir(async (root) => {
      await mkdir(path.join(root, "JPG"));
      await mkdir(path.join(root, "RAW"));
      await writeFile(path.join(root, "JPG", "IMG_0001.JPG"), "");

      const result = await scanDirectory(root, {
        recursive: true,
        includeHiddenFiles: false,
        ignoreCase: true
      });

      expect(result.directoryMode).toBe("separate_dirs");
      expect(result.imageFiles).toHaveLength(1);
      expect(result.rawFiles).toHaveLength(0);
      expect(result.jpgDirectory).toBe(path.join(root, "JPG"));
      expect(result.rawDirectory).toBe(path.join(root, "RAW"));
    });
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

describe("moveFilesToTrash", () => {
  test("moves selected files through injected trash function and writes a JSON log", async () => {
    await withTempDir(async (userDataPath) => {
      const trashed: string[] = [];
      const files = [mediaFile("IMG_0100.CR3", "raw", 512)];
      const context: DeleteContext = {
        mode: "jpg_as_source_delete_raw",
        rootPath: "/photos"
      };

      const result = await moveFilesToTrash(files, context, {
        userDataPath,
        trashItem: async (filePath) => {
          trashed.push(filePath);
        },
        generateLog: true,
        now: () => new Date("2026-05-09T10:30:00.000Z")
      });

      expect(trashed).toEqual([files[0].path]);
      expect(result.success).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.logPath).toBe(path.join(userDataPath, "logs", "delete-log-2026-05-09-10-30-00.json"));
    });
  });
});

describe("settingsService", () => {
  test("fills default appearance settings when reading an older settings file", async () => {
    await withTempDir(async (userDataPath) => {
      await writeFile(
        path.join(userDataPath, "settings.json"),
        JSON.stringify({
          scan: {
            recursive: false,
            includeHiddenFiles: true,
            ignoreCase: false
          },
          delete: {
            requireConfirmText: false,
            generateLog: false
          }
        }),
        "utf8"
      );

      const settings = await getSettings(userDataPath);

      expect(settings.appearance).toEqual({ fontScale: "medium" });
      expect(settings.scan.recursive).toBe(false);
      expect(settings.delete.generateLog).toBe(false);
    });
  });

  test("persists selected font scale when saving settings", async () => {
    await withTempDir(async (userDataPath) => {
      await saveSettings(
        {
          ...DEFAULT_SETTINGS,
          appearance: {
            fontScale: "large"
          }
        },
        userDataPath
      );

      const settings = await getSettings(userDataPath);

      expect(settings.appearance.fontScale).toBe("large");
    });
  });
});
