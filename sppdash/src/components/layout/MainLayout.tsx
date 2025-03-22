import React, { useState } from "react";
import Sidebar from "../Sidebar";
import Header from "../Header";
import { Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard";
import PagesView from "../pages/PagesView";
import UsersView from "../pages/UsersView";
import SettingsView from "../pages/SettingsView";
import HelpView from "../pages/HelpView";

import UpdateBOM from "../pages/UpdateBOM";
import SubLotProcessing from "../pages/SubLotProcessing";

const MainLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  const toggleSidebar = (): void => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar Component */}
      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar} 
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        {/* Header Component */}
        <Header toggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pages" element={<PagesView />} />
            <Route path="/users" element={<UsersView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/help" element={<HelpView />} />
            <Route path="/update-bom" element={<UpdateBOM />} />
            <Route path="/sub-lot-processing" element={<SubLotProcessing />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default MainLayout;