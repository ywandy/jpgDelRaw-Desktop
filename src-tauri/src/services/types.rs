use serde::{Deserialize, Serialize};

pub type PlatformName = String;

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DeleteMode {
    JpgAsSourceDeleteRaw,
    RawAsSourceDeleteJpg,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DirectoryMode {
    Auto,
    SeparateDirs,
    MixedDir,
    Manual,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MediaKind {
    Image,
    Raw,
    Sidecar,
    Unknown,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum CompareConflictReason {
    DuplicateImage,
    DuplicateRaw,
    AmbiguousMatch,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MediaFile {
    pub path: String,
    pub name: String,
    pub ext: String,
    pub key: String,
    pub kind: MediaKind,
    pub size: u64,
    pub modified_at: f64,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct ScanOptions {
    pub recursive: bool,
    pub include_hidden_files: bool,
    pub ignore_case: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub root_path: String,
    pub directory_mode: DirectoryMode,
    pub image_files: Vec<MediaFile>,
    pub raw_files: Vec<MediaFile>,
    pub sidecar_files: Vec<MediaFile>,
    pub unknown_files: Vec<MediaFile>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub jpg_directory: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw_directory: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MatchedPair {
    pub key: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image: Option<MediaFile>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw: Option<MediaFile>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CompareConflict {
    pub key: String,
    pub reason: CompareConflictReason,
    pub files: Vec<MediaFile>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CompareResult {
    pub mode: DeleteMode,
    pub directory_mode: DirectoryMode,
    pub image_files: Vec<MediaFile>,
    pub raw_files: Vec<MediaFile>,
    pub matched_pairs: Vec<MatchedPair>,
    pub delete_candidates: Vec<MediaFile>,
    pub conflicts: Vec<CompareConflict>,
    pub total_delete_size: u64,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteContext {
    pub mode: DeleteMode,
    pub root_path: String,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DeleteStatus {
    MovedToTrash,
    Failed,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteResultItem {
    pub path: String,
    pub size: u64,
    pub status: DeleteStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteResult {
    pub started_at: String,
    pub finished_at: String,
    pub mode: DeleteMode,
    pub root_path: String,
    pub total: usize,
    pub success: usize,
    pub failed: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub log_path: Option<String>,
    pub items: Vec<DeleteResultItem>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub appearance: AppearanceSettings,
    pub scan: ScanOptions,
    pub delete: DeleteSettings,
    pub sidecar: SidecarSettings,
    pub updates: UpdateSettings,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct AppearanceSettings {
    pub font_scale: FontScale,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct DeleteSettings {
    pub require_confirm_text: bool,
    pub generate_log: bool,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SidecarSettings {
    pub delete_with_raw: bool,
    pub extensions: Vec<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct UpdateSettings {
    pub auto_check_on_startup: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_checked_at: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FontScale {
    Small,
    Medium,
    Large,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            appearance: AppearanceSettings {
                font_scale: FontScale::Medium,
            },
            scan: ScanOptions {
                recursive: true,
                include_hidden_files: false,
                ignore_case: true,
            },
            delete: DeleteSettings {
                require_confirm_text: true,
                generate_log: true,
            },
            sidecar: SidecarSettings {
                delete_with_raw: false,
                extensions: SIDECAR_EXTENSIONS.iter().map(|ext| (*ext).to_string()).collect(),
            },
            updates: UpdateSettings {
                auto_check_on_startup: true,
                last_checked_at: None,
            },
        }
    }
}

pub const APP_NAME: &str = "RAW Pair Cleaner";
pub const APP_VERSION: &str = "1.0.0";

pub const IMAGE_EXTENSIONS: &[&str] = &[
    ".jpg", ".jpeg", ".png", ".heic", ".heif", ".hif", ".tif", ".tiff", ".webp", ".avif", ".bmp",
];

pub const RAW_EXTENSIONS: &[&str] = &[
    ".crw", ".cr2", ".cr3", ".nef", ".nrw", ".arw", ".srf", ".sr2", ".arq", ".raf", ".rw2", ".raw",
    ".rwl", ".orf", ".pef", ".dng", ".3fr", ".fff", ".iiq", ".mef", ".x3f", ".dcr", ".kdc", ".mrw",
    ".erf", ".srw", ".gpr", ".mos", ".cap", ".eip", ".bay", ".r3d",
];

pub const SIDECAR_EXTENSIONS: &[&str] = &[".xmp", ".dop", ".cos", ".on1", ".pp3"];

pub const IMAGE_DIRECTORY_NAMES: &[&str] = &[
    "jpg", "jpeg", "jpegs", "image", "images", "preview", "previews", "export", "exports", "photo", "photos",
];

pub const RAW_DIRECTORY_NAMES: &[&str] = &["raw", "raws", "origin", "original", "originals", "cr3", "cr2", "nef", "arw", "raf", "dng"];
