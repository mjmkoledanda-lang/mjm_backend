exports.sendCustomSMS = async (req, res) => {
    try {

        let { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                message: "Message required"
            });
        }

        message = message.trim();

        // Get families with phone numbers
        const families = await Family.find({
            phone: { $exists: true, $ne: "" }
        });

        if (!families.length) {
            return res.status(404).json({
                message: "No phone numbers found"
            });
        }

        // Remove duplicates
        const uniquePhones = [...new Set(
            families.map(f => f.phone)
        )];

        let sent = 0;
        let failed = 0;

        for (const rawPhone of uniquePhones) {

            try {

                if (!rawPhone) {
                    failed++;
                    continue;
                }

                // Clean phone number
                let cleanPhone = rawPhone
                    .replace(/\s/g, "")
                    .replace(/[^0-9]/g, "");

                // Convert to Sri Lanka format
                if (cleanPhone.startsWith("0")) {
                    cleanPhone = "94" + cleanPhone.substring(1);
                }

                if (cleanPhone.startsWith("94") === false) {
                    failed++;
                    continue;
                }

                await sendSMS(cleanPhone, message);

                sent++;

                // small delay (important for SMS gateway)
                await new Promise(resolve => setTimeout(resolve, 150));

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

        console.error("Custom SMS Error:", error);

        res.status(500).json({
            message: "SMS sending failed"
        });

    }
};