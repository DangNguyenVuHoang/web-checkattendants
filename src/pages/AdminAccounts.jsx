// src/pages/AdminAccounts.jsx
import { useEffect, useState } from "react";
import { ref, set, get, onValue } from "firebase/database";
import { db } from "../firebase";
import bcrypt from "bcryptjs";
import toast from "react-hot-toast";
import Pending from "./Pending";
import StudentList from "./StudentList";

export default function AdminAccounts() {
  const [username,setUsername] = useState("");
  const [role,setRole] = useState("class");
  const [classManaged,setClassManaged] = useState("");
  const [loading,setLoading] = useState(false);

  // list of classes to help UI (read from Class node)
  const [classOptions, setClassOptions] = useState([]);
  useEffect(() => {
    const cRef = ref(db, "Class");
    const unsub = onValue(cRef, (snap) => {
      const v = snap.val() || {};
      setClassOptions(Object.keys(v));
    });
    return () => unsub();
  }, []);

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
        uid: null,
        username,
        passwordHash: hash,
        role,
        classManaged: role === "class" ? classManaged : null,
        createdAt: new Date().toISOString()
      });
      if (role === "class") {
        // create Class node if not exists and link classAccount
        await set(ref(db, `Class/${classManaged}`), { className: classManaged, classAccount: username, students: {} });
      }
      toast.success("Tạo account thành công. Password mặc định = username");
      setUsername(""); setClassManaged(""); setRole("class");
    } catch (err) {
      console.error(err); toast.error("Lỗi tạo account");
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white p-6 rounded shadow">
        <h3 className="text-lg font-semibold mb-4">Tạo Admin / Class account</h3>
        <div className="grid grid-cols-3 gap-3 items-end">
          <input placeholder="username" value={username} onChange={(e)=>setUsername(e.target.value.trim())} className="col-span-1 border p-2 rounded" />
          <select value={role} onChange={(e)=>setRole(e.target.value)} className="col-span-1 border p-2 rounded">
            <option value="admin">admin</option>
            <option value="class">class</option>
          </select>
          {role === "class" ? (
            <select value={classManaged} onChange={(e)=>setClassManaged(e.target.value)} className="col-span-1 border p-2 rounded">
              <option value="">-- chọn lớp (hoặc nhập) --</option>
              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          ) : <div /> }
          <div className="col-span-3 flex gap-2">
            <button onClick={create} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={loading}>{loading? "Đang..." : "Tạo"}</button>
            <div className="text-sm text-gray-500 self-center">Password mặc định = username. Bắt buộc đổi khi vào production.</div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h4 className="font-semibold mb-3">Pending (Phê duyệt thẻ)</h4>
          {/* sử dụng component Pending - admin có full quyền thao tác trong component Pending */}
          <Pending adminMode={true} />
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h4 className="font-semibold mb-3">Danh sách học sinh (Toàn bộ)</h4>
          <StudentList />
        </div>
      </section>
    </div>
  );
}
