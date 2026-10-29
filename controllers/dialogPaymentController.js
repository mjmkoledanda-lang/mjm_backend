const OnlinePayment = require("../models/OnlinePayment");
const Payment = require("../models/Payment");
const Family = require("../models/Family");
const User = require("../models/User");
const Counter = require("../models/Counter");
const dialogIPGService = require("../services/dialogIPGService");
const sendSMS = require("../utils/sendSMS");
const { generatePaymentPDFBuffer } = require("../utils/generatePaymentPDF");

const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Atomic helper to get sequential receipt numbers: MJM-YYYY-XXXXX
 */
async function getNextReceiptNo() {
    const year = new Date().getFullYear();
    const counter = await Counter.findByIdAndUpdate(
        `receipt_${year}`,
        { $inc: { sequence: 1 } },
        { new: true, upsert: true }
    );
    const pad = String(counter.sequence).padStart(4, "0");
    return `RCP-${year}-${pad}`;
}

const { calculateFamilyArrears: getFamilyArrears } = require("../utils/arrearsHelper");

/**
 * Calculate total arrears for a family
 */
async function calculateFamilyArrears(familyId) {
    try {
        const family = await Family.findById(familyId);
        if (!family) return 0;

        const payments = await Payment.find({ family: family._id });
        const { totalArrears } = getFamilyArrears(family, payments);

        return totalArrears;
    } catch (err) {
        console.error("Error calculating arrears:", err);
        return 0;
    }
}

/**
 * Reusable completion logic (idempotent)
 */
async function processSuccessfulPayment(onlinePayment, genieTxn = null) {
    if (onlinePayment.paymentsRecorded && onlinePayment.status === "CONFIRMED") {
        return onlinePayment;
    }

    if (!onlinePayment.receiptNo) {
        onlinePayment.receiptNo = await getNextReceiptNo();
    }

    onlinePayment.status = "CONFIRMED";
    onlinePayment.paymentDate = new Date();
    if (genieTxn) {
        onlinePayment.genieResponse = genieTxn;
    }

    // Find admin / collector user to record payments
    let collector = await User.findOne({ role: "superadmin" });
    if (!collector) {
        collector = await User.findOne();
    }

    // Record individual monthly payments in the Payment collection
    const months = onlinePayment.months || [];
    for (const m of months) {
        await Payment.findOneAndUpdate(
            {
                family: onlinePayment.family,
                year: onlinePayment.year,
                month: m
            },
            {
                family: onlinePayment.family,
                year: onlinePayment.year,
                month: m,
                amount: onlinePayment.monthlyAmount,
                paidDate: new Date(),
                collectedBy: collector ? collector._id : onlinePayment.family,
                receiptPrinted: true,
                smsSent: true,
                remarks: `Dialog Genie IPG Ref: ${onlinePayment.orderId}`
            },
            { upsert: true, new: true }
        );
    }
    onlinePayment.paymentsRecorded = true;

    // Send SMS receipt via Notify.lk
    if (onlinePayment.phone && !onlinePayment.smsSent) {
        try {
            const family = await Family.findById(onlinePayment.family);
            const totalArrears = await calculateFamilyArrears(onlinePayment.family);

            const sortedMonths = [...months].sort((a, b) => a - b);
            const paidFor = sortedMonths
                .map((m) => `${monthNames[m - 1]} ${onlinePayment.year}`)
                .join(", ");

            const headTitle = onlinePayment.headTitle ? onlinePayment.headTitle + " " : "";
            const customerName = `${headTitle}${onlinePayment.headName || "Member"}`;

            const smsMessage = `Payment Receipt

Receipt No: ${onlinePayment.receiptNo}
Family ID: ${onlinePayment.familyId}
Name: ${customerName}

Paid For: ${paidFor}
Amount: Rs. ${Number(onlinePayment.amount).toLocaleString()}
Remaining Arrears: Rs. ${Number(totalArrears).toLocaleString()}
Ref: ${onlinePayment.orderId}

Jazakallah Khair.
Muhiyaddeen Jummah Masjid`;

            const smsRes = await sendSMS(onlinePayment.phone, smsMessage);
            onlinePayment.smsSent = true;
            onlinePayment.smsSentAt = new Date();
            onlinePayment.smsResponse = smsRes;
            console.log(`✅ SMS receipt sent to ${onlinePayment.phone} for ${onlinePayment.orderId}`);
        } catch (smsError) {
            console.error("⚠️ Failed to send payment receipt SMS:", smsError.message);
            onlinePayment.smsError = smsError.message;
        }
    }

    await onlinePayment.save();
    return onlinePayment;
}

