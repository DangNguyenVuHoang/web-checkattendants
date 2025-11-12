// src/pages/CardDetail.jsx
import { useEffect, useState } from "react";
import { ref, get, onValue } from "firebase/database";
import { db } from "../firebase";
import { useParams, useNavigate } from "react-router-dom";

/**
 * CardDetail
 * - Cho phép admin / class / student xem chi tiết 1 UID thẻ RFID
 * - Hiển thị thông tin học sinh, trạng thái thẻ, lịch sử quẹt
 */
export default function CardDetail() {
  const { uid } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [rfid, setRfid] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedRaw = localStorage.getItem("rfid_logged_user");
    if (!loggedRaw) {
      navigate("/login");
      return;
    }

    const logged = JSON.parse(loggedRaw);

    // 🔹 Load thông tin học sinh
    get(ref(db, `USER/${uid}`))
      .then((snap) => {
        if (!snap.exists()) {
          setUser(null);
          setLoading(false);
          return;
        }

        const data = snap.val();
        const isAdmin = logged.role === "admin";
        const isClass =
          logged.role === "class" &&
          String(data.class || "").toLowerCase() ===
            String(logged.classManaged || "").toLowerCase();
        const isOwner = logged.role === "student" && logged.uid === uid;

        if (!(isAdmin || isClass || isOwner)) {
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
        setUser(null);
      });

    // 🔹 Load dữ liệu RFID realtime
    const rfidRef = ref(db, `RFID/${uid}`);
    const unsub = onValue(rfidRef, (snap) => {
      if (!snap.exists()) {
        setRfid(null);
        setHistory([]);
        return;
      }

      const data = snap.val();
      setRfid({
        lastStatus: data.lastStatus ?? "Undefined",
        createdAt: data.createdAt ?? "-",
      });

      const logs = data.accessLog || data.accessLogs || {};
      const arr = Object.values(logs)
        .map((item) => ({
          time: item.time ?? "-",
          status: item.status ?? item.state ?? JSON.stringify(item),
        }))
        .sort(
          (a, b) =>
            new Date(b.time).getTime() - new Date(a.time).getTime()
        );

      setHistory(arr.slice(0, 20));
    });

    return () => unsub();
  }, [uid, navigate]);

  /* ================== UI Helpers ================== */
  const statusColor = (s) => {
    if (!s) return "bg-gray-200 text-gray-700";
    const st = String(s).toLowerCase();
    if (st.includes("lên") || st.includes("len") || st.includes("in"))
      return "bg-green-100 text-green-800";
    if (st.includes("xuống") || st.includes("xuong") || st.includes("out"))
      return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  /* ================== UI Render ================== */
  if (loading)
    return <div className="p-8 text-center text-gray-600">Đang tải dữ liệu...</div>;

  if (!user)
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 font-semibold mb-3">
          ⛔ Bạn không có quyền xem thẻ này hoặc thẻ không tồn tại.
        </div>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Đăng nhập
        </button>
      </div>
    );

  return (
    <div >
      {/* ===== Header ===== */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-blue-700">
            Chi tiết thẻ RFID:{" "}
            <span className="font-mono text-gray-800">{uid}</span>
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Thông tin học sinh và lịch sử quẹt thẻ gần đây
          </p>
        </div>

        {/* <div className="flex gap-2 mt-3 md:mt-0">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-100 hover:bg-blue-100 rounded-md text-sm"
          >
            ← Quay lại
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("rfid_logged_user");
              navigate("/login");
            }}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm"
          >
            Đăng xuất
          </button>
        </div> */}
      </div>

      {/* ===== Info Grid ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thông tin học sinh */}
        <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-lg mb-3 text-blue-700">
            🧍‍♂️ Thông tin học sinh
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div><strong>Họ tên:</strong> {user.name}</div>
            <div><strong>Giới tính:</strong> {user.gender || "-"}</div>
            <div><strong>Ngày sinh:</strong> {user.dob || "-"}</div>
            <div><strong>Lớp:</strong> {user.class || "-"}</div>
            <div><strong>Địa chỉ:</strong> {user.address || "-"}</div>
            <div><strong>SĐT học sinh:</strong> {user.phone || "-"}</div>
            <div><strong>Phụ huynh:</strong> {user.parentName || "-"}</div>
            <div><strong>SĐT phụ huynh:</strong> {user.parentPhone || "-"}</div>
          </div>
        </div>

        {/* Trạng thái RFID */}
        <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
          <h3 className="font-semibold text-lg mb-3 text-blue-700">
            💳 Trạng thái RFID
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <div>
              <span className="font-medium">Trạng thái hiện tại:</span>{" "}
              <span
                className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${statusColor(
                  rfid?.lastStatus
                )}`}
              >
                {rfid?.lastStatus ?? "Không có"}
              </span>
            </div>
            <div>
              <span className="font-medium">Ngày tạo thẻ:</span>{" "}
              {rfid?.createdAt ?? "-"}
            </div>
            <div>
              <span className="font-medium">Tổng lượt quẹt:</span>{" "}
              {history.length}
            </div>
          </div>
        </div>
      </div>

      {/* ===== Lịch sử quẹt ===== */}
      <div className="mt-10">
        <h3 className="font-semibold text-lg mb-4 text-blue-700">
          🕒 Lịch sử quẹt thẻ (20 lần gần nhất)
        </h3>

        {history.length === 0 ? (
          <div className="text-sm text-gray-500 italic">Không có lịch sử quẹt thẻ.</div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm border-collapse">
              <thead className="bg-blue-100 text-gray-700">
                <tr>
                  <th className="p-2 text-left font-medium">Thời gian</th>
                  <th className="p-2 text-left font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, idx) => (
                  <tr
                    key={idx}
                    className={`border-t ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-blue-50`}
                  >
                    <td className="p-2">{h.time}</td>
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
