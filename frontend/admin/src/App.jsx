import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";

import AppLayout from "./components/layout/AppLayout";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import FaresPage from "./pages/FaresPage";
import RoutesPage from "./pages/RoutesPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import NotificationsPage from "./pages/NotificationsPage";
import UsersPage from "./pages/UsersPage";
import AuditLogsPage from "./pages/AuditLogsPage";
import TerminalsPage from "./pages/TerminalsPage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import ArchivesPage from "./pages/ArchivesPage";
import Profile from "./pages/Profile";

const ProtectedRoute = ({ children }) => {
  const { admin } = useAuth();

  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  const { admin } = useAuth();

  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={admin ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Protected Application */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="fares" element={admin?.role === "poso" ? <Navigate to="/" replace /> : <FaresPage />} />
        <Route path="routes" element={admin?.role === "poso" ? <Navigate to="/" replace /> : <RoutesPage />} />
        <Route path="terminals" element={<TerminalsPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="announcements" element={admin?.role === "admin" ? <Navigate to="/" replace /> : <AnnouncementsPage />} />
        <Route path="archives" element={admin?.role !== "lgu" ? <Navigate to="/" replace /> : <ArchivesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={admin ? "/" : "/login"} replace />}
      />
    </Routes>
  );
};

export default App;
