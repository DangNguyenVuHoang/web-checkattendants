import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Pending from "./pages/Pending";
import StudentList from "./pages/StudentList";
import Login from "./pages/Login";
import CardDetail from "./pages/CardDetail";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminAccounts from "./pages/admin/AdminAccounts";
import AdminHome from "./pages/admin/AdminHome";
import AdminListStudents from "./pages/admin/AdminListStudents";
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

            {/* Admin routes with layout and nested routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["admin"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminHome />} />
              <Route path="home" element={<AdminHome />} />
              <Route path="accounts" element={<AdminAccounts />} />
              <Route path="liststudents" element={<AdminListStudents />} />
            </Route>

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
