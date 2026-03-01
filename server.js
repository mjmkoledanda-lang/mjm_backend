require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");

// Connect Database
connectDB();

// Initialize app
const app = express();

// ===============================
// MIDDLEWARE
// ===============================


app.use(cors({
    origin: function (origin, callback) {
        const allowedOrigins = [
            "http://localhost:3000",
            "https://mjmk.vercel.app"
        ];

        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.use(express.json());

// ===============================
// TEST ROUTES
// ===============================
app.get("/", (req, res) => {
    res.send("API Running...");
});

app.get("/api", (req, res) => {
    res.json({ message: "API Working ✅" });
});

// ===============================
// ROUTES
// ===============================

// Families
const familyRoutes = require("./routes/familyRoutes");
app.use("/api/families", familyRoutes);

// Members  ✅ (🔥 THIS WAS MISSING)
const memberRoutes = require("./routes/memberRoutes");
app.use("/api/members", memberRoutes);


// Payments
const paymentRoutes = require("./routes/paymentRoutes");
app.use("/api/payments", paymentRoutes);

// Reports
const reportRoutes = require("./routes/reportRoutes");
app.use("/api/reports", reportRoutes);

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
app.use("/api/families", require("./routes/familyRoutes"));



app.use(helmet());
app.use(cookieParser());

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

// app.use(rateLimit({
//     windowMs: 15 * 60 * 1000,
//     max: 100
// }));

const authRoutes = require("./routes/authRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/families", familyRoutes);