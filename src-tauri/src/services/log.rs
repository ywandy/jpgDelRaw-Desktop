use std::{fs, path::Path};

use chrono::{DateTime, Datelike, Timelike, Utc};
use thiserror::Error;

use super::types::{DeleteResult, APP_NAME, APP_VERSION};

#[derive(Debug, Error)]
pub enum LogError {
    #[error("无法写入删除日志：{0}")]
    Io(String),
    #[error("删除日志格式无效：{0}")]
    Json(String),
}

pub fn write_delete_log(result: &DeleteResult, user_data_path: &Path) -> Result<String, LogError> {
    let logs_directory = user_data_path.join("logs");
    fs::create_dir_all(&logs_directory).map_err(|error| LogError::Io(error.to_string()))?;

    let started_at = DateTime::parse_from_rfc3339(&result.started_at)
        .map(|date| date.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now());
    let log_path = logs_directory.join(format!("delete-log-{}.json", format_log_date(started_at)));
    let payload = serde_json::json!({
        "app": APP_NAME,
        "version": APP_VERSION,
        "mode": result.mode,
        "rootPath": result.root_path,
        "startedAt": result.started_at,
        "finishedAt": result.finished_at,
        "total": result.total,
        "success": result.success,
        "failed": result.failed,
        "items": result.items,
    });
    let content = serde_json::to_string_pretty(&payload).map_err(|error| LogError::Json(error.to_string()))?;

    fs::write(&log_path, format!("{}\n", content)).map_err(|error| LogError::Io(error.to_string()))?;
    Ok(log_path.to_string_lossy().to_string())
}

fn format_log_date(date: DateTime<Utc>) -> String {
    format!(
        "{:04}-{:02}-{:02}-{:02}-{:02}-{:02}",
        date.year(),
        date.month(),
        date.day(),
        date.hour(),
        date.minute(),
        date.second()
    )
}
