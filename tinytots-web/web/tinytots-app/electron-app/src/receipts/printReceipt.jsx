// src/receipts/printReceipt.jsx

export async function printReceipt(sale) {
  if (!sale) {
    throw new Error("No sale provided for printing.");
  }

  if (!window.electron) {
    throw new Error("Electron API is unavailable.");
  }

  if (!window.electron.printReceipt) {
    throw new Error("Electron print API is unavailable.");
  }

  try {
    const result = await window.electron.printReceipt(sale);

    if (!result.success) {
      throw new Error(result.error || "Receipt printing failed.");
    }

    return result;
  } catch (error) {
    console.error("Receipt printing failed:", error);
    throw error;
  }
}