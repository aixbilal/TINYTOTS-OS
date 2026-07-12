import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for port 465, false for 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends the daily sales report email.
 *
 * @param {string} filePath - Absolute path of the CSV file.
 * @param {string} fileName - Name shown in the email attachment.
 */
export async function sendReportEmail(filePath, fileName) {
  try {
    const info = await transporter.sendMail({
      from: `"Tiny Tots POS" <${process.env.SMTP_USER}>`,
      to: process.env.OWNER_EMAIL,
      subject: "Daily Sales Report",
      text: "Attached is your daily sales report.",
      attachments: [
        {
          filename: fileName,
          path: filePath,
        },
      ],
    });

    console.log("✅ Report email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Failed to send report email");
    console.error(error);
    throw error;
  }
}