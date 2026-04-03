require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const path = require("path");
const app = express();
const dashboardRoutes = require("./routes/dashboardRoutes");


app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is running"
    });
});

// ===============================
// CONNECT DATABASE
// ===============================
connectDB();



// ===============================
// 🔐 HELMET
// ===============================
app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);

// ===============================
// 🌐 CORS CONFIG
// ===============================
// ===============================
// 🌐 CORS CONFIG
// ===============================
const allowedOrigins = [
    "https://mjmk.lk",
    "https://www.mjmk.lk",
    "https://admin.mjmk.lk",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://192.168.8.187:8081",
    "exp://192.168.8.187:8081"
];

app.use(
    cors({
        origin: (origin, callback) => {

            // allow mobile apps, expo, postman
            if (!origin) return callback(null, true);

            if (
                allowedOrigins.includes(origin) ||
                origin.startsWith("exp://") ||
                origin.startsWith("http://192.168.")
            ) {
                return callback(null, true);
            }

            console.log("❌ CORS Blocked:", origin);
            return callback(new Error("Not allowed by CORS"));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// ===============================
// 📦 BODY PARSERS
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===============================
// 📁 STATIC FILES
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
app.use("/api/qr", require("./routes/qrRoutes"));

app.use("/api/qurban", require("./routes/qurbanRoutes"));

app.use("/api/kanji", require("./routes/kanjiRoutes"));
app.use("/api/qr", require("./routes/qrRoutes"));
app.use("/api/dashboard", dashboardRoutes);


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
    console.error("🔥 Error:", err);

    if (err.message === "Not allowed by CORS") {
        return res.status(403).json({
            success: false,
            message: "CORS Error: Origin not allowed",
        });
    }

    res.status(500).json({
        success: false,
        message: err.message || "Server Error",
    });
});

// ===============================
// 🚀 START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});