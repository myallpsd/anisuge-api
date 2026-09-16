const express = require("express");
const { baseUrl } = require("../../config");
const list = require("./list");
const sources = require("./sources");

const router = express.Router();

router.use("/list", list.router);
router.use("/sources", sources.router);

router.get("/", async (req, res) => {
  try {
    const get = req.query.get ? String(req.query.get) : "";
    if (!get) return res.status(400).json({ error: "Missing get query" });

    const url = new URL("/ajax/server", baseUrl);
    url.searchParams.set("get", get);
    const response = await fetch(url, {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        referer: baseUrl,
        "x-requested-with": "XMLHttpRequest",
        "user-agent": "Mozilla/5.0",
      },
    });
    const data = await response.json();
    if (data.status !== 200) throw new Error(data.message || "Server request failed");

    res.json({
      source: url.toString(),
      url: data.result?.url || "",
      skipData: data.result?.skip_data || null,
      result: data.result,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

module.exports = router;
