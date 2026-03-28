import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./lib/AuthContext";
import HomePage from "./components/HomePage";
import MainApp from "./components/MainApp";
import FeedViewer from "./components/FeedViewer";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/app" element={<ProtectedRoute><MainApp /></ProtectedRoute>} />
        <Route path="/feed" element={<FeedViewer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
