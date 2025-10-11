import { useState } from "react";
import { ref, set, get } from "firebase/database";
import { db } from "../firebase";
import bcrypt from "bcryptjs";
import toast from "react-hot-toast";

export default function AdminAccounts() {
  const [username,setUsername] = useState("");
  const [role,setRole] = useState("class");
  const [classManaged,setClassManaged] = useState("");
  const [loading,setLoading] = useState(false);

  const create = async () => {
    if (!username) return toast.error("Nhập username");
    if (role === "class" && !classManaged) return toast.error("Nhập mã lớp");
    setLoading(true);
    try {
      const snap = await get(ref(db, `ACCOUNTS/${username}`));
      if (snap.exists()) { toast.error("Username tồn tại"); setLoading(false); return; }
      const raw = username;
      const hash = bcrypt.hashSync(raw, 10);
      await set(ref(db, `ACCOUNTS/${username}`), {
        uid: null, username, passwordHash: hash, role, classManaged: role === "class" ? classManaged : null, createdAt: new Date().toISOString()
      });
      if (role === "class") {
        await set(ref(db, `Class/${classManaged}`), { className: classManaged, classAccount: username, students: {} });
      }
      toast.success("Tạo account thành công (password mặc định = username)");
      setUsername(""); setClassManaged(""); setRole("class");
    } catch (err) {
      console.error(err); toast.error("Lỗi tạo account");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-6 rounded shadow">
      <h3 className="text-lg font-semibold mb-3">Tạo Admin / Class account</h3>
      <div className="space-y-3">
        <input placeholder="username" value={username} onChange={(e)=>setUsername(e.target.value.trim())} className="w-full border p-2 rounded" />
        <select value={role} onChange={(e)=>setRole(e.target.value)} className="w-full border p-2 rounded">
          <option value="admin">admin</option>
          <option value="class">class</option>
        </select>
        {role === "class" && <input placeholder="mã lớp (vd: 12A1)" value={classManaged} onChange={(e)=>setClassManaged(e.target.value.trim())} className="w-full border p-2 rounded" />}
        <div className="flex gap-2">
          <button onClick={create} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading ? "Đang..." : "Tạo"}</button>
        </div>
      </div>
    </div>
  );
}
