use chrono::Utc;
use tauri::Runtime;
use thiserror::Error;

use super::{log, settings, types::{DeleteContext, DeleteResult, DeleteResultItem, DeleteStatus, MediaFile}};

#[derive(Debug, Error)]
pub enum TrashError {
    #[error("无法读取设置：{0}")]
    Settings(String),
    #[error("无法写入删除日志：{0}")]
    Log(String),
}

pub fn move_files_to_trash<R: Runtime>(
    app: &tauri::AppHandle<R>,
    files: Vec<MediaFile>,
    context: DeleteContext,
) -> Result<DeleteResult, TrashError> {
    let started_at = Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    let settings = settings::get_settings(app).map_err(|error| TrashError::Settings(error.to_string()))?;
    let mut items = Vec::with_capacity(files.len());

    for file in &files {
        match trash::delete(&file.path) {
            Ok(()) => items.push(DeleteResultItem {
                path: file.path.clone(),
                size: file.size,
                status: DeleteStatus::MovedToTrash,
                error: None,
            }),
            Err(error) => items.push(DeleteResultItem {
                path: file.path.clone(),
                size: file.size,
                status: DeleteStatus::Failed,
                error: Some(error.to_string()),
            }),
        }
    }

    let finished_at = Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Millis, true);
    let success = items.iter().filter(|item| item.status == DeleteStatus::MovedToTrash).count();
    let failed = items.iter().filter(|item| item.status == DeleteStatus::Failed).count();
    let mut result = DeleteResult {
        started_at,
        finished_at,
        mode: context.mode,
        root_path: context.root_path,
        total: files.len(),
        success,
        failed,
        log_path: None,
        items,
    };

    if settings.delete.generate_log {
        let user_data_path = settings::app_data_dir(app).map_err(|error| TrashError::Settings(error.to_string()))?;
        result.log_path = Some(log::write_delete_log(&result, &user_data_path).map_err(|error| TrashError::Log(error.to_string()))?);
    }

    Ok(result)
}
