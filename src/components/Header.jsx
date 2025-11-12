// src/components/Header.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Home,
  Users,
  ListChecks,
  LogOut,
  Bell,
  IdCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/**
 * Sidebar (collapsible)
 * - Nhận `collapsed` và `setCollapsed` từ App.jsx
 * - Đồng bộ co/giãn toàn layout
 * - Mobile có drawer riêng
 */
export default function Header({ collapsed, setCollapsed }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [open, setOpen] = useState(false); // mobile drawer
  const [active, setActive] = useState(location.pathname);

  const loggedRaw = localStorage.getItem("rfid_logged_user");
  const logged = loggedRaw ? JSON.parse(loggedRaw) : null;
  const role = logged?.role || null;
  const username = logged?.username || null;

  useEffect(() => {
    setActive(location.pathname);
    setOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("rfid_logged_user");
    navigate("/login");
  };

  const navItem = (to, label, Icon) => {
    const isActive = active === to || (to !== "/" && active?.startsWith(to));
    return (
      <Link
        to={to}
        key={to}
        onClick={() => setActive(to)}
        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
          isActive
            ? "bg-blue-600 text-white"
            : "bg-gray-100 text-gray-800 hover:bg-blue-100"
        }`}
        title={collapsed ? label : undefined}
      >
        <Icon size={18} className="min-w-[18px]" />
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  };

  // default landing page per role
  const homeTarget =
    role === "admin"
      ? "/admin/home"
      : role === "class"
      ? "/class/home"
      : role === "student"
      ? "/students/home"
      : "/login";

  return (
    <>
      {/* =========================
          Top bar (mobile)
      ========================== */}
      <div className="md:hidden flex items-center justify-between p-3 bg-white border-b">
        <div className="flex items-center gap-3">
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((s) => !s)}
            className="p-2 rounded-md bg-gray-100 hover:bg-blue-100"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <Link
            to={homeTarget}
            className="text-lg font-bold"
            onClick={() => setActive(homeTarget)}
          >
            Thuận Hiếu Education
          </Link>
        </div>

        {username ? (
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium">{username}</div>
          </div>
        ) : (
          <Link
            to="/login"
            className="px-3 py-1 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            Login
          </Link>
        )}
      </div>

      {/* =========================
          Desktop Sidebar
      ========================== */}
      <div
        className={`hidden md:fixed md:inset-y-0 md:left-0 ${
          collapsed ? "md:w-20" : "md:w-64"
        } md:flex md:flex-col md:justify-between 
        md:bg-white md:border-r transition-all duration-300`}
      >
        {/* --- Top Section --- */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            {!collapsed ? (
              <Link
                to={homeTarget}
                className="text-lg font-bold text-blue-700"
                onClick={() => setActive(homeTarget)}
              >
                Thuận Hiếu Education
              </Link>
            ) : (
              <Link
                to={homeTarget}
                onClick={() => setActive(homeTarget)}
                title="Thuận Hiếu Education"
              >
                <Home size={22} className="text-blue-700" />
              </Link>
            )}

            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded hover:bg-blue-100"
              title={collapsed ? "Mở rộng" : "Thu gọn"}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
          </div>

          {/* --- Navigation --- */}
          <nav className="flex-1 p-3 space-y-1">
            {role === "admin" && (
              <>
                {navItem("/admin/home", "Admin Home", Home)}
                {navItem("/admin/liststudents", "List Students", Users)}
                {navItem("/admin/accounts", "Accounts", ListChecks)}
              </>
            )}

            {role === "class" && (
              <>
                {navItem("/class/home", "Class Home", Home)}
                {navItem("/dashboard", "Class Dashboard", ListChecks)}
                 {navItem("/class/sentnotification", "Sent Notification", ListChecks)}
              </>
            )}

            {role === "student" && (
              <>
                {navItem("/students/home", "Thông tin", IdCard)}
                {navItem(
                  "/students/checkattendance",
                  "Lịch sử điểm danh",
                  ListChecks
                )}
                {navItem("/students/notification", "Thông báo", Bell)}
              </>
            )}
          </nav>
        </div>

        {/* --- Bottom Section --- */}
        <div className="border-t p-3 flex flex-col items-start">
          {username ? (
            <>
              {!collapsed && (
                <div className="mb-2">
                  <div className="text-sm font-medium">{username}</div>
                  <div className="text-xs text-gray-500">{role}</div>
                </div>
              )}
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm w-full"
              >
                <LogOut size={18} />
                {!collapsed && <span>Logout</span>}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="w-full px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 text-center"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* =========================
          Padding offset for main content
      ========================== */}
      <div
        className="hidden md:block transition-all duration-300"
        style={{
          paddingLeft: collapsed ? "80px" : "256px", // khớp với w-20 và w-64
        }}
      ></div>
    </>
  );
}
