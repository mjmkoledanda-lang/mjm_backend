const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendSMS = require("../utils/sendSMS");

// Helper: Clean Sri Lankan mobile number
const cleanPhone = (raw) => {
    if (!raw) return "";
    let p = String(raw).replace(/\D/g, "");
    if (p.startsWith("0")) {
        p = "94" + p.slice(1);
    }
    return p;
};

// Helper: Mask phone number for security
const maskPhone = (phone) => {
    if (!phone || phone.length < 4) return "registered phone";
    return phone.slice(0, 4) + " *** **" + phone.slice(-2);
};

// =======================
// Token Generators
// =======================

const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
};

// =======================
// Create Admin
// =======================

exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email, and password are required" });
        }

        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if (exists)
            return res.status(400).json({ message: "Admin with this email already exists" });

        let formattedPhone = "";
        if (phone) {
            formattedPhone = cleanPhone(phone);
            if (!formattedPhone.startsWith("94") || formattedPhone.length !== 11) {
                return res.status(400).json({
                    message: "Invalid phone format. Please enter a valid Sri Lankan mobile number (e.g. 07XXXXXXXX or 947XXXXXXXX)"
                });
            }
        }

        const hashed = await bcrypt.hash(password, 12);

        await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashed,
            role: "admin",
            phone: formattedPhone
        });

        res.status(201).json({
            message: "Admin created successfully"
        });

    } catch (error) {
        console.error("Create admin error:", error);
        res.status(500).json({ message: "Create admin failed" });
    }
};

// =======================
// Register User (Internal)
// =======================

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        const exists = await User.findOne({ email: email.toLowerCase().trim() });
        if (exists)
            return res.status(400).json({ message: "User already exists" });

        const hashed = await bcrypt.hash(password, 12);

        await User.create({
            name,
            email: email.toLowerCase().trim(),
            password: hashed,
            role: role || "admin",
            phone: phone ? cleanPhone(phone) : ""
        });

        res.status(201).json({ message: "User created successfully" });

    } catch (error) {
        res.status(500).json({ message: "Registration failed" });
    }
};

// =======================
// Login - Step 1 (Mandatory 2FA OTP)
// =======================

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });

        if (!user) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Case A: User has no phone set up for 2FA OTP
        if (!user.phone) {
            return res.status(200).json({
                requirePhoneSetup: true,
                email: user.email,
                name: user.name,
                message: "No contact number is linked to your admin account. Please provide your mobile number to receive your login OTP."
            });
        }

        // Case B: Generate 6-digit OTP and send via Notify.lk SMS
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.loginOtp = otp;
        user.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        user.otpAttempts = 0;
        await user.save();

        const masked = maskPhone(user.phone);

        try {
            await sendSMS(
                user.phone,
                `Your MJM Admin login OTP is ${otp}. Valid for 10 minutes. Do not share this code.`
            );
            console.log(`[AUTH 2FA] OTP SMS successfully dispatched to ${user.email} (${user.phone})`);
        } catch (smsError) {
            console.error(`[AUTH 2FA ERROR] SMS dispatch failed for ${user.phone}:`, smsError.message);
            // Console backup log so admin is never locked out during network/gateway downtime
            console.log(`[AUTH 2FA BACKUP] Temporary OTP for ${user.email}: ${otp}`);
        }

        return res.status(200).json({
            otpRequired: true,
            email: user.email,
            phone: masked,
            message: `A 6-digit verification code has been sent via SMS to ${masked}.`
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
    }
};

// =======================
// Setup Phone & Send OTP
// =======================

exports.setupPhoneAndSendOTP = async (req, res) => {
    try {
        const { email, password, phone } = req.body;

        if (!email || !password || !phone) {
            return res.status(400).json({
                message: "Email, password, and mobile number are required"
            });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: "Invalid password confirmation" });
        }

        const formatted = cleanPhone(phone);
        if (!formatted.startsWith("94") || formatted.length !== 11) {
            return res.status(400).json({
                message: "Please enter a valid Sri Lankan mobile number (e.g. 07XXXXXXXX or 947XXXXXXXX)"
            });
        }

        user.phone = formatted;

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.loginOtp = otp;
        user.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.otpAttempts = 0;
        await user.save();

        const masked = maskPhone(formatted);

        try {
            await sendSMS(
                user.phone,
                `Your MJM Admin login OTP is ${otp}. Valid for 10 minutes. Do not share this code.`
            );
            console.log(`[AUTH 2FA] Phone setup OTP SMS dispatched to ${user.email} (${user.phone})`);
        } catch (smsError) {
            console.error(`[AUTH 2FA ERROR] SMS dispatch failed:`, smsError.message);
            console.log(`[AUTH 2FA BACKUP] Temporary OTP for ${user.email}: ${otp}`);
        }

        return res.status(200).json({
            otpRequired: true,
            email: user.email,
            phone: masked,
            message: `Contact number registered! A 6-digit verification code has been sent to ${masked}.`
        });

    } catch (error) {
        console.error("Setup phone error:", error);
        res.status(500).json({ message: "Failed to setup phone number" });
    }
};

// =======================
// Verify Login OTP - Step 2
// =======================

