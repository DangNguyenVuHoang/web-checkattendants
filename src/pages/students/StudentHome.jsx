// src/pages/students/StudentHome.jsx
import { useEffect, useState } from "react";
import { ref, get, onValue } from "firebase/database";
import { db } from "../../firebase";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/**
 * StudentHome
 * - Giao diện tổng hợp thông tin học sinh
 * - Biểu đồ điểm danh (Recharts)
 * - Dữ liệu lấy từ USER + RFID (realtime)
 */
export default function StudentHome() {
  const [user, setUser] = useState(null);
  const [rfid, setRfid] = useState(null);
  const [attendance, setAttendance] = useState({
    daysPresent: 0,
    daysAbsent: 0,
    totalScans: 0,
    lastScanTime: "-",
  });
  const [chartData, setChartData] = useState([]);

  const loggedRaw = localStorage.getItem("rfid_logged_user");
  const logged = loggedRaw ? JSON.parse(loggedRaw) : null;
  const uid = logged?.uid || null;

  useEffect(() => {
    if (!uid) return;

    // 🧍 USER info
    get(ref(db, `USER/${uid}`)).then((snap) => {
      if (snap.exists()) setUser(snap.val());
    });

    // 🎯 RFID realtime info
    const rRef = ref(db, `RFID/${uid}`);
    const unsub = onValue(rRef, (snap) => {
      if (!snap.exists()) return;

      const data = snap.val();
      setRfid(data);

      // xử lý accessLog -> biểu đồ
      const logs = data.accessLog ? Object.values(data.accessLog) : [];
      const grouped = {};
      logs.forEach((l) => {
        const date = (l.time || "").split(" ")[0];
        if (!grouped[date]) grouped[date] = { date, lenxe: 0, xuongxe: 0 };
        if (l.status?.toLowerCase().includes("lên")) grouped[date].lenxe++;
        else if (l.status?.toLowerCase().includes("xuống")) grouped[date].xuongxe++;
      });

      const arr = Object.values(grouped)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7); // 7 ngày gần nhất
      setChartData(arr);

      // thống kê tổng quát
      const totalScans = logs.length;
      const daysPresent = new Set(Object.keys(grouped)).size;
      const daysAbsent = 7 - daysPresent; // giả định 1 tuần 7 ngày
      const lastScanTime =
        logs.length > 0
          ? logs.sort(
              (a, b) =>
                new Date(b.time).getTime() - new Date(a.time).getTime()
            )[0].time
          : "-";
      setAttendance({ daysPresent, daysAbsent, totalScans, lastScanTime });
    });

    return () => unsub();
  }, [uid]);

  if (!user)
    return (
      <div className="p-6 text-center text-gray-500">Đang tải thông tin...</div>
    );

  return (
    <div className="p-4">
      {/* Header */}
      <div className="bg-blue-800 text-white rounded-t-xl p-4 mb-6">
        <h1 className="text-2xl font-bold uppercase">
          TRƯỜNG TIỂU HỌC THUẬN HIẾU
        </h1>
      </div>

      {/* Section title */}
      <div className="bg-white p-3 rounded-t-lg shadow inline-block mb-4">
        <h2 className="text-lg font-semibold text-blue-700">
          THÔNG TIN HỌC SINH
        </h2>
      </div>

      {/* GRID MAIN INFO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Cột 1: Thông tin HS */}
        <div className="bg-white shadow rounded-xl p-4 text-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Thông tin học sinh</h3>
          <table className="w-full border text-sm">
            <tbody>
              <tr><td className="border p-2 w-1/3 font-medium">Họ tên</td><td className="border p-2">{user.name}</td></tr>
              <tr><td className="border p-2">Ngày sinh</td><td className="border p-2">{user.dob}</td></tr>
              <tr><td className="border p-2">Lớp</td><td className="border p-2">{user.class}</td></tr>
              <tr><td className="border p-2">Giới tính</td><td className="border p-2">{user.gender || "-"}</td></tr>
              <tr><td className="border p-2">Địa chỉ</td><td className="border p-2">{user.address || "-"}</td></tr>
              <tr><td className="border p-2">SĐT</td><td className="border p-2">{user.phone}</td></tr>
            </tbody>
          </table>
        </div>

        {/* Cột 2: Biểu đồ cột */}
        <div className="bg-white shadow rounded-xl p-4">
          <h3 className="text-center font-semibold text-sm mb-2 text-gray-700">
            Biểu đồ số lần lên - xuống xe (5 ngày gần nhất)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="lenxe" fill="#165dfc" name="Lên xe" />
              <Bar dataKey="xuongxe" fill="#52a1ff" name="Xuống xe" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cột 3: Biểu đồ tròn */}
        <div className="bg-white shadow rounded-xl p-4">
          <h3 className="text-center font-semibold text-sm mb-2 text-gray-700">
            Số ngày đã đi học trong một tuần
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={[
                  { name: "Đi học", value: attendance.daysPresent },
                  { name: "Vắng", value: Math.max(attendance.daysAbsent, 0) },
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label
              >
                <Cell fill="#165dfc" />
                <Cell fill="#52a1ff" />
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRID BOTTOM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Thông tin người liên hệ */}
        <div className="bg-white shadow rounded-xl p-4 text-sm">
          <h3 className="font-semibold mb-2 text-gray-800">
            Thông tin người liên hệ
          </h3>
          <table className="w-full border text-sm">
            <tbody>
              <tr><td className="border p-2 w-1/3 font-medium">Họ tên phụ huynh</td><td className="border p-2">{user.parentName || "Null"}</td></tr>
              {/* <tr><td className="border p-2">Họ tên cha</td><td className="border p-2">{user.fatherName || "Nguyễn Đình Dũng"}</td></tr> */}
              <tr><td className="border p-2">Địa chỉ liên hệ</td><td className="border p-2">{user.address || "Null"}</td></tr>
              <tr><td className="border p-2">Điện thoại phụ huynh</td><td className="border p-2">{user.parentPhone || "Null"}</td></tr>
              {/* <tr><td className="border p-2">Điện thoại cha</td><td className="border p-2">{user.parentPhone || "6745784912"}</td></tr> */}
            </tbody>
          </table>
        </div>

        {/* Tổng quan điểm danh */}
        <div className="bg-white shadow rounded-xl p-4 text-sm">
          <h3 className="font-semibold mb-2 text-gray-800">
            Tổng quan điểm danh
          </h3>
          <table className="w-full border text-sm">
            <tbody>
              <tr><td className="border p-2 w-1/2 font-medium">Tổng số lượt quẹt</td><td className="border p-2">{attendance.totalScans}</td></tr>
              <tr><td className="border p-2">Số ngày đi học</td><td className="border p-2">{attendance.daysPresent}</td></tr>
              <tr><td className="border p-2">Số ngày vắng</td><td className="border p-2">{attendance.daysAbsent}</td></tr>
              <tr><td className="border p-2">Lần quẹt gần nhất</td><td className="border p-2">{attendance.lastScanTime}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
