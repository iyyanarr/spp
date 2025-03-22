// src/components/UserProfile.tsx
import React, { useState } from "react";
import { useFrappeAuth } from "frappe-react-sdk";
import { useNavigate } from "react-router-dom";
import { LogOut, User, ChevronDown } from "lucide-react";

interface UserProfileProps {
  isSidebarOpen: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ isSidebarOpen }) => {
  const { currentUser, logout } = useFrappeAuth(); // Get current user data and logout function
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      // Redirect to login page after successful logout
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
      setIsDropdownOpen(false);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="p-4 border-t border-border relative">
      <div 
        className="flex items-center cursor-pointer" 
        onClick={toggleDropdown}
      >
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          {/* Display user initials */}
          <span className="font-medium">
            {currentUser?.full_name
              ? currentUser.full_name
                  .split(" ")
                  .map((name) => name[0])
                  .join("")
              : "?"}
          </span>
        </div>
        <div className={`ml-3 flex-grow ${!isSidebarOpen && "lg:hidden"}`}>
          {/* Display user full name */}
          <p className="font-medium">{currentUser || "Guest"}</p>
          {/* Display user role or email */}
          <p className="text-sm text-muted-foreground">
            {currentUser?.email || "No Email"}
          </p>
        </div>
        {isSidebarOpen && (
          <ChevronDown 
            className={`h-4 w-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
          />
        )}
      </div>

      {/* User dropdown menu */}
      {isDropdownOpen && isSidebarOpen && (
        <div className="absolute bottom-full left-0 w-full bg-white shadow-md rounded-md border border-gray-200 mb-1 py-1 z-50">
          <div className="px-3 py-2 text-sm text-gray-500 border-b border-gray-100">
            Signed in as <span className="font-medium text-gray-900">{currentUser}</span>
          </div>
          <button 
            className="w-full text-left px-3 py-2 text-sm flex items-center hover:bg-gray-50 text-red-600"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? "Logging out..." : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
