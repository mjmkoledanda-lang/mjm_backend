const router = require("express").Router();

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
    generateQR,
    generateAllQR
} = require("../controllers/qrController");

router.post(
    "/generate/:id",
    protect,
    authorizeRoles("superadmin", "admin"),
    generateQR
);

router.post(
    "/generate-all",
    protect,
    authorizeRoles("superadmin", "admin"),
    generateAllQR
);

module.exports = router;