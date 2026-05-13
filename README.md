# RAW Pair Cleaner / 底片清理器

<p align="center">
  <img src="build/icon.png" width="112" height="112" alt="RAW Pair Cleaner 图标" />
</p>

<p align="center">
  一个用于对比 JPG 类图片与 RAW 文件配对关系，并把冗余文件安全移入系统回收站的桌面工具。
</p>

<p align="center">
  <strong>默认语言：简体中文</strong>
  ·
  <a href="README.en.md">English</a>
</p>

<p align="center">
  <img alt="Electron" src="https://img.shields.io/badge/Electron-desktop-47848F?style=flat-square&logo=electron&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=1f2937" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-required-F69220?style=flat-square&logo=pnpm&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/license-MIT-16a34a?style=flat-square" />
</p>

![应用概览](docs/assets/readme-app-overview.svg)

## 项目简介

RAW Pair Cleaner 面向有大量摄影素材的用户：你可能会保留 RAW 原片，同时导出 JPG、HEIC、TIFF、WebP 等预览或成片。本工具会扫描选中的照片目录，根据无扩展名的小写文件名 key 对比 JPG 类图片与 RAW 文件，找出在当前删除模式下没有匹配关系的冗余文件。

它的默认设计是保守和安全的：所有待删除文件都会先展示给用户，冲突文件不会自动删除，前端渲染进程不会直接访问文件系统，真正的删除动作也只会移动到系统回收站 / 废纸篓。

## 功能特性

- **两种清理模式**
  - 以 JPG 类图片为准：删除没有对应 JPG 的 RAW 文件。
  - 以 RAW 文件为准：删除没有对应 RAW 的 JPG 类图片。
- **安全复核流程**
  - 展示扫描结果、匹配对、冲突项、待删除候选和预计释放空间。
  - 删除前可取消勾选单个或批量候选文件。
- **冲突保护**
  - 重复 JPG key、重复 RAW key、歧义匹配都会被标记为冲突，并排除出自动删除候选。
- **只进系统回收站**
  - 通过 Electron 后端把文件移动到系统回收站 / 废纸篓。
  - 不使用硬删除方式移除用户照片文件。
- **操作日志**
  - 开启设置后，会在 Electron 应用数据目录下生成 JSON 删除日志。
- **桌面端体验**
  - Electron 桌面壳、React 渲染层、自定义标题栏、侧边栏导航和适合桌面窗口的布局。

## 工作流程

![清理流程](docs/assets/readme-workflow.svg)

1. 选择或拖入照片目录。
2. 选择清理模式。
3. 扫描 JPG 类图片、RAW、附属文件和未知文件。
4. 按无扩展名的小写文件名 key 分组比较。
5. 查看待删除候选与冲突项。
6. 二次确认后，将选中文件移动到系统回收站。
7. 如果开启日志，写入 JSON 操作日志。

## 安全模型

![安全模型](docs/assets/readme-safety-model.svg)

核心安全规则属于产品约束：

- 删除候选必须在删除前可见。
- 开启确认文本后，删除前必须完成二次确认。
- 冲突文件绝不自动删除。
- `.xmp`、`.dop`、`.cos`、`.on1`、`.pp3` 等附属文件会被识别，但默认不会随 RAW 删除。
- 渲染层必须通过 `src/lib/api.ts` 使用桌面能力。
- 用户照片文件必须移动到系统回收站 / 废纸篓，不能用硬删除文件系统 API 移除。

## 匹配规则

文件匹配使用标准化 key：

```txt
IMG_0001.JPG -> img_0001
IMG_0001.CR3 -> img_0001
```

如果同一个 key 下正好有一个 JPG 类文件和一个 RAW 文件，它们会被视为匹配对。如果任意一侧存在多个文件，这组文件会被标记为冲突并排除出自动清理候选。

## 支持的文件类型

JPG 类图片包含常见图片和预览格式，例如 `.jpg`、`.jpeg`、`.png`、`.heic`、`.heif`、`.hif`、`.tif`、`.tiff`、`.webp`、`.avif`、`.bmp`。

