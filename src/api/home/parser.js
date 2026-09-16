const fs = require("node:fs");
const path = require("node:path");
const cheerio = require("cheerio");

function cleanText(value) {
  return value.replace(/\s+/g, " ").trim();
}

function absoluteUrl(baseUrl, value) {
  if (!value) return "";
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function animeId(url) {
  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts[0] === "watch" ? parts[1] || "" : "";
  } catch {
    return "";
  }
}

function imageUrl(baseUrl, htmlPath, item) {
  const src = item.find("img").attr("data-src") || item.find("img").attr("src") || "";
  if (!src) return "";
  if (src.startsWith("./") || src.startsWith("../")) {
    return absoluteUrl(`file://${path.dirname(htmlPath)}/`, src);
  }
  return absoluteUrl(baseUrl, src);
}

function cardImageUrl(baseUrl, item) {
  const src = item.find("img").attr("data-src") || item.find("img").attr("src") || "";
  return absoluteUrl(baseUrl, src);
}

function parseMeta(item) {
  const meta = item.find(".meta").first();
  const trailing = meta
    .children("span")
    .last()
    .clone()
    .children()
    .remove()
    .end()
    .text();

  return {
    type: cleanText(meta.find(".type").first().text()),
    sub: cleanText(meta.find(".sub").first().text()).replace(/^.*?(\d[\d,]*)$/, "$1"),
    dub: cleanText(meta.find(".dub").first().text()).replace(/^.*?(\d[\d,]*)$/, "$1"),
    total: cleanText(meta.find(".total").first().text()),
    extra: cleanText(trailing),
  };
}

function parseWidgetCard(baseUrl, item) {
  const posterLink = item.find("a.poster").first();
  const nameLink = item.find(".name a").first();
  const url = absoluteUrl(baseUrl, nameLink.attr("href") || posterLink.attr("href") || "");

  return {
    id: animeId(url),
    name: cleanText(nameLink.text()),
    japaneseName: cleanText(nameLink.attr("data-jp") || ""),
    url,
    poster: cardImageUrl(baseUrl, item),
    type: cleanText(item.find(".item-status .type").first().text()),
    sub: cleanText(item.find(".sub").first().text()).replace(/^.*?(\d[\d,]*)$/, "$1"),
    dub: cleanText(item.find(".dub").first().text()).replace(/^.*?(\d[\d,]*)$/, "$1"),
    total: cleanText(item.find(".total").first().text()),
  };
}

function parseWidgetItems({ baseUrl, html }) {
  const $ = cheerio.load(html);
  return $(".anime.main-card .item")
    .map((_, el) => parseWidgetCard(baseUrl, $(el)))
    .get();
}

function parseSchedule({ baseUrl, html }) {
  const $ = cheerio.load(html);
  return $("div")
    .map((_, dayEl) => {
      const day = $(dayEl);
      return {
        date: cleanText(day.find("h5 span").first().text()),
        weekday: cleanText(day.find("h5 span").last().text()),
        today: day.hasClass("today"),
        items: day.find("li a")
          .map((__, itemEl) => {
            const item = $(itemEl);
            const url = absoluteUrl(baseUrl, item.attr("href") || "");
            const nameNode = item.find("span").last();
            return {
              id: animeId(url),
              time: cleanText(item.find("span").first().text()),
              name: cleanText(nameNode.text()),
              japaneseName: cleanText(nameNode.attr("data-jp") || ""),
              url,
              status: cleanText(item.attr("class") || ""),
            };
          })
          .get(),
      };
    })
    .get()
    .filter((day) => day.date || day.items.length);
}

function parseCard(baseUrl, htmlPath, item) {
  const nameNode = item.find(".name").first();
  const url = absoluteUrl(baseUrl, item.attr("href") || "");
  return {
    id: animeId(url),
    name: cleanText(nameNode.text()),
    japaneseName: cleanText(nameNode.attr("data-jp") || ""),
    url,
    poster: imageUrl(baseUrl, htmlPath, item),
    ...parseMeta(item),
  };
}

function parseMostViewedTab(baseUrl, htmlPath, tab) {
  const items = [];
  const banner = tab.find(".ontop").first();
  const bannerLink = banner.find("a.banner").first();
  const bannerName = banner.find(".detail .name").first();
  const bgStyle = banner.find(".cover > div").attr("style") || "";
  const bgMatch = bgStyle.match(/url\(['"]?([^'")]+)['"]?\)/);

  if (bannerLink.length) {
    const url = absoluteUrl(baseUrl, bannerLink.attr("href") || "");
    items.push({
      rank: cleanText(banner.find(".rank").first().text()),
      id: animeId(url),
      name: cleanText(bannerName.text()),
      japaneseName: cleanText(bannerName.attr("data-jp") || ""),
      url,
      poster: absoluteUrl(baseUrl, bgMatch ? bgMatch[1] : ""),
      ...parseMeta(banner),
    });
  }

  tab.find(".anime.top-card > a.item").each((_, el) => {
    const item = tab.find(el);
    items.push({
      rank: cleanText(item.find(".rank").first().text()),
      ...parseCard(baseUrl, htmlPath, item),
    });
  });

  return items;
}

function parseHomeSections({ baseUrl, htmlPath, html }) {
  html = html || fs.readFileSync(htmlPath, "utf8");
  const $ = cheerio.load(html);

  return {
    source: baseUrl,
    recentlyAdded: $(".hot-stat section.added .anime.mini-card > a.item")
      .map((_, el) => parseCard(baseUrl, htmlPath, $(el)))
      .get(),
    justCompleted: $(".hot-stat section.complete .anime.mini-card > a.item")
      .map((_, el) => parseCard(baseUrl, htmlPath, $(el)))
      .get(),
    mostViewed: $(".hot-stat section.mostview .tab-content")
      .map((_, el) => {
        const tab = $(el);
        return {
          period: cleanText(tab.attr("data-name") || ""),
          items: parseMostViewedTab(baseUrl, htmlPath, tab),
        };
      })
      .get()
      .reduce((acc, entry) => {
        acc[entry.period] = entry.items;
        return acc;
      }, {}),
  };
}

module.exports = { parseHomeSections, parseWidgetItems, parseSchedule };
