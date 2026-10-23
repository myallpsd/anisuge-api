const express = require("express");
const router = express.Router();
const { decryptDomainsPayload } = require("./decrypt");

function fileIdFromHtml(html) {
  return (
    html.match(/\bdata-id=["'](\d+)["']/i)?.[1] ||
    html.match(/<title>\s*File\s+(\d+)\s+-\s+MegaPlay\s*<\/title>/i)?.[1] ||
    ""
  );
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
  sourceUrl.searchParams.set("id", id);

  const s = streamUrl ? new URL(streamUrl).searchParams.get("s") : "";
  if (s) sourceUrl.searchParams.set("s", s);

  const response = await fetch(sourceUrl.toString(), {
    headers: {
      Referer: streamUrl || "https://megaplay.buzz/",
      "User-Agent": "Mozilla/5.0",
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  const responseBody = await response.text();
  if (!response.ok) {
    throw new Error(`Sources request failed: ${response.status}`);
  }

  // 1. Parse responseBody JSON
  const parsedData = JSON.parse(responseBody);

  // 2. Decrypt `enc` (or `sources` if `sources` is an encrypted string) into decodedData
  const encryptedPayload =
    parsedData.enc ||
    (typeof parsedData.sources === "string" ? parsedData.sources : null);

  const decodedData = encryptedPayload
    ? decryptDomainsPayload(encryptedPayload)
    : null;
    

  parsedData.decodedData = decodedData;

  // 3. Return parsedData (which now contains decodedData inside it)
  return {
    source: sourceUrl.toString(),
    fileId: id,
    result: parsedData,
  };
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

module.exports = { router, fileIdFromHtml, getSources };