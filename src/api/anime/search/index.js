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

function parseSearchItems(html) {
  const $ = cheerio.load(html);
  return $(".search-card > a.item")
    .map((_, el) => {
      const item = $(el);
      const url = new URL(item.attr("href") || "", baseUrl).toString();
      const dots = item.find(".info .dot").map((__, dot) => cleanText($(dot).text())).get();

      return {
        id: animeId(url),
        name: cleanText(item.find(".name").text()),
        japaneseName: cleanText(item.find(".name").attr("data-jp") || ""),
        url,
        poster: new URL(item.find("img").attr("src") || "", baseUrl).toString(),
        subtitle: cleanText(item.find(".subname").text()),
        rating: cleanText(item.find(".rating").text()),
        score: dots[0] || "",
        type: dots[1] || "",
        aired: dots[2] || "",
      };
    })
    .get();
}

router.get("/", async (req, res) => {
  try {
    const keyword = req.query.keyword ? String(req.query.keyword) : "";
    if (!keyword) return res.status(400).json({ error: "Missing keyword query" });

    const url = new URL("/ajax/anime/search", baseUrl);
    url.searchParams.set("keyword", keyword);
    const response = await fetch(url, {
      headers: {
        accept: "application/json, text/javascript, */*; q=0.01",
        referer: baseUrl,
        "x-requested-with": "XMLHttpRequest",
        "user-agent": "Mozilla/5.0",
      },
    });
    const data = await response.json();
    if (data.status !== 200) throw new Error(data.message || "Search request failed");

    res.json({
      source: url.toString(),
      keyword,
      count: Number(data.result?.count || 0),
      linkMore: data.result?.linkMore || "",
      items: parseSearchItems(data.result?.html || ""),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

module.exports = { router, parseSearchItems };
