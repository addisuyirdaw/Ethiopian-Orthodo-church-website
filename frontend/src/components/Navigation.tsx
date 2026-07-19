import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermission } from '../hooks/usePermission';
import { 
  Menu, 
  X, 
  LogOut, 
  Home, 
  Users, 
  FileText, 
  CreditCard, 
  Gift, 
  CheckCircle,
  BookOpen,
  Settings,
  Bell
} from 'lucide-react';

/**
 * Navigation Bar Component
 * Shows menu items based on user role and permissions
 * 
 * Bishops/Priests:   ✗ No payments (they don't pay)
 * Followers/LAITY:   ✓ See payments, donations
 */
export const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const { ecclesiasticalRole, clearAuth } = useAuth();
  const { 
    canViewPayments, 
    canApproveDualAuth, 
    canManageSacraments,
    canViewDirectory,
    canViewFinancialReports
  } = usePermission();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    navigate('/');
  };

  // Menu items that appear based on permissions
  const menuItems = [
    { 
      label: 'Home', 
      icon: Home, 
      path: '/', 
      show: true 
    },
    { 
      label: 'Directory', 
      icon: Users, 
      path: '/directory', 
      show: canViewDirectory 
    },
    { 
      label: 'Payments', 
      icon: CreditCard, 
      path: '/payments', 
      show: canViewPayments,
      badge: 'LAITY Only'
    },
    { 
      label: 'Donations', 
      icon: Gift, 
      path: '/donations', 
      show: canViewPayments,
      badge: 'LAITY Only'
    },
    { 
      label: 'Sacraments', 
      icon: BookOpen, 
      path: '/sacraments', 
      show: canManageSacraments,
      badge: 'Clergy Only'
    },
    { 
      label: 'Approvals', 
      icon: CheckCircle, 
      path: '/approvals', 
      show: canApproveDualAuth,
      badge: 'Clergy Only'
    },
    { 
      label: 'Reports', 
      icon: FileText, 
      path: '/reports', 
      show: canViewFinancialReports 
    },
  ];

  const visibleMenuItems = menuItems.filter(item => item.show);

  return (
    <nav className="bg-slate-800/90 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">✝️</span>
            </div>
            <span className="text-white font-bold hidden sm:inline" style={{ fontFamily: "'Noto Serif Ethiopic', serif" }}>ደብረ ብርሃን መድኃኔዓለም</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-gray-300 hover:text-white transition text-sm font-medium"
                  title={item.badge || item.label}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-xs bg-red-600/20 text-red-300 px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Side: Role Badge + Logout */}
          <div className="flex items-center gap-4">
            {/* Role Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 rounded-lg border border-slate-600/50">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-300">{ecclesiasticalRole}</span>
            </div>

            {/* Notifications */}
            <button className="p-2 hover:bg-slate-700/50 rounded-lg text-gray-400 hover:text-white transition relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 rounded-lg transition text-sm font-medium border border-red-600/30"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-slate-700/50 rounded-lg text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-1">
            {visibleMenuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-700/50 text-gray-300 hover:text-white transition text-sm font-medium"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-xs bg-red-600/20 text-red-300 px-2 py-0.5 rounded ml-auto">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* RBAC Alert for Testing */}
      {canViewPayments && (
        <div className="bg-green-900/20 border-t border-green-700/30 px-4 py-2">
          <p className="text-xs text-green-300">
            ✅ <strong>Payment features enabled</strong> - You are logged in as a follower (LAITY)
          </p>
        </div>
      )}

      {!canViewPayments && canManageSacraments && (
        <div className="bg-blue-900/20 border-t border-blue-700/30 px-4 py-2">
          <p className="text-xs text-blue-300">
            ✅ <strong>Sacrament management enabled</strong> - You are logged in as clergy. Payment options are disabled.
          </p>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
