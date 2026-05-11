# RAW Pair Cleaner / 底片清理器 — Electron 桌面应用开发文档

> 这是一份可直接交给 Claude Code 使用的开发文档。  
> 目标是生成一个可运行的 Electron + React + TypeScript + TailwindCSS 桌面应用 MVP。

---

## 1. 项目概述

### 1.1 项目名称

中文名：

```txt
底片清理器
```

英文名：

```txt
RAW Pair Cleaner
```

应用标题：

```txt
RAW Pair Cleaner / 底片清理器
```

---

### 1.2 项目目标

实现一个桌面端摄影文件清理工具。

用户拖入照片目录后，应用自动扫描目录中的 JPG 类图片文件和 RAW 类照片文件，根据用户选择的删除模式，找出没有匹配关系的冗余文件，并安全移动到系统回收站。

---

### 1.3 核心原则

1. 删除必须安全。
2. 删除必须进入系统回收站，禁止硬删除。
3. 删除前必须展示扫描结果。
4. 删除前必须展示待删除文件列表。
5. 用户必须二次确认后才能删除。
6. 冲突文件不能自动删除。
7. 删除完成后必须生成 JSON 操作日志。
8. 前端渲染进程不能直接调用 Node.js 文件系统 API，必须通过 Electron IPC 调用主进程服务。

---

## 2. 技术栈

### 2.1 必选技术

```txt
Electron
React
TypeScript
Vite
TailwindCSS
Node.js
Electron IPC
```

---

### 2.2 包管理器

使用：

```bash
pnpm
```

---

### 2.3 关键 Electron 能力

文件删除必须使用：

```ts
import { shell } from "electron";

await shell.trashItem(filePath);
```

禁止使用：

```ts
fs.unlink
fs.rm
fs.rmSync
fs.unlinkSync
```

---

### 2.4 不使用的技术

首版 MVP 不使用：

```txt
Tauri
Next.js
SQLite
Prisma
RAW 解码库
图片预览库
EXIF 解析库
AI 选片能力
云同步能力
```

---

## 3. 用户核心流程

```txt
打开应用
  ↓
拖入照片目录 / 点击选择目录
  ↓
选择删除模式
  ↓
点击开始扫描
  ↓
应用自动识别目录模式
  ↓
扫描 JPG 类图片和 RAW 类文件
  ↓
生成扫描结果
  ↓
展示匹配数量、待删除数量、预计释放空间
  ↓
用户查看待删除文件列表
  ↓
用户可取消勾选部分文件
  ↓
点击执行删除
  ↓
弹出二次确认框
  ↓
用户输入「确认删除」
  ↓
移动文件到系统回收站
  ↓
生成删除日志
  ↓
展示删除结果
```

---

## 4. 功能范围

### 4.1 MVP 必须实现

```txt
1. Electron + React + TypeScript 项目初始化
2. Vite 构建
3. TailwindCSS 接入
4. 应用主窗口
5. 自定义标题栏，适配 macOS / Windows / Linux 风格
6. 左侧导航栏
7. 首页拖拽目录
8. 手动选择目录
9. 删除模式选择
10. 自动扫描目录
11. 自动识别 JPG 类图片文件
12. 自动识别 RAW 类文件
13. 自动识别目录结构
14. 文件匹配
15. 生成待删除文件列表
16. 展示扫描统计
17. 展示待删除文件表格
18. 勾选 / 取消勾选待删除文件
19. 删除前二次确认
20. 移动文件到系统回收站
21. 删除结果展示
22. JSON 删除日志
23. 设置页
24. 关于页
```

---

### 4.2 MVP 不做

```txt
1. 图片缩略图
2. RAW 文件预览
3. 图片 EXIF 展示
4. AI 自动挑图
5. Lightroom 插件
6. Capture One 插件
7. 文件一键恢复
8. 云端备份
9. 重复图片检测
10. 人脸识别
11. 模糊匹配
12. 批量重命名
```

---

## 5. 删除模式

