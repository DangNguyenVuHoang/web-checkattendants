import { useEffect, useState } from "react";
import { ref, get, onValue } from "firebase/database";
import { db } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";

export default function CardDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [rfid, setRfid] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedRaw = localStorage.getItem("rfid_logged_user");
    if (!loggedRaw) { navigate("/login"); return; }
    const logged = JSON.parse(loggedRaw);

    get(ref(db, `USER/${uid}`)).then((snap) => {
      if (!snap.exists()) { setLoading(false); setUser(null); return; }
      const u = snap.val();
      const isAdmin = logged.role === "admin";
      const isClass = logged.role === "class" && String(u.class || "").toLowerCase() === String(logged.classManaged || "").toLowerCase();
      const isOwner = logged.role === "student" && logged.uid === uid;
      if (!(isAdmin || isClass || isOwner)) { setUser(null); setLoading(false); return; }
      setUser(u); setLoading(false);
    }).catch((err) => { console.error(err); setLoading(false); setUser(null); });

    const rfidRef = ref(db, `RFID/${uid}`);
    const unsub = onValue(rfidRef, (snap) => {
      if (!snap.exists()) { setRfid(null); setHistory([]); return; }
      const data = snap.val();
      setRfid({ lastStatus: data.lastStatus ?? "Undefined", createdAt: data.createdAt ?? null, raw: data });
      const accessLogObj = data.accessLog || data.accessLogs || null;
      if (accessLogObj) {
        let arr = Object.values(accessLogObj).map(item => ({
          time: item.time ?? null,
          status: item.status ?? item.state ?? JSON.stringify(item)
        }));
        arr.sort((a,b) => (b.time ? new Date(b.time).getTime() : 0) - (a.time ? new Date(a.time).getTime() : 0));
        setHistory(arr.slice(0,20));
      } else setHistory([]);
    });

    return () => unsub();
  }, [uid, navigate]);

  if (loading) return <div className="p-6 text-center">Đang tải…</div>;

  if (!user) return (
    <div className="p-6 text-center">
      <div className="text-red-600 font-semibold">⛔ Bạn không có quyền xem thẻ này hoặc thẻ không tồn tại.</div>
      <div className="mt-3">
        <button onClick={() => navigate("/login")} className="px-3 py-1 bg-blue-600 text-white rounded">Đăng nhập</button>
      </div>
    </div>
  );

  const statusColor = (s) => {
    if (!s) return "bg-gray-200 text-gray-700";
    const st = String(s).toLowerCase();
    if (st.includes("len") || st.includes("in") || st.includes("ok") || st.includes("active")) return "bg-green-100 text-green-800";
    if (st.includes("xuong") || st.includes("out") || st.includes("no") || st.includes("fail")) return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 mb-8 bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">
            Thông tin thẻ: <span className="font-mono text-blue-700">{uid}</span>
          </h2>
          <div className="text-sm text-gray-500">Mã RFID: {uid}</div>
        </div>
        <div className="flex gap-2 mt-2 md:mt-0">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1 rounded bg-gray-100 text-black hover:bg-blue-100 transition-colors"
          >
            Quay lại
          </button>
          <button
            onClick={() => { localStorage.removeItem("rfid_logged_user"); navigate("/login"); }}
            className="px-3 py-1 rounded bg-gray-100 text-black hover:bg-blue-100 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thông tin học sinh */}
        <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-lg mb-3 text-blue-700">Thông tin học sinh</h3>
          <div className="space-y-2 text-sm">
            <div><span className="font-medium">Họ tên:</span> {user.name}</div>
            <div><span className="font-medium">Giới tính:</span> {user.gender || "-"}</div>
            <div><span className="font-medium">Ngày sinh:</span> {user.dob || "-"}</div>
            <div><span className="font-medium">Lớp:</span> {user.class || "-"}</div>
            <div><span className="font-medium">Địa chỉ:</span> {user.address || "-"}</div>
            <div><span className="font-medium">SĐT học sinh:</span> {user.phone || "-"}</div>
            <div><span className="font-medium">Phụ huynh:</span> {user.parentName || "-"}</div>
            <div><span className="font-medium">SĐT phụ huynh:</span> {user.parentPhone || "-"}</div>
            <div><span className="font-medium">Account:</span> {user.account?.username || "-"}</div>
          </div>
        </div>

        {/* Trạng thái RFID */}
        <div className="bg-gray-50 rounded-lg p-4 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-lg mb-3 text-blue-700">Trạng thái RFID</h3>
            <div className="mb-2">
              <span className={`inline-block px-3 py-1 text-xs font-medium rounded ${statusColor(rfid?.lastStatus)}`}>
                {rfid?.lastStatus ?? "Không có"}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              <span className="font-medium">Ngày tạo RFID:</span> {rfid?.createdAt ?? "-"}
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">
            <span className="font-medium">Số sự kiện realtime:</span> {history.length}
          </div>
        </div>
      </div>

      {/* Lịch sử quẹt thẻ */}
      <div className="mt-8">
        <h3 className="font-semibold text-lg mb-3 text-blue-700">Lịch sử quẹt thẻ (20 lần mới nhất)</h3>
        {history.length === 0 ? (
          <div className="text-sm text-gray-500">Không có lịch sử quẹt thẻ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Thời gian</th>
                  <th className="p-2 text-left">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => (
                  <tr key={idx} className="border-t hover:bg-blue-50">
                    <td className="p-2">{h.time ?? "-"}</td>
                    <td className="p-2">{h.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
