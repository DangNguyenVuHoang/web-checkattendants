// src/components/ModalSendNotification.jsx
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ref, push } from "firebase/database";
import { db } from "../firebase";
import toast from "react-hot-toast";

export default function ModalSendNotification({ studentUID, classManaged, onClose }) {
  const [type, setType] = useState("sleepy");
  const [message, setMessage] = useState("");

  const logged = JSON.parse(localStorage.getItem("rfid_logged_user") || "{}");

  // Nội dung mặc định theo loại (khi không nhập)
  const defaultMessageByType = useMemo(
    () => ({
      sleepy: "Thông báo: Học sinh có dấu hiệu buồn ngủ / ngủ gật.",
      health: "Thông báo: Học sinh có dấu hiệu sức khoẻ không tốt.",
      custom: "",
    }),
    []
  );

  const handleSend = async () => {
    const trimmed = message.trim();

    // ✅ Chỉ bắt buộc nội dung khi chọn "Tuỳ chỉnh"
    if (type === "custom" && !trimmed) {
      toast.error("Vui lòng nhập nội dung thông báo (Tuỳ chỉnh)");
      return;
    }

    // ✅ Nếu không phải tuỳ chỉnh và user không nhập -> dùng nội dung mặc định
    const finalMessage =
      trimmed || (type !== "custom" ? defaultMessageByType[type] : "");

    try {
      await push(ref(db, `Notifications/${studentUID}`), {
        message: finalMessage,
        type,
        class: classManaged,
        sentBy: logged.username || "unknown",
        sentByUID: logged.uid || null,
        time: new Date().toISOString(),
        status: "unread",
      });

      toast.success("Đã gửi thông báo!");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Lỗi gửi thông báo");
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white w-full max-w-md p-6 rounded shadow-lg z-10">
        <h2 className="text-xl font-semibold mb-4">Gửi thông báo</h2>

        {/* Select type */}
        <label className="text-sm font-medium">Loại thông báo</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full border p-2 rounded mt-1 mb-4"
        >
          <option value="sleepy">Buồn ngủ / Ngủ gật</option>
          <option value="health">Sức khoẻ không tốt</option>
          <option value="custom">Tuỳ chỉnh</option>
        </select>

        {/* Message */}
        <label className="text-sm font-medium">
          Nội dung{" "}
          {type === "custom" ? (
            <span className="text-red-600">(bắt buộc)</span>
          ) : (
            <span className="text-gray-500">(không bắt buộc)</span>
          )}
        </label>

        <textarea
          className="w-full border p-2 rounded mt-1 h-28"
          placeholder={
            type === "custom"
              ? "Nhập nội dung thông báo..."
              : "Có thể để trống (hệ thống sẽ dùng nội dung mặc định)..."
          }
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {type !== "custom" && (
          <div className="mt-2 text-xs text-gray-500">
            Nội dung mặc định nếu để trống:{" "}
            <span className="font-medium">{defaultMessageByType[type]}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-2 mt-4">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
            Hủy
          </button>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleSend}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