### 5.1 以 JPG 为准删除 RAW

模式 ID：

```ts
"jpg_as_source_delete_raw"
```

含义：

如果某个 RAW 文件没有对应的 JPG 类图片文件，则认为这个 RAW 文件是冗余文件，加入待删除候选列表。

示例：

```txt
JPG:
IMG_0001.jpg
IMG_0002.jpg

RAW:
IMG_0001.CR3
IMG_0002.CR3
IMG_0003.CR3

待删除:
IMG_0003.CR3
```

---

### 5.2 以 RAW 为准删除 JPG

模式 ID：

```ts
"raw_as_source_delete_jpg"
```

含义：

如果某个 JPG 类图片文件没有对应的 RAW 文件，则认为这个 JPG 类图片文件是冗余文件，加入待删除候选列表。

示例：

```txt
RAW:
IMG_0001.CR3
IMG_0002.CR3

JPG:
IMG_0001.jpg
IMG_0002.jpg
IMG_0003.jpg

待删除:
IMG_0003.jpg
```

---

## 6. 目录模式

### 6.1 双目录模式

用户拖入的目录下存在 JPG 和 RAW 两类子目录。

示例：

```txt
旅行照片/
├── JPG/
│   ├── IMG_0001.jpg
│   ├── IMG_0002.jpg
│   └── IMG_0003.jpg
└── RAW/
    ├── IMG_0001.CR3
    ├── IMG_0002.CR3
    └── IMG_0004.CR3
```

需要识别的 JPG 类目录名：

```txt
jpg
jpeg
jpegs
image
images
preview
previews
export
exports
photo
photos
```

需要识别的 RAW 类目录名：

```txt
raw
raws
origin
original
originals
cr3
cr2
nef
arw
raf
dng
```

---

### 6.2 混合目录模式

JPG 和 RAW 混在同一个目录或同一批子目录中。

示例：

```txt
旅行照片/
├── IMG_0001.jpg
├── IMG_0001.CR3
├── IMG_0002.jpg
├── IMG_0002.CR3
├── IMG_0003.jpg
└── IMG_0004.CR3
```

---

### 6.3 手动目录模式

如果自动识别不准确，允许用户手动指定：

```txt
JPG 目录
RAW 目录
```

---

### 6.4 自动识别逻辑

应用拖入目录后，需要执行：

```txt
1. 扫描根目录一级子目录。
2. 如果发现明显 JPG 类目录和 RAW 类目录，优先判断为双目录模式。
3. 如果根目录或递归扫描中同时发现 JPG 类文件和 RAW 类文件，判断为混合目录模式。
4. 如果无法判断，显示手动选择弹窗。
```

---

## 7. 文件类型

### 7.1 JPG 类图片扩展名

注意：这里的 JPG 是产品语义，代表普通图片 / 预览图，不仅仅是 `.jpg`。

```ts
export const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".heic",
  ".heif",
  ".hif",
  ".tif",
  ".tiff",
  ".webp",
  ".avif",
  ".bmp"
];
```

---

### 7.2 RAW 类文件扩展名

```ts
export const RAW_EXTENSIONS = [
  ".crw",
  ".cr2",
  ".cr3",

  ".nef",
  ".nrw",

  ".arw",
  ".srf",
  ".sr2",
  ".arq",

  ".raf",

  ".rw2",
  ".raw",
  ".rwl",

  ".orf",

  ".pef",
  ".dng",

  ".3fr",
  ".fff",

  ".iiq",
  ".mef",

  ".x3f",

  ".dcr",
  ".kdc",

  ".mrw",

  ".erf",

  ".srw",

  ".gpr",

  ".mos",
  ".cap",
  ".eip",
  ".bay",
  ".r3d"
];
```

---

### 7.3 附属文件扩展名

首版只识别，不默认删除。

```ts
export const SIDECAR_EXTENSIONS = [
  ".xmp",
  ".dop",
  ".cos",
  ".on1",
  ".pp3"
];
```

默认行为：

