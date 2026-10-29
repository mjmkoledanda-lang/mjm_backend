const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const {
    registerUser,
    loginUser,
    setupPhoneAndSendOTP,
    verifyLoginOTP,
    resendLoginOTP,
    refreshToken,
    forgotPassword,
    resetPassword,
    logoutUser,
    createAdmin,
    getAdmins,
    updateAdminPhone
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// ============================================
// SECURITY: Rate limiters for auth endpoints
// ============================================
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // max 20 login attempts per 15 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please wait 15 minutes before trying again." }
});

const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // max 10 OTP verifications per 10 min per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many verification attempts. Please wait 10 minutes." }
});

// Auth & OTP Routes
router.post("/login", authLimiter, loginUser);
router.post("/setup-phone", authLimiter, setupPhoneAndSendOTP);
router.post("/verify-login-otp", otpLimiter, verifyLoginOTP);
router.post("/resend-login-otp", otpLimiter, resendLoginOTP);

router.post("/logout", logoutUser);
router.post("/refresh", refreshToken);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Superadmin Management
router.post(
    "/create-admin",
    protect,
    authorizeRoles("superadmin"),
    createAdmin
);

router.get(
    "/admins",
    protect,
    authorizeRoles("superadmin"),
    getAdmins
);

router.put(
    "/admin/:adminId/phone",
    protect,
    authorizeRoles("superadmin"),
    updateAdminPhone
);

module.exports = router;