const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { parseAnimeDetail, parseMoreSeasons } = require("../src/api/anime/detail");
const { parseEpisodeList, vrf } = require("../src/api/anime/list");
const { parseSearchItems } = require("../src/api/anime/search");
const { parseTooltip } = require("../src/api/anime/tooltip");
const { appendQuery, parseFilterOptions } = require("../src/api/filter");
const { parseHomeSections, parseSchedule, parseWidgetItems } = require("../src/api/home/parser");
const { parseMenuLinks } = require("../src/api/menu/shared");
const { pagePath } = require("../src/api/page/shared");
const { parseServerList } = require("../src/api/server/list");
const { fileIdFromHtml } = require("../src/api/server/sources");

test("parses the three requested homepage sections", () => {
  const data = parseHomeSections({
    baseUrl: "https://anisuge.tv/home",
    htmlPath: path.join(__dirname, "fixtures/home.html"),
  });

  assert.equal(data.source, "https://anisuge.tv/home");
  assert.equal(data.slider[0].id, "one-piece-odmau");
  assert.equal(data.slider[0].title, "One Piece");
  assert.equal(data.slider[0].url, "https://anisuge.tv/watch/one-piece-odmau");
  assert.equal(data.slider[0].image, "https://image.tmdb.org/t/p/original/a6ptrTUH1c5OdWanjyYtAkOuYD0.jpg");
  assert.equal(data.recentlyAdded[0].id, "one-room-ta-nqdct");
  assert.equal(data.recentlyAdded[0].name, "One-Room TA");
  assert.equal(data.justCompleted[0].id, "mobile-suit-gundam-hathaway-the-sorcery-of-nymph-circe-cc5ie");
  assert.equal(data.justCompleted[0].name, "Mobile Suit Gundam: Hathaway - The Sorcery of Nymph Circe");
  assert.equal(data.mostViewed.day[0].id, "one-piece-odmau");
  assert.equal(data.mostViewed.day[0].name, "One Piece");
  assert.equal(data.mostViewed.week[0].name, "Bleach: Thousand-Year Blood War - The Calamity");
  assert.ok(Array.isArray(data.mostViewed.month));
  assert.ok(data.recentlyAdded.length > 0);
  assert.ok(data.justCompleted.length > 0);
});

test("parses slider ids from anime URLs", () => {
  const data = parseHomeSections({
    baseUrl: "https://anisuge.tv/home",
    html: `
      <div id="slider">
        <a class="swiper-slide" href="/anime/dragon-ball-super-beerus-opagc"
          title="Dragon Ball Super: Beerus"
          style="background-image: url('https://example.com/beerus.jpg');"></a>
      </div>
    `,
  });

  assert.deepEqual(data.slider, [{
    id: "dragon-ball-super-beerus-opagc",
    title: "Dragon Ball Super: Beerus",
    url: "https://anisuge.tv/anime/dragon-ball-super-beerus-opagc",
    image: "https://example.com/beerus.jpg",
  }]);
});

test("parses widget card ids from watch urls", () => {
  const items = parseWidgetItems({
    baseUrl: "https://anisuge.tv/home",
    html: `
      <div class="anime main-card">
        <div class="item">
          <a class="poster" href="https://anisuge.tv/watch/boku-no-hero-academia-i-am-a-hero-too-dwoba/ep-1">
            <img src="https://example.com/poster.jpg">
          </a>
          <div class="item-status"><span class="type">TV</span></div>
          <div class="dub-sub-total">
            <span class="sub">12</span><span class="dub">10</span><span class="total">13</span>
          </div>
          <div class="name">
            <a href="https://anisuge.tv/watch/boku-no-hero-academia-i-am-a-hero-too-dwoba/ep-2" data-jp="JP Name">
              Boku no Hero Academia
            </a>
          </div>
        </div>
      </div>
    `,
  });

  assert.equal(items[0].id, "boku-no-hero-academia-i-am-a-hero-too-dwoba");
  assert.equal(items[0].name, "Boku no Hero Academia");
  assert.equal(items[0].url, "https://anisuge.tv/watch/boku-no-hero-academia-i-am-a-hero-too-dwoba/ep-2");
});

