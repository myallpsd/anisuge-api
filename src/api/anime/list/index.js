const express = require("express");
const cheerio = require("cheerio");
const { baseUrl } = require("../../../config");

const router = express.Router();

function base64(value) {
  return Buffer.from(value, "binary").toString("base64").replace(/\//g, "_").replace(/\+/g, "-");
}

function rc4(key, input) {
  const box = [];
  let index = 0;
  let output = "";

  for (let i = 0; i < 256; i++) box[i] = i;
  for (let i = 0; i < 256; i++) {
    index = (index + box[i] + key.charCodeAt(i % key.length)) % 256;
    [box[i], box[index]] = [box[index], box[i]];
  }

  let i = 0;
  index = 0;
  for (let j = 0; j < input.length; j++) {
    i = (i + 1) % 256;
    index = (index + box[i]) % 256;
    [box[i], box[index]] = [box[index], box[i]];
    output += String.fromCharCode(input.charCodeAt(j) ^ box[(box[i] + box[index]) % 256]);
  }
  return output;
}

function vrf(id) {
  const encoded = base64(rc4("ysJhV6U27FVIjjuk", encodeURIComponent(String(id))));
  let shifted = "";

  for (let i = 0; i < encoded.length; i++) {
    let code = encoded.charCodeAt(i);
    if (i % 8 === 1) code += 3;
    else if (i % 8 === 7) code += 5;
    else if (i % 8 === 2) code -= 4;
    else if (i % 8 === 4) code -= 2;
    else if (i % 8 === 6) code += 4;
    else if (i % 8 === 0) code -= 3;
    else if (i % 8 === 3) code += 2;
    else if (i % 8 === 5) code += 5;
    shifted += String.fromCharCode(code);
  }

  return base64(shifted).replace(/[a-zA-Z]/g, (char) => {
    const code = char.charCodeAt(0) + 13;
    return String.fromCharCode((char <= "Z" ? 90 : 122) >= code ? code : code - 26);
  });
}

function animeId(url) {
  try {
    return new URL(url).pathname.split("/").filter(Boolean)[1] || "";
  } catch {
    return "";
  }
}

function episodeNumber(url) {
  try {
    const episode = new URL(url).pathname.split("/").filter(Boolean)[2] || "";
    return episode.replace(/^ep-/, "");
  } catch {
    return "";
  }
}

function parseEpisodeList(html, parentId = "") {
  const $ = cheerio.load(html);
  return $(".range-wrap a")
    .map((_, el) => {
      const item = $(el);
      const slug = item.attr("data-slug") || "";
      const href = item.attr("href") || "";
      const url = href && href !== "#" ? new URL(href, baseUrl).toString() : new URL(`/anime/${parentId}/ep-${slug}`, baseUrl).toString();
      return {
        id: animeId(url) || parentId,
        episode: episodeNumber(url),
        url,
        number: item.text().trim(),
        title: item.attr("title") || "",
        dataId: item.attr("data-id") || "",
        malId: item.attr("data-mal") || "",
        timestamp: item.attr("data-timestamp") || "",
        slug,
        sub: item.attr("data-sub") || "",
        dub: item.attr("data-dub") || "",
        ids: item.attr("data-ids") || "",
        enabled: item.attr("enabled") || "",
        active: item.hasClass("active"),
      };
    })
    .get();
}

async function getAnimePage(id) {
  const url = new URL(`/anime/${id}`, baseUrl);
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) throw new Error(`Anime page request failed: ${response.status}`);
  return { source: url.toString(), html: await response.text() };
}

async function getEpisodeList(numericId) {
  const url = new URL(`/ajax/episode/list/${numericId}`, baseUrl);
  url.searchParams.set("vrf", vrf(numericId));

  const response = await fetch(url, {
    headers: {
      accept: "application/json, text/javascript, */*; q=0.01",
      referer: baseUrl,
      "x-requested-with": "XMLHttpRequest",
      "user-agent": "Mozilla/5.0",
    },
  });
  const data = await response.json();
  if (data.status !== 200) throw new Error(data.message || data.result || "Episode list request failed");
  return { source: url.toString(), html: data.result };
}

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const page = await getAnimePage(id);
    const $ = cheerio.load(page.html);
    const numericId = $("[data-id][data-url]").first().attr("data-id");
    if (!numericId) return res.status(404).json({ error: "Anime not found" });

    const list = await getEpisodeList(numericId);
    res.json({
      source: page.source,
      episodeListSource: list.source,
      id,
      animeId: numericId,
      episodes: parseEpisodeList(list.html, id),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

module.exports = { router, parseEpisodeList, vrf };
