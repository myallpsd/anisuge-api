const express = require("express");
const cheerio = require("cheerio");
const { baseUrl } = require("../../../config");

const router = express.Router();

function parseServerList(html) {
  const $ = cheerio.load(html);
  return $(".server-type")
    .map((_, groupEl) => {
      const group = $(groupEl);
      return {
        type: group.attr("data-type") || "",
        servers: group.find(".server")
          .map((__, serverEl) => {
            const server = $(serverEl);
            return {
              name: server.find("span").first().text().trim(),
              epId: server.attr("data-ep-id") || "",
              cmid: server.attr("data-cmid") || "",
              svId: server.attr("data-sv-id") || "",
              linkId: server.attr("data-link-id") || "",
            };
          })
          .get(),
      };
    })
    .get();
}

async function fetchServerList(servers) {
  const url = new URL("/ajax/server/list", baseUrl);
  url.searchParams.set("servers", servers);

  const response = await fetch(url, {
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      referer: baseUrl,
      "x-requested-with": "XMLHttpRequest",
      "user-agent": "Mozilla/5.0",
    },
  });
  const data = await response.json();
  if (data.status !== 200) throw new Error(data.message || data.result || "Server list request failed");
  return { source: url.toString(), html: data.result };
}

router.get("/", async (req, res) => {
  try {
    const servers = req.query.servers ? String(req.query.servers) : "";
    if (!servers) return res.status(400).json({ error: "Missing servers query" });

    const data = await fetchServerList(servers);
    res.json({
      source: data.source,
      servers: parseServerList(data.html),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

module.exports = { router, parseServerList };
