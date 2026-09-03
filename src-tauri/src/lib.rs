use tauri::Manager;

/// Copie récursive d'un dossier (utilisé pour déployer le serveur standalone
/// vers AppData, Program Files interdisant l'exécution de scripts par bun).
#[cfg(not(debug_assertions))]
fn copy_dir_recursive(src: &std::path::Path, dst: &std::path::Path) -> std::io::Result<()> {
  std::fs::create_dir_all(dst)?;
  for entry in std::fs::read_dir(src)? {
    let entry = entry?;
    let ty = entry.file_type()?;
    let dst_path = dst.join(entry.file_name());
    if ty.is_dir() {
      copy_dir_recursive(&entry.path(), &dst_path)?;
    } else {
      std::fs::copy(entry.path(), &dst_path)?;
    }
  }
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      app.handle().plugin(
        tauri_plugin_log::Builder::default()
          .level(log::LevelFilter::Info)
          .build(),
      )?;
      app.handle().plugin(tauri_plugin_shell::init())?;

      // Spawn le sidecar server (bun) avec le chemin vers Next.js
      #[cfg(not(debug_assertions))]
      {
        use tauri_plugin_shell::ShellExt;
        use tauri_plugin_shell::process::CommandEvent;
        use std::fs;
        
        let resource_dir = app.path().resource_dir().expect("Impossible de trouver les ressources");
        let app_data_dir = app.path().app_data_dir().expect("Impossible de trouver app_data_dir");
        
        // Créer le dossier pour la base de données dans AppData
        let db_dir = app_data_dir.join("db");
        if !db_dir.exists() {
            fs::create_dir_all(&db_dir).expect("Failed to create db dir in AppData");
        }
        
        let target_db_path = db_dir.join("custom.db");
        let source_db_path = resource_dir.join("db").join("custom.db");
        
        // Copier la DB initiale si elle n'existe pas encore dans AppData
        if !target_db_path.exists() && source_db_path.exists() {
            fs::copy(&source_db_path, &target_db_path).expect("Failed to copy initial database");
        }

        // Copier le serveur standalone vers AppData : bun ne peut pas exécuter
        // un script JS depuis Program Files (EPERM système sur l'entrée), alors
        // que la lecture et l'exécution depuis un dossier utilisateur fonctionnent.
        // On re-copie si le BUILD_ID du bundle change (mise à jour de l'app).
        let server_src_dir = resource_dir.join(".next").join("standalone");
        let server_dir = app_data_dir.join("server");
        let build_id_src = server_src_dir.join(".next").join("BUILD_ID");
        let build_id_dst = server_dir.join(".next").join("BUILD_ID");
        if server_src_dir.exists() {
            let needs_copy = !server_dir.exists()
                || (build_id_src.exists()
                    && fs::read_to_string(&build_id_src).unwrap_or_default()
                        != fs::read_to_string(&build_id_dst).unwrap_or_default());
            if needs_copy {
                if server_dir.exists() {
                    fs::remove_dir_all(&server_dir).expect("Failed to remove old server copy");
                }
                copy_dir_recursive(&server_src_dir, &server_dir)
                    .expect("Failed to copy server to AppData");
            }
        }
        let server_js_path = server_dir.join("server.js");

        let server_path_str = server_js_path.to_string_lossy().to_string();
        let server_dir_str = server_dir.to_string_lossy().to_string();
        
        // Préparer l'URL de base de données pour Prisma
        let db_url = format!("file:{}", target_db_path.to_string_lossy().replace("\\", "/"));
        
        let handle = app.handle().clone();
        
        tauri::async_runtime::spawn(async move {
            let (mut rx, _child) = handle
                .shell()
                .sidecar("server")
                .expect("Failed to create sidecar command")
                .arg(server_path_str)
                .current_dir(server_dir_str)
                .env("PORT", "14242")
                .env("HOSTNAME", "127.0.0.1")
                .env("NODE_ENV", "production")
                .env("DATABASE_URL", db_url)
                .spawn()
                .expect("Failed to spawn sidecar");

            while let Some(event) = rx.recv().await {
                match event {
                    CommandEvent::Stdout(line) => log::info!("server: {}", String::from_utf8_lossy(&line)),
                    CommandEvent::Stderr(line) => log::error!("server err: {}", String::from_utf8_lossy(&line)),
                    CommandEvent::Error(err) => log::error!("server crash: {}", err),
                    CommandEvent::Terminated(payload) => log::error!("server terminated: {:?}", payload),
                    _ => {}
                }
            }
        });
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
