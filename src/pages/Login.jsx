// // src/pages/Login.jsx
// import { useState } from "react";
// import { get, ref } from "firebase/database";
// import { db } from "../firebase";
// import bcrypt from "bcryptjs";
// import { useNavigate } from "react-router-dom";
// import toast from "react-hot-toast";

// export default function Login() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e?.preventDefault();
//     if (!username || !password) {
//       toast.error("Nhập username & password");
//       return;
//     }
//     setLoading(true);
//     try {
//       const snap = await get(ref(db, `ACCOUNTS/${username}`));
//       if (!snap.exists()) {
//         toast.error("Tài khoản không tồn tại");
//         setLoading(false);
//         return;
//       }
//       const acc = snap.val();
//       const match = bcrypt.compareSync(password, acc.passwordHash);
//       if (!match) {
//         toast.error("Sai mật khẩu");
//         setLoading(false);
//         return;
//       }

//       // Lưu thông tin login đơn giản (localStorage)
//       const logged = { username: acc.username, uid: acc.uid, loginAt: new Date().toISOString() };
//       localStorage.setItem("rfid_logged_user", JSON.stringify(logged));

//       toast.success("Đăng nhập thành công");
//       // redirect to card detail
//       navigate(`/card/${acc.uid}`);
//     } catch (err) {
//       console.error(err);
//       toast.error("Lỗi đăng nhập");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
//       <h2 className="text-xl font-semibold mb-4">Đăng nhập tài khoản thẻ</h2>
//       <form onSubmit={handleLogin} className="space-y-3">
//         <div>
//           <label className="block text-sm font-medium text-gray-600">Username</label>
//           <input
//             className="w-full border p-2 rounded"
//             value={username}
//             onChange={(e) => setUsername(e.target.value.trim())}
//             placeholder="username"
//             autoComplete="username"
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-gray-600">Password</label>
//           <input
//             type="password"
//             className="w-full border p-2 rounded"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             placeholder="password"
//             autoComplete="current-password"
//           />
//         </div>

//         <div className="flex items-center justify-between">
//           <button
//             type="submit"
//             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//             disabled={loading}
//           >
//             {loading ? "Đang xử lý..." : "Đăng nhập"}
//           </button>
//           <button
//             type="button"
//             onClick={() => { setUsername(""); setPassword(""); }}
//             className="text-sm text-gray-500"
//           >
//             Clear
//           </button>
//         </div>
//       </form>

//       <div className="mt-4 text-sm text-gray-600">
//         Ghi chú: tài khoản mặc định là username = password (nếu bạn đã tạo theo flow approve).
//       </div>
//     </div>
//   );
// }
// src/pages/Login.jsx (debug version)
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
    if (!username || !password) { toast.error("Nhập username & password"); return; }
    setLoading(true);
    try {
      const snap = await get(ref(db, `ACCOUNTS/${username}`));
      console.log("[DEBUG] account snapshot:", snap.exists() ? snap.val() : null);
      if (!snap.exists()) {
        toast.error("Tài khoản không tồn tại (kiểm tra chính xác username/key trong DB)");
        setLoading(false);
        return;
      }

      const acc = snap.val();
      if (!acc.passwordHash) {
        console.error("[DEBUG] account missing passwordHash:", acc);
        toast.error("Tài khoản chưa có passwordHash. Hãy tạo lại tài khoản hoặc cập nhật hash.");
        setLoading(false);
        return;
      }

      // debug: show beginning of hash (not full for safety)
      console.log("[DEBUG] stored passwordHash (truncated):", acc.passwordHash.slice(0, 30) + "...");

      // compare
      let ok = false;
      try {
        ok = bcrypt.compareSync(password, acc.passwordHash);
      } catch (err) {
        console.error("[DEBUG] bcrypt.compareSync error:", err);
      }

      if (!ok) {
        // helpful fallback message
        console.warn("[DEBUG] password compare failed for user", username);
        toast.error("Sai mật khẩu. Nếu hash là placeholder, hãy tạo lại account admin (Admin -> tạo admin mới).");
        setLoading(false);
        return;
      }

      // success
      const logged = { username: acc.username, uid: acc.uid || null, role: acc.role || "student", classManaged: acc.classManaged || null, loginAt: new Date().toISOString() };
      localStorage.setItem("rfid_logged_user", JSON.stringify(logged));
      toast.success("Đăng nhập thành công");
      if (acc.role === "class" && acc.classManaged) navigate("/");
      else if (acc.uid) navigate(`/card/${acc.uid}`);
      else navigate("/");
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Lỗi đăng nhập (xem console)");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-white p-6 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Đăng nhập (debug)</h2>
      <form onSubmit={handleLogin} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-600">Username</label>
          <input className="w-full border p-2 rounded" value={username} onChange={(e) => setUsername(e.target.value.trim())} placeholder="username"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-600">Password</label>
          <input type="password" className="w-full border p-2 rounded" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password"/>
        </div>
        <div className="flex items-center justify-between">
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? "Đang..." : "Đăng nhập"}</button>
          <button type="button" onClick={() => { setUsername(""); setPassword(""); }} className="text-sm text-gray-500">Clear</button>
        </div>
      </form>
    </div>
  );
}
