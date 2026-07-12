import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";

import "./index.css";

import Splash from "./screens/Splash.jsx";
import Login from "./screens/Login.jsx";
import Dashboard from "./screens/Dashboard.jsx";
import Inventory from "./screens/Inventory.jsx";
import POS from "./screens/POS.jsx";
import ReceiptPrintPage from "./receipts/ReceiptPrintPage";
import LowStock from "./screens/LowStock";

import PerformanceGoals from "./screens/PerformanceGoals";
import OldReceipts from "./screens/OldReceipts";

import RequireAuth from "./components/RequireAuth.jsx";

createRoot(document.getElementById("root")).render(
  <HashRouter>
    <Routes>
      <Route path="/" element={<Splash />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />

      {/* POS screen — available to both cashiers and admins */}
      <Route
        path="/pos"
        element={
          <RequireAuth>
            <POS />
          </RequireAuth>
        }
      />

      {/* Admin-only screens */}
      <Route
        path="/inventory"
        element={
          <RequireAuth adminOnly>
            <Inventory />
          </RequireAuth>
        }
      />
      <Route
        path="/performance"
        element={
          <RequireAuth adminOnly>
            <PerformanceGoals />
          </RequireAuth>
        }
      />
      <Route
        path="/receipts"
        element={
          <RequireAuth adminOnly>
            <OldReceipts />
          </RequireAuth>
        }
      />
     <Route path="/low-stock" element={<LowStock />} />
      {/* Used internally by Electron's hidden print window — unchanged,
          no login needed since it's never user-navigated to directly */}
      <Route path="/print" element={<ReceiptPrintPage />} />
    </Routes>
  </HashRouter>
);