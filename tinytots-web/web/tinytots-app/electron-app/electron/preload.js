// pos-desktop/electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  /**
   * Sends the sale object to Electron, which generates a PDF
   * and sends it to the printer directly. Works fully offline.
   */
  printReceipt: (sale) => ipcRenderer.invoke("receipt:print", sale),

  /**
   * Best-effort: pulses the cash drawer via the receipt printer's
   * RJ11 port. See electron-cashdrawer-snippet.js for the caveat
   * about printer sharing.
   */
  openCashDrawer: () => ipcRenderer.invoke("cashdrawer:open"),

  /**
   * Caches a user's login locally (hashed password only) right after
   * a successful online login, so the same login still works if the
   * app is later opened with no internet connection.
   */
  cacheUser: (userData) => ipcRenderer.invoke("auth:cacheUser", userData),

  /**
   * Validates a login against the local cache. Used as a fallback
   * when the online /api/login request fails (no internet).
   */
  offlineLogin: (credentials) => ipcRenderer.invoke("auth:offlineLogin", credentials),

  removeCachedUser: (payload) => ipcRenderer.invoke("auth:removeCachedUser", payload),
});