```txt
不自动删除附属文件。
```

后续可以在设置中允许用户开启：

```txt
删除 RAW 时，同时删除同名 XMP / DOP 等附属文件。
```

---

## 8. 文件匹配规则

### 8.1 默认规则

去掉扩展名后，主文件名一致，即认为是一组。

大小写不敏感。

示例：

```txt
IMG_0001.jpg
IMG_0001.CR3
```

匹配 key：

```txt
img_0001
```

---

### 8.2 文件 key 生成

```ts
import path from "node:path";

export function getFileKey(filePath: string): string {
  const filename = path.basename(filePath);
  const ext = path.extname(filename);
  return filename.slice(0, filename.length - ext.length).toLowerCase();
}
```

---

### 8.3 冲突处理

如果同一个 key 下有多个 JPG 类文件或多个 RAW 文件，则认为冲突。

示例：

```txt
IMG_0001.jpg
IMG_0001.jpeg
IMG_0001.CR3
```

这种情况不能自动加入删除候选。

冲突类型：

```ts
export type CompareConflictReason =
  | "duplicate_image"
  | "duplicate_raw"
  | "ambiguous_match";
```

---

## 9. 数据结构

### 9.1 删除模式

```ts
export type DeleteMode =
  | "jpg_as_source_delete_raw"
  | "raw_as_source_delete_jpg";
```

---

### 9.2 目录模式

```ts
export type DirectoryMode =
  | "auto"
  | "separate_dirs"
  | "mixed_dir"
  | "manual";
```

---

### 9.3 文件类型

```ts
export type MediaKind =
  | "image"
  | "raw"
  | "sidecar"
  | "unknown";
```

---

### 9.4 文件对象

```ts
export interface MediaFile {
  path: string;
  name: string;
  ext: string;
  key: string;
  kind: MediaKind;
  size: number;
  modifiedAt: number;
}
```

---

### 9.5 扫描选项

```ts
export interface ScanOptions {
  recursive: boolean;
  includeHiddenFiles: boolean;
  ignoreCase: boolean;
}
```

---

### 9.6 扫描结果

```ts
export interface ScanResult {
  rootPath: string;
  directoryMode: DirectoryMode;
  imageFiles: MediaFile[];
  rawFiles: MediaFile[];
  sidecarFiles: MediaFile[];
  unknownFiles: MediaFile[];
  jpgDirectory?: string;
  rawDirectory?: string;
}
```

---

### 9.7 匹配关系

```ts
export interface MatchedPair {
  key: string;
  image?: MediaFile;
  raw?: MediaFile;
}
```

---

### 9.8 冲突对象

```ts
export interface CompareConflict {
  key: string;
  reason: "duplicate_image" | "duplicate_raw" | "ambiguous_match";
  files: MediaFile[];
}
```

---

### 9.9 对比结果

```ts
export interface CompareResult {
  mode: DeleteMode;
  directoryMode: DirectoryMode;
  imageFiles: MediaFile[];
  rawFiles: MediaFile[];
  matchedPairs: MatchedPair[];
  deleteCandidates: MediaFile[];
  conflicts: CompareConflict[];
  totalDeleteSize: number;
}
```

---

### 9.10 删除上下文

```ts
export interface DeleteContext {
  mode: DeleteMode;
  rootPath: string;
}
```

---

### 9.11 删除结果

```ts
export interface DeleteResultItem {
  path: string;
  size: number;
  status: "moved_to_trash" | "failed";
  error?: string;
}
```

```ts
export interface DeleteResult {
  startedAt: string;
  finishedAt: string;
  mode: DeleteMode;
  rootPath: string;
  total: number;
  success: number;
  failed: number;
  logPath?: string;
  items: DeleteResultItem[];
}
```

---

### 9.12 应用设置

```ts
export interface AppSettings {
  scan: {
    recursive: boolean;
    includeHiddenFiles: boolean;
    ignoreCase: boolean;
  };
  delete: {
    requireConfirmText: boolean;
    generateLog: boolean;
  };
  sidecar: {
    deleteWithRaw: boolean;
    extensions: string[];
  };
}
```

