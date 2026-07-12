import express from "express";
import { getState, setNeedsHuman } from "../services/conversationState.js";
import { startQuiz, handleQuiz } from "../whatsapp/quizHandler.js";
import { sendMessage } from "../whatsapp/sendMessage.js";
import {
  handleFastLane,
  handleBuyReply,
  handleFulfillmentReply,
  handleTrackOrder,
  TRACK_ORDER_REGEX,
  handleHandoffRequest,
  HANDOFF_REGEX,
  OWNER_PHONE,
  PUBLIC_CODE_REGEX,
  handleGlobalCancel,
  HELP_REGEX,
  getHelpMessage,
  handleQuantityReply,
  handleCartReply,
  CART_REGEX,
  DONE_REGEX,
  handleMarkDone,
} from "../whatsapp/fastLaneHandler.js";

const router = express.Router();

// ------------------------------------
// Meta Verification
// GET /webhook
// ------------------------------------
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (
    mode === "subscribe" &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    console.log("✅ WhatsApp webhook verified.");
    return res.status(200).send(challenge);
  }

  console.log("❌ Invalid verify token.");
  return res.sendStatus(403);
});

// ------------------------------------
// Incoming Messages
// POST /webhook
// ------------------------------------
router.post("/", async (req, res) => {
  // Always acknowledge Meta immediately — WhatsApp expects a fast 200
  res.sendStatus(200);

  console.log("========== WHATSAPP WEBHOOK ==========");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("======================================");

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) {
      return;
    }

    // Handle button taps separately from normal text messages
    if (message.type === "interactive" && message.interactive?.type === "button_reply") {
      const buttonId = message.interactive.button_reply.id;
      const tapperPhone = message.from;

      if (tapperPhone === OWNER_PHONE && buttonId.startsWith("resolve:")) {
        const customerPhone = buttonId.split(":")[1];
        await setNeedsHuman(customerPhone, false);
        await sendMessage(OWNER_PHONE, `✅ Cleared handoff flag for ${customerPhone}. Bot will respond to them normally again.`);
      }

      return;
    }

    // Ignore anything that isn't an actual incoming text message
    if (message.type !== "text") {
      return;
    }

    const phone = message.from;              // customer's WhatsApp number
    const text = message.text.body;          // what they typed 
    const state = await getState(phone);
    const trimmedText = text.trim();

    // If this number is flagged for human handoff, stay silent — do not auto-reply
    if (state?.needs_human) {
      console.log(`🙋 Skipping auto-reply for ${phone} — flagged for human handoff.`);
      return;
    }

    let replyText;

    // --- Global commands FIRST, regardless of conversation state ---
    if (HANDOFF_REGEX.test(trimmedText)) {
      replyText = await handleHandoffRequest(phone);
    } else if (TRACK_ORDER_REGEX.test(trimmedText)) {
      replyText = await handleTrackOrder(phone);
    } else if (trimmedText.toUpperCase() === "CANCEL") {
      replyText = await handleGlobalCancel(phone);
    } else if (HELP_REGEX.test(trimmedText)) {
      replyText = getHelpMessage();
    } else if (CART_REGEX.test(trimmedText)) {
      replyText = await handleCartReply(phone);
    } else if (DONE_REGEX.test(trimmedText)) {
      replyText = await handleMarkDone(phone, trimmedText);
    } else if (PUBLIC_CODE_REGEX.test(trimmedText)) {
      replyText = await handleFastLane(trimmedText.toUpperCase(), phone);
    } else if (trimmedText.toUpperCase() === "BUY") {
      replyText = await handleBuyReply(phone);
    } else if (state && state.step === "awaiting_quantity") {
      replyText = await handleQuantityReply(phone, text);
    } else if (state && (state.step === "awaiting_fulfillment" || state.step === "awaiting_address")) {
      replyText = await handleFulfillmentReply(phone, text);
    } else if (!state) {
      // First contact — show the help/menu message, then start the quiz
      const helpMsg = getHelpMessage();
      await sendMessage(phone, helpMsg);
      replyText = await startQuiz(phone);
    } else {
      // Mid-quiz -> continue it
      replyText = await handleQuiz(phone, text);
    }

    await sendMessage(phone, replyText);

  } catch (err) {
    console.error("❌ Webhook processing error:", err);
    try {
      if (req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from) {
        const phone = req.body.entry[0].changes[0].value.messages[0].from;
        await sendMessage(phone, "Sorry, something went wrong on our end. Please try again in a moment.");
      }
    } catch (_) {
      // don't let a failed fallback message crash anything further
    }
  }
});

export default router;