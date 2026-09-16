const express = require("express");
const { getMenu } = require("./shared");

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const menu = await getMenu();
    res.json({
      source: menu.source,
      cachedAt: menu.cachedAt,
      expiresAt: menu.expiresAt,
      items: menu.genres,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
  }
});

module.exports = router;
