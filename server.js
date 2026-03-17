require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const path = require("path");

// Connect Database
connectDB();

const app = express();

// ===============================
// 🔐 HELMET CONFIG
// ===============================
app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);

// ===============================
// 🌐 CORS CONFIG (FIXED)
// ===============================
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://mjmk.vercel.app", // ✅ FIXED DOMAIN
    "https://kmjm.vercel.app", // ✅ FIXED DOMAIN
];

app.use(
    cors({
        origin: (origin, callback) => {
            // allow requests like Postman / mobile apps (no origin)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            } else {
                console.error("❌ CORS Blocked:", origin);
                return callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

// ===============================
// 📦 BODY PARSERS
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===============================
// 📁 STATIC FILES (UPLOADS FIX)
// ===============================
app.use(
    "/uploads",
    (req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Cross-Origin-Resource-Policy", "cross-origin");
        next();
    },
    express.static(path.join(__dirname, "uploads"))
);

// ===============================
// 📡 ROUTES
// ===============================
app.use("/api/public", require("./routes/publicRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/families", require("./routes/familyRoutes"));
app.use("/api/members", require("./routes/memberRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/accounts", require("./routes/accountsRoutes"));
app.use("/api/income", require("./routes/incomeRoutes"));
app.use("/api/expense", require("./routes/expenseRoutes"));
app.use("/api/custom-payments", require("./routes/customPaymentRoutes"));
app.use("/api/sms", require("./routes/smsRoutes"));

// ===============================
// 🧪 TEST ROUTE
// ===============================
app.get("/", (req, res) => {
    res.send("✅ API Running...");
});

// ===============================
// ❌ GLOBAL ERROR HANDLER
// ===============================
app.use((err, req, res, next) => {
    console.error("🔥 Error:", err.message);

    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "CORS Error: Origin not allowed",
        });
    }

    res.status(500).json({
        success: false,
        message: "Server Error",
    });
});

// ===============================
// 🚀 START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});