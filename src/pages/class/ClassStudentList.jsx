// src/pages/class/ClassStudentList.jsx
import { useEffect, useMemo, useState } from "react";
import { ref, onValue, remove, get } from "firebase/database";
import { db } from "../../firebase";

import ModalEditStudent from "../../components/ModalEditStudent";
import ModalSendNotification from "../../components/ModalSendNotification";
import ModalViewNotifications from "../../components/ModalViewNotifications";

import toast from "react-hot-toast";

const PAGE_SIZE = 8;

export default function ClassStudentList() {
  const [students, setStudents] = useState([]);
  const [page, setPage] = useState(1);

  const [editUID, setEditUID] = useState(null);
  const [sendNotifUID, setSendNotifUID] = useState(null);
  const [viewNotifUID, setViewNotifUID] = useState(null);

  // FILTER
  const [search, setSearch] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  // Class teacher info
  const logged = JSON.parse(localStorage.getItem("rfid_logged_user") || "{}");
  const classManaged = logged?.classManaged || null;

  /* ---------------- DATE UTILS ---------------- */
  const fmtDate = (d) => {
    if (!d) return "-";
    try {
      const dt = d instanceof Date ? d : new Date(d);
      return isNaN(dt) ? String(d) : dt.toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  const fmtDateTime = (d) => {
    if (!d) return "";
    try {
      const dt = d instanceof Date ? d : new Date(d);
      return isNaN(dt) ? String(d) : dt.toLocaleString();
    } catch {
      return String(d);
    }
  };

  // Parse "DD-MM-YYYY HH:mm:ss" -> Date
  const parseVNDateTime = (str) => {
    if (!str) return null;
    const [datePart, timePart] = String(str).split(" ");
    if (!datePart) return null;

    const [dd, mm, yyyy] = datePart.split("-").map(Number);
    if (!dd || !mm || !yyyy) return null;

    let hh = 0,
      mi = 0,
      ss = 0;
    if (timePart) {
      const t = timePart.split(":").map(Number);
      hh = t[0] || 0;
      mi = t[1] || 0;
      ss = t[2] || 0;
    }
    return new Date(yyyy, mm - 1, dd, hh, mi, ss);
  };

  /* ---------------- STATUS NORMALIZE (FIX SAI MÀU) ---------------- */
  const normalizeText = (str) => {
    if (!str) return "";
    return str
      .toString()
      .trim()
      .toLowerCase()
      .normalize("NFD") // tách dấu tiếng Việt
      .replace(/[\u0300-\u036f]/g, "") // xoá dấu
      .replace(/[^a-z0-9]/g, ""); // xoá tất cả ký tự đặc biệt: space, -, _, ...
  };

  // "Xuong-xe" -> offboard, "Len-xe" -> onboard
  const normalizeRFIDStatus = (raw) => {
    if (!raw) return null;
    const s = normalizeText(raw); // "Xuong-xe" -> "xuongxe"

    if (["lenxe", "onboard", "in", "pickup", "boarded"].includes(s)) return "onboard";
    if (["xuongxe", "offboard", "out", "dropoff", "alighted"].includes(s)) return "offboard";

    return s; // trạng thái khác
  };

  // UI badge status
  const getAttendanceInfo = (s) => {
    const status = (s?.attendanceStatus || "").toString().toLowerCase();
    const updatedAt = s?.attendanceUpdatedAt || null;

    if (status === "onboard") {
      return {
        label: "Đã lên xe",
        pillClass: "bg-green-50 text-green-700 border border-green-200",
        dotClass: "bg-green-500",
        updatedAt,
      };
    }

    if (status === "offboard") {
      return {
        label: "Đã xuống xe",
        pillClass: "bg-red-50 text-red-700 border border-red-200",
        dotClass: "bg-red-500",
        updatedAt,
      };
    }

    if (!status) {
      return {
        label: "Chưa có dữ liệu",
        pillClass: "bg-gray-50 text-gray-600 border border-gray-200",
        dotClass: "bg-gray-400",
        updatedAt: null,
      };
    }

    // status khác
    return {
      label: `Trạng thái: ${status}`,
      pillClass: "bg-yellow-50 text-yellow-700 border border-yellow-200",
      dotClass: "bg-yellow-500",
      updatedAt,
    };
  };

  /* ---------------- LOAD STUDENTS + RFID ---------------- */
  useEffect(() => {
    if (!classManaged) return;

    const classRef = ref(db, `Class/${classManaged}/students`);

    const unsub = onValue(classRef, async (snap) => {
      try {
        const obj = snap.val() || {};
        const uids = Object.keys(obj);

        const results = await Promise.all(
          uids.map(async (uid) => {
            // 1) USER
            const userSnap = await get(ref(db, `USER/${uid}`));
            if (!userSnap.exists()) return null;
            const userData = userSnap.val();

            // 2) RFID schema của bạn:
            // RFID/{uid}/createdAt: "17-12-2025 23:01:02"
            // RFID/{uid}/lastStatus: "Xuong-xe"
            const rfidSnap = await get(ref(db, `RFID/${uid}`));
            const rfid = rfidSnap.val() || null;

            const rawStatus = rfid?.lastStatus || null;
            const atStr = rfid?.createdAt || null;

            const normalized = normalizeRFIDStatus(rawStatus);
            const atParsed = parseVNDateTime(atStr); // Date hoặc null

            const merged = {
              ...userData,
              attendanceStatus: normalized, // onboard/offboard/...
              attendanceUpdatedAt: atParsed || atStr || null,
              _rfidRawStatus: rawStatus || null, // debug nếu cần
            };

            return [uid, merged];
          })
        );

        const arr = results.filter(Boolean);

        // Sort newest first (theo createdAt user)
        arr.sort((a, b) => {
          const tA = a[1]?.createdAt ? new Date(a[1].createdAt).getTime() : 0;
          const tB = b[1]?.createdAt ? new Date(b[1].createdAt).getTime() : 0;
          return tB - tA;
        });

        setStudents(arr);
      } catch (e) {
        console.error(e);
        toast.error("Lỗi tải danh sách học sinh");
      }
    });

    return () => unsub();
  }, [classManaged]);

  /* ---------------- FILTERING ---------------- */
  const visibleEntries = useMemo(() => {
    const q = search.trim().toLowerCase();

    return students
      .filter(([uid, s]) => {
        if (!q) return true;
        return (s?.name || "").toLowerCase().includes(q);
      })
      .filter(([uid, s]) => {
        const dob = s?.dob ? new Date(s.dob) : null;

        if (filterDateFrom) {
          const from = new Date(filterDateFrom);
          if (!dob || isNaN(dob) || dob < from) return false;
        }

        if (filterDateTo) {
          const to = new Date(filterDateTo);
          to.setHours(23, 59, 59, 999);
          if (!dob || isNaN(dob) || dob > to) return false;
        }

        return true;
      });
  }, [students, search, filterDateFrom, filterDateTo]);

  const totalPages = Math.max(1, Math.ceil(visibleEntries.length / PAGE_SIZE));

  const pagedEntries = useMemo(() => {
    return visibleEntries.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [visibleEntries, page]);

  /* ---------------- DELETE ---------------- */
  const handleDeleteStudent = async (uid) => {
    if (!window.confirm("Bạn có chắc muốn xoá học sinh này?")) return;

    try {
      await remove(ref(db, `USER/${uid}`));
      await remove(ref(db, `Class/${classManaged}/students/${uid}`));
      toast.success("Đã xoá học sinh");
    } catch (e) {
      console.error(e);
      toast.error("Lỗi xoá học sinh");
    }
  };

  /* ---------------- RESET PAGE ---------------- */
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [search, filterDateFrom, filterDateTo]);

  /* ---------------- UI ---------------- */
  return (
    <div>
      {/* HEADER + FILTER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
        <h3 className="text-xl font-semibold">
          Danh sách học sinh lớp {classManaged}
        </h3>

        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Tìm theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>

        <div className="text-sm text-gray-600">
          {visibleEntries.length} học sinh • Trang {page}/{totalPages}
        </div>
      </div>

      {/* ---------------- MOBILE VIEW ---------------- */}
      <div className="block lg:hidden">
        {pagedEntries.length === 0 ? (
          <div className="text-center text-gray-500 p-6 bg-white rounded-lg shadow">
            Không có học sinh nào
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pagedEntries.map(([uid, s]) => {
              const st = getAttendanceInfo(s);

              return (
                <div
                  key={uid}
                  className="bg-white p-4 rounded-lg shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between mb-2">
                      <div className="text-sm text-gray-500 font-mono">{uid}</div>
                      <div className="text-xs text-gray-400">{s?.class || "-"}</div>
                    </div>

                    <div className="text-lg font-semibold">{s?.name}</div>
                    <div className="text-sm text-gray-600">
                      Phụ huynh: {s?.parentName || "-"}
                    </div>

                    {/* STATUS */}
                    <div className="mt-3">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${st.pillClass}`}
                        title={st.updatedAt ? `Cập nhật: ${fmtDateTime(st.updatedAt)}` : ""}
                      >
                        <span className={`w-2 h-2 rounded-full ${st.dotClass}`} />
                        <span className="font-semibold">{st.label}</span>
                        {st.updatedAt ? (
                          <span className="text-xs opacity-70">
                            • {fmtDateTime(st.updatedAt)}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Debug nếu cần */}
                    {/* <div className="mt-2 text-xs text-gray-400">raw: {s?._rfidRawStatus || "-"}</div> */}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <a href={`/card/${uid}`} className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300">
                      🔎
                    </a>

                    <button
                      onClick={() => setSendNotifUID(uid)}
                      className="px-3 py-2 bg-blue-200 rounded hover:bg-blue-300"
                    >
                      📤
                    </button>

                    <button
                      onClick={() => setViewNotifUID(uid)}
                      className="px-3 py-2 bg-purple-200 rounded hover:bg-purple-300"
                    >
                      📄
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---------------- DESKTOP TABLE ---------------- */}
      <div className="hidden lg:block">
        <section className="bg-white p-6 rounded-2xl shadow-md border">
          <div className="overflow-x-auto rounded">
            <table className="min-w-full text-sm divide-y">
              <thead className="bg-blue-400 text-black font-bold">
                <tr>
                  <th className="px-4 py-3 text-left">UID</th>
                  <th className="px-4 py-3 text-left">Họ tên</th>
                  <th className="px-4 py-3 text-left">Phụ huynh</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">SĐT HS</th>
                  <th className="px-4 py-3 text-left">Giới tính</th>
                  <th className="px-4 py-3 text-left">Ngày sinh</th>
                  <th className="px-4 py-3 text-left">Thao tác</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {pagedEntries.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center p-6 text-gray-500">
                      Không có học sinh
                    </td>
                  </tr>
                ) : (
                  pagedEntries.map(([uid, s]) => {
                    const st = getAttendanceInfo(s);

                    return (
                      <tr key={uid} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono">{uid}</td>
                        <td className="px-4 py-3">{s?.name}</td>
                        <td className="px-4 py-3">{s?.parentName || "-"}</td>

                        {/* STATUS */}
                        <td className="px-4 py-3">
                          <div
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${st.pillClass}`}
                            title={st.updatedAt ? `Cập nhật: ${fmtDateTime(st.updatedAt)}` : ""}
                          >
                            <span className={`w-2 h-2 rounded-full ${st.dotClass}`} />
                            <span className="font-semibold">{st.label}</span>
                            {st.updatedAt ? (
                              <span className="text-xs opacity-70">
                                {/* • {fmtDateTime(st.updatedAt)} */}
                              </span>
                            ) : null}
                          </div>
                        </td>

                        <td className="px-4 py-3">{s?.phone || "-"}</td>
                        <td className="px-4 py-3">{s?.gender || "-"}</td>
                        <td className="px-4 py-3">{fmtDate(s?.dob)}</td>

                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <a href={`/card/${uid}`} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300">
                              🔎
                            </a>

                            <button
                              onClick={() => setSendNotifUID(uid)}
                              className="px-3 py-1 bg-blue-200 rounded hover:bg-blue-300"
                            >
                              📤
                            </button>

                            <button
                              onClick={() => setViewNotifUID(uid)}
                              className="px-3 py-1 bg-purple-200 rounded hover:bg-purple-300"
                            >
                              📄
                            </button>

                            {/* nếu cần xoá */}
                            {/* 
                            <button
                              onClick={() => handleDeleteStudent(uid)}
                              className="px-3 py-1 bg-red-200 rounded hover:bg-red-300"
                            >
                              🗑️
                            </button>
                            */}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ---------------- PAGINATION ---------------- */}
      <div className="mt-3 flex items-center justify-between">
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
          Trang {page}/{totalPages}
        </div>
      </div>

      {/* ---------------- MODALS ---------------- */}
      {editUID && (
        <ModalEditStudent uid={editUID} onClose={() => setEditUID(null)} />
      )}

      {sendNotifUID && (
        <ModalSendNotification
          studentUID={sendNotifUID}
          classManaged={classManaged}
          onClose={() => setSendNotifUID(null)}
        />
      )}

      {viewNotifUID && (
        <ModalViewNotifications
          studentUID={viewNotifUID}
          onClose={() => setViewNotifUID(null)}
        />
      )}
    </div>
  );
}
