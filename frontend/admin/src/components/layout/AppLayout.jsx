import React from "react";
import { Outlet } from "react-router-dom";

import { SidebarProvider, useSidebar } from "../../contexts/SidebarContext";

import Header from "./header/Header";
import Sidebar from "./sidebar/Sidebar";
import Backdrop from "./Backdrop";

const LayoutContent = () => {
  const { isExpanded, isHovered, isMobile } = useSidebar();

  const sidebarWidth = isExpanded || isHovered ? "290px" : "90px";

  return (
    <div
      className="app-container"
      style={{
        minHeight: "100vh",
        display: "flex",
      }}
    >
      <Sidebar />

      <Backdrop />

      <div
        className="main-wrapper"
        style={{
          flex: 1,
          minWidth: 0,

          marginLeft: isMobile ? "0px" : sidebarWidth,

          transition: "margin-left 300ms ease",
        }}
      >
        <Header />

        <main
          className="content-body"
          style={{
            minHeight: "calc(100vh - 64px)",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppLayout = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
