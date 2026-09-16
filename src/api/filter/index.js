const express = require("express");
const cheerio = require("cheerio");
const { baseUrl } = require("../../config");
const { parseWidgetItems } = require("../home/parser");

const router = express.Router();
const ttlMs = Number(process.env.MENU_CACHE_DAYS || 30) * 24 * 60 * 60 * 1000;
let cachedAt = 0;
let cachedOptions = null;

function cleanText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function appendQuery(url, query) {
  for (const [key, value] of Object.entries(query)) {
    if (key === "page") continue;
    for (const item of Array.isArray(value) ? value : [value]) {
      if (item !== undefined) url.searchParams.append(key, String(item));
    }
  }
}

function parseFilterOptions(html) {
  const $ = cheerio.load(html);
  const options = {};

  $(".sorters input").each((_, el) => {
    const input = $(el);
    const name = input.attr("name");
    if (!name || name === "keyword" || name === "type") return;

    const key = name.replace(/\[\]$/, "");
    options[key] ||= [];
    options[key].push({
      id: input.attr("value") || "",
      name: cleanText(input.next("label").text()),
    });
  });

  return options;
}

async function getFilterOptions() {
  const now = Date.now();
  if (cachedOptions && now - cachedAt < ttlMs) return cachedOptions;

  const response = await fetch(new URL("/filter", baseUrl), { headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`Filter options request failed: ${response.status}`);

  cachedOptions = {
    source: new URL("/filter", baseUrl).toString(),
    cachedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ttlMs).toISOString(),
    options: parseFilterOptions(await response.text()),
  };
  cachedAt = now;
  return cachedOptions;
}

router.get("/", async (req, res) => {
  try {
    const url = new URL("/filter", baseUrl);
    appendQuery(url, req.query);
    if (req.query.page) url.searchParams.set("page", String(req.query.page));

    const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!response.ok) throw new Error(`Filter request failed: ${response.status}`);

    res.json({
      source: url.toString(),
      page: req.query.page ? String(req.query.page) : "1",
      items: parseWidgetItems({ baseUrl, html: await response.text() }),
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

router.get("/options", async (_req, res) => {
  try {
    res.json(await getFilterOptions());
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

module.exports = { router, parseFilterOptions, appendQuery };
