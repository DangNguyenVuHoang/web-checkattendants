// src/pages/ClassAccounts.jsx
import { useEffect, useState } from "react";
import { ref, onValue, get } from "firebase/database";
import { db } from "../firebase";
import { Link, useNavigate } from "react-router-dom";

/**
 * ClassAccounts
 * - Hiển thị danh sách học sinh thuộc classManaged (Class/{classManaged}/students)
 * - Cho link mở chi tiết thẻ (/card/:uid)
 * - Nếu không phải class account hoặc không có classManaged -> redirect /login
 */
export default function ClassAccounts() {
  const navigate = useNavigate();
  const raw = localStorage.getItem("rfid_logged_user");
  const logged = raw ? JSON.parse(raw) : null;
  const className = logged?.classManaged || null;

  const [students, setStudents] = useState({}); // { uid: { uid, name, createdAt } }
  const [usersMap, setUsersMap] = useState({}); // full USER data for uids

  useEffect(() => {
    if (!logged) { navigate("/login"); return; }
    if (logged.role !== "class" || !className) { navigate("/login"); return; }

    // listen Class/<className>/students
    const cRef = ref(db, `Class/${className}/students`);
    const unsub = onValue(cRef, (snap) => {
      const val = snap.val() || {};
      setStudents(val);
      // prefetch USER details for these uids
      Object.keys(val).forEach((uid) => {
        get(ref(db, `USER/${uid}`)).then(s => {
          if (s.exists()) {
            setUsersMap(prev => ({ ...prev, [uid]: s.val() }));
          }
        }).catch(err => console.error("prefetch USER error", err));
      });
    });

    return () => unsub();
  }, [logged, className, navigate]);

  if (!logged) return null;

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Trang lớp: {className}</h2>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h3 className="font-semibold mb-2">Danh sách học sinh ({Object.keys(students).length})</h3>
        {Object.keys(students).length === 0 ? (
          <div className="text-sm text-gray-500">Hiện chưa có học sinh trong lớp này.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">UID</th>
                  <th className="p-2 text-left">Họ tên</th>
                  <th className="p-2 text-left">Ngày tạo</th>
                  <th className="p-2 text-left">Lớp</th>
                  <th className="p-2 text-left">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(students).map(([uid, s]) => {
                  const u = usersMap[uid] || {};
                  return (
                    <tr key={uid} className="border-t hover:bg-gray-50">
                      <td className="p-2">{uid}</td>
                      <td className="p-2">{u.name || s.name || "-"}</td>
                      <td className="p-2">{s.createdAt || "-"}</td>
                      <td className="p-2">{u.class || className}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <Link to={`/card/${uid}`} className="px-2 py-1 bg-blue-600 text-white rounded text-sm">Xem thẻ</Link>
                          <button className="px-2 py-1 bg-gray-200 rounded text-sm" onClick={() => {
                            // quick navigate to student details page if exists
                            navigate(`/card/${uid}`);
                          }}>Chi tiết</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* <div className="flex gap-3">
        <button onClick={() => { localStorage.removeItem("rfid_logged_user"); navigate("/login"); }} className="px-3 py-2 bg-gray-300 rounded">Logout</button>
        <button onClick={() => navigate("/dashboard")} className="px-3 py-2 bg-blue-600 text-white rounded">Về Dashboard</button>
      </div> */}
    </div>
  );
}
