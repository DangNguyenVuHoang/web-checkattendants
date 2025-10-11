// src/pages/Login.jsx
import { useState } from "react";
import { get, ref } from "firebase/database";
import { db } from "../firebase";
import bcrypt from "bcryptjs";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!username || !password) return toast.error("Nhập username & password");
    setLoading(true);
    try {
      const snap = await get(ref(db, `ACCOUNTS/${username}`));
      if (!snap.exists()) { toast.error("Tài khoản không tồn tại"); setLoading(false); return; }
      const acc = snap.val();
      const ok = bcrypt.compareSync(password, acc.passwordHash);
      if (!ok) { toast.error("Sai mật khẩu"); setLoading(false); return; }

      const logged = {
        username: acc.username,
        uid: acc.uid || null,
        role: acc.role || "student",
        classManaged: acc.classManaged || null,
        loginAt: new Date().toISOString()
      };
      localStorage.setItem("rfid_logged_user", JSON.stringify(logged));
      toast.success("Đăng nhập thành công");

      // Redirect by role:
      if (acc.role === "admin") {
        navigate("/admin/accounts");
      } else if (acc.role === "class") {
        navigate("/dashboard");
      } else if (acc.uid) {
        navigate(`/card/${acc.uid}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Lỗi đăng nhập (xem console)");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Đăng nhập</h2>
      <form onSubmit={handleLogin} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-600">Username</label>
          <input className="w-full border p-2 rounded" value={username} onChange={(e)=>setUsername(e.target.value.trim())} placeholder="username"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Password</label>
          <input type="password" className="w-full border p-2 rounded" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="password"/>
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading? "Đang..." : "Đăng nhập"}</button>
          <button type="button" onClick={()=>{ setUsername(""); setPassword(""); }} className="text-sm text-gray-500">Clear</button>
        </div>
      </form>
      <div className="mt-4 text-sm text-gray-600">Ghi chú: mật khẩu mặc định = username (nếu account tạo bằng hệ thống).</div>
    </div>
  );
}
