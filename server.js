require("dotenv").config();

const dns = require("node:dns");

// =====================================================
// DNS CONFIGURATION
// =====================================================

dns.setServers([
    "1.1.1.1",
    "8.8.8.8",
]);

// =====================================================
// IMPORTS
// =====================================================

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const path = require("path");

const connectDB = require("./config/db");

// =====================================================
// ROUTES
// =====================================================

const dashboardRoutes =
    require("./routes/dashboardRoutes");

const publicRoutes =
    require("./routes/publicRoutes");

const dialogPaymentRoutes =
    require("./routes/dialogPaymentRoutes");

const postRoutes =
    require("./routes/postRoutes");

const authRoutes =
    require("./routes/authRoutes");

const familyRoutes =
    require("./routes/familyRoutes");

const memberRoutes =
    require("./routes/memberRoutes");

const paymentRoutes =
    require("./routes/paymentRoutes");

const reportRoutes =
    require("./routes/reportRoutes");

const accountsRoutes =
    require("./routes/accountsRoutes");

const incomeRoutes =
    require("./routes/incomeRoutes");

const expenseRoutes =
    require("./routes/expenseRoutes");

const customPaymentRoutes =
    require("./routes/customPaymentRoutes");

const smsRoutes =
    require("./routes/smsRoutes");

const qrRoutes =
    require("./routes/qrRoutes");

const qurbanRoutes =
    require("./routes/qurbanRoutes");

const kanjiRoutes =
    require("./routes/kanjiRoutes");

// =====================================================
// NASHA ROUTES
// =====================================================

const nashaRoutes =
    require("./routes/nashaRoutes");

const nashaQRRoutes =
    require("./routes/nashaQRRoutes");

const nashaReceiptRoutes =
    require("./routes/nashaReceiptRoutes");

const adRoutes =
    require("./routes/adRoutes");

// =====================================================
// APP
// =====================================================

const app = express();

// =====================================================
// SECURITY - HELMET
// =====================================================

app.use(
    helmet({
        crossOriginResourcePolicy: false,
    })
);

// =====================================================
// CORS CONFIGURATION
// =====================================================

const allowedOrigins = [
    // Production
    "https://mjmk.lk",
    "https://www.mjmk.lk",
    "https://admin.mjmk.lk",

    // Local development
    "http://localhost:3000",
    "http://localhost:5173",

    // React Native / Expo
    "http://192.168.8.187:8081",
    "exp://192.168.8.187:8081",
];

// =====================================================
// CORS MIDDLEWARE
// =====================================================

app.use(
    cors({
        origin: (origin, callback) => {

            // Postman / server-to-server
            if (!origin) {
                return callback(null, true);
            }

            // Explicitly allowed origins
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            // Expo development
            if (origin.startsWith("exp://")) {
                return callback(null, true);
            }

            // Local network development
            if (
                origin.startsWith(
                    "http://192.168."
                )
            ) {
                return callback(null, true);
            }

            console.log(
                "❌ CORS Blocked:",
                origin
            );

            return callback(
                new Error(
                    "Not allowed by CORS"
                )
            );
        },

        credentials: true,

        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE",
            "PATCH",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],
    })
);

// =====================================================
// BODY PARSERS
// =====================================================

app.use(
    express.json({
        limit: "10mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "10mb",
    })
);

app.use(cookieParser());

// =====================================================
// STATIC UPLOADS
// =====================================================

