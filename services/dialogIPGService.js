const crypto = require("crypto");
const https = require("https");
const { URL } = require("url");

class DialogIPGService {
    constructor() {
        this.appId = process.env.DIALOG_IPG_APP_ID || "36bafce7-a201-429b-a9e2-c5b78546677c";
        this.apiKey = process.env.DIALOG_IPG_APP_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcHBJZCI6IjM2YmFmY2U3LWEyMDEtNDI5Yi1hOWUyLWM1Yjc4NTQ2Njc3YyIsImNvbXBhbnlJZCI6IjYzOTdmMzlkZjA3ZmJhMDAwODQyYTkwYiIsImlhdCI6MTY3MDkwMjY4NSwiZXhwIjo0ODI2NTc2Mjg1fQ.fy12dgFhA3iB_RCjD7y8j5HClNRZUiBZgAg-QzFpxaE";
        this.baseUrl = (process.env.DIALOG_IPG_BASE_URL || "https://api.uat.geniebiz.lk/public").replace(/\/+$/, "");
    }

    /**
     * Generate SHA1 signature for Dialog Genie IPG transactions
     * Format: amount=<amountInCents>&currency=<currency>&apiKey=<apiKey>
     */
    generateSignature(amountInCents, currency = "LKR") {
        const signString = `amount=${amountInCents}&currency=${currency}&apiKey=${this.apiKey}`;
        return crypto.createHash("sha1").update(signString).digest("hex");
    }

    /**
     * Validate signature returned by Dialog Genie callback / webhook
     */
    verifySignature(signature, amountInCents, currency = "LKR") {
        if (!signature) return false;
        const expected = this.generateSignature(amountInCents, currency);
        return signature.toLowerCase() === expected.toLowerCase();
    }

    /**
     * Low-level HTTPS helper with browser User-Agent
     */
    request(endpoint, method = "GET", payload = null) {
        return new Promise((resolve, reject) => {
            const fullUrl = `${this.baseUrl}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;
            const parsedUrl = new URL(fullUrl);

            const headers = {
                Accept: "application/json",
                Authorization: this.apiKey,
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)"
            };

            let postData = null;
            if (payload && (method === "POST" || method === "PUT" || method === "PATCH")) {
                postData = typeof payload === "string" ? payload : JSON.stringify(payload);
                headers["Content-Type"] = "application/json";
                headers["Content-Length"] = Buffer.byteLength(postData);
            }

            const options = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || 443,
                path: parsedUrl.pathname + parsedUrl.search,
                method: method,
                headers: headers
            };

            const req = https.request(options, (res) => {
                let body = "";
                res.on("data", (chunk) => {
                    body += chunk;
                });

                res.on("end", () => {
                    let parsedData;
                    try {
                        parsedData = body ? JSON.parse(body) : {};
                    } catch (e) {
                        parsedData = { raw: body };
                    }

                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsedData);
                    } else {
                        const errorMsg = parsedData?.message || parsedData?.extraInfo || `HTTP ${res.statusCode}`;
                        const error = new Error(`Genie IPG Error (${res.statusCode}): ${errorMsg}`);
                        error.statusCode = res.statusCode;
                        error.response = parsedData;
                        reject(error);
                    }
                });
            });

            req.on("error", (err) => {
                reject(err);
            });

            req.setTimeout(20000, () => {
                req.destroy(new Error("Genie IPG request timeout after 20s"));
            });

            if (postData) {
                req.write(postData);
            }

            req.end();
        });
    }

    /**
     * Create a payment transaction in Dialog Genie IPG
     * @param {Object} options
     * @param {string} options.orderId - Unique local order identifier
     * @param {number} options.amountLkr - Amount in Sri Lankan Rupees (e.g. 500)
     * @param {string} options.redirectUrl - Customer browser redirect URL after payment
     * @param {string} [options.webhookUrl] - Server-to-server webhook callback URL
     * @param {string} [options.currency="LKR"]
     * @param {number} [options.validForHours=24]
     */
    async createTransaction({
        orderId,
        amountLkr,
        redirectUrl,
        webhookUrl,
        currency = "LKR",
        validForHours = 24
    }) {
        const amountInCents = Math.round(Number(amountLkr) * 100);
        const signature = this.generateSignature(amountInCents, currency);

        const payload = {
            currency: currency,
            amount: amountInCents,
            localId: orderId,
            redirectUrl: redirectUrl,
            apiVersion: "2.0",
            appVersion: "geniebiz-connect-php",
            signMethod: "sha1",
            signature: signature
        };

        if (webhookUrl) {
            payload.webhook = webhookUrl;
        }

        if (validForHours) {
            payload.validForHours = validForHours;
        }

        const response = await this.request("/transactions", "POST", payload);

        return {
            transactionId: response.id,
            paymentUrl: response.url,
            shortUrl: response.shortUrl,
            state: response.state,
            amountInCents: response.amount,
            amountLkr: (response.amount / 100).toFixed(2),
            currency: response.currency,
            raw: response
        };
    }

    /**
     * Get transaction status from Dialog Genie IPG
     * @param {string} transactionId
     */
    async getTransaction(transactionId) {
        if (!transactionId) {
            throw new Error("transactionId is required");
        }
        return await this.request(`/transactions/${transactionId}`, "GET");
    }
}

module.exports = new DialogIPGService();
