// pos-desktop/electron/main.js
import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pdfPrinterPkg from "pdf-to-printer";
import fs from "node:fs";
import os from "node:os";
import { exec } from "node:child_process";
import bcrypt from "bcryptjs";

import { generateReceiptPDF } from "./generateReceiptPDF.js";

const { getPrinters, print } = pdfPrinterPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEV_URL = "http://localhost:5173";

// Must match the exact printer name shown in Windows "Printers & Scanners".
const PRINTER_NAME = "POS-80C";

let mainWindow = null;

/* =======================================================
   OFFLINE AUTH CACHE
   Stores a small local file of { username, name, role, passwordHash }
   for each user who has successfully logged in online at least once.
   This lets the app validate logins when there's no internet, without
   ever storing raw passwords anywhere.
======================================================= */

const AUTH_CACHE_PATH = path.join(app.getPath("userData"), "auth-cache.json");

function readAuthCache() {
  try {
    if (!fs.existsSync(AUTH_CACHE_PATH)) return [];
    return JSON.parse(fs.readFileSync(AUTH_CACHE_PATH, "utf-8"));
  } catch (err) {
    console.error("Failed to read auth cache:", err);
    return [];
  }
}

function writeAuthCache(users) {
  try {
    fs.writeFileSync(AUTH_CACHE_PATH, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Failed to write auth cache:", err);
  }
}

/* =======================================================
   MAIN WINDOW
======================================================= */

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(DEV_URL);
  mainWindow.webContents.on("did-fail-load", () => {
    setTimeout(() => {
      mainWindow.loadURL(DEV_URL);
    }, 1000);
  });
}

/* =======================================================
   APP LIFECYCLE
======================================================= */

app.whenReady().then(() => {
  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

/* =======================================================
   IPC HANDLERS
======================================================= */

// 1) CASH DRAWER
ipcMain.handle("cashdrawer:open", async () => {
  try {
    // Standard ESC/POS "kick drawer pin 2" command.
    const kickCommand = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);
    const tempPath = path.join(os.tmpdir(), `drawer-kick-${Date.now()}.bin`);
    fs.writeFileSync(tempPath, kickCommand);

    await new Promise((resolve, reject) => {
      // Sends the raw bytes straight to the printer's spool queue.
      exec(`copy /b "${tempPath}" "\\\\localhost\\${PRINTER_NAME}"`, (err) => {
        fs.unlink(tempPath, () => {});
        if (err) reject(err);
        else resolve();
      });
    });

    return { success: true };
  } catch (err) {
    console.error("Cash drawer error:", err);
    return { success: false, error: err.message };
  }
});

// 2) PRINT OFFLINE CHECKOUT RECEIPT
ipcMain.handle("receipt:print", async (_event, sale) => {
  try {
    const pdfPath = await generateReceiptPDF(sale);

    await print(pdfPath, {
      printer: PRINTER_NAME,
    });

    return { success: true };
  } catch (err) {
    console.error("Print error:", err);
    return { success: false, error: err.message };
  }
});

// 3) FETCH ALL AVAILABLE PRINTERS
ipcMain.handle('get-printers', async () => {
  try {
    const printers = await getPrinters();
    return printers; // Returns an array of printer objects/names
  } catch (error) {
    console.error("Error fetching printers:", error);
    return [];
  }
});

// 4) PRINT A SPECIFIC PDF TO A SPECIFIC PRINTER
ipcMain.handle('print-pdf', async (event, { filePath, printerName }) => {
  try {
    await print(filePath, { printer: printerName });
    return { success: true };
  } catch (error) {
    console.error("Print failed:", error);
    return { success: false, error: error.message };
  }
});

// 5) CACHE A USER'S CREDENTIALS LOCALLY (called right after a successful
//    online login, so the same login works later even with no internet)
ipcMain.handle("auth:cacheUser", async (_event, { username, name, role, passwordHash }) => {
  try {
    const users = readAuthCache();
    const filtered = users.filter((u) => u.username !== username);
    filtered.push({ username, name, role, passwordHash });
    writeAuthCache(filtered);
    return { success: true };
  } catch (err) {
    console.error("auth:cacheUser error:", err);
    return { success: false, error: err.message };
  }
});

// 6) VALIDATE A LOGIN AGAINST THE LOCAL CACHE (used when there's no
//    internet, so offline login still works for anyone who has
//    logged in successfully at least once before)
ipcMain.handle("auth:offlineLogin", async (_event, { username, password }) => {
  try {
    const users = readAuthCache();
    const match = users.find((u) => u.username === username);

    if (!match) {
      return { success: false, message: "No cached login found for this user. Connect to the internet once to enable offline login." };
    }

    const passwordMatches = bcrypt.compareSync(password, match.passwordHash);
    if (!passwordMatches) {
      return { success: false, message: "Invalid username or password." };
    }

    return {
      success: true,
      user: { name: match.name, username: match.username, role: match.role },
    };
  } catch (err) {
    console.error("auth:offlineLogin error:", err);
    return { success: false, error: err.message };
  }
});
ipcMain.handle("auth:removeCachedUser", async (_event, { username }) => {
  try {
    const users = readAuthCache();
    const filtered = users.filter((u) => u.username !== username);
    writeAuthCache(filtered);
    return { success: true };
  } catch (err) {
    console.error("auth:removeCachedUser error:", err);
    return { success: false, error: err.message };
  }
});