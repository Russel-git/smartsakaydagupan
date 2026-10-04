import React from "react";

import { useSidebar } from "../../contexts/SidebarContext";

const Backdrop = () => {
  const { isMobile, isMobileOpen, closeMobileSidebar } = useSidebar();

  if (!isMobile || !isMobileOpen) {
    return null;
  }

  return (
    <div
      onClick={closeMobileSidebar}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        zIndex: 999,
        cursor: "pointer",
      }}
    />
  );
};

export default Backdrop;
