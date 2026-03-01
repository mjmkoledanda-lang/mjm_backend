const express = require("express");
const router = express.Router();

const { getMonthlyReport } = require("../controllers/reportController");

// GET /api/reports/monthly/:year
router.get("/monthly/:year", getMonthlyReport);

module.exports = router;