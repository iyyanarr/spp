import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button"
import { Menu, X, Home, FileText, Settings, Users, HelpCircle, Scissors } from "lucide-react";
import { RouteItem } from "../types";
import UserProfile from "./UserProfile";

interface SidebarProps {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const navigationRoutes: RouteItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    icon: Home
  },
  
  // {
  //   id: "bom",
  //   title: "BOM",
  //   path: "/bom",
  //   icon: FileText 
  // },
  // {
  //   id: "multi-bom",
  //   title: "Multi-Level BOM",
  //   path: "/mu",
  //   icon: FileText
  // },
  // {
  //   id: "update-bom",
  //   title: "Update BOM",
  //   path: "/update-bom",
  //   icon: Settings
  // },
  {
    id: "sub-lot-processing",
    title: "Sub Lot Processing",
    path: "/sub-lot-processing",
    icon: Scissors
  },
  {
    id: "users",
    title: "Users",
    path: "/users",
    icon: Users
  },
  {
    id: "settings",
    title: "Settings",
    path: "/settings",
    icon: Settings
  },
  {
    id: "help",
    title: "Help",
    path: "/help",
    icon: HelpCircle
  }
];

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar }) => {
  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out ${
        isSidebarOpen ? "w-64" : "w-0 lg:w-20"
      } bg-card border-r border-border shadow-sm`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        <div className={`flex items-center ${!isSidebarOpen && "lg:hidden"}`}>
          <img 
            src="https://sppindia.com/sppwebsite/wp-content/uploads/2015/03/SPP_India_LOGO.png" 
            alt="SPP India Logo" 
            className={`${isSidebarOpen ? 'h-15': 'h-12'} object-contain`}
          />
        </div>
        
        {/* Only show small logo when sidebar is collapsed on large screens */}
        {!isSidebarOpen && (
          <div className="hidden lg:flex items-center justify-center">
            <img 
              src="https://sppindia.com/sppwebsite/wp-content/uploads/2015/03/SPP_India_LOGO.png" 
              alt="SPP India Logo" 
              className="h-8 w-auto object-contain"
            />
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="lg:flex hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleSidebar}
          className="lg:hidden"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navigationRoutes.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center w-full px-3 py-2 rounded-md transition-colors
                    ${isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-secondary"}
                  `}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <span className={`${!isSidebarOpen && "lg:hidden"}`}>{item.title}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <UserProfile isSidebarOpen={isSidebarOpen} />
    </aside>
  );
};

export default Sidebar;