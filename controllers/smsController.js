const Family = require("../models/Family");
const Payment = require("../models/Payment");
const sendSMS = require("../utils/sendSMS");

// ==============================
// Send Payment Receipt SMS
// ==============================
exports.sendPaymentSMS = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id).populate("family");

        if (!payment) {
            return res.status(404).json({
                message: "Payment not found"
            });
        }

        const family = payment.family;

        if (!family || !family.phone) {
            return res.status(400).json({
                message: "Family phone not found"
            });
        }

        // Clean phone number
        let phone = family.phone.replace(/\D/g, "");

        // Convert Sri Lankan number 07XXXXXXXX to 947XXXXXXXX
        if (phone.startsWith("0")) {
            phone = "94" + phone.slice(1);
        }

        // Validate phone number
        if (!phone.startsWith("94") || phone.length !== 11) {
            return res.status(400).json({
                message: "Invalid family phone number"
            });
        }

        const message = `Monthly Payment Receipt

Family ID: ${family.familyId}
Head: ${family.headName}

Paid For: ${payment.month}/${payment.year}
Amount: Rs.${payment.amount}

Jazakallah`;

        console.log("Sending SMS to:", phone);

        await sendSMS(phone, message);

        return res.json({
            message: "SMS sent successfully"
        });

    } catch (error) {
        console.error(
            "SMS Error:",
            error.response?.data || error.message
        );

        return res.status(500).json({
            message: "SMS sending failed"
        });
    }
};

// ==============================
// Send Custom SMS to All Families
// ==============================
exports.sendCustomSMS = async (req, res) => {
    try {
        let { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "Message required"
            });
        }

        message = message.trim();

        const families = await Family.find({
            phone: {
                $exists: true,
                $ne: ""
            }
        });

        if (!families.length) {
            return res.status(404).json({
                message: "No phone numbers found"
            });
        }

        // Clean and normalize phone numbers before creating unique list
        const uniquePhones = [
            ...new Set(
                families
                    .map(family => {
                        let phone = family.phone.replace(/\D/g, "");

                        if (phone.startsWith("0")) {
                            phone = "94" + phone.slice(1);
                        }

                        return phone;
                    })
                    .filter(
                        phone =>
                            phone.startsWith("94") &&
                            phone.length === 11
                    )
            )
        ];

        if (!uniquePhones.length) {
            return res.status(400).json({
                message: "No valid phone numbers found"
            });
        }

        let sent = 0;
        let failed = 0;

        for (const phone of uniquePhones) {
            try {
                console.log("Sending SMS to:", phone);

                await sendSMS(phone, message);

                sent++;

                // Prevent Notify.lk rate limit
                await new Promise(resolve =>
                    setTimeout(resolve, 1000)
                );

            } catch (err) {
                console.error("SMS failed for:", phone);

                if (err.response) {
                    console.error(
                        "Notify.lk response:",
                        err.response.data
                    );
                } else {
                    console.error(
                        "Error:",
                        err.message
                    );
                }

                failed++;
            }
        }

        return res.json({
            message: "SMS broadcast completed",
            totalNumbers: uniquePhones.length,
            sent,
            failed
        });

    } catch (error) {
        console.error(
            "Custom SMS Error:",
            error
        );

        return res.status(500).json({
            message: "SMS sending failed"
        });
    }
};