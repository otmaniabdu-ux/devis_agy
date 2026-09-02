use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
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
        
        let server_dir = resource_dir.join(".next").join("standalone");
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
                .env("PORT", "3000")
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
