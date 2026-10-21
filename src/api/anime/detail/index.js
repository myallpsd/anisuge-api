const express = require("express");
const cheerio = require("cheerio");
const { baseUrl } = require("../../../config");

const router = express.Router();

function cleanText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function absoluteUrl(value) {
  return new URL(value || "", baseUrl).toString();
}

function animeId(url) {
  try {
    return new URL(url).pathname.split("/").filter(Boolean)[1] || "";
  } catch {
    return "";
  }
}

function linkedList($, row) {
  const links = row.find("a");
  if (links.length) {
    return links
      .map((_, el) => ({
        name: cleanText($(el).text()),
        url: absoluteUrl($(el).attr("href")),
      }))
      .get();
  }
  return cleanText(row.find("span").text())
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseMoreSeasons(html) {
  const $ = cheerio.load(html);
  return $(".swiper-wrapper a")
    .map((_, el) => {
      const item = $(el);
      const url = absoluteUrl(item.attr("href"));
      const image = item.find(".swiper-banner").attr("style") || "";
      return {
        id: animeId(url),
        name: cleanText(item.find("span").first().text()),
        url,
        poster: image.match(/url\(([^)]+)\)/)?.[1] || "",
        active: item.hasClass("active"),
      };
    })
    .get();
}

function parseRecommended(html) {
  const $ = cheerio.load(html);
  const section = $(".side-panel").filter((_, el) => {
    return cleanText($(el).find(".section-name").first().text()).toLowerCase() === "recommended";
  }).first();

  return section.find(".anime.mini-card > a.item")
    .map((_, el) => {
      const item = $(el);
      const url = absoluteUrl(item.attr("href"));
      const image = item.find(".poster img").first();
      const name = item.find(".name").first();
      const sub = cleanText(item.find(".dub-sub-total .sub").first().text());
      const dub = cleanText(item.find(".dub-sub-total .dub").first().text());

      return {
        id: animeId(url),
        name: cleanText(name.text() || image.attr("alt") || ""),
        japaneseName: cleanText(name.attr("data-jp") || ""),
        url,
        poster: image.attr("data-src") || image.attr("src")
          ? absoluteUrl(image.attr("data-src") || image.attr("src"))
          : "",
        type: cleanText(item.find(".meta .type").first().text()),
        sub: sub.replace(/^.*?(\d[\d,]*)$/, "$1"),
        dub: dub.replace(/^.*?(\d[\d,]*)$/, "$1"),
        total: cleanText(item.find(".dub-sub-total .total").first().text()),
      };
    })
    .get();
}

function parseAnimeDetail(html, id = "") {
  const $ = cheerio.load(html);
  const root = $("#media-info");
  const watch = $("[data-id][data-url]").first();
  const data = {
    id,
    numericId: watch.attr("data-id") || "",
    url: absoluteUrl(watch.attr("data-url") || `/anime/${id}`),
    poster: absoluteUrl(root.find(".poster img").attr("src")),
    name: cleanText(root.find("h1.title").text()),
    japaneseName: cleanText(root.find("h1.title").attr("data-jp") || root.find(".maindata > p").first().text()),
    type: cleanText(root.find(".status .type").first().text()),
    rating: cleanText(root.find(".status .rating").first().text()),
    quality: cleanText(root.find(".status .quality").first().text()),
    sub: cleanText(root.find(".dub-sub-total .sub").first().text()).replace(/^.*?(\d[\d,]*)$/, "$1"),
    dub: cleanText(root.find(".dub-sub-total .dub").first().text()).replace(/^.*?(\d[\d,]*)$/, "$1"),
    total: cleanText(root.find(".dub-sub-total .total").first().text()),
    description: cleanText(root.find(".description .full > div").text() || root.find(".description .short > div").text()),
  };

  root.find(".meta > div").each((_, el) => {
    const row = $(el);
    const label = cleanText(row.children("div").first().text()).replace(/:$/, "").toLowerCase();
    if (!label) return;
    const value = ["genre", "studios", "producers"].includes(label) ? linkedList($, row) : cleanText(row.children("span").text());
    data[label.replace(/\s+/g, "")] = value;
  });

  return data;
}

async function getMoreSeasons(numericId, referer) {
  const url = new URL(`/api/seasons/${numericId}`, baseUrl);
  const response = await fetch(url, {
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      referer,
      "x-requested-with": "XMLHttpRequest",
      "user-agent": "Mozilla/5.0",
    },
  });
  if (!response.ok) throw new Error(`More seasons request failed: ${response.status}`);

  const data = await response.json();
  return {
    source: url.toString(),
    items: data.status === 200 && data.result ? parseMoreSeasons(data.result) : [],
  };
}

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const url = new URL(`/anime/${id}`, baseUrl);
    const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!response.ok) throw new Error(`Anime detail request failed: ${response.status}`);

    const html = await response.text();
    const detail = parseAnimeDetail(html, id);
    const recommended = parseRecommended(html);
    const moreSeasons = detail.numericId ? await getMoreSeasons(detail.numericId, url.toString()) : { source: "", items: [] };
    detail.moreSeasons = moreSeasons.items;
    detail.moreSeasonsSource = moreSeasons.source;

    res.json({
      source: url.toString(),
      data: detail,
      recommended,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

module.exports = { router, parseAnimeDetail, parseMoreSeasons, parseRecommended };
