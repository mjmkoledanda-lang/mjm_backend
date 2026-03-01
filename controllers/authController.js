const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

// =======================
// Create Admin
// =======================

exports.createAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const exists = await User.findOne({ email });
        if (exists)
            return res.status(400).json({ message: "Admin already exists" });

        const hashed = await bcrypt.hash(password, 12);

        await User.create({
            name,
            email,
            password: hashed,
            role: "admin"
        });

        res.status(201).json({
            message: "Admin created successfully"
        });

    } catch (error) {
        res.status(500).json({ message: "Create admin failed" });
    }
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
// Register User
// =======================

exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const exists = await User.findOne({ email });
        if (exists)
            return res.status(400).json({ message: "User already exists" });

        const hashed = await bcrypt.hash(password, 12);

        await User.create({
            name,
            email,
            password: hashed,
            role
        });

        res.status(201).json({ message: "User created successfully" });

    } catch (error) {
        res.status(500).json({ message: "Registration failed" });
    }
};

// =======================
// Login (No Lock System)
// =======================

exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user)
            return res.status(401).json({ message: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.password);

        if (!match)
            return res.status(401).json({ message: "Invalid credentials" });

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite:
                process.env.NODE_ENV === "production" ? "none" : "lax"
        });

        res.json({
            accessToken,
            name: user.name,
            role: user.role
        });

    } catch (error) {
        res.status(500).json({ message: "Login failed" });
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