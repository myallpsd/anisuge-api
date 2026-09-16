const express = require("express");
const detail = require("./detail");
const list = require("./list");
const search = require("./search");
const tooltip = require("./tooltip");

const router = express.Router();

router.use("/detail", detail.router);
router.use("/list", list.router);
router.use("/search", search.router);
router.use("/tooltip", tooltip.router);

module.exports = router;
