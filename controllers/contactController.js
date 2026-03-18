const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendContactEmail = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required",
            });
        }

        console.log("📨 Sending email via Resend...");

        const response = await resend.emails.send({
            from: "Mosque Contact <onboarding@resend.dev>", // default allowed sender
            to: ["mjm.koledanda@gmail.com"],
            subject: subject || "New Contact Message",
            html: `
                <div style="font-family:Arial;padding:20px">
                    <h2>📩 New Contact Message</h2>

                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Subject:</strong> ${subject || "N/A"}</p>

                    <hr/>

                    <p><strong>Message:</strong></p>
                    <p>${message}</p>
                </div>
            `,
        });

        console.log("✅ Email sent:", response);

        res.json({
            success: true,
            message: "Email sent successfully",
        });

    } catch (error) {
        console.error("❌ RESEND ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};