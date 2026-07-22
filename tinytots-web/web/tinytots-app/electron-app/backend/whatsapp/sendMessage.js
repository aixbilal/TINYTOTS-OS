import "dotenv/config";

const WHATSAPP_API_URL = `https://graph.facebook.com/v20.0/${process.env.PHONE_NUMBER_ID}/messages`;

export async function sendMessage(to, text) {
    const response = await fetch(WHATSAPP_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: to,
            type: "text",
            text: { body: text }
        })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("❌ WhatsApp send error:", JSON.stringify(data, null, 2));
        throw new Error("Failed to send WhatsApp message");
    }

    return data;
}
export async function sendButtonMessage(to, bodyText, buttonId, buttonTitle) {
    const response = await fetch(WHATSAPP_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: to,
            type: "interactive",
            interactive: {
                type: "button",
                body: { text: bodyText },
                action: {
                    buttons: [
                        {
                            type: "reply",
                            reply: {
                                id: buttonId,
                                title: buttonTitle
                            }
                        }
                    ]
                }
            }
        })
    });

    const data = await response.json();

    if (!response.ok) {
        console.error("❌ WhatsApp button send error:", JSON.stringify(data, null, 2));
        throw new Error("Failed to send WhatsApp button message");
    }

    return data;
}