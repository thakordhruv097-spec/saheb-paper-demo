import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../../data/types';
import { getUsers, updateRawUserPin, addLog, saveUser } from '../../data/index';

interface AuthContextType {
  user: User | null;
  login: (username: string, pin: string) => Promise<boolean>;
  logout: () => void;
  resetPin: (username: string, newPin: string) => Promise<boolean>;
  updateUserProfile: (updatedFields: Partial<User>) => Promise<boolean>;
  simulateWorkerLogin: (targetUsername: string) => Promise<boolean>;
  hasAccess: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours session expiry window

interface SessionData {
  token: string;
  expiresAt: number;
  user: User;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearSession = () => {
    setUser(null);
    localStorage.removeItem('saheb_session');
    localStorage.removeItem('saheb_active_user');
  };

  useEffect(() => {
    const rawSession = localStorage.getItem('saheb_session');
    if (rawSession) {
      try {
        const session: SessionData = JSON.parse(rawSession);
        const now = Date.now();
        
        // Validate Token Expiry (8-hour window)
        if (!session.expiresAt || now > session.expiresAt) {
          console.warn('[Security] Session token expired. Redirecting to login.');
          clearSession();
        } else {
          // Verify user is still active in users master database
          const currentUsers = getUsers();
          const activeDbUser = currentUsers.find(u => u.username.toLowerCase() === session.user.username.toLowerCase());
          if (!activeDbUser || activeDbUser.active === false) {
            console.warn('[Security] Session invalidated: user is deactivated or deleted.');
            clearSession();
          } else {
            setUser(activeDbUser);
          }
        }
      } catch (err) {
        console.error('[Security] Failed to parse session data:', err);
        clearSession();
      }
    } else {
      // Clear legacy un-expirable user storage if present
      localStorage.removeItem('saheb_active_user');
    }
    setLoading(false);
  }, []);

  const login = async (username: string, pin: string): Promise<boolean> => {
    const users = getUsers();
    const foundUser = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() && u.pin === pin
    );

    if (foundUser) {
      if (foundUser.active === false) {
        addLog('Auth', 'Login Blocked', `Attempted login for deactivated user: ${foundUser.username}`, 'System');
        return false;
      }

      const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const expiresAt = Date.now() + SESSION_DURATION_MS;
      const sessionData: SessionData = { token, expiresAt, user: foundUser };

      setUser(foundUser);
      localStorage.setItem('saheb_session', JSON.stringify(sessionData));
      localStorage.setItem('saheb_active_user', JSON.stringify(foundUser));
      addLog('Auth', 'Login Success', `User ${foundUser.username} logged in as ${foundUser.role}`, foundUser.username);
      return true;
    } else {
      addLog('Auth', 'Login Failure', `Failed login attempt for username: ${username}`, 'System');
      return false;
    }
  };

  const logout = () => {
    if (user) {
      addLog('Auth', 'Logout', `User ${user.username} logged out`, user.username);
    }
    clearSession();
  };

  const resetPin = async (username: string, newPin: string): Promise<boolean> => {
    const users = getUsers();
    const foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (foundUser) {
      const success = updateRawUserPin(foundUser.username, newPin);
      if (success) {
        const updatedUser = { ...foundUser, pin: newPin, needsPinReset: false };
        const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const expiresAt = Date.now() + SESSION_DURATION_MS;
        const sessionData: SessionData = { token, expiresAt, user: updatedUser };

        setUser(updatedUser);
        localStorage.setItem('saheb_session', JSON.stringify(sessionData));
        localStorage.setItem('saheb_active_user', JSON.stringify(updatedUser));
        return true;
      }
    }
    return false;
  };

  const updateUserProfile = async (updatedFields: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    const users = getUsers();
    const existingIndex = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (existingIndex > -1) {
      const updatedUser: User = {
        ...users[existingIndex],
        ...updatedFields,
      };
      saveUser(updatedUser);

      // Update active state & session storage
      setUser(updatedUser);
      const rawSession = localStorage.getItem('saheb_session');
      if (rawSession) {
        try {
          const session = JSON.parse(rawSession);
          session.user = updatedUser;
          localStorage.setItem('saheb_session', JSON.stringify(session));
        } catch (e) {
          console.error(e);
        }
      }
      localStorage.setItem('saheb_active_user', JSON.stringify(updatedUser));
      addLog('Auth', 'Profile Update', `User ${updatedUser.username} updated profile details (${updatedUser.displayName})`, updatedUser.username);
      return true;
    }
    return false;
  };

  const simulateWorkerLogin = async (targetUsername: string): Promise<boolean> => {
    const users = getUsers();
    const foundUser = users.find(u => u.username.toLowerCase() === targetUsername.toLowerCase());
    if (foundUser) {
      const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const expiresAt = Date.now() + SESSION_DURATION_MS;
      const sessionData: SessionData = { token, expiresAt, user: foundUser };

      setUser(foundUser);
      localStorage.setItem('saheb_session', JSON.stringify(sessionData));
      localStorage.setItem('saheb_active_user', JSON.stringify(foundUser));
      addLog('Auth', 'Worker Login Simulated', `Simulated active session for @${foundUser.username} (${foundUser.displayName})`, user?.displayName || 'Admin');
      return true;
    }
    return false;
  };

  const hasAccess = (moduleName: string): boolean => {
    if (!user) return false;
    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    if (user.role === 'Admin' || user.username === 'admin' || userRoles.includes('Admin')) return true;

    // Get user's custom modules assigned strictly via Role Management system
    const custom = user.customModules && Array.isArray(user.customModules)
      ? user.customModules
      : ['dashboard'];

    // Direct match against assigned custom module keys
    if (custom.includes(moduleName)) return true;

    // Route level access checks for sections that contain sub-modules
    if (moduleName === 'pulp_mill_operations') return custom.includes('pulp_mill_operations');
    if (moduleName === 'raw_material_stock') return custom.includes('raw_material_stock');
    if (moduleName === 'machine_production') return custom.includes('machine_production');
    if (moduleName === 'rewinding_reel_conversion') return custom.includes('rewinding_reel_conversion');
    if (moduleName === 'lab') return custom.includes('machine_production') || custom.includes('pulp_mill_operations');

    // Utilities & ETP section: Accessible if ANY of boiler, etp, electricity, or utilities_etp is toggled ON
    if (moduleName === 'utilities_etp') {
      return custom.includes('utilities_etp') || custom.includes('boiler') || custom.includes('etp') || custom.includes('electricity');
    }

    if (moduleName === 'orders') return custom.includes('orders');

    // Finished Stock & Dispatch section route: Accessible if EITHER finished_stock_dispatch (Finish Stock) OR dispatch is toggled ON
    if (moduleName === 'finished_stock_dispatch') {
      return custom.includes('finished_stock_dispatch') || custom.includes('dispatch');
    }

    if (moduleName === 'spareparts_management') return custom.includes('spareparts_management');
    if (moduleName === 'label_studio') return custom.includes('label_studio') || custom.includes('monthly_yearly_reporting') || userRoles.includes('Admin') || userRoles.includes('Management');
    if (moduleName === 'monthly_yearly_reporting') return custom.includes('monthly_yearly_reporting');
    if (moduleName === 'admin_panel_audit') return custom.includes('admin_panel_audit') || userRoles.includes('Admin');
    if (moduleName === 'dashboard') return custom.includes('dashboard');

    // STRICT DENIAL: If a module is NOT enabled in Role Management, DENY ACCESS!
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center">
        <div className="text-primary font-bold animate-pulse text-lg">Loading Session...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, resetPin, updateUserProfile, simulateWorkerLogin, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
