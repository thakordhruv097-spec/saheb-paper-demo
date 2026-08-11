import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  moduleName: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, moduleName }) => {
  const { user, hasAccess } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess(moduleName)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center p-6 text-center">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-lg shadow-md max-w-md w-full border border-red-200">
          <div className="text-red-600 dark:text-red-400 text-5xl mb-4 font-bold">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You do not have the required permissions to view the <strong>{moduleName}</strong> module.
          </p>
          <a
            href="/"
            className="px-5 py-2.5 bg-primary text-white font-medium rounded-md hover:bg-blue-800 transition"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
export default ProtectedRoute;
