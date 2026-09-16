const express = require("express");
const fs = require("node:fs");
const { baseUrl, htmlPath } = require("../../config");
const { parseHomeSections, parseSchedule } = require("./parser");

const router = express.Router();

async function fetchSchedule() {
  const url = new URL("/ajax/schedule", baseUrl);
  const response = await fetch(url, {
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      referer: baseUrl,
      "x-requested-with": "XMLHttpRequest",
      "user-agent": "Mozilla/5.0",
    },
  });
  const data = await response.json();
  if (data.status !== 200) throw new Error(data.result || "Schedule request failed");
  return { source: url.toString(), html: data.result };
}

router.get("/home-sections", async (_req, res) => {
  try {
    const html = htmlPath && fs.existsSync(htmlPath) ? undefined : await fetch(baseUrl).then((response) => response.text());
    const schedule = await fetchSchedule();
    res.json({
      ...parseHomeSections({ baseUrl, htmlPath, html }),
      schedule: {
        source: schedule.source,
        days: parseSchedule({ baseUrl, html: schedule.html }),
      },
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

module.exports = router;
