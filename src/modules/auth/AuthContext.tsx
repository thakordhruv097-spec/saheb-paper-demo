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

  useEffect(() => {
    const syncSessionFromStorage = () => {
      const rawSession = localStorage.getItem('saheb_session');
      if (rawSession) {
        try {
          const session: SessionData = JSON.parse(rawSession);
          const currentUsers = getUsers();
          const activeDbUser = currentUsers.find(u => u.username.toLowerCase() === session.user.username.toLowerCase());
          if (activeDbUser && activeDbUser.active !== false) {
            setUser({ ...activeDbUser });
          }
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('storage', syncSessionFromStorage);
    window.addEventListener('focus', syncSessionFromStorage);
    return () => {
      window.removeEventListener('storage', syncSessionFromStorage);
      window.removeEventListener('focus', syncSessionFromStorage);
    };
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
      const expiresAt = Date.now() + 8 * 60 * 60 * 1000; // 8 hours duration

      const session: SessionData = {
        token,
        user: foundUser,
        expiresAt,
      };

      localStorage.setItem('saheb_session', JSON.stringify(session));
      localStorage.setItem('saheb_active_user', JSON.stringify(foundUser)); // fallback key
      setUser(foundUser);
      addLog('Auth', 'Login Successful', `User authenticated: ${foundUser.username}`, foundUser.username);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (user) {
      addLog('Auth', 'Logout', `User logged out: ${user.username}`, user.username);
    }
    clearSession();
  };

  const resetPin = async (username: string, newPin: string): Promise<boolean> => {
    const users = getUsers();
    const userToReset = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!userToReset) return false;

    return updateRawUserPin(userToReset.username, newPin);
  };

  const updateUserProfile = async (updates: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    const users = getUsers();
    const idx = users.findIndex(u => u.username.toLowerCase() === user.username.toLowerCase());
    if (idx === -1) return false;

    const updatedUser: User = { ...users[idx], ...updates };
    saveUser(updatedUser);

    // Update session storage
    const rawSession = localStorage.getItem('saheb_session');
    if (rawSession) {
      try {
        const session: SessionData = JSON.parse(rawSession);
        session.user = updatedUser;
        localStorage.setItem('saheb_session', JSON.stringify(session));
      } catch (err) {
        console.error(err);
      }
    }
    localStorage.setItem('saheb_active_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    window.dispatchEvent(new Event('storage'));
    return true;
  };

  const simulateWorkerLogin = async (username: string): Promise<boolean> => {
    const users = getUsers();
    const targetUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!targetUser) return false;

    const token = `token_sim_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = Date.now() + 8 * 60 * 60 * 1000;

    const session: SessionData = {
      token,
      user: targetUser,
      expiresAt,
    };

    localStorage.setItem('saheb_session', JSON.stringify(session));
    localStorage.setItem('saheb_active_user', JSON.stringify(targetUser));
    setUser(targetUser);
    window.dispatchEvent(new Event('storage'));
    addLog('Auth', 'Worker Login Simulated', `Admin simulated session for: ${targetUser.username} (${targetUser.displayName})`, 'Admin');
    return true;
  };

  // GRANULAR PERMISSION EVALUATION (STRICT NO-FALLBACK TO PREVENT PERMISSION BYPASS)
  const hasAccess = (moduleName: string): boolean => {
    if (!user) return false;

    // Super Admin has master authority across all endpoints
    if (user.role === 'Admin') return true;

    // Custom assigned modules configured by Admin in Role Management
    const custom = user.customModules && Array.isArray(user.customModules)
      ? user.customModules
      : [];

    // Direct match against assigned custom module keys
    if (custom.includes(moduleName)) return true;

    // Route & Menu level access checks
    if (moduleName === 'dashboard') return custom.includes('dashboard');
    if (moduleName === 'raw_material_stock') return custom.includes('raw_material_stock');
    if (moduleName === 'pulp_mill_operations') return custom.includes('pulp_mill_operations');
    if (moduleName === 'machine_production') return custom.includes('machine_production');
    if (moduleName === 'rewinding_reel_conversion') return custom.includes('rewinding_reel_conversion');
    if (moduleName === 'lab') return custom.includes('lab');

    // Individual utilities and unified module
    if (moduleName === 'boiler' || moduleName === 'etp' || moduleName === 'electricity' || moduleName === 'utilities_etp') {
      return custom.includes('utilities_etp') || custom.includes('boiler') || custom.includes('etp') || custom.includes('electricity');
    }

    if (moduleName === 'orders') return custom.includes('orders');

    // Finished Stock & Stock Categorization
    if (moduleName === 'finished_stock_dispatch') {
      return custom.includes('finished_stock_dispatch') || custom.includes('finish_stock') || custom.includes('stock_category');
    }

    // Dispatch Receipt & Vault
    if (moduleName === 'dispatch_receipt' || moduleName === 'dispatch') {
      return custom.includes('dispatch') || custom.includes('dispatch_receipt');
    }

    if (moduleName === 'spareparts_management') return custom.includes('spareparts_management');
    if (moduleName === 'label_studio') return custom.includes('label_studio');
    if (moduleName === 'monthly_yearly_reporting') return custom.includes('monthly_yearly_reporting');
    if (moduleName === 'admin_panel_audit') return custom.includes('admin_panel_audit');

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
