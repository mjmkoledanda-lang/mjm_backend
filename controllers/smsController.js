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
            return res.status(404).json({ message: "Payment not found" });
        }

        const family = payment.family;

        if (!family || !family.phone) {
            return res.status(400).json({ message: "Family phone not found" });
        }

        // Clean phone number
        let phone = family.phone.replace(/\D/g, "");

        if (phone.startsWith("0")) {
            phone = "94" + phone.slice(1);
        }

        const message = `Muhiyaddeen Jummah Mosque
Koledanda, Weligama

Payment Receipt

Family ID: ${family.familyId}
Head: ${family.headName}

Paid For: ${payment.month}/${payment.year}
Amount: Rs.${payment.amount}

Jazakallah`;

        console.log("Sending SMS to:", phone);

        await sendSMS(phone, message);

        res.json({ message: "SMS sent successfully" });

    } catch (error) {

        console.error("SMS Error:", error.response?.data || error.message);

        res.status(500).json({ message: "SMS sending failed" });

    }

};



// ==============================
// Send Custom SMS to All Families
// ==============================
exports.sendCustomSMS = async (req, res) => {

    try {

        let { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ message: "Message required" });
        }

        message = message.trim();

        const families = await Family.find({
            phone: { $exists: true, $ne: "" }
        });

        if (!families.length) {
            return res.status(404).json({ message: "No phone numbers found" });
        }

        const uniquePhones = [...new Set(families.map(f => f.phone))];

        let sent = 0;
        let failed = 0;

        for (const rawPhone of uniquePhones) {

            try {

                // Clean phone
                let phone = rawPhone.replace(/\D/g, "");

                if (phone.startsWith("0")) {
                    phone = "94" + phone.slice(1);
                }

                // Validate format
                if (!phone.startsWith("94") || phone.length !== 11) {
                    console.log("Invalid number skipped:", rawPhone);
                    failed++;
                    continue;
                }

                console.log("Sending SMS to:", phone);

                await sendSMS(phone, message);

                sent++;

                // Prevent Notify.lk rate-limit
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (err) {

                console.log("SMS failed for:", rawPhone);

                if (err.response) {
                    console.log("Notify.lk response:", err.response.data);
                } else {
                    console.log("Error:", err.message);
                }

                failed++;

            }

        }

        res.json({
            message: "SMS broadcast completed",
            totalNumbers: uniquePhones.length,
            sent,
            failed
        });

    } catch (error) {

        console.error("Custom SMS Error:", error);

        res.status(500).json({ message: "SMS sending failed" });

    }

};