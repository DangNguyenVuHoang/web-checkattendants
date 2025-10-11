// // src/pages/CardDetail.jsx
// import { useEffect, useState } from "react";
// import { ref, get, onValue } from "firebase/database";
// import { db } from "../firebase";
// import { useParams, useNavigate } from "react-router-dom";

// export default function CardDetail() {
//   const { uid } = useParams();
//   const navigate = useNavigate();
//   const [user, setUser] = useState(null);
//   const [rfid, setRfid] = useState(null); // { lastStatus, createdAt, ... }
//   const [history, setHistory] = useState([]); // accessLog array
//   const [loading, setLoading] = useState(true);

//   // helper format DD-MM-YYYY HH:mm:ss
//   const formatDateVN = (isoOrDate) => {
//     if (!isoOrDate) return "";
//     const d = new Date(isoOrDate);
//     const pad = (n) => String(n).padStart(2, "0");
//     return `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
//   };

//   useEffect(() => {
//     // simple auth check from localStorage
//     const loggedRaw = localStorage.getItem("rfid_logged_user");
//     if (!loggedRaw) {
//       navigate("/login");
//       return;
//     }
//     const logged = JSON.parse(loggedRaw);
//     if (!logged || logged.uid !== uid) {
//       setLoading(false);
//       setUser(null);
//       return;
//     }

//     // fetch USER once (we still keep realtime for RFID)
//     get(ref(db, `USER/${uid}`))
//       .then((snap) => {
//         if (snap.exists()) setUser(snap.val());
//         else setUser(null);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error(err);
//         setUser(null);
//         setLoading(false);
//       });

//     // realtime listener for RFID/{uid}
//     const rfidRef = ref(db, `RFID/${uid}`);
//     const unsubRfid = onValue(rfidRef, (snap) => {
//       if (!snap.exists()) {
//         setRfid(null);
//         setHistory([]);
//         return;
//       }
//       const data = snap.val();
//       // data may contain lastStatus, createdAt, accessLog, ...
//       setRfid({
//         lastStatus: data.lastStatus ?? "Undefined",
//         createdAt: data.createdAt ?? data.createdAtISO ?? null,
//         raw: data, // keep full object if needed
//       });

//       // accessLog might be an object keyed by timestamp -> convert to array
//       const accessLogObj = data.accessLog || data.accessLogs || data.logs || null;
//       if (accessLogObj) {
//         // data.accessLog might be an object; convert and sort desc by time if time exists
//         let arr = Object.values(accessLogObj).map((item) => {
//           // ensure item has time and status
//           return {
//             time: item.time ?? null,
//             status: item.status ?? item.state ?? JSON.stringify(item),
//           };
//         });

//         // try to sort newest first if time is parseable
//         arr.sort((a,b) => {
//           const ta = a.time ? new Date(a.time).getTime() : 0;
//           const tb = b.time ? new Date(b.time).getTime() : 0;
//           return tb - ta;
//         });

//         // keep first 20 entries
//         setHistory(arr.slice(0, 20));
//       } else {
//         setHistory([]);
//       }
//     });

//     // cleanup on unmount
//     return () => {
//       unsubRfid();
//     };
//   }, [uid, navigate]);

//   if (loading) return <div className="p-6 text-center">Đang tải…</div>;

//   if (!user) return (
//     <div className="p-6 text-center">
//       <div className="text-red-600 font-semibold">⛔ Bạn không có quyền xem thẻ này hoặc thẻ không tồn tại.</div>
//       <div className="mt-3">
//         <button onClick={() => navigate("/login")} className="px-3 py-1 bg-blue-600 text-white rounded">Đăng nhập</button>
//       </div>
//     </div>
//   );

//   // badge color by status
//   const statusColor = (s) => {
//     if (!s) return "bg-gray-200 text-gray-700";
//     const st = String(s).toLowerCase();
//     if (st.includes("in") || st.includes("on") || st.includes("active") || st.includes("granted") || st.includes("ok")) return "bg-green-100 text-green-800";
//     if (st.includes("denied") || st.includes("fail") || st.includes("forbidden") || st.includes("locked") || st.includes("no")) return "bg-red-100 text-red-800";
//     return "bg-yellow-100 text-yellow-800";
//   };

//   return (
//     <div className="max-w-3xl mx-auto mt-8 bg-white p-6 rounded shadow">
//       <div className="flex items-start justify-between gap-4">
//         <div>
//           <h3 className="text-lg font-semibold mb-2">Thông tin thẻ: <span className="font-mono">{uid}</span></h3>
//           <div className="space-y-1 text-sm">
//             <p><strong>Họ tên:</strong> {user.name}</p>
//             <p><strong>Họ tên PH:</strong> {user.parentName || "-"}</p>
//             <p><strong>Lớp:</strong> {user.class || "-"}</p>
//             <p><strong>SĐT PH:</strong> {user.parentPhone || "-"}</p>
//             <p><strong>SĐT HS:</strong> {user.phone || "-"}</p>
//             <p><strong>Địa chỉ:</strong> {user.address || "-"}</p>
//             <p><strong>Giới tính:</strong> {user.gender || "-"}</p>
//             <p><strong>Ngày sinh:</strong> {user.dob || "-"}</p>
//             <p><strong>Account:</strong> {user.account?.username || "-"}</p>
//           </div>
//         </div>