---

## 10. 项目目录结构

请生成以下项目结构：

```txt
raw-pair-cleaner/
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── index.html
├── postcss.config.js
├── tailwind.config.js
├── electron/
│   ├── main.ts
│   ├── preload.ts
│   └── services/
│       ├── scanService.ts
│       ├── compareService.ts
│       ├── trashService.ts
│       ├── logService.ts
│       └── settingsService.ts
├── shared/
│   ├── constants.ts
│   ├── fileExtensions.ts
│   ├── types.ts
│   └── fileUtils.ts
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── styles/
│   │   └── globals.css
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── ScanResultPage.tsx
│   │   ├── PendingDeletePage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── AboutPage.tsx
│   ├── components/
│   │   ├── AppLayout.tsx
│   │   ├── AppSidebar.tsx
│   │   ├── AppTitleBar.tsx
│   │   ├── DropZone.tsx
│   │   ├── ModeSelector.tsx
│   │   ├── ModeCard.tsx
│   │   ├── StatCard.tsx
│   │   ├── FileTable.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── WarningPanel.tsx
│   │   ├── DirectoryModeBadge.tsx
│   │   └── EmptyState.tsx
│   ├── lib/
│   │   ├── api.ts
│   │   ├── format.ts
│   │   └── platform.ts
│   └── types/
│       └── global.d.ts
```

---

## 11. Electron 主进程设计

### 11.1 main.ts 职责

`electron/main.ts` 需要负责：

```txt
1. 创建 BrowserWindow。
2. 配置 preload。
3. 注册 IPC handler。
4. 处理目录选择。
5. 调用 scanService。
6. 调用 compareService。
7. 调用 trashService。
8. 调用 settingsService。
```

---

### 11.2 BrowserWindow 要求

```ts
const mainWindow = new BrowserWindow({
  width: 1080,
  height: 720,
  minWidth: 900,
  minHeight: 640,
  title: "RAW Pair Cleaner / 底片清理器",
  frame: false,
  titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "hidden",
  webPreferences: {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: false
  }
});
```

说明：

- 使用自定义标题栏。
- macOS 需要保留系统感。
- Windows 和 Linux 模拟原生窗口控制区。

---

## 12. Preload 设计

### 12.1 暴露 API

`electron/preload.ts` 中通过 `contextBridge` 暴露：

```ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("rawPairCleaner", {
  selectDirectory: () => ipcRenderer.invoke("dialog:select-directory"),

  scanDirectory: (rootPath, options) =>
    ipcRenderer.invoke("files:scan-directory", rootPath, options),

  compareFiles: (scanResult, mode) =>
    ipcRenderer.invoke("files:compare", scanResult, mode),

  moveToTrash: (files, context) =>
    ipcRenderer.invoke("files:move-to-trash", files, context),

  getSettings: () =>
    ipcRenderer.invoke("settings:get"),

  saveSettings: (settings) =>
    ipcRenderer.invoke("settings:save", settings),

  windowMinimize: () =>
    ipcRenderer.invoke("window:minimize"),

  windowMaximize: () =>
    ipcRenderer.invoke("window:maximize"),

  windowClose: () =>
    ipcRenderer.invoke("window:close")
});
```

---

### 12.2 IPC channel 列表

```txt
dialog:select-directory
files:scan-directory
files:compare
files:move-to-trash
settings:get
settings:save
window:minimize
window:maximize
window:close
```

---

## 13. 服务层实现

### 13.1 scanService.ts

职责：

```txt
1. 递归扫描目录。
2. 忽略隐藏文件。
3. 识别文件扩展名。
4. 生成 MediaFile。
5. 自动判断目录模式。
```

核心函数：

```ts
export async function scanDirectory(
  rootPath: string,
  options: ScanOptions
): Promise<ScanResult>;
```

伪代码：

