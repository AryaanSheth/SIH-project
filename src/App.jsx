import { Navigate, Route, Routes } from "react-router-dom";
import MainApp from "./components/MainApp";
import FeedViewer from "./components/FeedViewer";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/feed" element={<FeedViewer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
