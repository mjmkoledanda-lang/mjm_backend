require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const accountsRoutes = require("./routes/accountsRoutes");

connectDB();

const app = express();

// ===============================
// GLOBAL MIDDLEWARE (TOP)
// ===============================

app.use(cors({
    origin: true,       // reflect request origin automatically
    credentials: true
}));

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
app.use("/api/accounts", accountsRoutes);
app.use("/api/income", require("./routes/incomeRoutes"));
app.use("/api/expense", require("./routes/expenseRoutes"));
app.use("/api/custom-payments", require("./routes/customPaymentRoutes"));
app.use("/api/sms", require("./routes/smsRoutes"));

// ===============================
// START SERVER (LAST LINE ONLY)
// ===============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});