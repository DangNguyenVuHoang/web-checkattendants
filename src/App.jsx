import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Pending from "./pages/Pending";
import StudentList from "./pages/StudentList";
import Login from "./pages/Login";
import CardDetail from "./pages/CardDetail";
import AdminAccounts from "./pages/AdminAccounts";
import ClassAccounts from "./pages/ClassAccounts";
import StudentAccounts from "./pages/StudentAccounts";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-6xl mx-auto p-4">
        <Header />
        <main>
          <Routes>
            {/* Redirect root → login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Admin-only routes */}
            <Route
              path="/admin/accounts"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminAccounts />
                </ProtectedRoute>
              }
            />

            {/* Class-only routes */}
            <Route
              path="/class"
              element={
                <ProtectedRoute roles={["class"]}>
                  <ClassAccounts />
                </ProtectedRoute>
              }
            />

            {/* Student-only routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute roles={["student"]}>
                  <StudentAccounts />
                </ProtectedRoute>
              }
            />

            {/* Dashboard for admin & class */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={["admin", "class"]}>
                  <div className="grid gap-6">
                    <StudentList />
                  </div>
                </ProtectedRoute>
              }
            />

            {/* View single card (no strict role restriction) */}
            <Route path="/card/:uid" element={<CardDetail />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
