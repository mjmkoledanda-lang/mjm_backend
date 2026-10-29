const express = require("express");
const router = express.Router();
const {
    getAccounts,
    updatePaymentAccount,
    deletePaymentAccount
} = require("../controllers/accountsController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(authorizeRoles("superadmin", "admin"));

router.get("/:year/:month", getAccounts);
router.put("/payment/:date", updatePaymentAccount);
router.delete("/payment/:date", deletePaymentAccount);

module.exports = router;
