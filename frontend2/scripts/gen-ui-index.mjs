import fs from "fs";
import path from "path";
import chokidar from "chokidar";
import url from "url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const uiDir = path.join(__dirname, "../src/components/ui");
const indexFile = path.join(uiDir, "index.ts");

function generateIndex() {
  const files = fs
    .readdirSync(uiDir)
    .filter(f => /\.(ts|tsx)$/.test(f) && f !== "index.ts");

  const content =
    files.map(f => `export * from "./${path.basename(f, path.extname(f))}";`).join("\n") +
    "\n";

  fs.writeFileSync(indexFile, content);
  console.log(`✅ Updated ${files.length} UI components in ui/index.ts`);
}

// chạy 1 lần khi start
generateIndex();

// nếu có tham số --watch thì bật chế độ theo dõi
if (process.argv.includes("--watch")) {
  console.log("👀 Watching for UI component changes...");
  chokidar.watch(uiDir, { ignoreInitial: true }).on("all", (event, filePath) => {
    if (/\.(ts|tsx)$/.test(filePath)) generateIndex();
  });
}
