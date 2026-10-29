const router = require("express").Router();

const { protect } = require("../middleware/authMiddleware");

const {
    getQurbanStatus,
    takeQurban
} = require("../controllers/qurbanController");

router.get("/:familyId", protect, getQurbanStatus);

router.post("/take", protect, takeQurban);

module.exports = router;