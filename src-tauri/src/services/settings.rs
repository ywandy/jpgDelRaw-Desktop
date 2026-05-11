use std::{fs, path::PathBuf};

use tauri::{Manager, Runtime};
use thiserror::Error;

use super::types::AppSettings;

#[derive(Debug, Error)]
pub enum SettingsError {
    #[error("无法读取设置目录：{0}")]
    AppData(String),
    #[error("无法保存设置：{0}")]
    Io(String),
    #[error("设置格式无效：{0}")]
    Json(String),
}

pub fn get_settings<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<AppSettings, SettingsError> {
    let path = settings_path(app)?;
    let content = match fs::read_to_string(&path) {
        Ok(content) => content,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(AppSettings::default()),
        Err(_) => return Ok(AppSettings::default()),
    };

    let parsed = serde_json::from_str::<serde_json::Value>(&content).map_err(|error| SettingsError::Json(error.to_string()))?;
    Ok(merge_settings(parsed))
}

pub fn save_settings<R: Runtime>(app: &tauri::AppHandle<R>, settings: &AppSettings) -> Result<(), SettingsError> {
    let path = settings_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| SettingsError::Io(error.to_string()))?;
    }

    let content = serde_json::to_string_pretty(settings).map_err(|error| SettingsError::Json(error.to_string()))?;
    fs::write(path, format!("{}\n", content)).map_err(|error| SettingsError::Io(error.to_string()))
}

pub fn app_data_dir<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<PathBuf, SettingsError> {
    app.path().app_data_dir().map_err(|error| SettingsError::AppData(error.to_string()))
}

fn settings_path<R: Runtime>(app: &tauri::AppHandle<R>) -> Result<PathBuf, SettingsError> {
    Ok(app_data_dir(app)?.join("settings.json"))
}

fn merge_settings(value: serde_json::Value) -> AppSettings {
    let mut settings = AppSettings::default();

    if let Some(font_scale) = value.pointer("/appearance/fontScale").and_then(|value| value.as_str()) {
        settings.appearance.font_scale = match font_scale {
            "small" => super::types::FontScale::Small,
            "large" => super::types::FontScale::Large,
            _ => super::types::FontScale::Medium,
        };
    }

    if let Some(scan) = value.get("scan") {
        if let Some(recursive) = scan.get("recursive").and_then(|value| value.as_bool()) {
            settings.scan.recursive = recursive;
        }
        if let Some(include_hidden_files) = scan.get("includeHiddenFiles").and_then(|value| value.as_bool()) {
            settings.scan.include_hidden_files = include_hidden_files;
        }
        if let Some(ignore_case) = scan.get("ignoreCase").and_then(|value| value.as_bool()) {
            settings.scan.ignore_case = ignore_case;
        }
    }

    if let Some(delete) = value.get("delete") {
        if let Some(require_confirm_text) = delete.get("requireConfirmText").and_then(|value| value.as_bool()) {
            settings.delete.require_confirm_text = require_confirm_text;
        }
        if let Some(generate_log) = delete.get("generateLog").and_then(|value| value.as_bool()) {
            settings.delete.generate_log = generate_log;
        }
    }

    if let Some(sidecar) = value.get("sidecar") {
        if let Some(delete_with_raw) = sidecar.get("deleteWithRaw").and_then(|value| value.as_bool()) {
            settings.sidecar.delete_with_raw = delete_with_raw;
        }
        if let Some(extensions) = sidecar.get("extensions").and_then(|value| value.as_array()) {
            settings.sidecar.extensions = extensions.iter().filter_map(|value| value.as_str().map(str::to_string)).collect();
        }
    }

    if let Some(updates) = value.get("updates") {
        if let Some(auto_check_on_startup) = updates.get("autoCheckOnStartup").and_then(|value| value.as_bool()) {
            settings.updates.auto_check_on_startup = auto_check_on_startup;
        }
        if let Some(last_checked_at) = updates.get("lastCheckedAt").and_then(|value| value.as_str()) {
            settings.updates.last_checked_at = Some(last_checked_at.to_string());
        }
    }

    settings
}