test("parses schedule section items", () => {
  const days = parseSchedule({
    baseUrl: "https://anisuge.tv/home",
    html: `
      <div class="today">
        <h5><span>1 Sep</span><br><span>Tuesday</span></h5>
        <ul>
          <li>
            <a class="passed" href="https://anisuge.tv/watch/boku-no-hero-academia-i-am-a-hero-too-dwoba">
              <span>04:00</span>
              <span data-jp="JP Name">Boku no Hero Academia Ep - 1</span>
            </a>
          </li>
        </ul>
      </div>
    `,
  });

  assert.equal(days[0].date, "1 Sep");
  assert.equal(days[0].weekday, "Tuesday");
  assert.equal(days[0].today, true);
  assert.equal(days[0].items[0].id, "boku-no-hero-academia-i-am-a-hero-too-dwoba");
  assert.equal(days[0].items[0].time, "04:00");
  assert.equal(days[0].items[0].status, "passed");
});

test("parses episode list range links", () => {
  assert.equal(vrf("702"), "FaATBD==");

  const episodes = parseEpisodeList(`
    <div class="range-wrap">
      <div>
        <a href="#" data-id="12102" title="Evil Lord Shingan... Reborn" data-num="Evil Lord Shingan... Reborn" data-mal="18671" data-timestamp="1729195516" data-slug="1" data-sub="1" data-dub="1" data-ids="abc" class="active" enabled="1">
          1
        </a>
      </div>
    </div>
  `, "love-chunibyo-other-delusions-2nd-season-heart-throb-bfx04");

  assert.equal(episodes[0].id, "love-chunibyo-other-delusions-2nd-season-heart-throb-bfx04");
  assert.equal(episodes[0].episode, "1");
  assert.equal(episodes[0].url, "https://anisuge.tv/watch/love-chunibyo-other-delusions-2nd-season-heart-throb-bfx04/ep-1");
  assert.equal(episodes[0].dataId, "12102");
  assert.equal(episodes[0].title, "Evil Lord Shingan... Reborn");
  assert.equal(episodes[0].malId, "18671");
  assert.equal(episodes[0].active, true);
});

test("parses server list groups", () => {
  const groups = parseServerList(`
    <div class="server-type type mb-2" data-type="sub">
      <div class="server-list">
        <div class="server" data-ep-id="12102" data-cmid="animixplay-fqsqfvdf4u" data-sv-id="1a7" data-link-id="abc">
          <div><span>Vidstream-2</span></div>
        </div>
      </div>
    </div>
  `);

  assert.equal(groups[0].type, "sub");
  assert.equal(groups[0].servers[0].name, "Vidstream-2");
  assert.equal(groups[0].servers[0].epId, "12102");
  assert.equal(groups[0].servers[0].svId, "1a7");
  assert.equal(groups[0].servers[0].linkId, "abc");
});

test("finds megaplay file id from stream page title", () => {
  assert.equal(fileIdFromHtml("<title>File 106302 - MegaPlay</title>"), "106302");
});

test("parses anime tooltip data", () => {
  const data = parseTooltip(`
    <span class="type">TV</span>
    <div class="name" data-jp="Zero no Tsukaima">The Familiar of Zero</div>
    <div class="subtitle">The Familiar of Zero; Zero no Tsukaima</div>
    <div class="info">
      <span class="mr-2"><i></i> 7.36</span>
      <div class="dub-sub-total"><span class="sub">13</span><span class="dub">13</span><span class="total">13</span></div>
    </div>
    <div class="detail">
      <div class="desc">Louise Françoise Le Blanc de La Vallière is a self-absorbed mage.</div>
      <div class="meta">
        <div>Scores: <span>7.36</span></div>
        <div>Aired: <span>Jul 3, 2006 to Sep 25, 2006</span></div>
        <div>Status: <span>Finished Airing</span></div>
        <div>Genre: <span><a href="https://anisuge.tv/genre/action">Action</a></span></div>
      </div>
    </div>
    <div class="watchnow-btn"><a href="https://anisuge.tv/watch/the-familiar-of-zero-fzbfz">Watch Now</a></div>
  `, "390");

  assert.equal(data.numericId, "390");
  assert.equal(data.id, "the-familiar-of-zero-fzbfz");
  assert.equal(data.name, "The Familiar of Zero");
  assert.equal(data.score, "7.36");
  assert.equal(data.status, "Finished Airing");
  assert.equal(data.genres[0].name, "Action");
});

