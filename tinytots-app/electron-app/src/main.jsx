import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";

/* Fontsource — Playfair (brand display), JetBrains Mono (codes), Inter (Geist fallback) */
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";

import "./index.css";

import Splash from "./screens/Splash.jsx";
import Login from "./screens/Login.jsx";
import Dashboard from "./screens/Dashboard.jsx";
import Inventory from "./screens/Inventory.jsx";
import POS from "./screens/POS.jsx";
import LowStock from "./screens/LowStock";

import PerformanceGoals from "./screens/PerformanceGoals";
import OldReceipts from "./screens/OldReceipts";

import RequireAuth from "./components/RequireAuth.jsx";
import AppShell from "./components/shell/AppShell.jsx";

createRoot(document.getElementById("root")).render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <AppShell warm>
              <Dashboard />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* POS screen — available to both cashiers and admins */}
      <Route
        path="/pos"
        element={
          <RequireAuth>
            <AppShell dense warm>
              <POS />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* Admin-only screens — all wrapped in the same persistent shell */}
      <Route
        path="/inventory"
        element={
          <RequireAuth adminOnly>
            <AppShell warm>
              <Inventory />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/performance"
        element={
          <RequireAuth adminOnly>
            <AppShell warm>
              <PerformanceGoals />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/receipts"
        element={
          <RequireAuth adminOnly>
            <AppShell warm>
              <OldReceipts />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/low-stock"
        element={
          <RequireAuth adminOnly>
            <AppShell warm>
              <LowStock />
            </AppShell>
          </RequireAuth>
        }
      />
    </Routes>
  </HashRouter>
);
