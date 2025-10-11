import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Pending from "./pages/Pending";
import StudentList from "./pages/StudentList";
import Login from "./pages/Login";
import CardDetail from "./pages/CardDetail";

export default function App() {
  return (
    <BrowserRouter>
      <div className="max-w-6xl mx-auto p-4">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">RFID Dashboard</h1>
          <nav className="flex gap-3">
            <Link to="/" className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">Dashboard</Link>
            <Link to="/login" className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700">Login</Link>
          </nav>
        </header>

        <main>
          <Routes>
            <Route path="/" element={
              <div className="grid gap-6">
                <Pending />
                <StudentList />
              </div>
            } />
            <Route path="/login" element={<Login />} />
            <Route path="/card/:uid" element={<CardDetail />} />
            {/* thêm route khác nếu cần */}
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