test("parses anime detail media info", () => {
  const data = parseAnimeDetail(`
    <section class="watch-wrap" data-id="692" data-url="https://anisuge.tv/watch/chivalry-of-a-failed-knight-x7zgz"></section>
    <div id="media-info">
      <div class="poster"><img src="https://example.com/poster.jpg" /></div>
      <div class="maindata">
        <p>Rakudai Kishi no Cavalry</p>
        <h1 class="title" data-jp="Rakudai Kishi no Cavalry">Chivalry of a Failed Knight</h1>
        <div class="status">
          <span class="type">TV</span><span class="rating">R</span><span class="quality">HD</span>
          <div class="dub-sub-total"><span class="sub">12</span><span class="dub">12</span><span class="total">12</span></div>
        </div>
        <div class="description"><div class="full"><div>Full description.</div></div></div>
      </div>
      <div class="meta">
        <div><div>Status:</div><span>Finished Airing</span></div>
        <div><div>Genre:</div><span><a href="/genre/action">Action</a>, <a href="/genre/fantasy">Fantasy</a></span></div>
      </div>
    </div>
  `, "chivalry-of-a-failed-knight-x7zgz");

  assert.equal(data.numericId, "692");
  assert.equal(data.name, "Chivalry of a Failed Knight");
  assert.equal(data.japaneseName, "Rakudai Kishi no Cavalry");
  assert.equal(data.status, "Finished Airing");
  assert.equal(data.genre[0].name, "Action");
});

test("parses more seasons swiper data", () => {
  const seasons = parseMoreSeasons(`
    <div class="swiper-wrapper">
      <a href="https://anisuge.tv/watch/love-chunibyo-other-delusions-2nd-season-heart-throb-bfx04" class="swiper-slide active">
        <div class="swiper-banner" style="background-image: url(https://example.com/poster.jpg);"></div>
        <span>Season 2</span>
      </a>
    </div>
  `);

  assert.equal(seasons[0].id, "love-chunibyo-other-delusions-2nd-season-heart-throb-bfx04");
  assert.equal(seasons[0].name, "Season 2");
  assert.equal(seasons[0].poster, "https://example.com/poster.jpg");
  assert.equal(seasons[0].active, true);
});

test("parses menu genre and type links", () => {
  const html = `
    <div id="unix-head-menu"><ul>
      <li class="have-sub"><a>Genres</a><ul><li><a href="/genre/action">Action</a></li></ul></li>
      <li class="have-sub"><a>Types</a><ul><li><a href="/type/movie">MOVIE</a></li></ul></li>
    </ul></div>
  `;

  assert.deepEqual(parseMenuLinks(html, "genres")[0], {
    id: "action",
    name: "Action",
    url: "https://anisuge.tv/genre/action",
  });
  assert.deepEqual(parseMenuLinks(html, "types")[0], {
    id: "movie",
    name: "MOVIE",
    url: "https://anisuge.tv/type/movie",
  });
});

test("builds dynamic page paths", () => {
  assert.equal(pagePath("/genre/:id", "action"), "/genre/action");
});

test("parses anime search items", () => {
  const items = parseSearchItems(`
    <div class="original anime search-card">
      <a class="item" href="https://anisuge.tv/watch/loner-life-in-another-world-g9rqp">
        <div class="poster"><img src="https://example.com/poster.jpg"></div>
        <div class="detail">
          <div class="name" data-jp="Hitoribocchi no Isekai Kouryaku">Loner Life in Another World</div>
          <div class="subname">Loner Life in Another World; Hitoribocchi no Isekai Kouryaku</div>
          <div class="info">
            <span class="rating mini-status">PG-13</span>
            <span class="dot">6.23</span>
            <span class="dot">TV</span>
            <span class="dot">Oct 4, 2024 to Dec 13, 2024</span>
          </div>
        </div>
      </a>
    </div>
  `);

  assert.equal(items[0].id, "loner-life-in-another-world-g9rqp");
  assert.equal(items[0].name, "Loner Life in Another World");
  assert.equal(items[0].score, "6.23");
  assert.equal(items[0].type, "TV");
});

test("parses filter options and appends array query", () => {
  const options = parseFilterOptions(`
    <form class="sorters">
      <input name="keyword" value="">
      <input type="checkbox" name="term_type[]" value="Movie"><label>Movie</label>
      <input type="checkbox" name="genre[]" value="1"><label>Action</label>
      <input type="radio" name="country" value=""><label>All</label>
      <input type="checkbox" name="year[]" value="2026"><label>2026</label>
      <input type="radio" name="sort" value="latest-updated"><label>Latest Updated</label>
    </form>
  `);
  assert.equal(options.term_type[0].id, "Movie");
  assert.equal(options.genre[0].name, "Action");
  assert.equal(options.year[0].id, "2026");

  const url = new URL("https://anisuge.tv/filter");
  appendQuery(url, { "genre[]": ["1", "46"], sort: "latest-updated", page: "2" });
  assert.equal(url.searchParams.getAll("genre[]").join(","), "1,46");
  assert.equal(url.searchParams.get("sort"), "latest-updated");
  assert.equal(url.searchParams.has("page"), false);
});
