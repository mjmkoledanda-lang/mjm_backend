const express = require("express");
const router = express.Router();
const { getDashboardStats, getKanjiDailyCounts} = require("../controllers/dashboardController");

router.get("/stats", getDashboardStats);

router.get("/kanji-daily", getKanjiDailyCounts);

module.exports = router;