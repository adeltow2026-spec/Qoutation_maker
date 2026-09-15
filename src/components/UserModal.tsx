import React, { useState } from 'react';
import { UserProfile } from '../types';
import {
  X,
  User,
  Check,
  Plus,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUserId: string;
  onSelectUser: (userId: string) => void;
  onSaveUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  onSelectUser,
  onSaveUser,
  onDeleteUser,
}) => {
  const activeUser = users.find((u) => u.id === currentUserId) || users[0];

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    avatarInitials: '',
  });

  if (!isOpen) return null;

  const startEdit = (user: UserProfile) => {
    setIsAddingNew(false);
    setEditingUserId(user.id);
    setFormData({ ...user });
  };

  const startAddNew = () => {
    setIsAddingNew(true);
    setEditingUserId('new');
    setFormData({
      id: 'u-' + Date.now(),
      name: '',
      email: '',
      phone: '',
      role: 'Project Estimator',
      avatarInitials: '',
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a user name.');
      return;
    }

    const initials =
      formData.avatarInitials?.trim() ||
      formData.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) ||
      'U';

    const updatedUser: UserProfile = {
      ...formData,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone?.trim() || '',
      role: formData.role.trim() || 'Estimator',
      avatarInitials: initials,
    };

    onSaveUser(updatedUser);
    if (isAddingNew) {
      onSelectUser(updatedUser.id);
    }
    setEditingUserId(null);
    setIsAddingNew(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Estimator &amp; User Account Section
              </h2>
              <p className="text-xs text-slate-300">
                Manage your profile, team estimators, and default quotation signatures
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Active Estimator Card */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                {activeUser?.avatarInitials ||
                  activeUser?.name?.slice(0, 2).toUpperCase() ||
                  'AU'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{activeUser?.name}</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    <UserCheck className="w-3 h-3" /> Active User
                  </span>
                </div>
                <div className="text-slate-600 font-medium mt-0.5">{activeUser?.role}</div>
                <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                  {activeUser?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" /> {activeUser.email}
                    </span>
                  )}
                  {activeUser?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" /> {activeUser.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => startEdit(activeUser)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-blue-300 text-blue-700 font-semibold rounded-lg shadow-xs transition-colors cursor-pointer text-xs"
            >
              Edit Profile
            </button>
          </div>

          {/* Edit / Add User Form (conditional) */}
          {editingUserId && (
            <form
              onSubmit={handleSave}
              className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-4 animate-in fade-in duration-200"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 text-xs">
                  {isAddingNew ? '＋ Add New Estimator / Team Member' : 'Edit Estimator Profile'}
                </span>
                <button
                  type="button"
                  onClick={() => setEditingUserId(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Adel"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Managing Estimator / Sales"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="adel.tow.2026@gmail.com"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Phone / Contact
                  </label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+971 50 123 4567"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUserId(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Estimator
                </button>
              </div>
            </form>
          )}

          {/* Team Members List / Switcher */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900">
                  Switch Active Estimator / Team Member
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select who is currently preparing and signing quotations
                </p>
              </div>
              <button
                type="button"
                onClick={startAddNew}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Member
              </button>
            </div>

            <div className="space-y-2">
              {users.map((user) => {
                const isSelected = user.id === currentUserId;
                return (
                  <div
                    key={user.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/50 border-blue-500 ring-1 ring-blue-500/30'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                    onClick={() => onSelectUser(user.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {user.avatarInitials || user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          {user.name}
                          {isSelected && (
                            <span className="text-[10px] text-blue-600 font-bold bg-blue-100/70 px-1.5 py-0.2 rounded">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {user.role} {user.email ? `• ${user.email}` : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => startEdit(user)}
                        className="px-2 py-1 text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded border border-slate-200 transition-colors cursor-pointer"
                      >
                        Edit
                      </button>

                      {users.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Remove ${user.name} from the team?`)) {
                              onDeleteUser(user.id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Delete member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Current quotations will be prepared under: <strong>{activeUser?.name}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
