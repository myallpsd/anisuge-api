# AnimeSuge API

Reference for the Express routes mounted by `src/app.js`. The endpoint names and response shapes below describe this repository; the [WatchHentai API README](https://github.com/senpaiorbit/animehentai-api/blob/main/README.md) was used as a documentation-style reference, not as a source for this project's routes.

The API scrapes AnimeSuge and returns JSON. Responses reflect the upstream site at request time and may change as its markup or data changes.

## Run locally

```sh
npm install
npm start
```

The default local base URL is `http://localhost:3000`. Set `PORT` to change the listening port and `BASE_URL` to change the upstream AnimeSuge URL (default: `https://anisuge.tv/home`). If `SOURCE_HTML` points to a local homepage HTML file, `/api/home-sections` reads its page sections from that file and still fetches the schedule from upstream.

## API-wide behavior

- The API routes use the `/api` prefix. The root and documentation routes are outside that prefix.
- All API endpoints use `GET`; responses are JSON except for the Swagger UI at `/docs`.
- There is no shared response envelope. Each route returns the fields described below.
- CORS allows any origin and the `Content-Type` request header.
- Most upstream or parsing failures return HTTP `500` with `{"error":"..."}`. Routes with required query parameters document their specific missing-parameter status below.
- Repeated filter values can be sent as repeated query parameters, for example `genre[]=1&genre[]=2`.

## Root and API documentation

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/` | Returns the API message and links to the homepage endpoint and docs. |
| GET | `/docs` | Interactive Swagger UI. |
| GET | `/docs.json` | OpenAPI 3.0.3 document. |

The root endpoint currently returns:

```json
{
  "message": "AnimeSuge sections API",
  "endpoint": "/api/home-sections",
  "docs": "/docs"
}
```

## Endpoints

### Homepage

#### `GET /api/home-sections`

Returns homepage sections and the release schedule.

Response fields:

- `source`: upstream homepage URL.
- `slider`: array of featured anime slides (`id`, `title`, `url`, `image`).
- `recentlyAdded`, `justCompleted`: arrays of anime cards (`id`, `name`, `japaneseName`, `url`, `poster`, `type`, `sub`, `dub`, `total`, `extra`).
- `mostViewed`: object keyed by upstream time period; each value is an array of ranked anime cards.
- `schedule`: object containing the upstream `source` and a `days` array. A day has `date`, `weekday`, `today`, and `items`; schedule items have `id`, `time`, `name`, `japaneseName`, `url`, and `status`.

### Homepage widgets

All widgets return `{ "source": "...", "page": "1", "items": [...] }`. `page` is a string; it defaults to `"1"`. Each item contains `id`, `name`, `japaneseName`, `url`, `poster`, `type`, `sub`, `dub`, and `total`.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/widget/updated-sub` | Recently updated subbed anime. |
| GET | `/api/widget/updated-all` | Recently updated anime across languages. |
| GET | `/api/widget/trending` | Trending anime. |
| GET | `/api/widget/updated-dub` | Recently updated dubbed anime. |
| GET | `/api/widget/random` | Random anime widget. |

Optional query parameter: `page` (upstream widget page number), e.g. `/api/widget/trending?page=2`.

### Anime listings

These endpoints return `source`, `page` (string, defaults to `"1"`), and `items`. Listing items have `id`, `name`, `japaneseName`, `url`, `poster`, `type`, `sub`, `dub`, and `total`.

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/latest-updated` | Recently updated anime. |
| GET | `/api/new-release` | New releases. |
| GET | `/api/most-viewed` | Most viewed anime. |
| GET | `/api/genre/:id` | Anime for a genre ID or slug, e.g. `/api/genre/action`. |
| GET | `/api/producer/:id` | Anime for a producer ID or slug. |
| GET | `/api/studio/:id` | Anime for a studio ID or slug. |
| GET | `/api/type/:id` | Anime for a type ID or slug, e.g. `/api/type/movie`. |
| GET | `/api/status/finished-airing` | Finished-airing anime. |
| GET | `/api/status/currently-airing` | Currently-airing anime. |

All listing routes accept the optional `page` query parameter.

The genre, producer, studio, and type routes also include the requested path value as a top-level `id`. The current upstream sometimes links listing cards under `/anime/...`; the listing parser only derives card IDs from `/anime/...` URLs, so a live listing item's `id` may be an empty string. The item's `url` remains available in that case.

### Filter

#### `GET /api/filter`

Filters anime and returns `{ "source": "...", "page": "1", "items": [...] }`. Item fields match the anime listing fields above. The route forwards filter query parameters to the upstream `/filter` page.

Supported upstream query parameters include:

| Parameter | Meaning |
| --- | --- |
| `keyword` | Search text. |
| `term_type[]` | Anime types. |
| `genre[]` | Genre IDs. |
| `year[]` | Years. |
| `rating[]` | Ratings. |
| `status[]` | Airing status. |
| `season[]` | Seasons. |
| `language[]` | Languages. |
| `country` | Country. |
| `sort` | Sort order, such as `latest-updated`. |
| `page` | Result page. |

Example: `/api/filter?keyword=one&genre[]=1&sort=latest-updated&page=2`

#### `GET /api/filter/options`

Returns `{ "source": "...", "cachedAt": "...", "expiresAt": "...", "options": {...} }`. `options` is grouped by filter name; each option has an `id` and `name`. The values are cached in memory for `MENU_CACHE_DAYS` days (default: 30).

### Menus

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/genres` | Genre menu. |
| GET | `/api/types` | Type menu. |

Both return `{ "source": "...", "cachedAt": "...", "expiresAt": "...", "items": [...] }`. Each menu item has `id`, `name`, and `url`. Menu results use the same in-memory cache as the filter options.

### Anime

| Method | Endpoint | Required input | Success response |
| --- | --- | --- | --- |
| GET | `/api/anime/search` | Query: `keyword` | `source`, `keyword`, `count`, `linkMore`, `items`. |
| GET | `/api/anime/detail/:id` | Path: anime slug | `source`, `data`, `recommended`. |
| GET | `/api/anime/list/:id` | Path: anime slug | `source`, `episodeListSource`, `id`, `animeId`, `episodes`. |
| GET | `/api/anime/tooltip/:id` | Path: numeric tooltip ID | `source`, `data`. |

Search items include `id`, `name`, `japaneseName`, `url`, `poster`, `subtitle`, `rating`, `score`, `type`, and `aired`. Missing `keyword` on `/api/anime/search` returns HTTP `400` with `{"error":"Missing keyword query"}`.

Anime detail `data` contains the parsed media information (including names, type, rating, quality, episode counts, description, and any metadata found on the page), plus `moreSeasons` and `moreSeasonsSource`. The top-level `recommended` array contains related anime cards with `id`, `name`, `japaneseName`, `url`, `poster`, `type`, `sub`, `dub`, and `total`.

Anime list `episodes` contains the parsed episode entries: `id`, `episode`, `url`, `number`, `title`, `dataId`, `malId`, `timestamp`, `slug`, `sub`, `dub`, `ids`, `enabled`, and `active`. An anime page with no matching media ID returns HTTP `404` with `{"error":"Anime not found"}`.

Tooltip `data` contains `numericId`, `id`, `name`, `japaneseName`, `type`, `subtitle`, `score`, `sub`, `dub`, `total`, `description`, `aired`, `status`, `genres`, and `url`.

### Streaming servers

| Method | Endpoint | Required input | Description |
| --- | --- | --- | --- |
| GET | `/api/server/list` | Query: `servers` | Returns `source` and grouped `servers`. Each group has a `type` and `servers` array containing `name`, `epId`, `cmid`, `svId`, and `linkId`. |
| GET | `/api/server` | Query: `get` | Resolves a server link; returns `source`, `url`, `skipData`, and upstream `result`. |
| GET | `/api/server/sources` | Query: `id` or `url` | Resolves MegaPlay sources; returns `source`, `fileId`, and upstream `result`. |

`/api/server/list` returns HTTP `400` when `servers` is missing. `/api/server` returns HTTP `400` when `get` is missing. `/api/server/sources` returns HTTP `500` with `{"error":"Missing url or id query"}` when neither `id` nor `url` is provided.

Examples:

- `/api/server/list?servers=EPISODE_SERVER_IDS`
- `/api/server?get=SERVER_LINK_ID`
- `/api/server/sources?id=106302`
- `/api/server/sources?url=https%3A%2F%2Fmegaplay.buzz%2Fstream%2Fs-2%2F19802%2Fdub%3Fs%3Dtcdn`

## Live response examples

These are real responses from the local server with the default upstream configuration. Anime catalog content is live and can differ between requests; examples show a single returned item where applicable.

### `GET /api/anime/search?keyword=one` — HTTP 200

```json
{
  "source": "https://anisuge.tv/ajax/anime/search?keyword=one",
  "keyword": "one",
  "count": 5,
  "linkMore": "https://anisuge.tv/filter?keyword=one",
  "items": [
    {
      "id": "loner-life-in-another-world-g9rqp",
      "name": "Loner Life in Another World",
      "japaneseName": "Hitoribocchi no Isekai Kouryaku",
      "url": "https://anisuge.tv/anime/loner-life-in-another-world-g9rqp",
      "poster": "https://cdn.anipixcdn.co/thumbnail/63ea2c642aaee001d818604fe1d9a811.jpg",
      "subtitle": "Loner Life in Another World; Hitoribocchi no Isekai Kouryaku",
      "rating": "PG-13",
      "score": "6.23",
      "type": "",
      "aired": "Oct 4, 2024 to Dec 13, 2024"
    }
  ]
}
```

### `GET /api/anime/tooltip/390` — HTTP 200

```json
{
  "source": "https://anisuge.tv/ajax/anime/tooltip/390",
  "data": {
    "numericId": "390",
    "id": "the-familiar-of-zero-fzbfz",
    "name": "The Familiar of Zero",
    "japaneseName": "Zero no Tsukaima",
    "type": "TV",
    "subtitle": "The Familiar of Zero; Zero no Tsukaima",
    "score": "7.36",
    "sub": "13",
    "dub": "13",
    "total": "13",
    "description": "Louise Françoise Le Blanc de La Vallière is a self-absorbed mage in a world of wands, cloaks, and royalty. Although she studies at Tristain Academy,...",
    "aired": "Jul 3, 2006 to Sep 25, 2006",
    "status": "Finished Airing",
    "genres": [
      {
        "name": "Action",
        "url": "https://anisuge.tv/genre/action"
      },
      {
        "name": "Adventure",
        "url": "https://anisuge.tv/genre/adventure"
      }
    ],
    "url": "https://anisuge.tv/anime/the-familiar-of-zero-fzbfz"
  }
}
```

### Missing query example — HTTP 400

`GET /api/server/list` without its required `servers` parameter returns:

```json
{
  "error": "Missing servers query"
}
```

## Route summary

| Method | Route |
| --- | --- |
| GET | `/` |
| GET | `/docs` |
| GET | `/docs.json` |
| GET | `/api/home-sections` |
| GET | `/api/widget/updated-sub` |
| GET | `/api/widget/updated-all` |
| GET | `/api/widget/trending` |
| GET | `/api/widget/updated-dub` |
| GET | `/api/widget/random` |
| GET | `/api/latest-updated` |
| GET | `/api/new-release` |
| GET | `/api/most-viewed` |
| GET | `/api/genre/:id` |
| GET | `/api/producer/:id` |
| GET | `/api/studio/:id` |
| GET | `/api/type/:id` |
| GET | `/api/status/finished-airing` |
| GET | `/api/status/currently-airing` |
| GET | `/api/filter` |
| GET | `/api/filter/options` |
| GET | `/api/genres` |
| GET | `/api/types` |
| GET | `/api/anime/search` |
| GET | `/api/anime/detail/:id` |
| GET | `/api/anime/list/:id` |
| GET | `/api/anime/tooltip/:id` |
| GET | `/api/server/list` |
| GET | `/api/server` |
| GET | `/api/server/sources` |
