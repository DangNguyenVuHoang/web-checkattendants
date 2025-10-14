// src/components/ModalApprove.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ref, set, remove, get, onValue } from "firebase/database";
import { db } from "../firebase";
import toast from "react-hot-toast";
import bcrypt from "bcryptjs";

export default function ModalApprove({ uid, onClose }) {
  const [form, setForm] = useState({
    name: "",
    parentName: "",
    role: "student",
    class: "",
    parentPhone: "",
    phone: "",
    address: "",
    gender: "",
    dob: "",
  });
  const [classOptions, setClassOptions] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const classRef = ref(db, "Class");
    const unsub = onValue(classRef, (snap) => {
      const val = snap.val() || {};
      const list = Object.keys(val).map((k) => ({ key: k, ...val[k] }));
      setClassOptions(list);
      if (!form.class && list.length > 0) {
        setForm((s) => ({ ...s, class: list[0].className || list[0].key }));
      }
    });
    return () => unsub();
  }, []);

  const formatDateVN = (date = new Date()) => {
    const pad = (n) => String(n).padStart(2, "0");
    const d = pad(date.getDate()), m = pad(date.getMonth()+1), y = date.getFullYear();
    const h = pad(date.getHours()), mm = pad(date.getMinutes()), s = pad(date.getSeconds());
    return `${d}-${m}-${y} ${h}:${mm}:${s}`;
  };

  const sanitize = (str) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
  };

  const makeBaseUsername = (fullName) => {
    const clean = sanitize(fullName || "user").replace(/\s+/g, "");
    const base = clean.length > 6 ? clean.slice(0,6) : clean;
    const rand3 = Math.floor(100 + Math.random() * 900);
    return `${base}${rand3}`;
  };

  const isUsernameTaken = async (username) => {
    const snap = await get(ref(db, `ACCOUNTS/${username}`));
    return snap.exists();
  };

  const generateUniqueUsername = async (fullName, attempts = 0) => {
    if (attempts > 8) return `user${Date.now().toString().slice(-6)}`;
    const candidate = makeBaseUsername(fullName);
    if (!(await isUsernameTaken(candidate))) return candidate;
    return generateUniqueUsername(fullName + Math.floor(Math.random()*1000), attempts + 1);
  };

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const handleApprove = async () => {
    const required = ["name", "role", "class"];
    for (const f of required) if (!form[f]) { toast.error(`Trường "${f}" không được để trống`); return; }

    setIsCreating(true);
    try {
      const username = await generateUniqueUsername(form.name || "user");
      const rawPassword = username; // default
      const passwordHash = bcrypt.hashSync(rawPassword, 10);
      const now = formatDateVN();

      // write USER
      await set(ref(db, `USER/${uid}`), {
        ...form,
        account: { username, role: "student" }
      });

      // write RFID
      await set(ref(db, `RFID/${uid}`), {
        lastStatus: "Undefined",
        createdAt: now,
        accessLog: {}
      });

      // write ACCOUNTS
      await set(ref(db, `ACCOUNTS/${username}`), {
        uid,
        username,
        passwordHash,
        role: "student",
        classManaged: form.class || null,
        createdAt: now
      });

      // add to Class node
      const classKey = form.class;
      if (classKey) {
        await set(ref(db, `Class/${classKey}/students/${uid}`), {
          uid,
          name: form.name,
          createdAt: now
        });
      }

      // remove pending
      await remove(ref(db, `Pending/${uid}`));

      toast.success("Đã phê duyệt & tạo account (username = password mặc định)");
      toast(`Username: ${username}`, { duration: 6000 });

      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi duyệt, xem console");
    } finally {
      setIsCreating(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={() => { if (!isCreating) onClose(); }} />
      <div className="relative bg-white p-6 rounded-xl shadow-lg w-full max-w-lg z-10">
        <h2 className="text-xl font-semibold mb-4">Điền thông tin học sinh (tạo account)</h2>

        <div className="grid grid-cols-2 gap-3">
          {[
            ["name","Họ và tên học sinh"],
            ["parentName","Họ và tên phụ huynh"],
            ["role","Vai trò"],
            ["parentPhone","SĐT phụ huynh"],
            ["phone","SĐT học sinh"],
            ["address","Địa chỉ"]
          ].map(([k,label]) => (
            <div key={k}>
              <label className="block text-sm text-gray-600 mb-1">{label}</label>
              <input name={k} value={form[k]||""} onChange={handleChange} className="border p-2 rounded w-full"/>
            </div>
          ))}

          <div>
            <label className="block text-sm text-gray-600 mb-1">Lớp</label>
            <select name="class" value={form.class||""} onChange={handleChange} className="border p-2 rounded w-full">
              <option value="">-- Chọn lớp --</option>
              {classOptions.map(c => <option key={c.key} value={c.key}>{c.className || c.key}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Giới tính</label>
            <select name="gender" value={form.gender||""} onChange={handleChange} className="border p-2 rounded w-full">
              <option value="">-- Chọn --</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Ngày sinh</label>
            <input type="date" name="dob" value={form.dob||""} onChange={handleChange} className="border p-2 rounded w-full"/>
          </div>
        </div>

        <div className="flex justify-end mt-5 gap-3">
          <button onClick={() => { if (!isCreating) onClose(); }} className="px-4 py-2 bg-gray-300 rounded">Hủy</button>
          <button onClick={handleApprove} disabled={isCreating} className="px-4 py-2 bg-blue-600 text-white rounded">{isCreating? "Đang tạo..." : "Phê duyệt & Tạo account"}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
