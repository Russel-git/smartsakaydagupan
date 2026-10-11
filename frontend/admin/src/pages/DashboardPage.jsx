import React from "react";
import { useAuth } from "../contexts/AuthContext";
import AdminDashboardView from "../components/dashboard/AdminDashboardView";
import PosoDashboardView from "../components/dashboard/PosoDashboardView";
import LguDashboardView from "../components/dashboard/LguDashboardView";

const DashboardPage = () => {
  const { isAdmin, isPoso } = useAuth();

  if (isAdmin) {
    return <AdminDashboardView />;
  }

  if (isPoso) {
    return <PosoDashboardView />;
  }

  return <LguDashboardView />;
};

export default DashboardPage;
