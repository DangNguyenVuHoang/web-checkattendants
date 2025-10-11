// import { useEffect, useState } from "react";
// import { ref, onValue } from "firebase/database";
// import { db } from "../firebase";
// import ModalEditStudent from "../components/ModalEditStudent";

// export default function StudentList() {
//   const [students, setStudents] = useState({});
//   const [editUID, setEditUID] = useState(null); // ✅ lưu uid đang được edit

//   useEffect(() => {
//     const userRef = ref(db, "USER");
//     onValue(userRef, (snapshot) => {
//       setStudents(snapshot.val() || {});
//     });
//   }, []);

//   return (
//     <div>
//       <h3 className="text-xl font-semibold mb-4">Danh sách học sinh</h3>
//       <div className="overflow-x-auto">
//         <table className="min-w-full bg-white border rounded-lg">
//           <thead className="bg-blue-600 text-white">
//             <tr>
//               <th className="p-2">UID</th>
//               <th className="p-2">Họ tên</th>
//               <th className="p-2">Phụ huynh</th>
//               <th className="p-2">Lớp</th>
//               <th className="p-2">SĐT PH</th>
//               <th className="p-2">SĐT HS</th>
//               <th className="p-2">Giới tính</th>
//               <th className="p-2">Ngày sinh</th>
//               <th className="p-2">Thao tác</th>
//             </tr>
//           </thead>
//           <tbody>
//             {Object.keys(students).length === 0 ? (
//               <tr>
//                 <td colSpan="9" className="text-center p-4">
//                   Không có học sinh nào ❌
//                 </td>
//               </tr>
//             ) : (
//               Object.entries(students).map(([uid, s]) => (
//                 <tr key={uid} className="border-b hover:bg-gray-100">
//                   <td className="p-2">{uid}</td>
//                   <td className="p-2">{s.name}</td>
//                   <td className="p-2">{s.parentName}</td>
//                   <td className="p-2">{s.class}</td>
//                   <td className="p-2">{s.parentPhone}</td>
//                   <td className="p-2">{s.phone}</td>
//                   <td className="p-2">{s.gender}</td>
//                   <td className="p-2">{s.dob}</td>
//                   <td className="p-2 flex gap-2">
//                     <button
//                       className="bg-yellow-400 px-2 py-1 rounded hover:bg-yellow-500"
//                       onClick={() => setEditUID(uid)}
//                     >
//                       ✏️
//                     </button>
//                     <button className="bg-red-500 text-white px-2 py-1 rounded">
//                       🗑️
//                     </button>
//                     <button className="bg-green-500 text-white px-2 py-1 rounded">
//                       ℹ️
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* ✅ Modal edit */}
//       {editUID && (
//         <ModalEditStudent uid={editUID} onClose={() => setEditUID(null)} />
//       )}
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import ModalEditStudent from "../components/ModalEditStudent";

export default function StudentList() {
  const [students, setStudents] = useState({});
  const [editUID, setEditUID] = useState(null);
  const [classStudentUIDs, setClassStudentUIDs] = useState(new Set());

  useEffect(() => {
    const userRef = ref(db, "USER");
    const unsub = onValue(userRef, (snapshot) => setStudents(snapshot.val() || {}));
    return () => unsub();
  }, []);

  useEffect(() => {
    const loggedRaw = localStorage.getItem("rfid_logged_user");
    if (!loggedRaw) return;
    const logged = JSON.parse(loggedRaw);
    if (logged.role !== "class" || !logged.classManaged) { setClassStudentUIDs(new Set()); return; }

    const cRef = ref(db, `Class/${logged.classManaged}/students`);
    const unsub = onValue(cRef, (snap) => {
      const val = snap.val() || {};
      setClassStudentUIDs(new Set(Object.keys(val)));
    });
    return () => unsub();
  }, []);

  const loggedRaw = localStorage.getItem("rfid_logged_user");
  const logged = loggedRaw ? JSON.parse(loggedRaw) : null;

  const visibleEntries = Object.entries(students).filter(([uid, s]) => {
    if (!logged) return false;
    if (logged.role === "admin") return true;
    if (logged.role === "class") return classStudentUIDs.has(uid);
    if (logged.role === "student") return uid === logged.uid;
    return false;
  });

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Danh sách học sinh</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-lg">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-2">UID</th><th className="p-2">Họ tên</th><th className="p-2">Phụ huynh</th>
              <th className="p-2">Lớp</th><th className="p-2">SĐT PH</th><th className="p-2">SĐT HS</th>
              <th className="p-2">Giới tính</th><th className="p-2">Ngày sinh</th><th className="p-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries.length === 0 ? (
              <tr><td colSpan="9" className="text-center p-4">Không có học sinh nào</td></tr>
            ) : visibleEntries.map(([uid, s]) => (
              <tr key={uid} className="border-b hover:bg-gray-100">
                <td className="p-2">{uid}</td>
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.parentName || "-"}</td>
                <td className="p-2">{s.class}</td>
                <td className="p-2">{s.parentPhone || "-"}</td>
                <td className="p-2">{s.phone || "-"}</td>
                <td className="p-2">{s.gender || "-"}</td>
                <td className="p-2">{s.dob || "-"}</td>
                <td className="p-2 flex gap-2">
                  <button className="bg-yellow-400 px-2 py-1 rounded" onClick={() => setEditUID(uid)}>✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editUID && <ModalEditStudent uid={editUID} onClose={() => setEditUID(null)} />}
    </div>
  );
}