app.use(
    "/uploads",

    (req, res, next) => {
        res.header(
            "Access-Control-Allow-Origin",
            "*"
        );

        res.header(
            "Cross-Origin-Resource-Policy",
            "cross-origin"
        );

        next();
    },

    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get(
    "/api/health",
    (req, res) => {
        res.status(200).json({
            success: true,
            status: "OK",
            message: "Server is running",
            timestamp:
                new Date().toISOString(),
        });
    }
);

// =====================================================
// API ROUTES
// =====================================================

// =====================================================
// PUBLIC
// =====================================================

app.use(
    "/api/public",
    publicRoutes
);

app.use(
    "/api/public/dialog-ipg",
    dialogPaymentRoutes
);

app.use(
    "/api/dialog-ipg",
    dialogPaymentRoutes
);

// =====================================================
// POSTS
// =====================================================

app.use(
    "/api/posts",
    postRoutes
);

// =====================================================
// AUTHENTICATION
// =====================================================

app.use(
    "/api/auth",
    authRoutes
);

// =====================================================
// FAMILY MANAGEMENT
// =====================================================

app.use(
    "/api/families",
    familyRoutes
);

app.use(
    "/api/members",
    memberRoutes
);

// =====================================================
// PAYMENTS
// =====================================================

app.use(
    "/api/payments",
    paymentRoutes
);

app.use(
    "/api/custom-payments",
    customPaymentRoutes
);

// =====================================================
// FINANCIAL REPORTS
// =====================================================

app.use(
    "/api/reports",
    reportRoutes
);

app.use(
    "/api/accounts",
    accountsRoutes
);

app.use(
    "/api/income",
    incomeRoutes
);

app.use(
    "/api/expense",
    expenseRoutes
);

// =====================================================
// SMS
// =====================================================

app.use(
    "/api/sms",
    smsRoutes
);

// =====================================================
// GENERAL QR
// =====================================================

app.use(
    "/api/qr",
    qrRoutes
);

// =====================================================
// QURBAN
// =====================================================

app.use(
    "/api/qurban",
    qurbanRoutes
);

// =====================================================
// KANJI
// =====================================================

app.use(
    "/api/kanji",
    kanjiRoutes
);

// =====================================================
// ADVERTISEMENTS & TV DISPLAY
// =====================================================

app.use(
    "/api/ads",
    adRoutes
);

// =====================================================
// NASHA TICKET SYSTEM
// =====================================================
//
// POST /api/nasha
// GET  /api/nasha
// GET  /api/nasha/:id
// GET  /api/nasha/reports/summary
//
// =====================================================

app.use(
    "/api/nasha",
    nashaRoutes
);

// =====================================================
// NASHA QR SYSTEM
// =====================================================
//
// POST /api/nasha-qr/generate
// GET  /api/nasha-qr
// GET  /api/nasha-qr/available
// GET  /api/nasha-qr/:id
// GET  /api/nasha-qr/:id/image
// GET  /api/nasha-qr/scan/:token
// POST /api/nasha-qr/print
// POST /api/nasha-qr/:id/issue-qr
// POST /api/nasha-qr/:id/issue-nasha
// POST /api/nasha-qr/:id/cancel
// PUT  /api/nasha-qr/:id
// GET  /api/nasha-qr/reports/summary
//
// =====================================================

app.use(
    "/api/nasha-qr",
    nashaQRRoutes
);

// =====================================================
// NASHA RECEIPT SYSTEM
// =====================================================
//
// This is completely separate from QR.
//
// POST /api/nasha-receipts
// GET  /api/nasha-receipts
// GET  /api/nasha-receipts/summary
// GET  /api/nasha-receipts/reports/summary
// GET  /api/nasha-receipts/:id
//
// =====================================================

app.use(
    "/api/nasha-receipts",
    nashaReceiptRoutes
);

// =====================================================
// DASHBOARD
// =====================================================

app.use(
    "/api/dashboard",
    dashboardRoutes
);

// =====================================================
// ROOT
// =====================================================

app.get(
    "/",
    (req, res) => {
        res.status(200).json({
            success: true,
            message: "MJMK API Running...",
            version: "1.0.0",
        });
    }
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
    (req, res) => {
        res.status(404).json({
            success: false,
            message:
                `Route not found: ${req.method} ${req.originalUrl}`,
        });
    }
);

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use(
    (
        err,
        req,
        res,
        next
    ) => {

        console.error(
            "🔥 Global Error:",
            err
        );

        // =================================================
        // CORS ERROR
        // =================================================

        if (
            err.message ===
            "Not allowed by CORS"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "CORS Error: Origin not allowed",
            });
        }

        // =================================================
        // JSON PARSING ERROR
        // =================================================

        if (
            err instanceof SyntaxError &&
            err.status === 400 &&
            err.body
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid JSON request",
            });
        }

        // =================================================
        // DEFAULT ERROR
        // =================================================

        const statusCode =
            err.statusCode ||
            err.status ||
            500;

        return res
            .status(statusCode)
            .json({
                success: false,

                message:
                    err.message ||
                    "Internal Server Error",

                ...(process.env.NODE_ENV ===
                    "development" && {
                        stack: err.stack,
                    }),
            });
    }
);

// =====================================================
// START SERVER
// =====================================================

const PORT =
    process.env.PORT || 5000;

const startServer =
    async () => {

        try {

            console.log(
                "🔄 Connecting to MongoDB..."
            );

            await connectDB();

            console.log(
                "✅ MongoDB connected"
            );

            app.listen(
                PORT,
                () => {

                    console.log(
                        "================================="
                    );

                    console.log(
                        `🚀 Server running on port ${PORT}`
                    );

                    console.log(
                        `🌐 Environment: ${
                            process.env.NODE_ENV ||
                            "development"
                        }`
                    );

                    console.log(
                        "📡 API: /api"
                    );

                    console.log(
                        "🎟️ Nasha API: /api/nasha"
                    );

                    console.log(
                        "🔳 Nasha QR API: /api/nasha-qr"
                    );

                    console.log(
                        "🧾 Nasha Receipt API: /api/nasha-receipts"
                    );

                    console.log(
                        "================================="
                    );
                }
            );

        } catch (error) {

            console.error(
                "❌ Database connection failed:",
                error.message
            );

            process.exit(1);
        }
    };

startServer();

// =====================================================
// EXPORT APP
// =====================================================

module.exports = app;