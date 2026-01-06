// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let app_handle = app.handle().clone();
            
            // Register global shortcuts that work even when app is not focused
            #[cfg(desktop)]
            {
                // Cmd/Ctrl + K - Focus search (standard shortcut)
                app_handle.global_shortcut().register("CommandOrControl+K", move |_app, _shortcut, _event| {
                    if let Some(window) = _app.get_webview_window("main") {
                        let _ = window.eval("window.dispatchEvent(new CustomEvent('tauri-shortcut-search'));");
                    }
                }).expect("Failed to register CommandOrControl+K shortcut");

                // Cmd/Ctrl + F - Focus search (alternative)
                app_handle.global_shortcut().register("CommandOrControl+F", move |_app, _shortcut, _event| {
                    if let Some(window) = _app.get_webview_window("main") {
                        let _ = window.eval("window.dispatchEvent(new CustomEvent('tauri-shortcut-search'));");
                    }
                }).expect("Failed to register CommandOrControl+F shortcut");
            }
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