exports.verifyLoginOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP verification code are required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: "User account not found" });
        }

        if (!user.loginOtp || !user.loginOtpExpires) {
            return res.status(400).json({ message: "No active OTP request found. Please login again." });
        }

        if (Date.now() > new Date(user.loginOtpExpires).getTime()) {
            user.loginOtp = null;
            user.loginOtpExpires = null;
            await user.save();
            return res.status(400).json({ message: "Verification code has expired. Please request a new code." });
        }

        if (user.otpAttempts >= 5) {
            user.loginOtp = null;
            user.loginOtpExpires = null;
            user.otpAttempts = 0;
            await user.save();
            return res.status(429).json({ message: "Too many incorrect OTP attempts. Please login again." });
        }

        if (user.loginOtp !== String(otp).trim()) {
            user.otpAttempts = (user.otpAttempts || 0) + 1;
            await user.save();
            const remaining = 5 - user.otpAttempts;
            return res.status(400).json({
                message: `Invalid verification code. ${remaining > 0 ? remaining + " attempt(s) remaining." : "Please login again."}`
            });
        }

        // OTP Verified successfully!
        user.loginOtp = null;
        user.loginOtpExpires = null;
        user.otpAttempts = 0;

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        });

        res.json({
            accessToken,
            name: user.name,
            role: user.role
        });

    } catch (error) {
        console.error("Verify OTP error:", error);
        res.status(500).json({ message: "OTP verification failed" });
    }
};

// =======================
// Resend Login OTP
// =======================

exports.resendLoginOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user || !user.phone) {
            return res.status(400).json({ message: "Cannot resend OTP. User or registered phone number not found." });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.loginOtp = otp;
        user.loginOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.otpAttempts = 0;
        await user.save();

        const masked = maskPhone(user.phone);

        try {
            await sendSMS(
                user.phone,
                `Your new MJM Admin login OTP is ${otp}. Valid for 10 minutes. Do not share this code.`
            );
            console.log(`[AUTH 2FA] Resent OTP to ${user.email} (${user.phone})`);
        } catch (smsError) {
            console.error(`[AUTH 2FA ERROR] Resend SMS failed:`, smsError.message);
            console.log(`[AUTH 2FA BACKUP] Temporary OTP for ${user.email}: ${otp}`);
        }

        res.json({
            success: true,
            phone: masked,
            message: `A new OTP verification code has been sent to ${masked}`
        });

    } catch (error) {
        console.error("Resend OTP error:", error);
        res.status(500).json({ message: "Failed to resend OTP" });
    }
};

// =======================
// Admin Management (Superadmin)
// =======================

exports.getAdmins = async (req, res) => {
    try {
        const admins = await User.find().select("name email role phone createdAt").sort({ createdAt: -1 });
        res.json(admins);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch admins" });
    }
};

exports.updateAdminPhone = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { phone } = req.body;

        const formatted = cleanPhone(phone);
        if (!formatted.startsWith("94") || formatted.length !== 11) {
            return res.status(400).json({ message: "Invalid phone number format. Must be a valid Sri Lankan mobile number." });
        }

        const updated = await User.findByIdAndUpdate(
            adminId,
            { phone: formatted },
            { new: true }
        ).select("name email role phone");

        if (!updated) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.json({ success: true, message: "Admin contact phone updated successfully", admin: updated });
    } catch (error) {
        res.status(500).json({ message: "Failed to update phone" });
    }
};

// =======================
// Refresh Token
// =======================

exports.refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (!token)
            return res.status(401).json({ message: "No refresh token" });

        const decoded = jwt.verify(
            token,
            process.env.JWT_REFRESH_SECRET
        );

        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== token)
            return res.status(401).json({ message: "Invalid refresh token" });

        const newAccessToken = generateAccessToken(user);

        res.json({
            accessToken: newAccessToken,
            name: user.name,
            role: user.role
        });

    } catch (error) {
        res.status(401).json({ message: "Invalid refresh token" });
    }
};

// =======================
// Logout
// =======================

exports.logoutUser = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (token) {
            const user = await User.findOne({ refreshToken: token });
            if (user) {
                user.refreshToken = null;
                await user.save();
            }
        }

        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production" ? "none" : "lax"
        });

        res.json({ message: "Logged out successfully" });

    } catch (error) {
        res.status(500).json({ message: "Logout failed" });
    }
};

// =======================
// Forgot Password
// =======================

exports.forgotPassword = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user)
            return res.status(404).json({ message: "User not found" });

        const resetToken = crypto.randomBytes(32).toString("hex");

        user.resetPasswordToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        user.resetPasswordExpire =
            Date.now() + 10 * 60 * 1000;

        await user.save();

        console.log(
            `Reset Link: http://localhost:3000/reset/${resetToken}`
        );

        res.json({ message: "Reset link generated" });

    } catch (error) {
        res.status(500).json({ message: "Forgot password failed" });
    }
};

// =======================
// Reset Password
// =======================

exports.resetPassword = async (req, res) => {
    try {
        const hashedToken = crypto
            .createHash("sha256")
            .update(req.params.token)
            .digest("hex");

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() }
        });

        if (!user)
            return res.status(400).json({
                message: "Token invalid or expired"
            });

        user.password = await bcrypt.hash(
            req.body.password,
            12
        );

        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.json({ message: "Password reset successful" });

    } catch (error) {
        res.status(500).json({ message: "Reset failed" });
    }
};