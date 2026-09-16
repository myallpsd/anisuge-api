module.exports = {
  openapi: "3.0.3",
  info: {
    title: "AnimeSuge API",
    version: "1.0.0",
    description: "Scraped AnimeSuge JSON endpoints for home sections, listings, widgets, episodes, servers, and sources.",
  },
  servers: [{ url: "http://localhost:3000" }],
  tags: [
    { name: "Home" },
    { name: "Widgets" },
    { name: "Listings" },
    { name: "Anime" },
    { name: "Servers" },
  ],
  paths: {
    "/api/home-sections": {
      get: {
        tags: ["Home"],
        summary: "Get homepage sections",
        responses: {
          200: { description: "Homepage sections with schedule" },
        },
      },
    },
    "/api/filter": {
      get: {
        tags: ["Listings"],
        summary: "Filter anime with AnimeSuge filter query parameters",
        parameters: [
          { name: "keyword", in: "query", required: false, schema: { type: "string" } },
          { name: "term_type[]", in: "query", required: false, schema: { type: "array", items: { type: "string" } } },
          { name: "genre[]", in: "query", required: false, schema: { type: "array", items: { type: "string" } } },
          { name: "year[]", in: "query", required: false, schema: { type: "array", items: { type: "string" } } },
          { name: "rating[]", in: "query", required: false, schema: { type: "array", items: { type: "string" } } },
          { name: "status[]", in: "query", required: false, schema: { type: "array", items: { type: "string" } } },
          { name: "season[]", in: "query", required: false, schema: { type: "array", items: { type: "string" } } },
          { name: "language[]", in: "query", required: false, schema: { type: "array", items: { type: "string" } } },
          { name: "country", in: "query", required: false, schema: { type: "string" } },
          { name: "sort", in: "query", required: false, schema: { type: "string", example: "latest-updated" } },
          { name: "page", in: "query", required: false, schema: { type: "integer", example: 2 } },
        ],
        responses: {
          200: { description: "Filtered anime listing items" },
        },
      },
    },
    "/api/filter/options": {
      get: {
        tags: ["Listings"],
        summary: "Cached filter option lists",
        responses: {
          200: { description: "Filter option groups" },
        },
      },
    },
    "/api/widget/{name}": {
      get: {
        tags: ["Widgets"],
        summary: "Get homepage widget items",
        parameters: [
          {
            name: "name",
            in: "path",
            required: true,
            schema: { type: "string", enum: ["updated-sub", "updated-all", "trending", "updated-dub", "random"] },
          },
          { name: "page", in: "query", required: false, schema: { type: "integer", example: 2 } },
        ],
        responses: {
          200: { description: "Widget items" },
          404: { description: "Unknown widget" },
        },
      },
    },
    "/api/latest-updated": { get: listing("Recently updated anime") },
    "/api/new-release": { get: listing("New release anime") },
    "/api/most-viewed": { get: listing("Most viewed anime") },
    "/api/genres": { get: menuList("Cached genre list from homepage menu") },
    "/api/types": { get: menuList("Cached type list from homepage menu") },
    "/api/genre/{id}": { get: listing("Anime by genre", "action") },
    "/api/studio/{id}": { get: listing("Anime by studio", "silver-link") },
    "/api/producer/{id}": { get: listing("Anime by producer", "sentai-filmworks") },
    "/api/type/{id}": { get: listing("Anime by type", "movie") },
    "/api/status/finished-airing": { get: listing("Finished airing anime") },
    "/api/status/currently-airing": { get: listing("Currently airing anime") },
    "/api/anime/list/{id}": {
      get: {
        tags: ["Anime"],
        summary: "Get anime episode list",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Episode range list" },
          404: { description: "Anime not found" },
        },
      },
    },
    "/api/anime/detail/{id}": {
      get: {
        tags: ["Anime"],
        summary: "Get anime detail from media-info",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "chivalry-of-a-failed-knight-x7zgz" } }],
        responses: {
          200: { description: "Anime detail data" },
        },
      },
    },
    "/api/anime/search": {
      get: {
        tags: ["Anime"],
        summary: "Search anime",
        parameters: [{ name: "keyword", in: "query", required: true, schema: { type: "string", example: "one" } }],
        responses: {
          200: { description: "Search results" },
          400: { description: "Missing keyword query" },
        },
      },
    },
    "/api/anime/tooltip/{id}": {
      get: {
        tags: ["Anime"],
        summary: "Get anime tooltip details",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", example: "390" } }],
        responses: {
          200: { description: "Tooltip anime details" },
        },
      },
    },
    "/api/server/list": {
      get: {
        tags: ["Servers"],
        summary: "Get available streaming servers for an episode",
        parameters: [{ name: "servers", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Grouped server list" },
          400: { description: "Missing servers query" },
        },
      },
    },
    "/api/server": {
      get: {
        tags: ["Servers"],
        summary: "Resolve one server link to a Megaplay stream URL",
        parameters: [{ name: "get", in: "query", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Megaplay stream URL and skip data" },
          400: { description: "Missing get query" },
        },
      },
    },
    "/api/server/sources": {
      get: {
        tags: ["Servers"],
        summary: "Get video sources from a Megaplay stream URL or file id",
        parameters: [
          { name: "url", in: "query", required: false, schema: { type: "string", example: "https://megaplay.buzz/stream/s-2/19802/dub?s=tcdn" } },
          { name: "id", in: "query", required: false, schema: { type: "string", example: "106302" } },
        ],
        responses: {
          200: { description: "Video source, tracks, intro, and outro" },
          500: { description: "Missing url or id query, or upstream failure" },
        },
      },
    },
  },
};

function listing(summary, idExample) {
  const parameters = [{ name: "page", in: "query", required: false, schema: { type: "integer", example: 2 } }];
  if (idExample) parameters.unshift({ name: "id", in: "path", required: true, schema: { type: "string", example: idExample } });

  return {
    tags: ["Listings"],
    summary,
    parameters,
    responses: {
      200: { description: "Anime listing items" },
    },
  };
}

function menuList(summary) {
  return {
    tags: ["Listings"],
    summary,
    responses: {
      200: { description: "Cached menu items" },
    },
  };
}
