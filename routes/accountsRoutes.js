const express = require("express");
const router = express.Router();
const { getAccounts } = require("../controllers/accountsController");

router.get("/:year/:month", getAccounts);

module.exports = router;