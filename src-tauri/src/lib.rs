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
        
        // On récupère le chemin des ressources
        let resource_dir = app.path().resource_dir().expect("Impossible de trouver les ressources");
        
        let server_js_path = resource_dir
            .join(".next")
            .join("standalone")
            .join("server.js");
            
        let server_path_str = server_js_path.to_string_lossy().to_string();
        
        let handle = app.handle().clone();
        
        tauri::async_runtime::spawn(async move {
            let (mut rx, _child) = handle
                .shell()
                .sidecar("server")
                .expect("Failed to create sidecar command")
                .arg(server_path_str)
                .spawn()
                .expect("Failed to spawn sidecar");

            while let Some(event) = rx.recv().await {
                if let CommandEvent::Stdout(line) = event {
                    println!("server: {}", String::from_utf8_lossy(&line));
                }
            }
        });
      }

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
