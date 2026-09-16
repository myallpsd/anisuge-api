const cheerio = require("cheerio");
const { baseUrl } = require("../../config");

const ttlMs = Number(process.env.MENU_CACHE_DAYS || 30) * 24 * 60 * 60 * 1000;
let cachedAt = 0;
let cached = null;

function cleanText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function parseMenuLinks(html, sectionTitle) {
  const $ = cheerio.load(html);
  const section = $("#unix-head-menu > ul > li.have-sub")
    .filter((_, el) => cleanText($(el).children("a").first().text()).toLowerCase() === sectionTitle)
    .first();

  return section
    .find("ul a")
    .map((_, el) => {
      const href = $(el).attr("href") || "";
      return {
        id: href.split("/").filter(Boolean).pop() || "",
        name: cleanText($(el).text()),
        url: new URL(href, baseUrl).toString(),
      };
    })
    .get();
}

async function getMenu() {
  const now = Date.now();
  if (cached && now - cachedAt < ttlMs) return cached;

  const response = await fetch(baseUrl, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`Menu request failed: ${response.status}`);

  const html = await response.text();
  cached = {
    source: baseUrl,
    cachedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMs).toISOString(),
    genres: parseMenuLinks(html, "genres"),
    types: parseMenuLinks(html, "types"),
  };
  cachedAt = now;
  return cached;
}

module.exports = { getMenu, parseMenuLinks };
