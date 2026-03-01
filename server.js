require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

connectDB();

const app = express();

// ===============================
// GLOBAL MIDDLEWARE (TOP ONLY)
// ===============================

app.use(cors({
    origin: (origin, callback) => {
        if (
            !origin ||
            origin.includes("vercel.app") ||
            origin.includes("localhost")
        ) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.options("*", cors());

app.use(express.json());
app.use(cookieParser());
app.use(helmet());

// ===============================
// TEST ROUTE
// ===============================

app.get("/", (req, res) => {
    res.send("API Running...");
});

// ===============================
// ROUTES
// ===============================

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/families", require("./routes/familyRoutes"));
app.use("/api/members", require("./routes/memberRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));

// ===============================
// START SERVER (LAST LINE ONLY)
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});