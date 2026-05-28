import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Browse } from "./pages/Browse";
import { MediaDetails } from "./pages/MediaDetails";
import { Roadmap } from "./pages/Roadmap";
import { Profile } from "./pages/Profile";
import { Explore } from "./pages/Explore";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { useStore } from "./store/useStore";
import { CinematicThemeProvider } from "./context/CinematicThemeContext";

// Protected Route Guard Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useStore((state) => state.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <CinematicThemeProvider>
        <div className="min-h-screen bg-[#050609] text-zinc-100 selection:bg-red-600 selection:text-white">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/browse"
              element={
                <ProtectedRoute>
                  <Browse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/discover/:mood"
              element={
                <ProtectedRoute>
                  <Browse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roadmap"
              element={
                <ProtectedRoute>
                  <Roadmap />
                </ProtectedRoute>
              }
            />
            <Route
              path="/explore"
              element={
                <ProtectedRoute>
                  <Explore />
                </ProtectedRoute>
              }
            />
            <Route
              path="/media/:type/:id"
              element={
                <ProtectedRoute>
                  <MediaDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/browse" replace />} />
          </Routes>
        </div>
      </CinematicThemeProvider>
    </BrowserRouter>
  );
};
