// src/components/RequireAuth.jsx
import { Navigate } from "react-router-dom";
import { getSession } from "../auth";

// Wrap any route that needs someone logged in:
//   <Route path="/pos" element={<RequireAuth><POS /></RequireAuth>} />
//
// Pass adminOnly to also block cashiers:
//   <Route path="/inventory" element={<RequireAuth adminOnly><Inventory /></RequireAuth>} />
export default function RequireAuth({ children, adminOnly = false }) {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && session.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}