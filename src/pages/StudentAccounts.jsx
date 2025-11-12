// src/pages/StudentAccounts.jsx
import { useEffect, useState } from "react";
import { ref, onValue, get } from "firebase/database";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 12; // ✅ số bản ghi mỗi trang

export default function StudentAccounts() {
  const navigate = useNavigate();
  const raw = localStorage.getItem("rfid_logged_user");
  const logged = raw ? JSON.parse(raw) : null;
  const uid = logged?.uid || null;

  const [user, setUser] = useState(null);
  const [rfid, setRfid] = useState(null);
  const [history, setHistory] = useState([]);

  // 🔹 trạng thái phân trang
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!logged) { navigate("/login"); return; }
    if (logged.role !== "student" || !uid) { navigate("/login"); return; }

    // USER
    get(ref(db, `USER/${uid}`))
      .then((snap) => {
        if (snap.exists()) setUser(snap.val());
      })
      .catch((err) => console.error(err));

    // RFID realtime
    const rRef = ref(db, `RFID/${uid}`);
    const unsub = onValue(rRef, (snap) => {
      if (!snap.exists()) {
        setRfid(null);
        setHistory([]);
        return;
      }

      const data = snap.val();
      setRfid({
        lastStatus: data.lastStatus ?? "Undefined",
        createdAt: data.createdAt ?? null,
        raw: data,
      });

      const accessLogObj = data.accessLog || data.accessLogs || null;
      if (accessLogObj) {
        let arr = Object.values(accessLogObj).map((item) => ({
          time: item.time ?? null,
          status: item.status ?? item.state ?? JSON.stringify(item),
        }));
        arr.sort(
          (a, b) =>
            (b.time ? new Date(b.time).getTime() : 0) -
            (a.time ? new Date(a.time).getTime() : 0)
        );
        setHistory(arr);
        setPage(1); // reset về trang đầu mỗi lần load
      } else setHistory([]);
    });

    return () => unsub();
  }, [logged, uid, navigate]);

  if (!logged) return null;

  // 🔹 phân trang logic
  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
  const currentPageItems = history.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Trang học sinh</h2>

      {/* --- Thông tin học sinh --- */}
      <div className="bg-white p-4 rounded shadow mb-6 grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Thông tin cá nhân</h4>
          <div className="text-sm space-y-1">
            <div><strong>UID:</strong> {uid}</div>
            <div><strong>Họ tên:</strong> {user?.name || "-"}</div>
            <div><strong>Phụ huynh:</strong> {user?.parentName || "-"}</div>
            <div><strong>Lớp:</strong> {user?.class || "-"}</div>
            <div><strong>Điện thoại:</strong> {user?.phone || "-"}</div>
            <div><strong>SĐT phụ huynh:</strong> {user?.parentPhone || "-"}</div>
            <div><strong>Ngày sinh:</strong> {user?.dob || "-"}</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">RFID / trạng thái</h4>
          <div className="mb-2">
            <div
              className={`inline-block px-3 py-1 rounded text-sm ${
                rfid?.lastStatus
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {rfid?.lastStatus ?? "Không có"}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            <strong>Created:</strong> {rfid?.createdAt ?? "-"}
          </div>
        </div>
      </div>

      {/* --- Lịch sử quẹt thẻ (phân trang) --- */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Lịch sử quẹt thẻ (mới nhất)</h4>
          <div className="text-sm text-gray-500">
            Tổng: {history.length} | Trang {page} / {totalPages}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="text-sm text-gray-500">Không có lịch sử</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Thời gian</th>
                    <th className="p-2 text-left">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPageItems.map((h, idx) => (
                    <tr key={idx} className="border-t hover:bg-gray-50">
                      <td className="p-2">{h.time ?? "-"}</td>
                      <td className="p-2">{h.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* --- Pagination controls --- */}
            <div className="flex justify-between items-center mt-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
                >
                  Next
                </button>
              </div>
              <div className="text-sm text-gray-600">
                Trang {page} / {totalPages}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
