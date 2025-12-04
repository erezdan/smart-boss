import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const versionFile = path.join(__dirname, "../src/version.js");
const packageJsonFile = path.join(__dirname, "../../package.json");

// Read main version from package.json
let mainVersion = "0.1.0";
if (fs.existsSync(packageJsonFile)) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonFile, "utf8"));
  if (pkg.version) mainVersion = pkg.version;
}

let build = 1;
let lastMainVersion = mainVersion;

// Try to read the current version file
let existingContent = "";
if (fs.existsSync(versionFile)) {
  existingContent = fs.readFileSync(versionFile, "utf8");
  const match = existingContent.match(/APP_VERSION\s*=\s*"([\d.]+)\.(\d+)"/);
  if (match) {
    lastMainVersion = match[1];
    if (lastMainVersion === mainVersion) {
      build = parseInt(match[2], 10) + 1;
    } else {
      build = 1; // Reset build if main version changed
    }
  }
}

const newVersion = `${mainVersion}.${build}`;
console.log(`📦 Updating APP_VERSION → ${newVersion}`);

// Replace existing APP_VERSION line or append it if not found
let newContent = "";
if (existingContent.includes("APP_VERSION")) {
  newContent = existingContent.replace(
    /APP_VERSION\s*=\s*".*?"/,
    `APP_VERSION = "${newVersion}"`
  );
} else {
  newContent = `${existingContent}\nexport const APP_VERSION = "${newVersion}";\n`;
}

fs.writeFileSync(versionFile, newContent, "utf8");
console.log(`✅ Updated version file without removing APP_CACHE_VERSION`);