RAW 文件包含常见相机 RAW 格式，例如 `.cr2`、`.cr3`、`.nef`、`.arw`、`.raf`、`.rw2`、`.orf`、`.dng`、`.3fr`、`.iiq`、`.srw`、`.r3d` 等。

权威扩展名列表位于 [`shared/fileExtensions.ts`](shared/fileExtensions.ts)，并需要与 Node/Electron 服务侧类型保持一致。

## 技术栈

- [Electron](https://www.electronjs.org/)：桌面应用壳和原生命令。
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)：渲染层。
- [Vite](https://vite.dev/)：前端开发和构建。
- [Tailwind CSS](https://tailwindcss.com/)：界面样式。
- [Vitest](https://vitest.dev/)：TypeScript 测试。
- Node/Electron 服务：位于 `electron/services/`，负责扫描、对比、回收站、日志和设置。

## 快速开始

### 环境要求

- 与项目依赖兼容的 Node.js。
- pnpm。
- Node/Electron 以及对应操作系统的 Electron 依赖。

平台依赖可参考 Electron 官方文档：<https://www.electronjs.org/start/prerequisites/>

### 安装依赖

```bash
pnpm install
```

### 开发运行

```bash
pnpm dev
```

该命令会启动 Vite 渲染层，并打开 Electron 桌面应用。

### 构建渲染层

```bash
pnpm build
```

该命令会执行 TypeScript 检查，并将 Vite 渲染层构建到 `dist/`。

### 构建桌面安装包

```bash
pnpm dist
```

当前脚本在 macOS 上会构建 macOS DMG。

### 运行测试

```bash
pnpm test
```

运行单个测试文件：

```bash
pnpm test tests/core.test.ts
```

## 项目结构

```txt
.
├── shared/                  # 共享 TypeScript 类型、常量、扩展名和文件工具
├── src/                     # React 渲染层
│   ├── components/          # 可复用 UI 组件
│   ├── lib/api.ts           # 渲染层访问 Electron 能力的门面
│   └── pages/               # 页面级界面
├── electron/               # Electron 应用壳和 Node/Electron 后端
│   ├── main.ts              # IPC 注册和应用启动
│   ├── preload.ts           # 安全 bridge
│   └── services/            # 扫描、对比、回收站、日志、设置服务
├── tests/                   # Vitest 测试
└── RAW_PAIR_CLEANER_DEV_DOC.md
```

## 开发说明

- 修改 Electron 命令面时，需要同步 `src/lib/api.ts`、`electron/main.ts` 和 `shared/types.ts`。
- 修改扩展名时，需要同步 `shared/fileExtensions.ts` 和 Node/Electron 服务侧类型。
- `package.json` 当前没有配置 `lint` 脚本；基础验证命令是 `pnpm build` 和 `pnpm test`。
- 不要在渲染进程中引入直接文件系统访问。

## 隐私

RAW Pair Cleaner 是本地桌面工具。文件扫描、匹配、删除、设置和日志都在本地 Electron 应用内完成，核心流程不需要云同步或远程图片处理。

## 作者与仓库

- 作者：ywandy（<https://github.com/ywandy>）
- GitHub 仓库：<https://github.com/ywandy/jpgDelRaw-Desktop>
- 问题反馈：<https://github.com/ywandy/jpgDelRaw-Desktop/issues>

## 贡献指南

欢迎贡献。建议的流程：

1. 先创建 issue 或在 PR 中清楚描述要解决的问题。
2. 行为变更需要符合上面的安全模型。
3. 修改匹配逻辑、渲染层工具或后端服务时，请补充聚焦测试。
4. 提交 PR 前运行 `pnpm build` 和 `pnpm test`。

## 路线图

- 为 scanner、compare、trash、log、settings 等 Node/Electron 服务补充测试。
- 改进冲突解释和批量复核体验。
- 增加可选附属文件处理流程，但保持“默认不删除附属文件”。
- 补充更多桌面平台的发布产物。

## 许可证

本项目使用 MIT 许可证，详见 [`LICENSE`](LICENSE)。
