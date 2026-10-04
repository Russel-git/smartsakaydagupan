import React, { createContext, useContext, useEffect, useState } from "react";

const SidebarContext = createContext(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }

  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // ============================================================
  // RESPONSIVE STATE
  // ============================================================

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;

      setIsMobile(mobile);

      if (!mobile) {
        setIsMobileOpen(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ============================================================
  // DESKTOP SIDEBAR
  // ============================================================

  const toggleSidebar = () => {
    setIsExpanded((prev) => !prev);
  };

  // ============================================================
  // MOBILE SIDEBAR
  // ============================================================

  const toggleMobileSidebar = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  // ============================================================
  // CONTEXT
  // ============================================================

  const value = {
    isExpanded: isMobile ? false : isExpanded,
    isMobile,
    isMobileOpen,
    isHovered,

    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar,
    setIsHovered,
  };

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
};
