import { useEffect, useMemo, useState } from "react";
import { ref, onValue, update } from "firebase/database";
import { db } from "../../firebase";
import toast from "react-hot-toast";

const PAGE_SIZE = 6;

export default function StudentNotification() {
  const [list, setList] = useState([]);
  const [page, setPage] = useState(1);

  const loggedRaw = localStorage.getItem("rfid_logged_user");
  const logged = loggedRaw ? JSON.parse(loggedRaw) : null;
  const studentUID = logged?.uid || null;

  /* ---------------- LOAD NOTIFICATIONS ---------------- */
  useEffect(() => {
    if (!studentUID) return;

    const notifRef = ref(db, `Notifications/${studentUID}`);

    const unsub = onValue(notifRef, (snap) => {
      const val = snap.val() || {};

      const arr = Object.keys(val).map((id) => ({
        id,
        ...val[id],
      }));

      arr.sort((a, b) => new Date(b.time) - new Date(a.time));
      setList(arr);
    });

    return () => unsub();
  }, [studentUID]);

  /* ---------------- MARK READ (ON CLICK) ---------------- */
  const markAsRead = async (notifID) => {
    try {
      await update(ref(db, `Notifications/${studentUID}/${notifID}`), {
        status: "read",
      });
      // Không toast cũng được, nhưng để user biết đã cập nhật
      toast.success("Đã đánh dấu đã đọc");
    } catch {
      toast.error("Không thể cập nhật");
    }
  };

  const handleOpenNotif = (n) => {
    // Nếu đã đọc rồi thì không update nữa
    if (n.status === "read") return;

    // Click vào card -> set read
    markAsRead(n.id);
  };

  const markAllRead = async () => {
    try {
      const updates = {};

      list.forEach((n) => {
        updates[`Notifications/${studentUID}/${n.id}/status`] = "read";
      });

      await update(ref(db), updates);
      toast.success("Đã đánh dấu tất cả!");
    } catch (err) {
      toast.error("Lỗi khi đánh dấu");
    }
  };

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const pagedList = useMemo(
    () => list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [list, page]
  );

  // Auto reset page khi list thay đổi
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const fmt = (d) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      return isNaN(dt) ? String(d) : dt.toLocaleString();
    } catch {
      return String(d);
    }
  };

  const renderTypeLabel = (type) => {
    switch (type) {
      case "sleepy":
        return { text: "Buồn ngủ", cls: "bg-yellow-300 text-yellow-900" };
      case "health":
        return { text: "Sức khoẻ", cls: "bg-red-300 text-red-900" };
      case "custom":
        return { text: "Tuỳ chỉnh", cls: "bg-gray-300 text-gray-900" };
      default:
        return { text: type || "-", cls: "bg-gray-300 text-gray-900" };
    }
  };

  return (
    <div className="space-y-6">
      {/* ---------------- HEADER ---------------- */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Thông báo của bạn</h2>

        {list.some((n) => n.status === "unread") && (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={markAllRead}
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* ---------------- EMPTY ---------------- */}
      {list.length === 0 ? (
        <div className="p-6 text-center text-gray-500 bg-white rounded shadow">
          Không có thông báo nào
        </div>
      ) : (
        <>
          {/* ---------------- LIST ---------------- */}
          <div className="space-y-3">
            {pagedList.map((n) => {
              const typeInfo = renderTypeLabel(n.type);

              return (
                <div
                  key={n.id}
                  onClick={() => handleOpenNotif(n)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") handleOpenNotif(n);
                  }}
                  className={`p-4 border rounded shadow-sm cursor-pointer transition ${
                    n.status === "unread"
                      ? "bg-blue-50 hover:bg-blue-100"
                      : "bg-gray-50 hover:bg-gray-100"
                  }`}
                  title="Bấm để xem (tự đánh dấu đã đọc)"
                >
                  {/* TAG + TIME */}
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 text-xs rounded ${typeInfo.cls}`}>
                      {typeInfo.text}
                    </span>

                    <span className="text-xs text-gray-500">{fmt(n.time)}</span>
                  </div>

                  {/* MESSAGE */}
                  <div className="mt-2 text-sm text-gray-800 whitespace-pre-line">
                    {n.message}
                  </div>

                  {/* SENT BY + STATUS */}
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-600">
                    <span>Gửi bởi: {n.sentBy || "-"}</span>

                    <span
                      className={`flex items-center gap-1 ${
                        n.status === "read" ? "text-green-600" : "text-blue-600"
                      }`}
                    >
                      {n.status === "read" ? "🟢 Đã xem" : "🔵 Chưa xem"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ---------------- PAGINATION ---------------- */}
          <div className="mt-4 flex items-center justify-between px-1">
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
        </>
      )}
    </div>
  );
}
