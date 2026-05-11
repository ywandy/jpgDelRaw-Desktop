use std::{fs, path::{Path, PathBuf}, time::UNIX_EPOCH};

use thiserror::Error;
use walkdir::WalkDir;

use super::types::{
    DirectoryMode, MediaFile, MediaKind, ScanOptions, ScanResult, IMAGE_DIRECTORY_NAMES, IMAGE_EXTENSIONS, RAW_DIRECTORY_NAMES,
    RAW_EXTENSIONS, SIDECAR_EXTENSIONS,
};

#[derive(Debug, Error)]
pub enum ScanError {
    #[error("目录不存在，请重新选择。")]
    NotFound,
    #[error("无法读取该目录，请检查系统权限。")]
    PermissionDenied,
    #[error("请选择照片目录。")]
    NotDirectory,
    #[error("{0}")]
    Io(String),
}

#[derive(Default)]
struct DirectoryDetection {
    directory_mode: Option<DirectoryMode>,
    jpg_directory: Option<String>,
    raw_directory: Option<String>,
}

pub fn scan_directory(root_path: String, options: ScanOptions) -> Result<ScanResult, ScanError> {
    let root = PathBuf::from(&root_path);
    let metadata = fs::metadata(&root).map_err(map_metadata_error)?;

    if !metadata.is_dir() {
        return Err(ScanError::NotDirectory);
    }

    let root_detection = detect_root_directories(&root, &options)?;
    let file_paths = walk_directory(&root, &options)?;
    let mut media_files = Vec::with_capacity(file_paths.len());

    for file_path in file_paths {
        media_files.push(to_media_file(&file_path)?);
    }

    let image_files = filter_kind(&media_files, MediaKind::Image);
    let raw_files = filter_kind(&media_files, MediaKind::Raw);
    let sidecar_files = filter_kind(&media_files, MediaKind::Sidecar);
    let unknown_files = filter_kind(&media_files, MediaKind::Unknown);
    let detection = detect_directory_mode(&root, &image_files, &raw_files, root_detection);

    Ok(ScanResult {
        root_path,
        directory_mode: detection.directory_mode.unwrap_or(DirectoryMode::Manual),
        image_files,
        raw_files,
        sidecar_files,
        unknown_files,
        jpg_directory: detection.jpg_directory,
        raw_directory: detection.raw_directory,
    })
}

fn walk_directory(root: &Path, options: &ScanOptions) -> Result<Vec<PathBuf>, ScanError> {
    let mut results = Vec::new();

    for entry in WalkDir::new(root).min_depth(1).into_iter() {
        let entry = entry.map_err(map_walkdir_error)?;
        let depth = entry.depth();
        let file_type = entry.file_type();
        let name = entry.file_name().to_string_lossy();

        if !options.include_hidden_files && is_hidden_name(&name) {
            if file_type.is_dir() {
                // walkdir cannot skip from this point without custom iterator state; hidden files are filtered below.
            }
            continue;
        }

        if file_type.is_dir() {
            continue;
        }

        if file_type.is_file() && (options.recursive || depth == 1) {
            results.push(entry.path().to_path_buf());
        }
    }

    Ok(results)
}

fn to_media_file(file_path: &Path) -> Result<MediaFile, ScanError> {
    let metadata = fs::metadata(file_path).map_err(map_metadata_error)?;
    let modified_at = metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_secs_f64() * 1000.0)
        .unwrap_or(0.0);

    Ok(MediaFile {
        path: path_to_string(file_path),
        name: file_path.file_name().map(|name| name.to_string_lossy().to_string()).unwrap_or_default(),
        ext: normalize_extension(file_path),
        key: get_file_key(file_path),
        kind: get_media_kind(file_path),
        size: metadata.len(),
        modified_at,
    })
}

