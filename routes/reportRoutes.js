const express = require("express");
const router = express.Router();

const {
    getMonthlyReport,
    getDailyRolePaymentReport
} = require("../controllers/reportController");

// Monthly report
router.get("/monthly/:year", getMonthlyReport);

// 🔥 NEW ROUTE
router.get("/daily-role", getDailyRolePaymentReport);

module.exports = router;