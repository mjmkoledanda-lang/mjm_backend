const axios = require("axios");

const sendSMS = async (to, message) => {

    try {

        const response = await axios.post(
            "https://app.notify.lk/api/v1/send",
            null,
            {
                params: {
                    user_id: process.env.NOTIFY_USER_ID,
                    api_key: process.env.NOTIFY_API_KEY,
                    sender_id: process.env.NOTIFY_SENDER_ID,
                    to: to.replace("+", ""), // Notify expects 94XXXXXXXX
                    message: message
                }
            }
        );

        console.log("SMS Sent:", response.data);

    } catch (error) {

        console.error("Notify.lk SMS Error:", error.response?.data || error.message);
        throw error;

    }

};

module.exports = sendSMS;