// // src/components/ModalStudentNotifications.jsx
// import { useEffect, useState } from "react";
// import { ref, onValue, push } from "firebase/database";
// import { db } from "../firebase";
// import toast from "react-hot-toast";

// export default function ModalStudentNotifications({ uid, onClose }) {
//   const [history, setHistory] = useState([]);
//   const [openSend, setOpenSend] = useState(false);
//   const [message, setMessage] = useState("");

//   // Load history
//   useEffect(() => {
//     const nRef = ref(db, `Notifications/${uid}`);
//     const unsub = onValue(nRef, (snap) => {
//       const val = snap.val() || {};
//       const arr = Object.keys(val).map((id) => ({
//         id,
//         ...val[id],
//       }));

//       arr.sort((a, b) => new Date(b.time) - new Date(a.time));
//       setHistory(arr);
//     });

//     return () => unsub();
//   }, [uid]);

//   const handleSend = async () => {
//     if (!message.trim()) {
//       toast.error("Nội dung không được để trống");
//       return;
//     }

//     try {
//       await push(ref(db, `Notifications/${uid}`), {
//         message,
//         time: new Date().toISOString(),
//       });

//       toast.success("Đã gửi thông báo");
//       setMessage("");
//       setOpenSend(false);
//     } catch (err) {
//       toast.error("Lỗi gửi thông báo");
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center">
//       <div className="absolute inset-0 bg-black/40" onClick={onClose} />

//       <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">

//         <h3 className="text-xl font-bold mb-3">📤 Gửi thông báo cho: {uid}</h3>

//         {/* Lịch sử */}
//         <div className="max-h-60 overflow-y-auto border rounded p-3 bg-gray-50 mb-4">
//           {history.length === 0 ? (
//             <div className="text-gray-500 text-sm text-center">
//               Chưa có thông báo nào.
//             </div>
//           ) : (
//             history.map((n) => (
//               <div key={n.id} className="border-b py-2 text-sm">
//                 <div>{n.message}</div>
//                 <div className="text-xs text-gray-500">
//                   {new Date(n.time).toLocaleString()}
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         {/* Button mở form gửi mới */}
//         {!openSend ? (
//           <button
//             onClick={() => setOpenSend(true)}
//             className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
//           >
//             + Gửi thông báo mới
//           </button>
//         ) : (
//           <div className="space-y-2">
//             <textarea
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               className="border rounded w-full p-2 text-sm"
//               rows={3}
//               placeholder="Nhập nội dung thông báo..."
//             />

//             {/* Template nhanh */}
//             <div className="flex gap-2 flex-wrap text-sm">
//               <button
//                 onClick={() => setMessage("Học sinh ngủ gật trong lớp.")}
//                 className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
//               >
//                 😴 Ngủ gật
//               </button>
//               <button
//                 onClick={() => setMessage("Sức khoẻ học sinh không tốt.")}
//                 className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
//               >
//                 🤒 Sức khoẻ không tốt
//               </button>
//               <button
//                 onClick={() => setMessage("Học sinh cần chú ý tập trung hơn.")}
//                 className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
//               >
//                 ⚠️ Thiếu tập trung
//               </button>
//             </div>

//             <div className="flex justify-end gap-2">
//               <button
//                 onClick={() => setOpenSend(false)}
//                 className="px-3 py-1 bg-gray-300 rounded"
//               >
//                 Hủy
//               </button>

//               <button
//                 onClick={handleSend}
//                 className="px-3 py-1 bg-blue-600 text-white rounded"
//               >
//                 Gửi
//               </button>
//             </div>
//           </div>
//         )}

//         <button
//           onClick={onClose}
//           className="absolute top-2 right-3 text-gray-500 hover:text-red-500"
//         >
//           ✕
//         </button>
//       </div>
//     </div>
//   );
// }
