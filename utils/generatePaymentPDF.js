const PDFDocument = require("pdfkit");

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

/**
 * Generate a PDF receipt buffer
 * @param {Object} payment - The OnlinePayment document / details
 * @returns {Promise<Buffer>}
 */
function generatePaymentPDFBuffer(payment) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: "A4",
                margin: 40,
                info: {
                    Title: `Receipt - ${payment.receiptNo || payment.orderId}`,
                    Author: "Muhiyaddeen Jummah Masjid",
                    Subject: "Online Payment Contribution Receipt"
                }
            });

            const buffers = [];
            doc.on("data", (chunk) => buffers.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(buffers)));
            doc.on("error", (err) => reject(err));

            const primaryColor = "#065f46"; // Emerald 800
            const secondaryColor = "#047857"; // Emerald 700
            const darkText = "#1e293b"; // Slate 800
            const lightMuted = "#64748b"; // Slate 500
            const borderGray = "#e2e8f0"; // Slate 200

            // ==========================================
            // HEADER BANNER & BACKGROUND ACCENT
            // ==========================================
            doc.rect(40, 40, 515, 6).fill(primaryColor);

            // Bismillah
            doc.fillColor(primaryColor)
               .fontSize(13)
               .font("Helvetica-Bold")
               .text("BISMILLAHIR RAHMANIR RAHIM", 40, 60, { align: "center", width: 515 });

            // Masjid Title
            doc.fillColor(primaryColor)
               .fontSize(20)
               .font("Helvetica-Bold")
               .text("MUHIYADDEEN JUMMAH MASJID", 40, 80, { align: "center", width: 515 });

            // Location
            doc.fillColor(lightMuted)
               .fontSize(10)
               .font("Helvetica")
               .text("Koledanda, Weligama, Sri Lanka  •  Web: https://mjmk.lk", 40, 105, { align: "center", width: 515 });

            // Divider Line
            doc.moveTo(40, 125).lineTo(555, 125).lineWidth(1).strokeColor(borderGray).stroke();

            // Document Badge / Title
            doc.rect(40, 140, 515, 34).fillAndStroke("#ecfdf5", "#a7f3d0");
            doc.fillColor(primaryColor)
               .fontSize(12)
               .font("Helvetica-Bold")
               .text("OFFICIAL ONLINE PAYMENT RECEIPT", 40, 150, { align: "center", width: 515 });

            // ==========================================
            // 2-COLUMN INFO: RECEIPT META & DONOR META
            // ==========================================
            const metaTop = 190;

            // Left Box: Contributor Details
            doc.rect(40, metaTop, 250, 125).fillAndStroke("#f8fafc", borderGray);
            doc.fillColor(secondaryColor).fontSize(10).font("Helvetica-Bold").text("CONTRIBUTOR DETAILS", 52, metaTop + 12);

            doc.fillColor(lightMuted).fontSize(9).font("Helvetica").text("Family ID:", 52, metaTop + 32);
            doc.fillColor(darkText).fontSize(9).font("Helvetica-Bold").text(payment.familyId || "N/A", 125, metaTop + 32);

            doc.fillColor(lightMuted).fontSize(9).font("Helvetica").text("Name:", 52, metaTop + 50);
            const fullName = `${payment.headTitle ? payment.headTitle + " " : ""}${payment.headName || "Community Member"}`;
            doc.fillColor(darkText).fontSize(9).font("Helvetica-Bold").text(fullName, 125, metaTop + 50, { width: 155 });

            doc.fillColor(lightMuted).fontSize(9).font("Helvetica").text("NIC:", 52, metaTop + 72);
            doc.fillColor(darkText).fontSize(9).font("Helvetica").text(payment.nic || "N/A", 125, metaTop + 72);

            doc.fillColor(lightMuted).fontSize(9).font("Helvetica").text("Mobile Phone:", 52, metaTop + 90);
            doc.fillColor(darkText).fontSize(9).font("Helvetica").text(payment.phone || "N/A", 125, metaTop + 90);

            // Right Box: Payment Transaction Details
            doc.rect(305, metaTop, 250, 125).fillAndStroke("#f8fafc", borderGray);
            doc.fillColor(secondaryColor).fontSize(10).font("Helvetica-Bold").text("TRANSACTION DETAILS", 317, metaTop + 12);

            doc.fillColor(lightMuted).fontSize(9).font("Helvetica").text("Receipt No:", 317, metaTop + 32);
            doc.fillColor(primaryColor).fontSize(9).font("Helvetica-Bold").text(payment.receiptNo || payment.orderId, 395, metaTop + 32);

            doc.fillColor(lightMuted).fontSize(9).font("Helvetica").text("Order Ref:", 317, metaTop + 50);
            doc.fillColor(darkText).fontSize(8.5).font("Helvetica").text(payment.orderId || "N/A", 395, metaTop + 50, { width: 150 });

            doc.fillColor(lightMuted).fontSize(9).font("Helvetica").text("Genie Txn ID:", 317, metaTop + 68);
            doc.fillColor(darkText).fontSize(8.5).font("Helvetica").text(payment.transactionId || "N/A", 395, metaTop + 68, { width: 150 });

            const pDate = payment.paymentDate ? new Date(payment.paymentDate) : new Date();
            const dateStr = pDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
            const timeStr = pDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

            doc.fillColor(lightMuted).fontSize(9).font("Helvetica").text("Date & Time:", 317, metaTop + 86);
            doc.fillColor(darkText).fontSize(8.5).font("Helvetica").text(`${dateStr} ${timeStr}`, 395, metaTop + 86);

            doc.fillColor(lightMuted).fontSize(9).font("Helvetica").text("Payment Method:", 317, metaTop + 104);
            doc.fillColor(darkText).fontSize(8.5).font("Helvetica").text("Dialog Genie IPG (Online)", 395, metaTop + 104);

            // ==========================================
            // TABLE OF CONTRIBUTIONS
            // ==========================================
            const tableTop = 335;

            // Table Header
            doc.rect(40, tableTop, 515, 26).fill(primaryColor);
            doc.fillColor("#ffffff").fontSize(9).font("Helvetica-Bold");
            doc.text("#", 50, tableTop + 8);
            doc.text("Description", 75, tableTop + 8);
            doc.text("Year", 295, tableTop + 8);
            doc.text("Rate (LKR)", 360, tableTop + 8);
            doc.text("Amount (LKR)", 465, tableTop + 8, { width: 80, align: "right" });

            // Table Rows
            const monthsList = payment.months || [];
            let currentY = tableTop + 26;

            monthsList.forEach((m, idx) => {
                const monthName = monthNames[m - 1] || `Month ${m}`;
                const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";
                const rowHeight = 24;

                doc.rect(40, currentY, 515, rowHeight).fillAndStroke(rowBg, borderGray);

                doc.fillColor(darkText).fontSize(9).font("Helvetica");
                doc.text(String(idx + 1), 50, currentY + 7);
                doc.text(`Monthly Mosque Contribution (${monthName})`, 75, currentY + 7);
                doc.text(String(payment.year || new Date().getFullYear()), 295, currentY + 7);
                doc.text(`Rs. ${(payment.monthlyAmount || 0).toLocaleString()}`, 360, currentY + 7);
                doc.text(`Rs. ${(payment.monthlyAmount || 0).toLocaleString()}`, 465, currentY + 7, { width: 80, align: "right" });

                currentY += rowHeight;
            });

            // If empty or custom
            if (monthsList.length === 0) {
                doc.rect(40, currentY, 515, 24).fillAndStroke("#ffffff", borderGray);
                doc.fillColor(darkText).fontSize(9).font("Helvetica").text("Online Mosque Contribution", 75, currentY + 7);
                doc.text(`Rs. ${(payment.amount || 0).toLocaleString()}`, 465, currentY + 7, { width: 80, align: "right" });
                currentY += 24;
            }

            // Total Row
            doc.rect(40, currentY, 515, 32).fillAndStroke("#ecfdf5", "#a7f3d0");
            doc.fillColor(primaryColor).fontSize(11).font("Helvetica-Bold");
            doc.text("TOTAL AMOUNT PAID", 75, currentY + 10);
            doc.text(`LKR ${(payment.amount || 0).toLocaleString()}`, 400, currentY + 10, { width: 145, align: "right" });

            currentY += 45;

            // ==========================================
            // STATUS & VERIFICATION BOX
            // ==========================================
            doc.rect(40, currentY, 515, 55).fillAndStroke("#f1f5f9", borderGray);

            // Paid Stamp Badge
            doc.rect(52, currentY + 12, 110, 30).fillAndStroke("#dcfce7", "#16a34a");
            doc.fillColor("#15803d").fontSize(11).font("Helvetica-Bold").text("VERIFIED PAID", 52, currentY + 21, { align: "center", width: 110 });

            doc.fillColor(darkText).fontSize(8.5).font("Helvetica")
               .text(`Payment Gateway: Dialog Genie IPG (Dialog Pay Business)`, 180, currentY + 14);
            doc.fillColor(darkText).fontSize(8.5).font("Helvetica")
               .text(`SMS Receipt: Sent to ${payment.phone} via Notify.lk`, 180, currentY + 28);
            doc.fillColor(lightMuted).fontSize(7.5).font("Helvetica")
               .text(`Auth Token / Signature: Validated & recorded in Mosque Treasury Registry.`, 180, currentY + 41);

            currentY += 75;

            // ==========================================
            // FOOTER & ISLAMIC DU'A
            // ==========================================
            doc.fillColor(primaryColor)
               .fontSize(11)
               .font("Helvetica-Bold")
               .text("Jazakallahu Khairan for your contribution!", 40, currentY, { align: "center", width: 515 });

            doc.fillColor(lightMuted)
               .fontSize(8.5)
               .font("Helvetica")
               .text('"May Allah bless your wealth, family, and home. Ameen."', 40, currentY + 16, { align: "center", width: 515 });

            doc.moveTo(40, currentY + 36).lineTo(555, currentY + 36).lineWidth(0.5).strokeColor(borderGray).stroke();

            doc.fillColor(lightMuted)
               .fontSize(7.5)
               .font("Helvetica")
               .text("This is an official system-generated digital receipt and requires no physical signature.", 40, currentY + 44, { align: "center", width: 515 });

            doc.fillColor(lightMuted)
               .fontSize(7)
               .font("Helvetica")
               .text(`Generated on ${new Date().toUTCString()}  •  Muhiyaddeen Jummah Masjid, Koledanda, Weligama`, 40, currentY + 56, { align: "center", width: 515 });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generatePaymentPDFBuffer
};
