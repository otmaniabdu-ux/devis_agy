import { $ } from "bun";
import { copyFile, mkdir, readdir, readFile, rm, cp, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "path";

console.log("🚀 Démarrage de la préparation du build Tauri...");

// 1. Build Next.js
console.log("📦 Build de Next.js...");
await $`bun run build`;

// 2. Préparation du dossier standalone
console.log("📁 Préparation des assets statiques pour le standalone...");
const standaloneDir = join(import.meta.dir, "../.next/standalone");
const standaloneStaticDir = join(standaloneDir, ".next/static");
const standalonePublicDir = join(standaloneDir, "public");

await mkdir(standaloneStaticDir, { recursive: true });
await mkdir(standalonePublicDir, { recursive: true });

// Copie des assets statiques et configurations dans standalone
await $`xcopy /E /I /Y .next\\static .next\\standalone\\.next\\static`;
await $`xcopy /E /I /Y public .next\\standalone\\public`;
await $`xcopy /E /I /Y prisma .next\\standalone\\prisma`;
await copyFile(".env", join(standaloneDir, ".env"));

console.log("🛠️  Correction des modules externes hashés par Turbopack (Prisma, react-pdf)...");
async function fixPrismaImports(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== "node_modules") {
            await fixPrismaImports(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
            let content = await readFile(fullPath, 'utf8');
            const hadHash = content.includes('@prisma/client-') || content.includes('@react-pdf/renderer-');
            if (hadHash) {
                content = content.replace(/@prisma\/client-[a-f0-9]+/g, '@prisma/client');
                content = content.replace(/@react-pdf\/renderer-[a-f0-9]+/g, '@react-pdf/renderer');
                await writeFile(fullPath, content, 'utf8');
                console.log(`✅ Corrigé : ${entry.name}`);
            }
        }
    }
}
await fixPrismaImports(standaloneDir);
// 2b. Le tracing Turbopack tronque les packages node_modules (ne copie que les
// fichiers vus par l'analyse ESM — ex: @noble/hashes sans utils.js, restructure
// sans dist/). On restaure l'arbre complet de @react-pdf/renderer depuis les
// node_modules du repo (qui fonctionnent en dev).
console.log("📦 Restauration de l'arbre complet @react-pdf...");
const repoNodeModules = join(import.meta.dir, "../node_modules");
const standaloneNodeModules = join(standaloneDir, "node_modules");
const visited = new Set<string>();
const queue: string[] = ["@react-pdf/renderer"];
while (queue.length) {
    const name = queue.shift()!;
    if (visited.has(name)) continue;
    visited.add(name);
    const src = join(repoNodeModules, ...name.split("/"));
    if (!existsSync(src)) { console.log(`⚠️  absent du repo: ${name}`); continue; }
    const dst = join(standaloneNodeModules, ...name.split("/"));
    if (existsSync(dst)) await rm(dst, { recursive: true });
    await mkdir(join(dst, ".."), { recursive: true });
    await cp(src, dst, { recursive: true });
    try {
        const pkg = JSON.parse(await readFile(join(src, "package.json"), "utf8"));
        for (const dep of Object.keys(pkg.dependencies ?? {})) queue.push(dep);
    } catch { /* package sans package.json lisible */ }
}
console.log(`✅ ${visited.size} packages react-pdf restaurés`);

// 3. Préparation du Sidecar (Bun executable)
console.log("⚙️  Création de l'exécutable Sidecar...");
const binDir = join(import.meta.dir, "../src-tauri/bin");
await mkdir(binDir, { recursive: true });

// Copie de node.exe en tant que sidecar Tauri.
// Bun est incompatible avec le standalone Turbopack pour la génération PDF
// (#imports pdfkit non résolus, import.meta.url vide) — Node exécute
// correctement server.js et l'arbre node_modules tracé.
const nodePath = Bun.which("node");
if (!nodePath) throw new Error("node.exe introuvable dans le PATH");
const sidecarPath = join(binDir, "server-x86_64-pc-windows-msvc.exe");
await copyFile(nodePath, sidecarPath);
console.log(`✅ Sidecar = Node.js (${nodePath})`);

// 4. Préparation du frontend Tauri (Redirection HTML)
console.log("🌐 Création du frontend de chargement...");
const distDir = join(import.meta.dir, "../src-tauri/dist");
await mkdir(distDir, { recursive: true });

const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OmraVIP - Chargement</title>
    <style>
        body { font-family: system-ui; display: flex; justify-content: center; align-items: center; height: 100vh; background: #0A1628; color: #F7F5F0; margin: 0; flex-direction: column; }
        .loader { border: 4px solid rgba(255,255,255,0.1); border-left-color: #C4A152; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 20px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader"></div>
    <h2>Démarrage du moteur OmraVIP...</h2>
    <p>Veuillez patienter quelques instants.</p>
    <script>
        // mode "no-cors" : le fetch aboutit dès que le serveur est joignable.
        // Un fetch classique serait bloqué par la policy CORS du WebView
        // (origin tauri.localhost → localhost:14242 sans en-têtes CORS).
        const checkServer = async () => {
            try {
                await fetch("http://localhost:14242/api/parametres", { mode: "no-cors" });
                window.location.href = "http://localhost:14242";
                return;
            } catch (e) { }
            setTimeout(checkServer, 1000);
        };
        setTimeout(checkServer, 1000);
        // Filet de sécurité : navigation forcée si le serveur tarde à démarrer
        // 60 s : au premier lancement, l'app copie le serveur (~160 Mo) vers AppData
        setTimeout(() => { window.location.href = "http://localhost:14242"; }, 60000);
    </script>
</body>
</html>
`;
await Bun.write(join(distDir, "index.html"), html);

console.log("✅ Préparation terminée ! Vous pouvez maintenant lancer Tauri build.");
