const express = require("express");

const router = express.Router();

function fileIdFromHtml(html) {
  return html.match(/<title>\s*File\s+(\d+)\s+-\s+MegaPlay\s*<\/title>/i)?.[1] || "";
}

async function getSources({ id, streamUrl }) {
  if (!id) {
    if (!streamUrl) throw new Error("Missing url or id query");
    const page = await fetch(streamUrl, {
      headers: {
        referer: "https://anisuge.tv/",
        "user-agent": "Mozilla/5.0",
      },
    });
    if (!page.ok) throw new Error(`Stream page request failed: ${page.status}`);
    id = fileIdFromHtml(await page.text());
    if (!id) throw new Error("Could not find MegaPlay file id");
  }

  const sourceUrl = new URL("/stream/getSources", "https://megaplay.buzz");
  sourceUrl.searchParams.append("id", id);
  sourceUrl.searchParams.append("id", id);

  const s = streamUrl ? new URL(streamUrl).searchParams.get("s") : "";
  if (s) sourceUrl.searchParams.set("s", s);

  const response = await fetch(sourceUrl, {
    headers: {
      referer: streamUrl || "https://megaplay.buzz/",
      "user-agent": "Mozilla/5.0",
    },
  });
  if (!response.ok) throw new Error(`Sources request failed: ${response.status}`);
  return { source: sourceUrl.toString(), fileId: id, result: await response.json() };
}

router.get("/", async (req, res) => {
  try {
    const data = await getSources({
      id: req.query.id ? String(req.query.id) : "",
      streamUrl: req.query.url ? String(req.query.url) : "",
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

module.exports = { router, fileIdFromHtml };
