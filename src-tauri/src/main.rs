#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod services;

use services::{compare, scanner, settings, trash_service, types};
use tauri::{Manager, Runtime};

#[tauri::command]
async fn scan_directory(root_path: String, options: types::ScanOptions) -> Result<types::ScanResult, String> {
    scanner::scan_directory(root_path, options).map_err(|error| error.to_string())
}

#[tauri::command]
fn compare_files(scan_result: types::ScanResult, mode: types::DeleteMode) -> types::CompareResult {
    compare::compare_files(scan_result, mode)
}

#[tauri::command]
async fn move_to_trash<R: Runtime>(
    app: tauri::AppHandle<R>,
    files: Vec<types::MediaFile>,
    context: types::DeleteContext,
) -> Result<types::DeleteResult, String> {
    trash_service::move_files_to_trash(&app, files, context).map_err(|error| error.to_string())
}

#[tauri::command]
async fn get_settings<R: Runtime>(app: tauri::AppHandle<R>) -> Result<types::AppSettings, String> {
    settings::get_settings(&app).map_err(|error| error.to_string())
}

#[tauri::command]
async fn save_settings<R: Runtime>(app: tauri::AppHandle<R>, settings: types::AppSettings) -> Result<(), String> {
    settings::save_settings(&app, &settings).map_err(|error| error.to_string())
}

#[tauri::command]
fn get_platform() -> types::PlatformName {
    match std::env::consts::OS {
        "macos" => "darwin".to_string(),
        "windows" => "win32".to_string(),
        other => other.to_string(),
    }
}

#[tauri::command]
fn window_minimize<R: Runtime>(window: tauri::Window<R>) -> Result<(), String> {
    window.minimize().map_err(|error| error.to_string())
}

#[tauri::command]
fn window_maximize<R: Runtime>(window: tauri::Window<R>) -> Result<(), String> {
    if window.is_maximized().map_err(|error| error.to_string())? {
        window.unmaximize().map_err(|error| error.to_string())
    } else {
        window.maximize().map_err(|error| error.to_string())
    }
}

#[tauri::command]
fn window_close<R: Runtime>(window: tauri::Window<R>) -> Result<(), String> {
    window.close().map_err(|error| error.to_string())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            compare_files,
            move_to_trash,
            get_settings,
            save_settings,
            get_platform,
            window_minimize,
            window_maximize,
            window_close
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "macos")]
                window.set_title("RAW Pair Cleaner / 底片清理器")?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
