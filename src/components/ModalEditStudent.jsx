import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ref, get, set } from "firebase/database";
import { db } from "../firebase";
import toast from "react-hot-toast";

export default function ModalEditStudent({ uid, onClose }) {
  const [form, setForm] = useState(null);
  useEffect(() => {
    get(ref(db, `USER/${uid}`)).then(snap => {
      setForm(snap.val() || {});
    });
  }, [uid]);

  if (!form) return null;

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    try {
      await set(ref(db, `USER/${uid}`), form);
      toast.success("Đã lưu thông tin học sinh");
      onClose();
    } catch (err) {
      console.error(err); toast.error("Lỗi lưu");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white p-4 sm:p-6 md:p-8 rounded shadow max-w-lg w-full z-10">
        <h3 className="font-semibold mb-3 text-lg md:text-xl">
          Chỉnh sửa học sinh: {form.name}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            name="name"
            value={form.name || ""}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Tên học sinh"
          />
          <input
            name="parentName"
            value={form.parentName || ""}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Tên phụ huynh"
          />
          <input
            name="class"
            value={form.class || ""}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Lớp"
          />
          <input
            name="phone"
            value={form.phone || ""}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Số điện thoại học sinh"
          />
          <input
            name="parentPhone"
            value={form.parentPhone || ""}
            onChange={handleChange}
            className="border p-2 rounded w-full"
            placeholder="Số điện thoại phụ huynh"
          />
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 bg-gray-300 rounded w-full sm:w-auto">Cancel</button>
          <button onClick={handleSave} className="px-3 py-1 bg-blue-600 text-white rounded w-full sm:w-auto">Save</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
