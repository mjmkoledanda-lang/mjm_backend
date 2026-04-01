const router = require("express").Router();

const { protect } = require("../middleware/authMiddleware");

const {
    getKanjiStatus,
    takeKanji
} = require("../controllers/kanjiController");

router.get("/:familyId", protect, getKanjiStatus);

router.post("/take", protect, takeKanji);

module.exports = router;