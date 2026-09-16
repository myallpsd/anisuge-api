const express = require("express");
const cheerio = require("cheerio");
const { baseUrl } = require("../../../config");

const router = express.Router();

function cleanText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function animeId(url) {
  try {
    return new URL(url).pathname.split("/").filter(Boolean)[1] || "";
  } catch {
    return "";
  }
}

function parseTooltip(html, numericId = "") {
  const $ = cheerio.load(html);
  const url = new URL($(".watchnow-btn a").attr("href") || "", baseUrl).toString();

  return {
    numericId,
    id: animeId(url),
    name: cleanText($(".name").first().text()),
    japaneseName: cleanText($(".name").first().attr("data-jp") || ""),
    type: cleanText($(".type").first().text()),
    subtitle: cleanText($(".subtitle").first().text()),
    score: cleanText($(".info .mr-2").first().text()),
    sub: cleanText($(".dub-sub-total .sub").first().text()).replace(/^.*?(\d[\d,]*)$/, "$1"),
    dub: cleanText($(".dub-sub-total .dub").first().text()).replace(/^.*?(\d[\d,]*)$/, "$1"),
    total: cleanText($(".dub-sub-total .total").first().text()),
    description: cleanText($(".desc").first().text()),
    aired: cleanText($(".meta div").filter((_, el) => cleanText($(el).text()).startsWith("Aired:")).find("span").text()),
    status: cleanText($(".meta div").filter((_, el) => cleanText($(el).text()).startsWith("Status:")).find("span").text()),
    genres: $(".meta a")
      .map((_, el) => ({
        name: cleanText($(el).text()),
        url: new URL($(el).attr("href") || "", baseUrl).toString(),
      }))
      .get(),
    url,
  };
}

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const url = new URL(`/ajax/anime/tooltip/${id}`, baseUrl);
    const response = await fetch(url, {
      headers: {
        accept: "text/html, */*; q=0.01",
        referer: baseUrl,
        "x-requested-with": "XMLHttpRequest",
        "user-agent": "Mozilla/5.0",
      },
    });
    if (!response.ok) throw new Error(`Tooltip request failed: ${response.status}`);

    res.json({
      source: url.toString(),
      data: parseTooltip(await response.text(), id),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

module.exports = { router, parseTooltip };