```ts
async function scanDirectory(rootPath, options) {
  const allFiles = await walkDirectory(rootPath, options);

  const mediaFiles = allFiles.map(toMediaFile);

  return {
    rootPath,
    directoryMode: detectDirectoryMode(rootPath, mediaFiles),
    imageFiles: mediaFiles.filter(file => file.kind === "image"),
    rawFiles: mediaFiles.filter(file => file.kind === "raw"),
    sidecarFiles: mediaFiles.filter(file => file.kind === "sidecar"),
    unknownFiles: mediaFiles.filter(file => file.kind === "unknown")
  };
}
```

---

### 13.2 compareService.ts

职责：

```txt
1. 根据 key 对 imageFiles 和 rawFiles 分组。
2. 找出匹配关系。
3. 找出待删除文件。
4. 找出冲突文件。
5. 计算预计释放空间。
```

核心函数：

```ts
export function compareFiles(
  scanResult: ScanResult,
  mode: DeleteMode
): CompareResult;
```

核心规则：

```txt
以 JPG 为准删除 RAW:
raw.key 不存在于 imageMap 中，则加入待删除。

以 RAW 为准删除 JPG:
image.key 不存在于 rawMap 中，则加入待删除。
```

注意：

```txt
如果某个 key 存在多个 image 或多个 raw，加入 conflicts，不加入 deleteCandidates。
```

---

### 13.3 trashService.ts

职责：

```txt
1. 接收用户勾选后的文件列表。
2. 逐个调用 shell.trashItem。
3. 捕获失败。
4. 返回 DeleteResult。
5. 调用 logService 写日志。
```

核心函数：

```ts
export async function moveFilesToTrash(
  files: MediaFile[],
  context: DeleteContext
): Promise<DeleteResult>;
```

必须使用：

```ts
await shell.trashItem(file.path);
```

---

### 13.4 logService.ts

职责：

```txt
1. 在 app.getPath("userData")/logs 下创建日志目录。
2. 删除完成后写入 JSON 日志。
3. 返回日志文件路径。
```

日志文件名格式：

```txt
delete-log-YYYY-MM-DD-HH-mm-ss.json
```

---

### 13.5 settingsService.ts

职责：

```txt
1. 读取应用设置。
2. 没有设置时返回默认设置。
3. 保存设置到 app.getPath("userData")/settings.json。
```

默认设置：

```ts
export const DEFAULT_SETTINGS: AppSettings = {
  scan: {
    recursive: true,
    includeHiddenFiles: false,
    ignoreCase: true
  },
  delete: {
    requireConfirmText: true,
    generateLog: true
  },
  sidecar: {
    deleteWithRaw: false,
    extensions: [".xmp", ".dop", ".cos", ".on1", ".pp3"]
  }
};
```

---

## 14. React 页面设计

### 14.1 App.tsx

职责：

```txt
1. 管理当前页面。
2. 管理选中的目录。
3. 管理删除模式。
4. 管理扫描结果。
5. 管理对比结果。
6. 管理待删除勾选状态。
```

可以不引入 React Router，MVP 使用本地 state 切换页面即可。

页面状态：

```ts
type PageKey =
  | "home"
  | "scanResult"
  | "pendingDelete"
  | "settings"
  | "about";
```

---

### 14.2 HomePage.tsx

展示内容：

```txt
1. 应用图标
2. 标题：RAW Pair Cleaner / 底片清理器
3. 副标题：智能识别 RAW 与 JPG 匹配关系，安全清理冗余文件
4. 拖拽目录区域
5. 删除模式选择
6. 选择目录按钮
7. 开始扫描按钮
```

交互：

```txt
1. 拖入目录后保存 rootPath。
2. 点击选择目录调用 window.rawPairCleaner.selectDirectory。
3. 点击开始扫描调用 scanDirectory。
4. 扫描完成后调用 compareFiles。
5. 跳转到 ScanResultPage。
```

---

### 14.3 ScanResultPage.tsx

展示内容：

