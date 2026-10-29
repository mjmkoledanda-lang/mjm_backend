const axios = require("axios");

const sendSMS = async (to, message) => {

    try {

        // Clean phone number
        let phone = to.replace(/\D/g, "");

        if (phone.startsWith("0")) {
            phone = "94" + phone.slice(1);
        }

        if (!phone.startsWith("94") || phone.length !== 11) {
            throw new Error("Invalid phone format: " + phone);
        }

        const response = await axios.get(
            "https://app.notify.lk/api/v1/send",
            {
                params: {
                    user_id: process.env.NOTIFY_USER_ID,
                    api_key: process.env.NOTIFY_API_KEY,
                    sender_id: process.env.NOTIFY_SENDER_ID,
                    to: phone,
                    message: message
                },
                timeout: 10000
            }
        );

        console.log("SMS Sent:", phone, response.data);

        if (response.data.status !== "success") {
            throw new Error(response.data.message || "SMS failed");
        }

        return response.data;

    } catch (error) {

        console.error(
            "Notify.lk SMS Error:",
            error.response?.data || error.message
        );

        throw error;

    }

};

module.exports = sendSMS;