fn detect_root_directories(root: &Path, options: &ScanOptions) -> Result<DirectoryDetection, ScanError> {
    let entries = fs::read_dir(root).map_err(map_metadata_error)?;
    let mut detection = DirectoryDetection::default();

    for entry in entries {
        let entry = entry.map_err(map_metadata_error)?;
        let file_type = entry.file_type().map_err(map_metadata_error)?;
        if !file_type.is_dir() {
            continue;
        }

        let name = entry.file_name().to_string_lossy().to_string();
        if !options.include_hidden_files && is_hidden_name(&name) {
            continue;
        }

        let normalized = name.to_lowercase();
        if detection.jpg_directory.is_none() && IMAGE_DIRECTORY_NAMES.contains(&normalized.as_str()) {
            detection.jpg_directory = Some(path_to_string(&entry.path()));
        }
        if detection.raw_directory.is_none() && RAW_DIRECTORY_NAMES.contains(&normalized.as_str()) {
            detection.raw_directory = Some(path_to_string(&entry.path()));
        }
    }

    Ok(detection)
}

fn detect_directory_mode(root: &Path, image_files: &[MediaFile], raw_files: &[MediaFile], root_detection: DirectoryDetection) -> DirectoryDetection {
    let image_directory = root_detection
        .jpg_directory
        .or_else(|| find_first_matching_directory(root, image_files, IMAGE_DIRECTORY_NAMES));
    let raw_directory = root_detection
        .raw_directory
        .or_else(|| find_first_matching_directory(root, raw_files, RAW_DIRECTORY_NAMES));

    if let (Some(jpg_directory), Some(raw_directory)) = (&image_directory, &raw_directory) {
        if jpg_directory != raw_directory {
            return DirectoryDetection {
                directory_mode: Some(DirectoryMode::SeparateDirs),
                jpg_directory: image_directory,
                raw_directory: Some(raw_directory.clone()),
            };
        }
    }

    if !image_files.is_empty() && !raw_files.is_empty() {
        return DirectoryDetection {
            directory_mode: Some(DirectoryMode::MixedDir),
            jpg_directory: None,
            raw_directory: None,
        };
    }

    DirectoryDetection {
        directory_mode: Some(DirectoryMode::Manual),
        jpg_directory: None,
        raw_directory: None,
    }
}

fn find_first_matching_directory(root: &Path, files: &[MediaFile], directory_names: &[&str]) -> Option<String> {
    for file in files {
        let path = Path::new(&file.path);
        let relative = path.strip_prefix(root).ok()?;
        let mut segments = relative.components();
        let first = segments.next()?.as_os_str().to_string_lossy().to_string();
        if directory_names.contains(&first.to_lowercase().as_str()) {
            return Some(path_to_string(&root.join(first)));
        }
    }
    None
}

fn filter_kind(files: &[MediaFile], kind: MediaKind) -> Vec<MediaFile> {
    files.iter().filter(|file| file.kind == kind).cloned().collect()
}

fn normalize_extension(file_path: &Path) -> String {
    file_path
        .extension()
        .map(|ext| format!(".{}", ext.to_string_lossy()).to_lowercase())
        .unwrap_or_default()
}

fn get_file_key(file_path: &Path) -> String {
    file_path.file_stem().map(|stem| stem.to_string_lossy().to_lowercase()).unwrap_or_default()
}

fn get_media_kind(file_path: &Path) -> MediaKind {
    let ext = normalize_extension(file_path);
    if IMAGE_EXTENSIONS.contains(&ext.as_str()) {
        MediaKind::Image
    } else if RAW_EXTENSIONS.contains(&ext.as_str()) {
        MediaKind::Raw
    } else if SIDECAR_EXTENSIONS.contains(&ext.as_str()) {
        MediaKind::Sidecar
    } else {
        MediaKind::Unknown
    }
}

fn is_hidden_name(name: &str) -> bool {
    name.starts_with('.')
}

fn path_to_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

fn map_metadata_error(error: std::io::Error) -> ScanError {
    match error.kind() {
        std::io::ErrorKind::NotFound => ScanError::NotFound,
        std::io::ErrorKind::PermissionDenied => ScanError::PermissionDenied,
        _ => ScanError::Io(error.to_string()),
    }
}

fn map_walkdir_error(error: walkdir::Error) -> ScanError {
    if let Some(io_error) = error.io_error() {
        return map_metadata_error(std::io::Error::new(io_error.kind(), io_error.to_string()));
    }
    ScanError::Io(error.to_string())
}