```txt
1. 扫描完成状态。
2. 自动识别的目录模式。
3. JPG 类文件数量。
4. RAW 类文件数量。
5. 匹配成功数量。
6. 待删除文件数量。
7. 预计释放空间。
8. JPG / RAW 目录信息，如果有。
9. 重新扫描按钮。
10. 查看待删除文件按钮。
11. 执行删除按钮。
```

如果待删除文件数量为 0：

```txt
隐藏执行删除按钮。
显示：未发现需要删除的冗余文件。
```

---

### 14.4 PendingDeletePage.tsx

展示内容：

```txt
1. 待删除文件标题。
2. 待删除说明。
3. 文件表格。
4. 全选 / 取消全选。
5. 每行勾选框。
6. 警告提示：将移动到系统回收站。
7. 取消按钮。
8. 确认删除按钮。
```

表格字段：

```txt
选择
文件名
路径
大小
匹配的文件
```

点击确认删除后：

```txt
弹出 ConfirmDialog。
```

---

### 14.5 SettingsPage.tsx

展示设置：

```txt
扫描设置：
- 递归扫描
- 忽略大小写
- 包含隐藏文件

删除设置：
- 删除前二次确认
- 删除后生成日志

附属文件：
- 是否随 RAW 删除 XMP 等附属文件
```

MVP 可以只做展示和简单开关。

---

### 14.6 AboutPage.tsx

展示：

```txt
RAW Pair Cleaner / 底片清理器

一个用于对比 JPG 与 RAW 文件关系的安全清理工具。

版本：v1.0.0

核心能力：
- JPG / RAW 文件匹配
- 多余文件识别
- 移动到系统回收站
- 删除日志记录
```

---

## 15. UI 设计要求

### 15.1 整体风格

```txt
现代
简洁
桌面工具感
摄影工具感
安全可信
不要做成移动端
不要做成网页后台
```

---

### 15.2 应用窗口尺寸

默认窗口：

```txt
1080 x 720
```

最小窗口：

```txt
900 x 640
```

---

### 15.3 布局

主布局：

```txt
┌──────────────────────────────────────────────┐
│ TitleBar                                     │
├──────────────┬───────────────────────────────┤
│ Sidebar      │ MainContent                   │
│              │                               │
│              │                               │
└──────────────┴───────────────────────────────┘
```

Sidebar 宽度：

```txt
160px
```

主内容：

```txt
flex-1
padding: 24px
```

---

### 15.4 左侧导航

导航项：

```txt
首页
扫描结果
待删除文件
设置
关于
```

底部显示：

```txt
v1.0.0
```

---

### 15.5 系统风格

根据 `process.platform` / preload 提供的平台信息，渲染不同标题栏风格。

平台：

```txt
darwin -> macOS
win32 -> Windows
linux -> Linux
```

#### macOS 风格

```txt
左上角红黄绿窗口控制按钮
圆角窗口
柔和阴影
浅色标题栏
```

#### Windows 11 风格

```txt
右上角最小化、最大化、关闭按钮
标题栏清晰
蓝色主按钮
圆角卡片
```

#### Linux / Ubuntu 风格

```txt
深色 header bar
右上角窗口控制按钮
橙色强调危险操作
表格清晰
```

---

### 15.6 色彩

推荐使用 Tailwind 色彩：

主色：

```txt
indigo-600
violet-600
blue-600
```

成功色：

```txt
green-600
```

警告色：

```txt
orange-500
```

危险色：

```txt
red-600
```

中性色：

```txt
slate-50
slate-100
slate-200
slate-500
slate-700
slate-900
```

---

## 16. 组件设计

### 16.1 AppLayout.tsx

负责整体布局。

Props：

```ts
interface AppLayoutProps {
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  children: React.ReactNode;
}
```

---

### 16.2 AppTitleBar.tsx

负责自定义标题栏和窗口控制。

功能：

```txt
1. 显示应用标题。
2. 根据平台显示不同样式。
3. 调用 windowMinimize。
4. 调用 windowMaximize。
5. 调用 windowClose。
```

