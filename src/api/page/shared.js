const express = require("express");
const { baseUrl } = require("../../config");
const { parseWidgetItems } = require("../home/parser");

async function fetchPage(pathname, page) {
  const url = new URL(pathname, baseUrl);
  if (page) url.searchParams.set("page", page);

  const response = await fetch(url, {
    headers: { "user-agent": "Mozilla/5.0" },
  });
  if (!response.ok) throw new Error(`Page request failed: ${response.status}`);
  return { source: url.toString(), html: await response.text() };
}

function pagePath(pathname, id = "") {
  return pathname.replace(":id", id);
}

function createPageRouter(pathname) {
  const router = express.Router({ mergeParams: true });

  router.get("/", async (req, res) => {
    try {
      const page = req.query.page ? String(req.query.page) : "";
      const data = await fetchPage(pagePath(pathname, req.params.id), page);
      res.json({
        source: data.source,
        page: page || "1",
        id: req.params.id,
        items: parseWidgetItems({ baseUrl, html: data.html }),
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}

module.exports = { createPageRouter, pagePath };
