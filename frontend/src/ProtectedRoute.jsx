import { Navigate } from "react-router-dom";
import { isLoggedIn } from "./api";

export function ProtectedRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/*
--- App.jsx (routing shell — wire this up once the Ride page exists) ---

import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";
import { ProtectedRoute } from "./ProtectedRoute";
// import RidePage from "./RidePage";  // <- built in the next slice

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/ride"
          element={
            <ProtectedRoute>
              <div>Ride page goes here — next slice</div>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}

npm install react-router-dom
*/
