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
import LandingPage from "./pages/LandingPage/LandingPage";
import AboutPage from "./pages/LandingPage/About";
import BlogPage from "./pages/LandingPage/BlogPage";
import FAQPage from "./pages/LandingPage/FAQPage";
import ContactPage from "./pages/LandingPage/ContactPage";

const ProtectedRoute = ({ children }) => {
  const { admin } = useAuth();

  if (!admin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  const { admin } = useAuth();

  return (
    <Routes>
      <Route index path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/faqs" element={<FAQPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Application */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path={"/dashboard"} element={<DashboardPage />} />
        <Route
          path="fares"
          element={
            admin?.role === "poso" ? (
              <Navigate to="dashboard" replace />
            ) : (
              <FaresPage />
            )
          }
        />
        <Route
          path="/routes"
          element={
            admin?.role === "poso" ? (
              <Navigate to="dasboard" replace />
            ) : (
              <RoutesPage />
            )
          }
        />
        <Route path="/terminals" element={<TerminalsPage />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route
          path="/announcements"
          element={
            admin?.role === "admin" ? (
              <Navigate to="dashboard" replace />
            ) : (
              <AnnouncementsPage />
            )
          }
        />
        <Route
          path="/archives"
          element={
            admin?.role !== "lgu" ? (
              <Navigate to="dashboard" replace />
            ) : (
              <ArchivesPage />
            )
          }
        />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/profile" element={<Profile />} />
      </Route>

      {/* Fallback */}
      <Route
        path="*"
        element={<Navigate to={admin ? "/dashboard" : "/"} replace />}
      />
    </Routes>
  );
};

export default App;
