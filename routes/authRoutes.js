const express = require("express");
const router = express.Router();
module.exports = router;
const {
    registerUser,
    loginUser,
    refreshToken,
    forgotPassword,
    resetPassword,
    logoutUser,
    createAdmin
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");


router.post("/logout", logoutUser);
//router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/refresh", refreshToken);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

router.post(
    "/create-admin",
    protect,
    authorizeRoles("superadmin"),
    createAdmin
);

module.exports = router;