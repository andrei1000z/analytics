//! analytics-desktop — Tauri 2 native shell wrapping the dashboard PWA.
//!
//! Phase 6 scaffold: ships an empty plugin set so `cargo build` works on
//! Linux / macOS / Windows once the Tauri toolchain is present. Phase 6.5
//! wires `tauri-plugin-stronghold` to encrypt the per-site passphrase at
//! rest using the OS keychain — flip the commented block in `Cargo.toml`
//! and the helper below to enable it.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        // Phase 6.5: uncomment after enabling stronghold + argon2 in Cargo.toml.
        //
        // .plugin(tauri_plugin_stronghold::Builder::new(|password| {
        //     use argon2::{Argon2, PasswordHasher, password_hash::SaltString};
        //     // Stable per-installation salt would live next to this file at first run.
        //     let salt = SaltString::generate(&mut argon2::password_hash::rand_core::OsRng);
        //     let argon2 = Argon2::default();
        //     argon2
        //         .hash_password(password.as_bytes(), &salt)
        //         .expect("argon2")
        //         .hash
        //         .expect("hash bytes")
        //         .as_bytes()
        //         .to_vec()
        // }).build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
