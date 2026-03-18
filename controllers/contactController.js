import nodemailer from "nodemailer";

export const sendContactEmail = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        // ✅ Validation
        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });
        }

        // ✅ Transporter (FIXED)
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"Website Contact" <${process.env.EMAIL_USER}>`,
            replyTo: email, // ✅ important
            to: process.env.EMAIL_USER,
            subject: subject || "New Contact Message",
            html: `
                <h2>New Contact Message</h2>
                <p><b>Name:</b> ${name}</p>
                <p><b>Email:</b> ${email}</p>
                <p><b>Subject:</b> ${subject || "N/A"}</p>
                <p><b>Message:</b><br/>${message}</p>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            success: true,
            message: "Email sent successfully"
        });

    } catch (error) {
        console.error("EMAIL ERROR:", error);

        res.status(500).json({
            success: false,
            message: error.message || "Failed to send email"
        });
    }
};