// ==========================================
// 1. INITIATE PAYMENT
// POST /api/public/dialog-ipg/initiate
// ==========================================
exports.initiatePayment = async (req, res) => {
    try {
        const { nic, months, year, phone } = req.body;

        if (!nic) {
            return res.status(400).json({ success: false, message: "NIC number is required" });
        }

        if (!months || !Array.isArray(months) || months.length === 0) {
            return res.status(400).json({ success: false, message: "Please select at least one month to pay" });
        }

        const selectedYear = Number(year) || new Date().getFullYear();
        const cleanNIC = nic.trim().toUpperCase();

        const family = await Family.findOne({
            nic: { $regex: `^${cleanNIC}$`, $options: "i" }
        });

        if (!family) {
            return res.status(404).json({ success: false, message: "Family not found for this NIC" });
        }

        const monthlyAmount = Number(family.monthlyAmount || 0);
        if (monthlyAmount <= 0) {
            return res.status(400).json({ success: false, message: "Monthly amount is not configured for this family" });
        }

        // Check if any requested months are already paid
        const existingPayments = await Payment.find({
            family: family._id,
            year: selectedYear,
            month: { $in: months }
        });

        if (existingPayments.length > 0) {
            const alreadyPaid = existingPayments.map((p) => monthNames[p.month - 1]).join(", ");
            return res.status(400).json({
                success: false,
                message: `Month(s) already paid: ${alreadyPaid}. Please refresh and re-select.`
            });
        }

        // Determine recipient phone number
        let targetPhone = (phone || family.phone || "").trim();
        if (!targetPhone) {
            return res.status(400).json({
                success: false,
                message: "Mobile phone number is required to send your SMS payment receipt."
            });
        }

        const cleanPhone = targetPhone.replace(/\D/g, "");
        if (cleanPhone.length < 9) {
            return res.status(400).json({
                success: false,
                message: "Invalid phone number format. Please provide a valid Sri Lankan mobile number."
            });
        }

        const totalAmount = months.length * monthlyAmount;
        const orderId = `MJM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        // Determine Redirect URL (Dialog Genie requires https://)
        // Check if an explicit redirect URL is configured in environment
        let redirectBase = process.env.DIALOG_IPG_REDIRECT_URL || "";
        if (!redirectBase) {
            const frontendUrl = process.env.FRONTEND_URL || "https://mjmk.lk";
            redirectBase = `${frontendUrl.replace(/\/+$/, "")}/payment-status`;
        }

        // If local dev or test, ensure it starts with https:// as required by Dialog Genie
        if (!redirectBase.startsWith("https://")) {
            redirectBase = "https://mjmk.lk/payment-status";
        }

        const redirectUrl = `${redirectBase}?orderId=${encodeURIComponent(orderId)}`;

        // Webhook URL (Dialog Genie requires public HTTPS; http:// or localhost causes Genie API to reject with 403 Forbidden)
        let webhookUrl = undefined;
        const backendBase = process.env.BACKEND_PUBLIC_URL || "https://mjm-backend-buvj.onrender.com";
        if (backendBase.startsWith("https://") && !backendBase.includes("localhost")) {
            webhookUrl = `${backendBase.replace(/\/+$/, "")}/api/public/dialog-ipg/webhook`;
        }

        console.log(`Initiating Dialog Genie IPG for ${orderId}: Rs. ${totalAmount} (Redirect: ${redirectUrl})`);

        // Create Transaction on Dialog Genie IPG
        const genieResult = await dialogIPGService.createTransaction({
            orderId: orderId,
            amountLkr: totalAmount,
            redirectUrl: redirectUrl,
            webhookUrl: webhookUrl,
            currency: "LKR",
            validForHours: 24
        });

        // Save OnlinePayment in MongoDB
        const onlinePayment = await OnlinePayment.create({
            orderId: orderId,
            transactionId: genieResult.transactionId,
            family: family._id,
            familyId: family.familyId,
            headTitle: family.headTitle,
            headName: family.headName,
            nic: family.nic,
            phone: targetPhone,
            months: months,
            year: selectedYear,
            monthlyAmount: monthlyAmount,
            amount: totalAmount,
            currency: "LKR",
            status: "PENDING",
            paymentUrl: genieResult.paymentUrl,
            genieResponse: genieResult.raw
        });

        res.status(200).json({
            success: true,
            orderId: orderId,
            transactionId: genieResult.transactionId,
            paymentUrl: genieResult.paymentUrl,
            shortUrl: genieResult.shortUrl,
            amount: totalAmount,
            currency: "LKR",
            months: months,
            year: selectedYear,
            phone: targetPhone,
            paymentId: onlinePayment._id
        });

    } catch (error) {
        console.error("❌ INITIATE PAYMENT ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to initiate online payment"
        });
    }
};

// ==========================================
// 2. VERIFY PAYMENT STATUS
// GET /api/public/dialog-ipg/verify/:identifier
// ==========================================
exports.verifyPayment = async (req, res) => {
    try {
        const { identifier } = req.params;
        const { transactionId: queryTxnId } = req.query;

        if (!identifier && !queryTxnId) {
            return res.status(400).json({ success: false, message: "Payment identifier is required" });
        }

        // Search by orderId, transactionId, or MongoDB _id
        let onlinePayment = await OnlinePayment.findOne({
            $or: [
                { orderId: identifier },
                { transactionId: identifier },
                { transactionId: queryTxnId || "" },
                ...(identifier && identifier.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: identifier }] : [])
            ]
        }).populate("family");

        if (!onlinePayment) {
            return res.status(404).json({ success: false, message: "Payment transaction not found" });
        }

        // If already confirmed, return current details
        if (onlinePayment.status === "CONFIRMED") {
            return res.status(200).json({
                success: true,
                status: "CONFIRMED",
                message: "Payment successfully confirmed",
                payment: onlinePayment
            });
        }

        // Query Dialog Genie API for live transaction status
        const txnIdToCheck = onlinePayment.transactionId || queryTxnId;
        if (!txnIdToCheck) {
            return res.status(400).json({ success: false, message: "No Genie Transaction ID associated" });
        }

        const genieTxn = await dialogIPGService.getTransaction(txnIdToCheck);
        const state = (genieTxn.state || "").toUpperCase();

        console.log(`Live Genie status check for ${onlinePayment.orderId} (${txnIdToCheck}): ${state}`);

        if (state === "CONFIRMED" || state === "AUTHORIZED") {
            onlinePayment = await processSuccessfulPayment(onlinePayment, genieTxn);
            return res.status(200).json({
                success: true,
                status: "CONFIRMED",
                message: "Payment confirmed successfully! SMS receipt dispatched.",
                payment: onlinePayment
            });
        } else if (state === "CANCELLED" || state === "FAILED") {
            onlinePayment.status = state;
            await onlinePayment.save();
            return res.status(200).json({
                success: false,
                status: state,
                message: `Payment was ${state.toLowerCase()}.`,
                payment: onlinePayment
            });
        } else {
            // Pending / QR_CODE_GENERATED / INITIATED
            return res.status(200).json({
                success: false,
                status: state || "PENDING",
                message: "Payment is awaiting completion.",
                payment: onlinePayment
            });
        }

    } catch (error) {
        console.error("❌ VERIFY PAYMENT ERROR:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to verify payment status"
        });
    }
};

// ==========================================
// 3. DIALOG GENIE WEBHOOK
// POST /api/public/dialog-ipg/webhook
// ==========================================
exports.handleWebhook = async (req, res) => {
    try {
        console.log("📩 Dialog Genie Webhook received:", req.body);
        const { localId, transactionId, signature } = req.body;

        if (!localId && !transactionId) {
            return res.status(400).json({ message: "Invalid webhook payload" });
        }

        let onlinePayment = await OnlinePayment.findOne({
            $or: [
                { orderId: localId },
                { transactionId: transactionId }
            ]
        });

        if (!onlinePayment) {
            console.warn(`Webhook: No payment record found for order ${localId} / txn ${transactionId}`);
            return res.status(200).json({ status: "ignored" });
        }

        // Validate state from Dialog Genie API
        const genieTxn = await dialogIPGService.getTransaction(transactionId || onlinePayment.transactionId);
        const state = (genieTxn.state || "").toUpperCase();

        if (state === "CONFIRMED" || state === "AUTHORIZED") {
            await processSuccessfulPayment(onlinePayment, genieTxn);
            console.log(`✅ Webhook confirmed payment ${onlinePayment.orderId}`);
        } else if (state === "CANCELLED" || state === "FAILED") {
            onlinePayment.status = state;
            await onlinePayment.save();
        }

        res.status(200).json({ status: "success" });

    } catch (error) {
        console.error("❌ WEBHOOK ERROR:", error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 4. DOWNLOAD RECEIPT PDF
// GET /api/public/dialog-ipg/receipt/:identifier/pdf
// ==========================================
exports.downloadReceiptPDF = async (req, res) => {
    try {
        const { identifier } = req.params;

        const onlinePayment = await OnlinePayment.findOne({
            $or: [
                { orderId: identifier },
                { transactionId: identifier },
                { receiptNo: identifier },
                ...(identifier && identifier.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: identifier }] : [])
            ]
        });

        if (!onlinePayment) {
            return res.status(404).send("Payment receipt not found");
        }

        const pdfBuffer = await generatePaymentPDFBuffer(onlinePayment);
        const filename = `Receipt_${onlinePayment.receiptNo || onlinePayment.orderId}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.setHeader("Content-Length", pdfBuffer.length);

        return res.send(pdfBuffer);

    } catch (error) {
        console.error("❌ PDF GENERATION ERROR:", error);
        res.status(500).send("Error generating receipt PDF");
    }
};
