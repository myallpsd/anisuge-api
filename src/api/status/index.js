const express = require("express");
const finishedAiringRouter = require("./finished-airing");
const currentlyAiringRouter = require("./currently-airing");

const router = express.Router();

router.use("/finished-airing", finishedAiringRouter);
router.use("/currently-airing", currentlyAiringRouter);

module.exports = router;
