import { sendMessage } from "./whatsapp/sendMessage.js";

const myPhone = "923322484264s"; // <-- replace with YOUR real WhatsApp number, country code, no + or spaces

await sendMessage(myPhone, "Test message from bot ✅");
console.log("Sent!");