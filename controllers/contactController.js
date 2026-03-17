// controllers/contactController.js
import nodemailer from "nodemailer";

export const sendContactEmail = async (req, res) => {
    const { name, email, subject, message } = req.body;

    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: "mjm.koledanda@gmail.com",
                pass: "unpkjqhwnzuwtbsl", // NOT your normal password
            },
        });

        const mailOptions = {
            from: email,
            to: "mjm.koledanda@gmail.com",
            subject: `Contact Form: ${subject}`,
            html: `
                <h2>New Contact Message</h2>
                <p><b>Name:</b> ${name}</p>
                <p><b>Email:</b> ${email}</p>
                <p><b>Subject:</b> ${subject}</p>
                <p><b>Message:</b><br/>${message}</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: "Email sent" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Failed to send email" });
    }
};