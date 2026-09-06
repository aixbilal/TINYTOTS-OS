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

  const { print, getPrinters } = pdfPrinterPkg;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const DEV_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
  const API_HEALTH_URL = "http://127.0.0.1:3000/api/health";
  const API_PORT = "3000";

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
    RECEIPT PRINTER PREFERENCE (machine-local)
    Stored as { "receiptPrinter": "<windows printer name>" } under
    userData. This is per-machine operational config and deliberately
    never goes to Supabase. The backend reads the same file for its
    reprint path (see resolveReceiptPrinter in backend/server.js).
  ======================================================= */

  const PRINTER_CONFIG_PATH = path.join(
    app.getPath("userData"),
    "printer-config.json"
  );

  function readPrinterConfig() {
    try {
      if (!fs.existsSync(PRINTER_CONFIG_PATH)) return {};
      return JSON.parse(fs.readFileSync(PRINTER_CONFIG_PATH, "utf-8")) || {};
    } catch (err) {
      console.error("Failed to read printer config:", err);
      return {};
    }
  }

  function writePrinterConfig(config) {
    fs.writeFileSync(PRINTER_CONFIG_PATH, JSON.stringify(config, null, 2));
  }

  /**
   * Resolve the receipt printer to use. There is deliberately NO fallback:
   *  - a non-empty saved receiptPrinter → return that exact name
   *  - no config file / empty / invalid config → return ""
   * Callers must treat "" as "not configured" and surface a clear error
   * rather than guessing a printer.
   */
  function resolvePrinterName() {
    return (readPrinterConfig().receiptPrinter || "").trim();
  }

  /**
   * True when `name` matches an installed Windows printer. Best-effort:
   * if discovery itself fails we don't block printing on it.
   */
  async function isPrinterInstalled(name) {
    if (!name) return false;
    try {
      const printers = await getPrinters();
      return (printers || []).some((p) => p.name === name);
    } catch (err) {
      console.error("Printer availability check failed:", err);
      return true;
    }
  }

  const NO_PRINTER_ERROR =
    "No receipt printer is configured. Open Printer Settings and select your receipt printer.";
  const PRINTER_UNAVAILABLE_ERROR =
    "The configured receipt printer is not available. Open Printer Settings and select an installed printer.";

  /* =======================================================
    MAIN WINDOW
  ======================================================= */

  function createMainWindow() {
    const iconPath = path.join(__dirname, "assets", "icon.ico");

    mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      title: "TINYTOTS OS",
      icon: fs.existsSync(iconPath) ? iconPath : undefined,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    mainWindow.setTitle("TINYTOTS OS");
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
        "TINYTOTS OS UI is missing.\n\n" +
        `Expected built files at:\n${indexHtml}\n\n` +
        "Run `npm run build` (Vite) before packaging or launching with ELECTRON_USE_DIST=1.";
      console.error(message);
      dialog.showErrorBox("TINYTOTS OS — missing UI build", message);
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
      dialog.showErrorBox("TINYTOTS OS — API failed to start", message);
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

  // 1) CASH DRAWER — pulsed through the configured receipt printer.
  ipcMain.handle("cashdrawer:open", async () => {
    try {
      const printerName = resolvePrinterName();
      if (!printerName) {
        return { success: false, error: NO_PRINTER_ERROR };
      }
      if (!(await isPrinterInstalled(printerName))) {
        return { success: false, error: PRINTER_UNAVAILABLE_ERROR };
      }

      // Standard ESC/POS "kick drawer pin 2" command.
      const kickCommand = Buffer.from([0x1b, 0x70, 0x00, 0x19, 0xfa]);
      const tempPath = path.join(os.tmpdir(), `drawer-kick-${Date.now()}.bin`);
      fs.writeFileSync(tempPath, kickCommand);

      await new Promise((resolve, reject) => {
        // Sends the raw bytes straight to the printer's spool queue.
        exec(`copy /b "${tempPath}" "\\\\localhost\\${printerName}"`, (err) => {
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
      const printerName = resolvePrinterName();
      if (!printerName) {
        return { success: false, error: NO_PRINTER_ERROR };
      }
      if (!(await isPrinterInstalled(printerName))) {
        return { success: false, error: PRINTER_UNAVAILABLE_ERROR };
      }

      const pdfPath = await generateReceiptPDF(sale);

      await print(pdfPath, {
        printer: printerName,
        scale: "noscale",
      });

      return { success: true };
    } catch (err) {
      console.error("Print error:", err);
      return { success: false, error: err.message };
    }
  });

  // 2b) RECEIPT PRINTER PREFERENCE + DISCOVERY
  ipcMain.handle("printer:list", async () => {
    try {
      const printers = await getPrinters();
      return {
        success: true,
        printers: (printers || []).map((p) => ({
          name: p.name,
          isDefault: !!p.isDefault,
        })),
      };
    } catch (err) {
      console.error("printer:list error:", err);
      return { success: false, error: err.message, printers: [] };
    }
  });

  ipcMain.handle("printer:getPreference", async () => {
    try {
      const saved = (readPrinterConfig().receiptPrinter || "").trim();
      return { success: true, receiptPrinter: saved || null };
    } catch (err) {
      console.error("printer:getPreference error:", err);
      return { success: false, error: err.message, receiptPrinter: null };
    }
  });

  ipcMain.handle("printer:setPreference", async (_event, name) => {
    try {
      const receiptPrinter = typeof name === "string" ? name.trim() : "";
      const config = readPrinterConfig();
      config.receiptPrinter = receiptPrinter;
      writePrinterConfig(config);
      return { success: true, receiptPrinter: receiptPrinter || null };
    } catch (err) {
      console.error("printer:setPreference error:", err);
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
