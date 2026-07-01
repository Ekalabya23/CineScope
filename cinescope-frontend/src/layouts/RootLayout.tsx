import React from "react";
import { Outlet, Navigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { useStore } from "../store/useStore";

export const RootLayout: React.FC = () => {
  const token = useStore((state) => state.token);

  // Structural Route Guard: Push unauthenticated anomalies back out to sign-in terminal
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="bg-[#0b0c10] min-h-screen text-white flex flex-col relative overflow-x-hidden selection:bg-red-600 selection:text-white">
      {/* Structural Fixed Navigation Layer */}
      <Navbar />

      {/* Core Dynamic Content Window Panel */}
      <main className="flex-1 w-full relative z-10 pb-24 md:pb-0">
        <Outlet />
      </main>

      {/* Decorative Cinematic Background Glow Element */}
      <div className="fixed bottom-0 left-0 w-full h-48 md:h-96 bg-[radial-gradient(ellipse_at_bottom,rgba(229,9,20,0.05)_0%,transparent_70%)] pointer-events-none z-0" />
    </div>
  );
};
