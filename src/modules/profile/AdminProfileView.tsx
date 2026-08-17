import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import {
  ShieldCheck,
  User,
  Users,
  Lock,
  Mail,
  Phone,
  HelpCircle,
  KeyRound,
  CheckCircle2,
  LogOut,
  Eye,
  EyeOff,
  Edit3,
  ShieldAlert,
  Building2
} from 'lucide-react';
import UserManagementView from '../admin/UserManagementView';
import RoleManagementView from './RoleManagementView';
import { COMPANY_CONFIG } from '../../config/company';

interface AdminProfileViewProps {
  defaultTab?: 'profile' | 'roles' | 'users';
}

export const AdminProfileView: React.FC<AdminProfileViewProps> = ({ defaultTab }) => {
  const { user, updateUserProfile, logout } = useAuth();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'users' | 'profile' | 'roles'>(() => {
    if (defaultTab) return defaultTab;
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('tab') === 'role-management' || location.pathname.includes('role-management')) {
      return 'roles';
    }
    return 'profile';
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('tab') === 'role-management' || location.pathname.includes('role-management')) {
      setActiveTab('roles');
    }
  }, [location]);

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pin, setPin] = useState(user?.pin || '');
  const [securityQuestion, setSecurityQuestion] = useState(user?.securityQuestion || 'What is your favorite color?');
  const [securityAnswer, setSecurityAnswer] = useState(user?.securityAnswer || '');
  const [showPin, setShowPin] = useState(false);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (pin && (pin.length !== 4 || isNaN(Number(pin)))) {
      setErrorMsg('Security PIN must be exactly 4 numeric digits.');
      return;
    }

    const updated = await updateUserProfile({
      displayName: displayName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      pin: pin.trim(),
      securityQuestion,
      securityAnswer: securityAnswer.trim(),
    });

    if (updated) {
      setSuccessMsg('Master Admin Profile updated successfully!');
      setIsEditing(false);
    } else {
      setErrorMsg('Failed to update profile. Please try again.');
    }
  };

  return (
    <div className="space-y-4 font-sans pb-12 w-full">
      
      {/* 1. COMPACT SLEEK ADMIN HEADER BANNER */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden">
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-black tracking-tight truncate">{user.displayName}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Master Admin
              </span>
            </div>
            <p className="text-xs text-blue-200/90 font-mono">@{user.username} • Superuser Account</p>
          </div>
        </div>
      </div>

      {/* 2. PROFILE NAVIGATION TAB CONTROLS (ALWAYS VISIBLE) */}
      <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-surface-dark p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <User className="h-4 w-4" />
          <span>My Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex-1 min-w-[150px] px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'roles'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-amber-300" />
          <span>Role Management</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 min-w-[130px] px-4 py-2.5 rounded-xl font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-2 ${
            activeTab === 'users'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>User Accounts</span>
        </button>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold">
          {errorMsg}
        </div>
      )}

      {/* 3. ADMIN PROFILE CREDENTIALS (Shown only on My Profile tab) */}
      {activeTab === 'profile' && (
        <div>
          {!isEditing ? (
            <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-primary dark:text-blue-400" />
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Admin Personal Credentials & Security
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-slate-400">Fixed Superuser Role</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <User className="h-3.5 w-3.5" />
                    <span>Full Display Name</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{user.displayName}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <Lock className="h-3.5 w-3.5" />
                    <span>Username / Fixed Role</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">
                    {user.username} <span className="text-xs font-bold text-primary dark:text-blue-400">({user.role})</span>
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email Address</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{user.email || 'admin@sahebpaper.com'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <Phone className="h-3.5 w-3.5" />
                    <span>Phone Number</span>
                  </div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{user.phone || '9876543210'}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between text-slate-400 text-[11px] font-bold uppercase tracking-wider mb-1">
                    <span className="flex items-center gap-2">
                      <KeyRound className="h-3.5 w-3.5 text-amber-500" />
                      <span>Security PIN</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs transition"
                    >
                      {showPin ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-slate-500" />
                          <span className="text-[10px] font-extrabold text-slate-500">Hide PIN</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5 text-primary dark:text-blue-400" />
                          <span className="text-[10px] font-extrabold text-primary dark:text-blue-400">Show PIN</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-base font-black font-mono tracking-widest text-slate-900 dark:text-white mt-1">
                    {showPin ? (user.pin || '1234') : '••••'}
                  </p>
                </div>

              </div>

              {/* Official Mill & Enterprise Configuration */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/60 to-indigo-50/60 dark:from-slate-900/80 dark:to-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-blue-800/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary dark:text-blue-400" />
                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider font-heading">
                      {COMPANY_CONFIG.name}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-primary dark:text-blue-300">
                    Official Mill Registry
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Phone / WhatsApp</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{COMPANY_CONFIG.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Email Address</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{COMPANY_CONFIG.email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Official Website</span>
                    <a href={COMPANY_CONFIG.websiteUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline font-bold">
                      {COMPANY_CONFIG.website}
                    </a>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">Registered Plant Address</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">{COMPANY_CONFIG.address}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-primary hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Edit3 className="h-4 w-4 shrink-0" />
                  <span>Update My Profile Details</span>
                </button>

                <button
                  onClick={logout}
                  className="w-full py-3.5 px-6 rounded-2xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-extrabold text-xs uppercase tracking-wider border border-red-200 dark:border-red-800 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span>Logout of Account</span>
                </button>
              </div>

            </div>
          ) : (
            /* EDIT ADMIN PROFILE FORM */
            <form onSubmit={handleSaveProfile} className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                  Edit Master Admin Credentials
                </h2>
                <span className="text-xs font-bold text-primary dark:text-blue-400">Editing Admin Account</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Full Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Phone Number (10 Digits)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="e.g. 9876543210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">4-Digit Security PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pin}
                    onChange={e => setPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Security Question</label>
                  <select
                    value={securityQuestion}
                    onChange={e => setSecurityQuestion(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  >
                    <option value="What is your favorite color?">What is your favorite color?</option>
                    <option value="What is your pet's name?">What is your pet's name?</option>
                    <option value="What town were you born in?">What town were you born in?</option>
                    <option value="What is your favorite food?">What is your favorite food?</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Security Answer</label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={e => setSecurityAnswer(e.target.value)}
                    placeholder="Answer for account recovery"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-primary hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save Admin Credentials</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 3. ROLE MANAGEMENT VIEW */}
      {activeTab === 'roles' && (
        <div className="animate-fadeIn">
          <RoleManagementView />
        </div>
      )}

      {/* 4. USER MANAGEMENT VIEW */}
      {activeTab === 'users' && (
        <div className="animate-fadeIn">
          <UserManagementView />
        </div>
      )}

    </div>
  );
};

export default AdminProfileView;
