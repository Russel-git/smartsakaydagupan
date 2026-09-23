import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FaresPage from './pages/FaresPage';
import RoutesPage from './pages/RoutesPage';
import ComplaintsPage from './pages/ComplaintsPage';
import NotificationsPage from './pages/NotificationsPage';
import UsersPage from './pages/UsersPage';
import AuditLogsPage from './pages/AuditLogsPage';
import TerminalsPage from './pages/TerminalsPage';

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
      <Route
        path="/login"
        element={admin ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="fares" element={<FaresPage />} />
        <Route path="routes" element={<RoutesPage />} />
        <Route path="terminals" element={<TerminalsPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={admin ? "/" : "/login"} replace />} />
    </Routes>
  );
};


export default App;
