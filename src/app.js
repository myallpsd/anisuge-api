const express = require("express");
const animeRouter = require("./api/anime");
const { openapi, swaggerUi } = require("./docs");
const filterRouter = require("./api/filter").router;
const genreRouter = require("./api/genre");
const homeRouter = require("./api/home");
const latestUpdatedRouter = require("./api/latest-updated");
const mostViewedRouter = require("./api/most-viewed");
const newReleaseRouter = require("./api/new-release");
const producerRouter = require("./api/producer");
const serverRouter = require("./api/server");
const statusRouter = require("./api/status");
const studioRouter = require("./api/studio");
const typeRouter = require("./api/type");
const widgetRouter = require("./api/widget");
const genresRouter = require("./api/menu/genres");
const typesRouter = require("./api/menu/types");

const app = express();

app.use((_req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.get("/", (_req, res) => {
  res.json({
    message: "AnimeSuge sections API",
    endpoint: "/api/home-sections",
    docs: "/docs",
  });
});

app.get("/docs.json", (_req, res) => res.json(openapi));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapi));

app.use("/api", homeRouter);
app.use("/api/anime", animeRouter);
app.use("/api/filter", filterRouter);
app.use("/api/genres", genresRouter);
app.use("/api/types", typesRouter);
app.use("/api/genre/:id", genreRouter);
app.use("/api/latest-updated", latestUpdatedRouter);
app.use("/api/new-release", newReleaseRouter);
app.use("/api/most-viewed", mostViewedRouter);
app.use("/api/producer/:id", producerRouter);
app.use("/api/server", serverRouter);
app.use("/api/status", statusRouter);
app.use("/api/studio/:id", studioRouter);
app.use("/api/type/:id", typeRouter);
app.use("/api/widget", widgetRouter);

module.exports = app;
