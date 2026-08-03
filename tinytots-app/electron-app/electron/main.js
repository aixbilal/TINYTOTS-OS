// pos-desktop/electron/main.js
import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pdfPrinterPkg from "pdf-to-printer";
import fs from "node:fs";
import os from "node:os";
import { exec, spawn } from "node:child_process";
import bcrypt from "bcryptjs";

import { generateReceiptPDF } from "./generateReceiptPDF.js";

const { print } = pdfPrinterPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEV_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
const API_HEALTH_URL = "http://127.0.0.1:3000/api/health";
const API_PORT = "3000";

// Must match the exact printer name shown in Windows "Printers & Scanners".
const PRINTER_NAME = "POS-80C";

let mainWindow = null;
/** @type {import('node:child_process').ChildProcess | null} */
let backendProcess = null;
let backendStartedByUs = false;

/**
 * Dev = unpackaged Electron AND not forced to load dist.
 * Production/packaged builds always load the Vite `dist` output.
 * Local smoke of a built UI: ELECTRON_USE_DIST=1 npm run electron
 */
function shouldUseDevServer() {
  if (app.isPackaged) return false;
  if (process.env.ELECTRON_USE_DIST === "1") return false;
  return true;
}

function distIndexPath() {
  return path.join(__dirname, "..", "dist", "index.html");
}

function backendRootPath() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend");
  }
  return path.join(__dirname, "..", "backend");
}

/** Minimal .env parser — KEY=VALUE lines; ignores comments/blank. */
function loadEnvFile(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const text = fs.readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

async function isApiHealthy() {
  try {
    const res = await fetch(API_HEALTH_URL, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForApiReady(timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isApiHealthy()) return true;
    if (backendProcess && backendProcess.exitCode !== null) {
      return false;
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

function stopBackendProcess() {
  if (!backendProcess || !backendStartedByUs) {
    backendProcess = null;
    backendStartedByUs = false;
    return;
  }
  const child = backendProcess;
  backendProcess = null;
  backendStartedByUs = false;
  try {
    if (process.platform === "win32" && child.pid) {
      spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
        stdio: "ignore",
        windowsHide: true,
      });
    } else {
      child.kill("SIGTERM");
    }
  } catch (err) {
    console.error("Failed to stop embedded backend:", err);
  }
}

/**
 * Ensure the local Express API is running. Spawns it via ELECTRON_RUN_AS_NODE
 * unless POS_EXTERNAL_API=1 or something is already healthy on :3000.
 */
async function ensureBackendRunning() {
  if (process.env.POS_EXTERNAL_API === "1") {
    if (await isApiHealthy()) return;
    throw new Error(
      "POS_EXTERNAL_API=1 but nothing is healthy at http://127.0.0.1:3000/api/health. " +
        "Start the backend manually or unset POS_EXTERNAL_API."
    );
  }

  if (await isApiHealthy()) {
    console.log("[POS] Reusing existing API on port 3000.");
    return;
  }

  const backendRoot = backendRootPath();
  const serverJs = path.join(backendRoot, "server.js");
  const envPath = path.join(backendRoot, ".env");

  if (!fs.existsSync(serverJs)) {
    throw new Error(
      `POS backend is missing.\n\nExpected:\n${serverJs}\n\n` +
        "Rebuild with electron-builder so backend is copied into resources."
    );
  }

  const fileEnv = loadEnvFile(envPath);
  const childEnv = {
    ...process.env,
    ...fileEnv,
    ELECTRON_RUN_AS_NODE: "1",
    NODE_ENV: app.isPackaged ? "production" : process.env.NODE_ENV || "development",
    POS_EMBEDDED: "1",
    POS_DATA_DIR: app.getPath("userData"),
    PORT: API_PORT,
  };

  // Packaged / embedded builds must never use the well-known local fallback.
  if (app.isPackaged || childEnv.NODE_ENV === "production") {
    const secret = (childEnv.POS_API_SECRET || "").trim();
    if (
      !secret ||
      secret === "tinytots-local-pos-dev-token" ||
      secret === "change-me-to-a-long-random-string"
    ) {
      throw new Error(
        "POS_API_SECRET must be set to a real secret in backend/.env " +
          "(not the local dev fallback) before launching the packaged app."
      );
    }
  }

  console.log(`[POS] Starting embedded backend from ${serverJs}`);
  backendProcess = spawn(process.execPath, [serverJs], {
    cwd: backendRoot,
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  backendStartedByUs = true;

  backendProcess.stdout?.on("data", (buf) => {
    console.log(`[backend] ${buf.toString().trimEnd()}`);
  });
  backendProcess.stderr?.on("data", (buf) => {
    console.error(`[backend] ${buf.toString().trimEnd()}`);
  });
  backendProcess.on("exit", (code, signal) => {
    console.log(`[POS] Embedded backend exited code=${code} signal=${signal}`);
    if (backendStartedByUs) {
      backendProcess = null;
      backendStartedByUs = false;
    }
  });

  const ready = await waitForApiReady();
  if (!ready) {
    stopBackendProcess();
    throw new Error(
      "Embedded POS API failed to become ready at http://127.0.0.1:3000/api/health."
    );
  }
  console.log("[POS] Embedded backend is ready.");
}

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

  const useDev = shouldUseDevServer();

  if (useDev) {
    mainWindow.loadURL(DEV_URL);
    // Retry while Vite is still starting during `npm start`.
    mainWindow.webContents.on("did-fail-load", () => {
      if (!shouldUseDevServer()) return;
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadURL(DEV_URL);
        }
      }, 1000);
    });
    return;
  }

  const indexHtml = distIndexPath();
  if (!fs.existsSync(indexHtml)) {
    const message =
      "TinyTots POS UI is missing.\n\n" +
      `Expected built files at:\n${indexHtml}\n\n` +
      "Run `npm run build` (Vite) before packaging or launching with ELECTRON_USE_DIST=1.";
    console.error(message);
    dialog.showErrorBox("TinyTots POS — missing UI build", message);
    app.quit();
    return;
  }

  mainWindow.loadFile(indexHtml);
}

/* =======================================================
   APP LIFECYCLE
======================================================= */

app.whenReady().then(async () => {
  try {
    await ensureBackendRunning();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[POS] Backend startup failed:", message);
    dialog.showErrorBox("TinyTots POS — API failed to start", message);
    app.quit();
    return;
  }

  createMainWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("before-quit", () => {
  stopBackendProcess();
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

// 3) CACHE A USER'S CREDENTIALS LOCALLY (called right after a successful
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

// 4) VALIDATE A LOGIN AGAINST THE LOCAL CACHE (used when there's no
//    internet, so offline login still works for anyone who has
//    logged in successfully at least once before)
ipcMain.handle("auth:offlineLogin", async (_event, { username, password }) => {
  try {
    const users = readAuthCache();
    const match = users.find((u) => u.username === username);

    if (!match) {
      return {
        success: false,
        message:
          "No cached login found for this user. Connect to the internet once to enable offline login.",
      };
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
