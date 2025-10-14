// src/pages/StudentList.jsx
import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";
import ModalEditStudent from "../components/ModalEditStudent";

/**
 * Responsive StudentList
 * - Mobile / Tablet: cards (grid 1 -> 2 cols)
 * - Laptop and up (lg): table
 */

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

  // small helper to format DOB (if ISO) or leave as-is
  const fmtDate = (d) => {
    if (!d) return "-";
    // if stored as yyyy-mm-dd or yyyy-mm-ddT...
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) {
      try {
        const dt = new Date(d);
        if (!isNaN(dt)) return dt.toLocaleDateString();
      } catch {}
    }
    return d;
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-xl font-semibold">Danh sách học sinh</h3>
        <div className="text-sm text-gray-600">{visibleEntries.length} học sinh</div>
      </div>

      {/* Cards view: shown on screens < lg */}
      <div className="block lg:hidden">
        {visibleEntries.length === 0 ? (
          <div className="text-center text-gray-500 p-6 bg-white rounded-lg shadow">Không có học sinh nào</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleEntries.map(([uid, s]) => (
              <div key={uid} className="bg-white p-4 rounded-lg shadow flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-500 font-mono">{uid}</div>
                    <div className="text-xs text-gray-400">{s.class || "-"}</div>
                  </div>

                  <div className="text-lg font-medium text-gray-800 mb-1 truncate">{s.name || "-"}</div>
                  <div className="text-sm text-gray-600 mb-2">{s.parentName ? `Phụ huynh: ${s.parentName}` : "Phụ huynh: -"}</div>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                    <div><span className="text-gray-500">SĐT HS:</span> <span className="font-medium">{s.phone || "-"}</span></div>
                    <div><span className="text-gray-500">SĐT PH:</span> <span className="font-medium">{s.parentPhone || "-"}</span></div>
                    <div><span className="text-gray-500">Giới tính:</span> <span className="font-medium">{s.gender || "-"}</span></div>
                    <div><span className="text-gray-500">Ngày sinh:</span> <span className="font-medium">{fmtDate(s.dob)}</span></div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => setEditUID(uid)}
                    className="flex-1 px-3 py-2 text-sm bg-yellow-400 hover:bg-yellow-500 rounded-md"
                  >
                    ✏️ Chỉnh sửa
                  </button>

                  <a
                    href={`/card/${uid}`}
                    className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-md text-center"
                  >
                    🔎 Xem
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table view: shown on lg and above */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">UID</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Họ tên</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Phụ huynh</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Lớp</th>
                <th className="px-4 py-3 text-left text-sm font-medium">SĐT PH</th>
                <th className="px-4 py-3 text-left text-sm font-medium">SĐT HS</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Giới tính</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Ngày sinh</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y">
              {visibleEntries.length === 0 ? (
                <tr>
                  <td colSpan="9" className="p-6 text-center text-gray-500">Không có học sinh nào</td>
                </tr>
              ) : (
                visibleEntries.map(([uid, s]) => (
                  <tr key={uid} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm">{uid}</td>
                    <td className="px-4 py-3 text-sm">{s.name || "-"}</td>
                    <td className="px-4 py-3 text-sm">{s.parentName || "-"}</td>
                    <td className="px-4 py-3 text-sm">{s.class || "-"}</td>
                    <td className="px-4 py-3 text-sm">{s.parentPhone || "-"}</td>
                    <td className="px-4 py-3 text-sm">{s.phone || "-"}</td>
                    <td className="px-4 py-3 text-sm">{s.gender || "-"}</td>
                    <td className="px-4 py-3 text-sm">{fmtDate(s.dob)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditUID(uid)}
                          className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 rounded-md"
                        >
                          ✏️
                        </button>
                        <a href={`/card/${uid}`} className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded-md">🔎</a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editUID && <ModalEditStudent uid={editUID} onClose={() => setEditUID(null)} />}
    </div>
  );
}