---

### 16.3 DropZone.tsx

功能：

```txt
1. 支持拖入目录。
2. 支持点击选择目录。
3. 显示当前目录路径。
4. 拖入时有高亮状态。
```

---

### 16.4 ModeSelector.tsx

功能：

```txt
1. 展示两个删除模式卡片。
2. 支持切换删除模式。
```

---

### 16.5 StatCard.tsx

展示扫描统计。

Props：

```ts
interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  tone?: "blue" | "green" | "orange" | "red" | "purple";
}
```

---

### 16.6 FileTable.tsx

展示待删除文件列表。

功能：

```txt
1. 展示文件名。
2. 展示路径。
3. 展示大小。
4. 支持勾选。
5. 支持全选。
```

---

### 16.7 ConfirmDialog.tsx

删除前二次确认。

要求：

```txt
1. 输入「确认删除」后确认按钮才可点击。
2. 展示删除数量。
3. 展示删除模式。
4. 明确说明文件将移动到系统回收站。
```

---

## 17. 格式化函数

`src/lib/format.ts` 需要实现：

```ts
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, index);

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}
```

---

## 18. 前端 API 封装

`src/lib/api.ts`：

```ts
export const api = window.rawPairCleaner;
```

`src/types/global.d.ts`：

```ts
import type {
  AppSettings,
  CompareResult,
  DeleteContext,
  DeleteMode,
  DeleteResult,
  MediaFile,
  ScanOptions,
  ScanResult
} from "../../shared/types";

declare global {
  interface Window {
    rawPairCleaner: {
      selectDirectory: () => Promise<string | null>;
      scanDirectory: (
        rootPath: string,
        options: ScanOptions
      ) => Promise<ScanResult>;
      compareFiles: (
        scanResult: ScanResult,
        mode: DeleteMode
      ) => Promise<CompareResult>;
      moveToTrash: (
        files: MediaFile[],
        context: DeleteContext
      ) => Promise<DeleteResult>;
      getSettings: () => Promise<AppSettings>;
      saveSettings: (settings: AppSettings) => Promise<void>;
      windowMinimize: () => Promise<void>;
      windowMaximize: () => Promise<void>;
      windowClose: () => Promise<void>;
    };
  }
}
```

---

## 19. 删除确认文案

弹窗标题：

```txt
确认移动到系统回收站？
```

弹窗内容：

```txt
你将移动 {count} 个文件到系统回收站。

此操作不会硬删除文件，但仍建议确认文件已备份或不再需要。
```

强确认输入提示：

```txt
请输入「确认删除」继续
```

确认输入内容必须等于：

```txt
确认删除
```

---

## 20. 删除日志格式

日志保存目录：

```txt
app.getPath("userData")/logs/
```

日志文件名：

```txt
delete-log-YYYY-MM-DD-HH-mm-ss.json
```

日志 JSON：

```json
{
  "app": "RAW Pair Cleaner",
  "version": "1.0.0",
  "mode": "jpg_as_source_delete_raw",
  "rootPath": "/Users/user/Pictures/travel",
  "startedAt": "2026-05-09T10:30:00.000Z",
  "finishedAt": "2026-05-09T10:30:03.000Z",
  "total": 4,
  "success": 4,
  "failed": 0,
  "items": [
    {
      "path": "/Users/user/Pictures/travel/raw/IMG_0044.CR3",
      "size": 50331648,
      "status": "moved_to_trash"
    }
  ]
}
```

---

## 21. 错误处理

需要处理以下错误：

### 21.1 目录不存在

提示：

```txt
目录不存在，请重新选择。
```

---

### 21.2 没有权限读取目录

提示：

```txt
无法读取该目录，请检查系统权限。
```

---

### 21.3 没有找到 JPG 或 RAW

提示：

```txt
未找到可对比的 JPG / RAW 文件。
```

---

### 21.4 删除失败

提示：

```txt
部分文件移动到回收站失败，请查看失败列表。
```

失败列表需要显示：