//         {/* RFID status panel */}
//         <div className="w-48 p-4 bg-gray-50 rounded shadow-sm">
//           <h4 className="text-sm font-semibold mb-2">RFID trạng thái</h4>
//           <div className="mb-2">
//             <div className={`inline-block px-3 py-1 text-xs font-medium rounded ${statusColor(rfid?.lastStatus)}`}>
//               {rfid?.lastStatus ?? "Không có"}
//             </div>
//           </div>
//           <div className="text-xs text-gray-500">
//             <div><strong>Created:</strong></div>
//             <div>{rfid?.createdAt ? rfid.createdAt : "-"}</div>
//           </div>
//           <div className="mt-3 text-xs text-gray-600">
//             <strong>Realtime:</strong>
//             <div className="text-sm">{history.length > 0 ? `${history.length} event(s)` : "No logs"}</div>
//           </div>
//         </div>
//       </div>

//       {/* access log table */}
//       <div className="mt-6">
//         <h4 className="font-semibold mb-2">Lịch sử quẹt thẻ (mới nhất)</h4>
//         {history.length === 0 ? (
//           <div className="text-sm text-gray-500">Không có lịch sử quẹt thẻ</div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm border">
//               <thead className="bg-gray-100">
//                 <tr>
//                   <th className="p-2 text-left">Thời gian</th>
//                   <th className="p-2 text-left">Trạng thái</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {history.map((h, idx) => (
//                   <tr key={idx} className="border-t hover:bg-gray-50">
//                     <td className="p-2">{h.time ? h.time : "-"}</td>
//                     <td className="p-2">{h.status}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       <div className="mt-4 flex gap-2">
//         <button onClick={() => { localStorage.removeItem("rfid_logged_user"); navigate("/login"); }} className="px-3 py-1 bg-gray-300 rounded">Logout</button>
//         <button onClick={() => navigate("/")} className="px-3 py-1 bg-blue-600 text-white rounded">Về dashboard</button>
//       </div>
//     </div>
//   );
// }
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
        let arr = Object.values(accessLogObj).map(item => ({ time: item.time ?? null, status: item.status ?? item.state ?? JSON.stringify(item) }));
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
      <div className="mt-3"><button onClick={() => navigate("/login")} className="px-3 py-1 bg-blue-600 text-white rounded">Đăng nhập</button></div>
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
    <div className="max-w-3xl mx-auto mt-8 bg-white p-6 rounded shadow">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Thông tin thẻ: <span className="font-mono">{uid}</span></h3>
          <div className="space-y-1 text-sm">
            <p><strong>Họ tên:</strong> {user.name}</p>
            <p><strong>Họ tên PH:</strong> {user.parentName || "-"}</p>
            <p><strong>Lớp:</strong> {user.class || "-"}</p>
            <p><strong>SĐT PH:</strong> {user.parentPhone || "-"}</p>
            <p><strong>SĐT HS:</strong> {user.phone || "-"}</p>
            <p><strong>Địa chỉ:</strong> {user.address || "-"}</p>
            <p><strong>Giới tính:</strong> {user.gender || "-"}</p>
            <p><strong>Ngày sinh:</strong> {user.dob || "-"}</p>
            <p><strong>Account:</strong> {user.account?.username || "-"}</p>
          </div>
        </div>

        <div className="w-48 p-4 bg-gray-50 rounded shadow-sm">
          <h4 className="text-sm font-semibold mb-2">RFID trạng thái</h4>
          <div className="mb-2"><div className={`inline-block px-3 py-1 text-xs font-medium rounded ${statusColor(rfid?.lastStatus)}`}>{rfid?.lastStatus ?? "Không có"}</div></div>
          <div className="text-xs text-gray-500"><div><strong>Created:</strong></div><div>{rfid?.createdAt ?? "-"}</div></div>
          <div className="mt-3 text-xs text-gray-600"><strong>Realtime:</strong><div className="text-sm">{history.length > 0 ? `${history.length} event(s)` : "No logs"}</div></div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold mb-2">Lịch sử quẹt thẻ (mới nhất)</h4>
        {history.length === 0 ? <div className="text-sm text-gray-500">Không có lịch sử quẹt thẻ</div> : (
          <div className="overflow-x-auto"><table className="min-w-full text-sm border"><thead className="bg-gray-100"><tr><th className="p-2 text-left">Thời gian</th><th className="p-2 text-left">Trạng thái</th></tr></thead><tbody>{history.map((h, idx) => (<tr key={idx} className="border-t hover:bg-gray-50"><td className="p-2">{h.time ?? "-"}</td><td className="p-2">{h.status}</td></tr>))}</tbody></table></div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => { localStorage.removeItem("rfid_logged_user"); navigate("/login"); }} className="px-3 py-1 bg-gray-300 rounded">Logout</button>
        <button onClick={() => navigate("/")} className="px-3 py-1 bg-blue-600 text-white rounded">Về dashboard</button>
      </div>
    </div>
  );
}
