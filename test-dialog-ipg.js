const dialogIPGService = require("./services/dialogIPGService");
const { generatePaymentPDFBuffer } = require("./utils/generatePaymentPDF");

async function runTests() {
    console.log("==========================================");
    console.log("RUNNING DIALOG GENIE IPG INTEGRATION TESTS");
    console.log("==========================================");

    // TEST 1: Signature generation and verification
    console.log("\n[TEST 1] Testing Signature Generation & Verification...");
    const amountInCents = 150000; // Rs 1500.00
    const currency = "LKR";
    const sig = dialogIPGService.generateSignature(amountInCents, currency);
    console.log("Generated SHA1 signature:", sig);

    const isValid = dialogIPGService.verifySignature(sig, amountInCents, currency);
    console.log("Signature verification match:", isValid);
    if (!isValid) throw new Error("Signature verification failed!");
    console.log("✅ Signature test passed!");

    // TEST 2: Dialog Genie Sandbox Transaction Creation
    console.log("\n[TEST 2] Testing Dialog Genie Sandbox API Transaction Creation...");
    const testOrderId = `TEST-E2E-${Date.now()}`;
    try {
        const txn = await dialogIPGService.createTransaction({
            orderId: testOrderId,
            amountLkr: 500,
            redirectUrl: "https://mjmk.lk/payment-status?orderId=" + testOrderId
        });
        console.log("Genie Transaction ID:", txn.transactionId);
        console.log("Genie Payment URL:", txn.paymentUrl);
        console.log("Genie Initial State:", txn.state);
        console.log("Genie Amount Formatted:", txn.amountLkr, txn.currency);

        if (!txn.transactionId || !txn.paymentUrl) {
            throw new Error("Missing transactionId or paymentUrl from Genie response");
        }
        console.log("✅ Dialog Genie Sandbox API transaction created successfully!");

        // TEST 3: Status Query
        console.log("\n[TEST 3] Testing Dialog Genie Sandbox Transaction Status Check...");
        const statusRes = await dialogIPGService.getTransaction(txn.transactionId);
        console.log("Fetched transaction state:", statusRes.state);
        console.log("Amount in cents:", statusRes.amount);
        console.log("✅ Status query passed!");

    } catch (apiErr) {
        console.error("Genie API error:", apiErr.message);
        throw apiErr;
    }

    // TEST 4: PDF Receipt Generation
    console.log("\n[TEST 4] Testing PDF Receipt Generation...");
    const samplePayment = {
        orderId: testOrderId,
        receiptNo: "RCP-2026-0001",
        transactionId: "6ae229c366b72b3bd35f3d97",
        familyId: "WEL-552",
        headTitle: "Al-Haj",
        headName: "Mohamed Rameez",
        nic: "882345678V",
        phone: "0771234567",
        months: [3, 4],
        year: 2026,
        monthlyAmount: 500,
        amount: 1000,
        currency: "LKR",
        status: "CONFIRMED",
        paymentDate: new Date()
    };

    const pdfBuffer = await generatePaymentPDFBuffer(samplePayment);
    console.log("Generated PDF byte size:", pdfBuffer.length);
    if (!pdfBuffer || pdfBuffer.length < 500) {
        throw new Error("Generated PDF buffer is too small or invalid!");
    }
    console.log("✅ PDF Receipt generation test passed!");

    console.log("\n==========================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
    console.log("==========================================");
}

runTests().then(() => {
    process.exit(0);
}).catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});
