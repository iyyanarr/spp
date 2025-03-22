import { FrappeProvider, useFrappeAuth } from 'frappe-react-sdk';
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from "react-router-dom";
import MainLayout from "./components/layout/MainLayout";
import Login from "./components/Login";

// Protected Route component to handle authentication
const ProtectedRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { currentUser, isLoading } = useFrappeAuth();
  const location = useLocation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Give auth a moment to initialize
    const timer = setTimeout(() => {
      setChecking(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Show a loading indicator while checking authentication
  if (isLoading || checking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-blue-600"></div>
          <p className="text-sm text-slate-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Render the protected component if authenticated
  return element;
};

const App: React.FC = () => {
  const getSiteName = () => {
    // @ts-ignore
    if (window.frappe?.boot?.versions?.frappe && (window.frappe.boot.versions.frappe.startsWith('15') || window.frappe.boot.versions.frappe.startsWith('16'))) {
      // @ts-ignore
      return window.frappe?.boot?.sitename ?? import.meta.env.VITE_SITE_NAME;
    }
    return import.meta.env.VITE_SITE_NAME;
  };

  return (
    <FrappeProvider
      socketPort={import.meta.env.VITE_SOCKET_PORT}
      siteName={getSiteName()}
    >
      <Router>
        <Routes>
          {/* Login Route - Publicly accessible */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes - Requires authentication */}
          <Route path="/*" element={
            <ProtectedRoute element={<MainLayout />} />
          } />
        </Routes>
      </Router>
    </FrappeProvider>
  );
};

export default App;