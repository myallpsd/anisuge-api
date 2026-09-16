const express = require("express");
const updatedSubRouter = require("./updated-sub");
const updatedAllRouter = require("./updated-all");
const trendingRouter = require("./trending");
const updatedDubRouter = require("./updated-dub");
const randomRouter = require("./random");

const router = express.Router();

router.use("/updated-sub", updatedSubRouter);
router.use("/updated-all", updatedAllRouter);
router.use("/trending", trendingRouter);
router.use("/updated-dub", updatedDubRouter);
router.use("/random", randomRouter);

module.exports = router;
