// import { useEffect, useState } from "react";
// import { createPortal } from "react-dom";
// import { ref, onValue, update } from "firebase/database";
// import { db } from "../firebase";
// import toast from "react-hot-toast";

// export default function ModalEditStudent({ uid, onClose }) {
//   const [form, setForm] = useState({
//     name: "",
//     parentName: "",
//     role: "",
//     class: "",
//     parentPhone: "",
//     phone: "",
//     address: "",
//     gender: "",
//     dob: "",
//   });

//   // ✅ Tự load dữ liệu khi modal mở
//   useEffect(() => {
//     if (!uid) return;
//     const userRef = ref(db, "USER/" + uid);
//     onValue(userRef, (snapshot) => {
//       const data = snapshot.val();
//       if (data) setForm(data);
//     });
//   }, [uid]);

//   const handleChange = (e) =>
//     setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSave = async () => {
//     try {
//       await update(ref(db, "USER/" + uid), form);
//       toast.success("✅ Cập nhật thông tin thành công!");
//       onClose();
//     } catch (err) {
//       console.error(err);
//       toast.error("❌ Lỗi khi cập nhật dữ liệu!");
//     }
//   };

//   const modalContent = (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       <div
//         className="absolute inset-0 bg-black/50 backdrop-blur-sm"
//         onClick={onClose}
//       ></div>

//       <div className="relative bg-white p-6 rounded-xl shadow-2xl w-full max-w-lg animate-slideUp z-10">
//         <h2 className="text-xl font-semibold mb-4 text-gray-800 text-center">
//           ✏️ Chỉnh sửa thông tin học sinh
//         </h2>

//         <div className="grid grid-cols-2 gap-3">
//           {[
//             ["name", "Họ và tên học sinh"],
//             ["parentName", "Họ và tên phụ huynh"],
//             ["role", "Vai trò"],
//             ["class", "Lớp"],
//             ["parentPhone", "SĐT Phụ huynh"],
//             ["phone", "SĐT Học sinh"],
//             ["address", "Địa chỉ"],
//           ].map(([key, label]) => (
//             <div key={key}>
//               <label className="block text-sm font-medium text-gray-600 mb-1">
//                 {label}
//               </label>
//               <input
//                 name={key}
//                 value={form[key] || ""}
//                 onChange={handleChange}
//                 className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
//               />
//             </div>
//           ))}

//           <div>
//             <label className="block text-sm font-medium text-gray-600 mb-1">
//               Giới tính
//             </label>
//             <select
//               name="gender"
//               value={form.gender || ""}
//               onChange={handleChange}
//               className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
//             >
//               <option value="">-- Chọn --</option>
//               <option value="Nam">Nam</option>
//               <option value="Nữ">Nữ</option>
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-600 mb-1">
//               Ngày sinh
//             </label>
//             <input
//               type="date"
//               name="dob"
//               value={form.dob || ""}
//               onChange={handleChange}
//               className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
//             />
//           </div>
//         </div>

//         <div className="flex justify-end mt-5 gap-3">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
//           >
//             Hủy
//           </button>
//           <button
//             onClick={handleSave}
//             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
//           >
//             Lưu thay đổi
//           </button>
//         </div>
//       </div>
//     </div>
//   );

//   return createPortal(modalContent, document.body);
// }
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
      <div className="relative bg-white p-6 rounded shadow max-w-lg w-full z-10">
        <h3 className="font-semibold mb-3">Chỉnh sửa học sinh {uid}</h3>
        <div className="grid grid-cols-2 gap-3">
          <input name="name" value={form.name||""} onChange={handleChange} className="border p-2 rounded" />
          <input name="parentName" value={form.parentName||""} onChange={handleChange} className="border p-2 rounded" />
          <input name="class" value={form.class||""} onChange={handleChange} className="border p-2 rounded" />
          <input name="phone" value={form.phone||""} onChange={handleChange} className="border p-2 rounded" />
          <input name="parentPhone" value={form.parentPhone||""} onChange={handleChange} className="border p-2 rounded" />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 bg-gray-300 rounded">Cancel</button>
          <button onClick={handleSave} className="px-3 py-1 bg-blue-600 text-white rounded">Save</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
