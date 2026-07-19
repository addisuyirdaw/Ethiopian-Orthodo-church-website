import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermission } from '../../hooks/usePermission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: keyof ReturnType<typeof usePermission>;
}

/**
 * ProtectedRoute Component
 * - Checks if user is authenticated (token exists)
 * - Optionally checks for specific permissions (RBAC)
 * 
 * Usage:
 * <ProtectedRoute>
 *   <MyComponent />
 * </ProtectedRoute>
 * 
 * <ProtectedRoute requiredPermission="canViewPayments">
 *   <PaymentPage />
 * </ProtectedRoute>
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredPermission 
}) => {
  const { token } = useAuth();
  const permissions = usePermission();

  // Check authentication
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Check permission if required
  if (requiredPermission) {
    const hasPermission = permissions[requiredPermission];
    if (!hasPermission) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900">
          <div className="text-center">
            <div className="text-red-600 text-5xl mb-4">⛔</div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-gray-400 mb-6">Your role does not have permission to access this page.</p>
            <a href="/" className="text-red-500 hover:text-red-400">Return to Home</a>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
