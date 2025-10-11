// src/App.jsx
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Pending from "./pages/Pending";
import StudentList from "./pages/StudentList";
import Login from "./pages/Login";
import CardDetail from "./pages/CardDetail";
import AdminAccounts from "./pages/AdminAccounts";
import ClassAccounts from "./pages/ClassAccounts";
import StudentAccounts from "./pages/StudentAccounts";

/**
 * Helpers: role-based routes
 */
function requireLoggedRole(expectedRole, children) {
  const raw = localStorage.getItem("rfid_logged_user");
  if (!raw) return <Navigate to="/login" replace />;
  try {
    const logged = JSON.parse(raw);
    if (logged.role === expectedRole) return children;
    return <Navigate to="/login" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
}

function AdminRoute({ children }) {
  return requireLoggedRole("admin", children);
}
function ClassRoute({ children }) {
  return requireLoggedRole("class", children);
}
function StudentRoute({ children }) {
  return requireLoggedRole("student", children);
}

export default function App() {
  // read logged (used only for constructing some link targets in Header)
  const raw = localStorage.getItem("rfid_logged_user");
  const logged = raw ? JSON.parse(raw) : null;

  return (
    <BrowserRouter>
      <div className="max-w-6xl mx-auto p-4">
        {/* Shared header component handles role-aware nav / logout */}
        <Header />

        <main>
          <Routes>
            {/* Root: theo yêu cầu hiện tại, mặc định về login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public */}
            <Route path="/login" element={<Login />} />

            {/* Admin-only */}
            <Route
              path="/admin/accounts"
              element={
                <AdminRoute>
                  <AdminAccounts />
                </AdminRoute>
              }
            />

            {/* Class-only */}
            <Route
              path="/class"
              element={
                <ClassRoute>
                  <ClassAccounts />
                </ClassRoute>
              }
            />

            {/* Student-only */}
            <Route
              path="/student"
              element={
                <StudentRoute>
                  <StudentAccounts />
                </StudentRoute>
              }
            />

            {/* General dashboard (optional): combine Pending + StudentList
                You may want to protect this route for admin/class; keep public redirect */}
            <Route
              path="/dashboard"
              element={
                raw && logged && (logged.role === "admin" || logged.role === "class") ? (
                  <div className="grid gap-6">
                    {/* <Pending /> */}
                    <StudentList />
                  </div>
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* View single card (CardDetail) — access control enforced inside the page */}
            <Route path="/card/:uid" element={<CardDetail />} />

            {/* Fallback -> login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
