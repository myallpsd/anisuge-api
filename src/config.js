const fs = require("node:fs");

function loadEnv(file = ".env") {
  if (!fs.existsSync(file)) return;

  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const pivot = trimmed.indexOf("=");
    if (pivot === -1) continue;

    const key = trimmed.slice(0, pivot).trim();
    const value = trimmed.slice(pivot + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnv();

module.exports = {
  port: Number(process.env.PORT || 3000),
  baseUrl: process.env.BASE_URL || "https://anisuge.tv/home",
  htmlPath: process.env.SOURCE_HTML,
};
