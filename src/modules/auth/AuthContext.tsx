import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '../../data/types';
import { getUsers, updateRawUserPin, addLog, saveUser } from '../../data/index';

interface AuthContextType {
  user: User | null;
  login: (username: string, pin: string) => Promise<boolean>;
  logout: () => void;
  resetPin: (username: string, newPin: string) => Promise<boolean>;
  updateUserProfile: (updatedFields: Partial<User>) => Promise<boolean>;
  hasAccess: (module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role to Module permission mapping strictly for 6 Master Roles
const ROLE_PERMISSIONS: Partial<Record<UserRole, string[]>> = {
  Admin: [
    'dashboard',
    'raw_material_stock',
    'pulp_mill_operations',
    'machine_production',
    'rewinding_reel_conversion',
    'utilities_etp',
    'finished_stock_dispatch',
    'spareparts_management',
    'monthly_yearly_reporting',
    'admin_panel_audit',
    'orders',
    'lab',
  ],
  PlantManager: [
    'dashboard',
    'raw_material_stock',
    'pulp_mill_operations',
    'machine_production',
    'rewinding_reel_conversion',
    'utilities_etp',
    'finished_stock_dispatch',
    'spareparts_management',
    'monthly_yearly_reporting',
    'admin_panel_audit',
    'orders',
    'lab',
  ],
  LabOperator: ['dashboard', 'lab'],
  Shopper: ['dashboard', 'raw_material_stock', 'spareparts_management'],
  Dispatcher: ['dashboard', 'finished_stock_dispatch', 'rewinding_reel_conversion', 'orders'],
  Viewer: [
    'dashboard',
    'raw_material_stock',
    'pulp_mill_operations',
    'machine_production',
    'rewinding_reel_conversion',
    'utilities_etp',
    'finished_stock_dispatch',
    'spareparts_management',
    'monthly_yearly_reporting',
    'admin_panel_audit',
    'orders',
    'lab',
  ],
};

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

  const hasAccess = (moduleName: string): boolean => {
    if (!user) return false;
    const userRoles = user.roles && user.roles.length > 0 ? user.roles : [user.role];
    if (userRoles.includes('Admin')) return true;

    return userRoles.some(rKey => {
      const permissions = ROLE_PERMISSIONS[rKey] || [];
      return permissions.includes(moduleName);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] flex items-center justify-center">
        <div className="text-primary font-bold animate-pulse text-lg">Loading Session...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, resetPin, updateUserProfile, hasAccess }}>
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
