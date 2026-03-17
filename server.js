require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const accountsRoutes = require("./routes/accountsRoutes");
const path = require("path");

connectDB();

const app = express();

// ===============================
// 🔥 HELMET FIX (VERY IMPORTANT)
// ===============================
app.use(
    helmet({
        crossOriginResourcePolicy: false // ✅ FIX IMAGE BLOCK
    })
);

// ===============================
// ✅ CORS
// ===============================
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    credentials: true
}));

// ===============================
// ✅ BODY PARSERS
// ===============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// ===============================
// 🔥 STATIC UPLOADS (FIXED)
// ===============================
app.use("/uploads", (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Cross-Origin-Resource-Policy", "cross-origin"); // 🔥 CRITICAL
    next();
}, express.static(path.join(__dirname, "uploads")));

// ===============================
// ✅ ROUTES
// ===============================
app.use("/api/public", require("./routes/publicRoutes"));
app.use("/api/posts", require("./routes/postRoutes"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/families", require("./routes/familyRoutes"));
app.use("/api/members", require("./routes/memberRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/accounts", accountsRoutes);
app.use("/api/income", require("./routes/incomeRoutes"));
app.use("/api/expense", require("./routes/expenseRoutes"));
app.use("/api/custom-payments", require("./routes/customPaymentRoutes"));
app.use("/api/sms", require("./routes/smsRoutes"));

// ===============================
// TEST ROUTE
// ===============================
app.get("/", (req, res) => {
    res.send("API Running...");
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});