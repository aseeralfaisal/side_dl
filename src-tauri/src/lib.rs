use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::{image::Image, Manager};

const ICON_PNG: &[u8] = include_bytes!("../icons/128x128.png");

struct FlaskSidecar(Mutex<Option<Child>>);

impl Drop for FlaskSidecar {
    fn drop(&mut self) {
        if let Ok(mut guard) = self.0.lock() {
            if let Some(ref mut child) = *guard {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
    }
}

fn start_flask(sidecar: &FlaskSidecar) {
    let backend_dir = std::env::current_dir()
        .ok()
        .map(|d| d.join("backend"))
        .or_else(|| {
            std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().map(|d| d.join("backend")))
        });

    let entry = backend_dir
        .as_ref()
        .map(|d| d.join("app").join("__init__.py"));

    if let Some(path) = entry {
        if path.exists() {
            let child = Command::new("python3")
                .arg(&path)
                .env("FLASK_RUN_PORT", "5000")
                .env("FLASK_RUN_HOST", "127.0.0.1")
                .spawn();
            match child {
                Ok(c) => {
                    if let Ok(mut guard) = sidecar.0.lock() {
                        *guard = Some(c);
                    }
                }
                Err(e) => eprintln!("Failed to start Flask sidecar: {e}"),
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(FlaskSidecar(Mutex::new(None)))
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(icon) = Image::from_bytes(ICON_PNG) {
                    let _ = window.set_icon(icon);
                }
            }
            let sidecar = app.state::<FlaskSidecar>();
            start_flask(&sidecar);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