```txt
文件路径
失败原因
```

---

### 21.5 冲突文件

提示：

```txt
检测到同名冲突文件，已跳过自动删除。
```

---

## 22. 开发命令

生成项目后，必须支持：

```bash
pnpm install
pnpm dev
pnpm build
```

推荐 `package.json` scripts：

```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "build": "tsc && vite build",
    "start": "electron .",
    "lint": "eslint ."
  }
}
```

如果不配置 ESLint，可以移除 `lint`。

---

## 23. package.json 依赖建议

依赖：

```json
{
  "dependencies": {
    "@vitejs/plugin-react": "latest",
    "electron": "latest",
    "react": "latest",
    "react-dom": "latest",
    "lucide-react": "latest"
  },
  "devDependencies": {
    "typescript": "latest",
    "vite": "latest",
    "tailwindcss": "latest",
    "postcss": "latest",
    "autoprefixer": "latest",
    "concurrently": "latest",
    "wait-on": "latest"
  }
}
```

---

## 24. 验收标准

### 24.1 基础运行

```txt
pnpm install 成功
pnpm dev 成功启动
应用窗口正常打开
```

---

### 24.2 首页

```txt
能看到拖拽区域
能选择目录
能选择删除模式
能点击开始扫描
```

---

### 24.3 扫描

```txt
能扫描目录中的 JPG 类图片
能扫描目录中的 RAW 文件
能识别混合目录
能识别双目录
能生成扫描统计
```

---

### 24.4 对比

```txt
以 JPG 为准删除 RAW 模式正确
以 RAW 为准删除 JPG 模式正确
匹配数量正确
待删除数量正确
预计释放空间正确
冲突文件不加入待删除
```

---

### 24.5 删除

```txt
删除前展示待删除列表
用户可以取消勾选
删除前必须二次确认
输入「确认删除」后才能执行
执行删除后文件进入系统回收站
删除结果展示成功 / 失败数量
删除日志成功生成
```

---

## 25. Claude Code 执行指令

请按以下要求生成完整项目：

```txt
你是资深 Electron + React + TypeScript 桌面应用工程师。

请根据本开发文档，从零生成一个名为 raw-pair-cleaner 的 Electron 桌面应用项目。

要求：
1. 使用 Electron + React + TypeScript + Vite + TailwindCSS。
2. 使用 pnpm。
3. 按文档中的目录结构生成代码。
4. 实现完整 MVP。
5. 前端不能直接使用 Node.js fs。
6. 文件扫描、对比、删除、日志必须在 Electron 主进程或服务层完成。
7. 删除必须使用 Electron shell.trashItem。
8. 禁止使用 fs.unlink / fs.rm 删除用户文件。
9. UI 要有桌面应用质感。
10. 支持 macOS / Windows / Linux 风格标题栏。
11. 所有核心类型放在 shared/types.ts。
12. 所有文件扩展名放在 shared/fileExtensions.ts。
13. 生成后确保 pnpm install、pnpm dev 可以运行。
14. 如果遇到实现复杂点，优先保证文件扫描、匹配、删除安全链路完整。
```

---

## 26. 首版优先级

如果开发时间有限，优先实现：

```txt
P0:
- 项目能启动
- 首页选择目录
- 扫描 JPG / RAW
- 两种删除模式
- 待删除列表
- 二次确认
- shell.trashItem 删除
- 删除日志

P1:
- 自动识别双目录 / 混合目录
- 冲突检测
- 设置页
- 平台标题栏风格

P2:
- 附属文件设置
- 更细致的错误提示
- UI 动效
- 历史日志查看
```

---

## 27. 最终交付物

Claude Code 最终应该生成：

```txt
raw-pair-cleaner/
```

并支持：

```bash
cd raw-pair-cleaner
pnpm install
pnpm dev
```

运行后出现一个桌面应用窗口，可以完成：

```txt
选择目录
扫描文件
对比 JPG / RAW
查看待删除文件
确认删除
移动到系统回收站
生成日志
```
