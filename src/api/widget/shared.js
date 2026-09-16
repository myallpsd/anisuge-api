const express = require("express");
const { baseUrl } = require("../../config");
const { parseWidgetItems } = require("../home/parser");

async function fetchWidget(name, page) {
  const url = new URL(`/ajax/home/widget/${name}`, baseUrl);
  if (page) url.searchParams.set("page", page);

  const response = await fetch(url, {
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      referer: baseUrl,
      "x-requested-with": "XMLHttpRequest",
      "user-agent": "Mozilla/5.0",
    },
  });
  const data = await response.json();
  if (data.status !== 200) throw new Error(data.result || "Widget request failed");
  return { source: url.toString(), html: data.result };
}

function createWidgetRouter(name) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const page = req.query.page ? String(req.query.page) : "";
      const widget = await fetchWidget(name, page);
      res.json({
        source: widget.source,
        page: page || "1",
        items: parseWidgetItems({ baseUrl, html: widget.html }),
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}

module.exports = { createWidgetRouter };
