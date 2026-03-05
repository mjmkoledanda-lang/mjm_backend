const express = require("express");
const router = express.Router();
const { getAccounts } = require("../controllers/accountsController");

router.get("/accounts/:year/:month/:day", getAccounts);

module.exports = router;