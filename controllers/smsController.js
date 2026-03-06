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

        const phone = "94" + family.phone.replace(/^0/, "");

        const message = `Muhiyaddeen Jummah Mosque
Koledanda, Weligama

Payment Receipt

Family ID: ${family.familyId}
Head: ${family.headName}

Paid For: ${payment.month}/${payment.year}
Amount: Rs.${payment.amount}

Jazakallah`;

        await sendSMS(phone, message);

        res.json({ message: "SMS sent successfully" });

    } catch (error) {

        console.error(error);

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

        const uniquePhones = [...new Set(
            families.map(f => f.phone)
        )];

        let sent = 0;
        let failed = 0;

        for (const rawPhone of uniquePhones) {

            try {

                const cleanPhone = rawPhone
                    .replace(/\s/g, "")
                    .replace(/[^0-9]/g, "");

                const phone = "94" + cleanPhone.replace(/^0/, "");

                await sendSMS(phone, message);

                sent++;

            } catch (err) {

                console.log("SMS failed:", rawPhone);
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

        console.error(error);

        res.status(500).json({ message: "SMS sending failed" });

    }

};