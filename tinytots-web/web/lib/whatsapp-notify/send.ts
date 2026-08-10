// lib/whatsapp-notify/send.ts
// Sends WhatsApp template messages via Meta's Graph API using the
// Cloud API number (0334-6417385).

const GRAPH_API_VERSION = "v21.0";

interface SendTemplateParams {
  to: string; // customer phone number, e.g. "923001234567" (no + or leading 0)
  templateName: string;
  bodyParams: string[]; // fills {{1}}, {{2}}, {{3}} in order
  buttons?: { type: "quick_reply"; payload: string }[]; // optional, for order_received
}

export async function sendWhatsAppTemplate({
  to,
  templateName,
  bodyParams,
  buttons,
}: SendTemplateParams): Promise<{ success: boolean; error?: string }> {
  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.error("WhatsApp Cloud API credentials missing in environment");
    return { success: false, error: "server_misconfigured" };
  }

  const components: Record<string, unknown>[] = [
    {
      type: "body",
      parameters: bodyParams.map((text) => ({ type: "text", text })),
    },
  ];

  if (buttons && buttons.length > 0) {
    buttons.forEach((btn, index) => {
      components.push({
        type: "button",
        sub_type: "quick_reply",
        index: index.toString(),
        parameters: [{ type: "payload", payload: btn.payload }],
      });
    });
  }

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components,
        },
      }),
    });

    const data = await response.json();
    console.log(
      "WhatsApp Graph API response:",
      JSON.stringify({ status: response.status, data })
    );
    if (!response.ok) {
      console.error("WhatsApp send failed:", data);
      return {
        success: false,
        error: data?.error?.message || "whatsapp_api_error",
      };
    }
    return { success: true };
  } catch (err) {
    console.error("WhatsApp send exception:", err);
    return { success: false, error: "network_error" };
  }
}