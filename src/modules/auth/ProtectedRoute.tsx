import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  moduleName: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, moduleName }) => {
  const { user, hasAccess } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!hasAccess(moduleName)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center p-6 text-center">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full border border-red-200 dark:border-red-900/50">
          <div className="text-amber-500 text-5xl mb-4 font-bold">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
            You do not have the required permissions to view the <strong>{moduleName}</strong> module.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition cursor-pointer shadow-md shadow-blue-600/20 active:scale-95"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
export default ProtectedRoute;
