// src/components/Header.jsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * Header component chung
 * - Đọc info user từ localStorage.rfid_logged_user
 * - Hiển thị navigation tùy theo role:
 *    - admin  -> Dashboard, Admin, Class, Logout (Admin có link /admin/accounts)
 *    - class  -> Dashboard, Class, Logout (Class -> /class)
 *    - student-> Student, Logout (Student -> /student)
 *    - guest  -> Login
 * - Hiển thị username ở góc phải nếu đã login
 */

function safeReadLogged() {
  const raw = localStorage.getItem("rfid_logged_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function Header() {
  const navigate = useNavigate();
  const logged = safeReadLogged();

  const handleLogout = () => {
    localStorage.removeItem("rfid_logged_user");
    // optional: you may also want to sign out anonymous auth but keep simple for now
    navigate("/login");
  };

  // role detection helpers
  const role = logged?.role || null;
  const username = logged?.username || null;

  return (
    <header className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <Link to={logged ? (role === "admin" ? "/admin/accounts" : role === "class" ? "/class" : role === "student" ? "/student" : "/dashboard") : "/login"} className="text-xl font-bold">
          RFID Dashboard
        </Link>

        <nav className="hidden sm:flex gap-2 items-center">
          {/* Common Dashboard link - admins/classes/students land on different pages */}
          {logged ? (
            <Link to={role === "admin" ? "/admin/accounts" : role === "class" ? "/class" : role === "student" ? "/student" : "/dashboard"}
              className="px-3 py-1 rounded bg-gray-200 hover:bg-yellow-500 text-sm">
              Home
            </Link>
          ) : (
            <Link to="/login" className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">Home</Link>
          )}

          {/* Admin-only */}
          {role === "admin" && (
            <>
              <Link to="/admin/accounts" className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-green-700">Admin</Link>
              <Link to="/dashboard" className="px-3 py-1 rounded bg-blue-600  text-white hover:bg-green-700 text-sm">All Students</Link>
            </>
          )}

          {/* Class-only */}
          {role === "class" && (
            <>
              <Link to="/class" className="px-3 py-1 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700">Class</Link>
              <Link to="/dashboard" className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm">Class Dashboard</Link>
            </>
          )}

          {/* Student-only */}
          {role === "student" && (
            <>
              <Link to="/student" className="px-3 py-1 rounded bg-yellow-600 text-white text-sm hover:bg-yellow-700">My Card</Link>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {username ? (
          <>
            <div className="text-sm text-gray-700 mr-2 hidden sm:block">
              <span className="font-medium">{username}</span> <span className="text-xs text-gray-500">({role})</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">Login</Link>
        )}

        {/* small menu for mobile */}
        <div className="sm:hidden">
          <details className="relative">
            <summary className="px-2 py-1 bg-gray-100 rounded">Menu</summary>
            <div className="absolute right-0 mt-2 p-3 bg-white border rounded shadow w-48">
              {logged ? (
                <>
                  <div className="text-sm font-medium mb-2">{username} <span className="text-xs text-gray-500">({role})</span></div>
                  <ul className="space-y-1">
                    <li>
                      <Link to={role === "admin" ? "/admin/accounts" : role === "class" ? "/class" : role === "student" ? "/student" : "/dashboard"} className="block px-2 py-1 hover:bg-gray-50 rounded">Home</Link>
                    </li>
                    {role === "admin" && <li><Link to="/admin/accounts" className="block px-2 py-1 hover:bg-gray-50 rounded">Admin</Link></li>}
                    {role === "class" && <li><Link to="/class" className="block px-2 py-1 hover:bg-gray-50 rounded">Class</Link></li>}
                    {role === "student" && <li><Link to="/student" className="block px-2 py-1 hover:bg-gray-50 rounded">Student</Link></li>}
                    <li><button onClick={handleLogout} className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded">Logout</button></li>
                  </ul>
                </>
              ) : (
                <ul>
                  <li><Link to="/login" className="block px-2 py-1 hover:bg-gray-50 rounded">Login</Link></li>
                </ul>
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
