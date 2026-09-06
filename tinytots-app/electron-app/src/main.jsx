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
import Categories from "./screens/Categories.jsx";
import Reports from "./screens/Reports.jsx";
import Users from "./screens/Users.jsx";
import Profile from "./screens/Profile.jsx";
import Customers from "./screens/Customers.jsx";
import CustomerDetail from "./screens/CustomerDetail.jsx";
import PrinterSettings from "./screens/PrinterSettings.jsx";

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
            <AppShell>
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
            <AppShell dense>
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
            <AppShell>
              <Inventory />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/performance"
        element={
          <RequireAuth adminOnly>
            <AppShell>
              <PerformanceGoals />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/receipts"
        element={
          <RequireAuth adminOnly>
            <AppShell>
              <OldReceipts />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/low-stock"
        element={
          <RequireAuth adminOnly>
            <AppShell>
              <LowStock />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/categories"
        element={
          <RequireAuth adminOnly>
            <AppShell>
              <Categories />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/reports"
        element={
          <RequireAuth adminOnly>
            <AppShell>
              <Reports />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/users"
        element={
          <RequireAuth adminOnly>
            <AppShell>
              <Users />
            </AppShell>
          </RequireAuth>
        }
      />

      <Route
        path="/customers"
        element={
          <RequireAuth adminOnly>
            <AppShell>
              <Customers />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/customers/:id"
        element={
          <RequireAuth adminOnly>
            <AppShell>
              <CustomerDetail />
            </AppShell>
          </RequireAuth>
        }
      />
      <Route
        path="/settings/printer"
        element={
          <RequireAuth adminOnly>
            <AppShell>
              <PrinterSettings />
            </AppShell>
          </RequireAuth>
        }
      />

      {/* Profile — available to any logged-in user */}
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <AppShell>
              <Profile />
            </AppShell>
          </RequireAuth>
        }
      />
    </Routes>
  </HashRouter>
);
