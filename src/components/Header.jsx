// src/components/Header.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

/**
 * Header component (simple + hover preserved)
 * - NavLink bây giờ không xử lý active state, chỉ render Link với lớp CSS mặc định
 * - Admin mini-panel + mobile menu giữ nguyên
 */

function NavLink({ to, children, activeLink, setActiveLink, className = "" }) {
  const isActive = activeLink === to;
  const base =
    "px-3 py-1 rounded text-sm text-black transition-colors " +
    (isActive
      ? "bg-blue-600 text-white"
      : "bg-gray-100 hover:bg-gray-200");
  return (
    <Link
      to={to}
      className={base + " " + className}
      onClick={() => setActiveLink(to)}
    >
      {children}
    </Link>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState(null);

  const loggedRaw = localStorage.getItem("rfid_logged_user");
  const logged = loggedRaw ? JSON.parse(loggedRaw) : null;
  const role = logged?.role || null;
  const username = logged?.username || null;

  const handleLogout = () => {
    localStorage.removeItem("rfid_logged_user");
    navigate("/login");
    setActiveLink("/login");
  };

  return (
    <header className="flex items-center justify-between mb-6">
      {/* left: brand + main nav */}
      <div className="flex items-center gap-4">
        <Link
          to={
            logged
              ? role === "admin"
                ? "/admin/home"
                : role === "class"
                ? "/class"
                : role === "student"
                ? "/student"
                : "/dashboard"
              : "/login"
          }
          className="text-xl font-bold"
          onClick={() =>
            setActiveLink(
              logged
                ? role === "admin"
                  ? "/admin/home"
                  : role === "class"
                  ? "/class"
                  : role === "student"
                  ? "/student"
                  : "/dashboard"
                : "/login"
            )
          }
        >
          RFID Dashboard
        </Link>

        {/* main desktop nav */}
        <nav className="hidden sm:flex gap-2 items-center">
          <NavLink
            to={
              logged
                ? role === "admin"
                  ? "/admin/home"
                  : role === "class"
                  ? "/class"
                  : role === "student"
                  ? "/student"
                  : "/dashboard"
                : "/login"
            }
            activeLink={activeLink}
            setActiveLink={setActiveLink}
          >
            Home
          </NavLink>

          {role === "admin" && (
            <>
              <NavLink to="/admin/home" activeLink={activeLink} setActiveLink={setActiveLink}>Admin Home</NavLink>
              <NavLink to="/admin/liststudents" activeLink={activeLink} setActiveLink={setActiveLink}>List Students</NavLink>
              <NavLink to="/admin/accounts" activeLink={activeLink} setActiveLink={setActiveLink}>Accounts</NavLink>
            </>
          )}

          {role === "class" && (
            <>
              <NavLink to="/class" activeLink={activeLink} setActiveLink={setActiveLink}>Class</NavLink>
              <NavLink to="/dashboard" activeLink={activeLink} setActiveLink={setActiveLink}>Class Dashboard</NavLink>
            </>
          )}

          {role === "student" && (
            <NavLink to="/student" activeLink={activeLink} setActiveLink={setActiveLink}>My Card</NavLink>
          )}
        </nav>
      </div>

      {/* right: user info + admin mini-panel (desktop) + mobile menu */}
      <div className="flex items-center gap-3">
        {/* Admin mini-panel (desktop) */}
        {role === "admin" && (
          <div className="hidden md:block relative">
            <details className="relative">
              <summary className="px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer">
                Admin Panel
              </summary>

              <div className="absolute right-0 mt-2 w-96 bg-white border rounded-lg shadow-lg z-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Admin Panel</h3>
                    <p className="text-sm text-gray-500">
                      Quản trị hệ thống — quản lý accounts, pending, danh sách học sinh...
                    </p>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={handleLogout}
                      className="px-3 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600 focus:bg-blue-600 active:bg-blue-600 focus:text-white active:text-white transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>

                <nav className="mt-4 grid grid-cols-1 gap-2">
                  <Link to="/admin/home" className="px-3 py-2 rounded text-sm bg-gray-100 hover:bg-gray-200">
                    Home
                  </Link>
                  <Link to="/admin/liststudents" className="px-3 py-2 rounded text-sm bg-gray-100 hover:bg-gray-200">
                    List Students
                  </Link>
                  <Link to="/admin/accounts" className="px-3 py-2 rounded text-sm bg-gray-100 hover:bg-gray-200">
                    Accounts
                  </Link>
                </nav>
              </div>
            </details>
          </div>
        )}

        {/* username + logout (non-admin shows logout inline) */}
        {username ? (
          <>
            <div className="text-sm text-gray-700 mr-2 hidden sm:block">
              <span className="font-medium">{username}</span>
              <span className="text-xs text-gray-500"> ({role})</span>
            </div>

            {role !== "admin" && (
              <button
                onClick={handleLogout}
                className="px-3 py-1 rounded bg-red-500 text-white text-sm hover:bg-red-600 focus:bg-blue-600 active:bg-blue-600 focus:text-white active:text-white transition-colors"
              >
                Logout
              </button>
            )}
          </>
        ) : (
          <Link to="/login" className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">
            Login
          </Link>
        )}

        {/* Mobile menu: includes admin links */}
        <div className="sm:hidden">
          <details className="relative">
            <summary className="px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">Menu</summary>
            <div className="absolute right-0 mt-2 p-3 bg-white border rounded shadow w-56 z-50">
              {username ? (
                <>
                  <div className="text-sm font-medium mb-2">
                    {username} <span className="text-xs text-gray-500">({role})</span>
                  </div>
                  <ul className="space-y-1">
                    <li>
                      <Link
                        to={role === "admin" ? "/admin/home" : role === "class" ? "/class" : role === "student" ? "/student" : "/dashboard"}
                        className="block px-2 py-1 hover:bg-gray-50 rounded"
                      >
                        Home
                      </Link>
                    </li>

                    {role === "admin" && (
                      <>
                        <li><Link to="/admin/home" className="block px-2 py-1 hover:bg-gray-50 rounded">Admin Home</Link></li>
                        <li><Link to="/admin/liststudents" className="block px-2 py-1 hover:bg-gray-50 rounded">List Students</Link></li>
                        <li><Link to="/admin/accounts" className="block px-2 py-1 hover:bg-gray-50 rounded">Accounts</Link></li>
                      </>
                    )}

                    {role === "class" && (
                      <>
                        <li><Link to="/class" className="block px-2 py-1 hover:bg-gray-50 rounded">Class</Link></li>
                        <li><Link to="/dashboard" className="block px-2 py-1 hover:bg-gray-50 rounded">Class Dashboard</Link></li>
                      </>
                    )}

                    {role === "student" && (
                      <li><Link to="/student" className="block px-2 py-1 hover:bg-gray-50 rounded">My Card</Link></li>
                    )}

                    <li>
                      <button onClick={handleLogout} className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded">Logout</button>
                    </li>
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
