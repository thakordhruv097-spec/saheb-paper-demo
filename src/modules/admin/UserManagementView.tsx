import React, { useState, useMemo } from 'react';
import { useAuth } from '../auth/AuthContext';
import { getUsers, saveUser, deactivateUser, addLog, deleteUser } from '../../data/index';
import type { User, UserRole } from '../../data/types';
import {
  Users,
  Plus,
  Shield,
  Search,
  UserCheck,
  UserX,
  X,
  Pencil,
  Trash2,
  CheckCircle2,
  Eye,
  EyeOff,
  Save,
  Check,
} from 'lucide-react';

const MASTER_ROLES: { key: UserRole; label: string; desc: string; color: string }[] = [
  { key: 'Admin', label: 'Admin Owner', desc: 'Full Master System Control', color: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-300/50 dark:border-amber-700/50' },
  { key: 'PlantManager', label: 'Plant Manager', desc: 'Mill Operations & Production', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700' },
  { key: 'LabOperator', label: 'Pulper (Pulp Mill)', desc: 'Pulper & Pulp Mill Operations', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700' },
  { key: 'Viewer', label: 'Viewer', desc: 'Read-Only System Observer', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700' },
  { key: 'Shopper', label: 'Shopper (Purchase)', desc: 'Waste Paper & Chemical Purchase', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700' },
  { key: 'Dispatcher', label: 'Dispatcher', desc: 'Reel Stock & Delivery Order', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700' },
];

const ROLE_COLORS: Record<string, string> = {
  Admin: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-300/40 dark:border-amber-700/50',
  PlantManager: 'bg-slate-100 text-slate-700 dark:bg-slate-800/90 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  LabOperator: 'bg-slate-100 text-slate-700 dark:bg-slate-800/90 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  Viewer: 'bg-slate-100 text-slate-700 dark:bg-slate-800/90 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  Shopper: 'bg-slate-100 text-slate-700 dark:bg-slate-800/90 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  Dispatcher: 'bg-slate-100 text-slate-700 dark:bg-slate-800/90 dark:text-slate-200 border-slate-200 dark:border-slate-700',
};

const ROLE_LABELS: Record<string, string> = {
  Admin: 'Admin',
  PlantManager: 'Plant Manager',
  LabOperator: 'Pulper',
  Viewer: 'Viewer',
  Shopper: 'Shopper',
  Dispatcher: 'Dispatcher',
};

export const UserManagementView: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>(() => getUsers());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // PIN visibility toggle state
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form states with Multi-Role support
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    pin: '',
    roles: ['PlantManager'] as UserRole[],
    email: '',
    phone: '',
  });

  const [formError, setFormError] = useState('');
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const togglePinVisibility = (username: string) => {
    setVisiblePins(prev => ({ ...prev, [username]: !prev[username] }));
  };

  const toggleFormRole = (roleKey: UserRole) => {
    setFormData(prev => {
      const exists = prev.roles.includes(roleKey);
      if (exists) {
        if (prev.roles.length === 1) return prev; // Must keep at least 1 role
        return { ...prev, roles: prev.roles.filter(r => r !== roleKey) };
      } else {
        return { ...prev, roles: [...prev.roles, roleKey] };
      }
    });
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      username: '',
      displayName: '',
      pin: '',
      roles: ['PlantManager'],
      email: '',
      phone: '',
    });
    setFormError('');
    setShowAddModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (u: User) => {
    setEditingUser(u);
    const existingRoles = u.roles && u.roles.length > 0 ? u.roles : [u.role];
    setFormData({
      username: u.username,
      displayName: u.displayName,
      pin: u.pin || '1234',
      roles: existingRoles,
      email: u.email || '',
      phone: u.phone || '',
    });
    setFormError('');
  };

  // Save New User
  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.username.trim() || !formData.displayName.trim() || !formData.pin.trim()) {
      setFormError('Name, Username, and 4-Digit PIN are required');
      return;
    }

    if (formData.roles.length === 0) {
      setFormError('Please select at least 1 role for this user account');
      return;
    }

    if (formData.pin.length !== 4 || isNaN(Number(formData.pin))) {
      setFormError('PIN must be exactly 4 digits');
      return;
    }

    const cleanUsername = formData.username.trim().toLowerCase().replace(/\s+/g, '_');
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      setFormError(`Username "@${cleanUsername}" already exists!`);
      return;
    }

    const newUser: User = {
      username: cleanUsername,
      displayName: formData.displayName.trim(),
      role: formData.roles[0],
      roles: formData.roles,
      pin: formData.pin.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      active: true,
    };

    saveUser(newUser);
    setUsers(getUsers());
    setShowAddModal(false);
    triggerToast(`User "${newUser.displayName}" created with ${newUser.roles?.length} role(s)!`);
    addLog('Admin', 'User Created', `Created account @${newUser.username} with roles: ${newUser.roles?.join(', ')}`, currentUser?.displayName || 'Admin');
  };

  // Save Edit User
  const handleEditUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError('');

    if (!formData.displayName.trim() || !formData.pin.trim()) {
      setFormError('Display Name and PIN are required');
      return;
    }

    if (formData.roles.length === 0) {
      setFormError('Please select at least 1 role for this user account');
      return;
    }

    if (formData.pin.length !== 4 || isNaN(Number(formData.pin))) {
      setFormError('PIN must be exactly 4 digits');
      return;
    }

    const isMasterAdmin = editingUser.username === 'admin';
    const updated: User = {
      ...editingUser,
      displayName: formData.displayName.trim(),
      role: isMasterAdmin ? 'Admin' : formData.roles[0],
      roles: isMasterAdmin ? ['Admin'] : formData.roles,
      pin: formData.pin.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    };

    saveUser(updated);
    setUsers(getUsers());
    setEditingUser(null);
    triggerToast(`User "${updated.displayName}" updated successfully!`);
    addLog('Admin', 'User Updated', `Updated account @${updated.username} with roles: ${updated.roles?.join(', ')}`, currentUser?.displayName || 'Admin');
  };

  // Toggle User Active Status
  const handleToggleActive = (u: User) => {
    if (u.username === currentUser?.username) {
      alert('You cannot deactivate your own Admin account!');
      return;
    }
    deactivateUser(u.username, currentUser?.displayName || 'Admin');
    setUsers(getUsers());
    const newStatus = u.active === false ? 'Activated' : 'Deactivated';
    triggerToast(`User "${u.displayName}" account ${newStatus}!`);
  };

  // Delete User
  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    if (deletingUser.username === currentUser?.username) {
      alert('You cannot delete your own Admin account!');
      setDeletingUser(null);
      return;
    }
    deleteUser(deletingUser.username);
    setUsers(getUsers());
    triggerToast(`User "${deletingUser.displayName}" removed permanently`);
    setDeletingUser(null);
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch =
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase());
      const uRoles = u.roles || [u.role];
      const matchRole = filterRole === 'ALL' || uRoles.includes(filterRole as UserRole);
      return matchSearch && matchRole;
    });
  }, [users, searchTerm, filterRole]);

  // Counts per role
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach(u => {
      const uRoles = u.roles || [u.role];
      uRoles.forEach(r => {
        counts[r] = (counts[r] || 0) + 1;
      });
    });
    return counts;
  }, [users]);

  return (
    <div className="space-y-6 font-sans pb-12 text-left">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. TOP HEADER BAR */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">User Accounts & Multi-Role Access</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary dark:text-blue-400 text-xs font-black">
              {users.length} Active Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage employee accounts, assign 1 or multiple roles per person, and configure 4-digit security PINs
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-black text-xs uppercase tracking-wider shadow-sm transition cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Add New User</span>
        </button>
      </div>



      {/* 3. SEARCH BAR */}
      <div className="bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
          <span>Showing <strong className="text-slate-800 dark:text-white">{filteredUsers.length}</strong> of {users.length} accounts</span>
        </div>
      </div>

      {/* 4. DESKTOP USER DATA TABLE */}
      <div className="hidden md:block bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-slate-400 uppercase tracking-wider font-extrabold text-[10px]">
              <th className="py-4 px-6">User Details</th>
              <th className="py-4 px-6 text-center">Assigned Roles (Multi-Role)</th>
              <th className="py-4 px-6">Mobile & Email</th>
              <th className="py-4 px-6">4-Digit PIN</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUsers.map(u => {
              const assignedRoles = u.roles && u.roles.length > 0 ? u.roles : [u.role];
              return (
                <tr key={u.username} className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition ${u.active === false ? 'opacity-50' : ''}`}>
                  {/* User Details */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                        {u.displayName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm">{u.displayName}</div>
                        <div className="font-mono text-slate-400 text-[11px]">@{u.username}</div>
                      </div>
                    </div>
                  </td>

                  {/* Assigned Multi-Roles */}
                  <td className="py-4 px-6 text-center">
                    <div className="flex flex-wrap gap-1.5 justify-center items-center">
                      {assignedRoles.map(rKey => (
                        <span key={rKey} className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-extrabold border ${ROLE_COLORS[rKey] || 'bg-slate-100 text-slate-700'}`}>
                          {ROLE_LABELS[rKey] || rKey}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Mobile & Email */}
                  <td className="py-4 px-6 font-mono text-slate-600 dark:text-slate-300">
                    <div>{u.phone || 'No Mobile'}</div>
                    <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{u.email || 'No Email'}</div>
                  </td>

                  {/* 4-Digit PIN */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>{visiblePins[u.username] ? u.pin || '1234' : '••••'}</span>
                      <button
                        onClick={() => togglePinVisibility(u.username)}
                        className="p-1 text-slate-400 hover:text-primary transition cursor-pointer"
                        title={visiblePins[u.username] ? 'Hide PIN' : 'Show PIN'}
                      >
                        {visiblePins[u.username] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>

                  {/* Account Status Toggle */}
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer border ${
                        u.active !== false
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800'
                      }`}
                    >
                      {u.active !== false ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                      <span>{u.active !== false ? 'Active' : 'Inactive'}</span>
                    </button>
                  </td>

                  {/* Direct Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Edit Account & Roles"
                      >
                        <Pencil className="h-3.5 w-3.5 text-primary" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => setDeletingUser(u)}
                        className="px-2.5 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Delete User"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400 text-xs font-bold">
                  No accounts found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. MOBILE USER CARDS */}
      <div className="block md:hidden space-y-3">
        {filteredUsers.map(u => {
          const assignedRoles = u.roles && u.roles.length > 0 ? u.roles : [u.role];
          return (
            <div key={u.username} className={`bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 shadow-xs space-y-3 ${u.active === false ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs shrink-0">
                    {u.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-xs">{u.displayName}</div>
                    <div className="font-mono text-slate-400 text-[10px]">@{u.username}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                  {assignedRoles.map(rKey => (
                    <span key={rKey} className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${ROLE_COLORS[rKey] || 'bg-slate-100 text-slate-700'}`}>
                      {ROLE_LABELS[rKey] || rKey}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <div>📱 {u.phone || 'No Mobile'}</div>
                <div>🔑 PIN: {visiblePins[u.username] ? u.pin || '1234' : '••••'}</div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => handleToggleActive(u)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                    u.active !== false ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'
                  }`}
                >
                  {u.active !== false ? '✓ Active' : '✕ Inactive'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(u)}
                    className="px-2.5 py-1.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <Pencil className="h-3.5 w-3.5 text-primary" /> Edit
                  </button>
                  <button
                    onClick={() => setDeletingUser(u)}
                    className="px-2.5 py-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== 6. ADD NEW USER MODAL (MULTI-ROLE CHECKBOXES) ===== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Create New User Account
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Full Display Name</label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Username (Login ID)</label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. ramesh_k"
                    className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Mobile Number (10 Digits)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="e.g. 9876543210"
                    className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1 font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">4-Digit Security PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={formData.pin}
                    onChange={e => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="e.g. 1234"
                    className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1 font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              {/* Multi-Role Selection Pills */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  Assign Roles (Select 1 or Multiple Roles)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MASTER_ROLES.map(r => {
                    const isSelected = formData.roles.includes(r.key);
                    return (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => toggleFormRole(r.key)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                          isSelected
                            ? `${r.color} ring-2 ring-primary/40 scale-[1.02] shadow-xs font-black`
                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-xs font-bold truncate">{r.label}</div>
                        {isSelected && <Check className="h-4 w-4 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer transition flex items-center justify-center gap-2"
                >
                  Create User Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== 7. EDIT USER MODAL (MULTI-ROLE CHECKBOXES) ===== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Pencil className="h-5 w-5 text-primary" /> Edit Account Details
                </h3>
                <span className="text-xs text-slate-400 font-mono">User: @{editingUser.username}</span>
              </div>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-200">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Full Display Name</label>
                  <input
                    type="text"
                    required
                    value={formData.displayName}
                    onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase">Mobile Number (10 Digits)</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">4-Digit Security PIN</label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={formData.pin}
                  onChange={e => setFormData({ ...formData, pin: e.target.value })}
                  className="w-full py-2.5 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/40 mt-1 font-mono tracking-widest text-center"
                />
              </div>

              {/* Multi-Role Selection Pills */}
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  Assigned Roles
                </label>
                {editingUser.username === 'admin' ? (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-xs font-black flex items-center justify-between">
                    <span>👑 System Administrator (Fixed Master Admin Account)</span>
                    <Shield className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MASTER_ROLES.map(r => {
                      const isSelected = formData.roles.includes(r.key);
                      return (
                        <button
                          key={r.key}
                          type="button"
                          onClick={() => toggleFormRole(r.key)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition flex items-center justify-between ${
                            isSelected
                              ? `${r.color} ring-2 ring-primary/40 scale-[1.02] shadow-xs font-black`
                              : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 opacity-60 hover:opacity-100 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="text-xs font-bold truncate">{r.label}</div>
                          {isSelected && <Check className="h-4 w-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm cursor-pointer transition flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" /> Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== 8. DELETE CONFIRMATION MODAL ===== */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-slate-200 dark:border-slate-700 text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center mx-auto">
              <UserX className="h-6 w-6" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Delete User Account?</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{deletingUser.displayName}</strong> (@{deletingUser.username})? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black shadow-sm cursor-pointer transition"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementView;
