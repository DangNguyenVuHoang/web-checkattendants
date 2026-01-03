// src/components/ModalViewNotifications.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../firebase";

export default function ModalViewNotifications({ studentUID, onClose }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!studentUID) return;

    const notifRef = ref(db, `Notifications/${studentUID}`);

    const unsub = onValue(notifRef, (snap) => {
      const val = snap.val() || {};

      const arr = Object.keys(val).map((id) => ({
        id,
        ...val[id],
      }));

      // Sort mới → cũ
      arr.sort((a, b) => new Date(b.time) - new Date(a.time));

      setNotifications(arr);
    });

    return () => unsub();
  }, [studentUID]);

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
        return { text: "Buồn ngủ", cls: "bg-yellow-200 text-yellow-800" };
      case "health":
        return { text: "Sức khoẻ", cls: "bg-red-200 text-red-800" };
      case "custom":
        return { text: "Tuỳ chỉnh", cls: "bg-gray-300 text-gray-800" };
      default:
        return { text: type || "-", cls: "bg-gray-200 text-gray-700" };
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white w-full max-w-lg p-6 rounded shadow-lg z-10 max-h-[90vh] flex flex-col">
        <h2 className="text-xl font-semibold mb-4">Lịch sử thông báo</h2>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-gray-500 text-center py-6">
              Chưa có thông báo nào
            </div>
          ) : (
            notifications.map((n) => {
              const typeInfo = renderTypeLabel(n.type);

              return (
                <div
                  key={n.id}
                  className={`border p-3 rounded ${
                    n.status === "unread" ? "bg-blue-50" : "bg-gray-50"
                  }`}
                >
                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs px-2 py-1 rounded ${typeInfo.cls}`}
                    >
                      {typeInfo.text}
                    </span>

                    <span className="text-xs text-gray-500">
                      {fmt(n.time)}
                    </span>
                  </div>

                  {/* Message */}
                  <div className="mt-2 text-sm whitespace-pre-line">
                    {n.message}
                  </div>

                  {/* Footer info */}
                  <div className="mt-2 flex justify-between items-center text-xs text-gray-600">
                    <span>Gửi bởi: {n.sentBy || "-"}</span>

                    {/* ✅ CHỈ HIỂN THỊ TRẠNG THÁI */}
                    <span
                      className={`flex items-center gap-1 ${
                        n.status === "read"
                          ? "text-green-600"
                          : "text-blue-600"
                      }`}
                    >
                      {n.status === "read"
                        ? "🟢 Đã xem"
                        : "🔵 Chưa xem"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t mt-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
