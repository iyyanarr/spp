// src/components/UserProfile.tsx
import React from "react";
import { useFrappeAuth } from "frappe-react-sdk";

interface UserProfileProps {
  isSidebarOpen: boolean;
}

const UserProfile: React.FC<UserProfileProps> = ({ isSidebarOpen }) => {
  const { currentUser } = useFrappeAuth(); // Get current user data

  return (
    <div className="p-4 border-t border-border">
      <div className="flex items-center">
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
        <div className={`ml-3 ${!isSidebarOpen && "lg:hidden"}`}>
          {/* Display user full name */}
          <p className="font-medium">{currentUser || "Guest"}</p>
          {/* Display user role or email */}
          <p className="text-sm text-muted-foreground">
            {currentUser?.email || "No Email"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
