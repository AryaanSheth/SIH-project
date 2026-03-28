import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./components/HomePage";
import MainApp from "./components/MainApp";
import FeedViewer from "./components/FeedViewer";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/app" element={<MainApp />} />
      <Route path="/feed" element={<FeedViewer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
