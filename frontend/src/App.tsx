import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Workspace } from "./pages/Workspace";

// Two routes:
//   /          → Landing (the front of house)
//   /registry  → Workspace (the writing desk + reading room)
export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/registry" element={<Workspace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
