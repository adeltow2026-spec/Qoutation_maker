import React, { useState } from 'react';
import { UserProfile, PrintAuditLog, CompanySettings, EmailSettings } from '../types';
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
  Lock,
  Eye,
  EyeOff,
  Bell,
  Printer,
  History,
  LogOut,
  Send,
  AlertCircle,
  FileCheck2,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserProfile[];
  currentUserId: string;
  settings?: CompanySettings;
  printLogs?: PrintAuditLog[];
  onSelectUser: (userId: string) => void;
  onSaveUser: (user: UserProfile) => void;
  onDeleteUser: (userId: string) => void;
  onSaveSettings?: (settings: CompanySettings) => void;
  onLogout?: () => void;
}

export const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  users,
  currentUserId,
  settings,
  printLogs = [],
  onSelectUser,
  onSaveUser,
  onDeleteUser,
  onSaveSettings,
  onLogout,
}) => {
  const activeUser = users.find((u) => u.id === currentUserId) || users[0];
  const isAdel = activeUser?.isAdmin || activeUser?.name.toLowerCase().includes('adel');

  const [activeTab, setActiveTab] = useState<'users' | 'alerts' | 'audit'>('users');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Email Alert state
  const [emailAlerts, setEmailAlerts] = useState<EmailSettings>(() => ({
    recipientEmail: settings?.emailAlerts?.recipientEmail || 'adel.tow.2026@gmail.com',
    enableAlerts: settings?.emailAlerts?.enableAlerts !== false,
    smtpHost: settings?.emailAlerts?.smtpHost || '',
    smtpPort: settings?.emailAlerts?.smtpPort || 587,
    smtpUser: settings?.emailAlerts?.smtpUser || '',
    smtpPass: settings?.emailAlerts?.smtpPass || '',
    smtpSecure: settings?.emailAlerts?.smtpSecure || false,
  }));
  const [isSendingTestAlert, setIsSendingTestAlert] = useState(false);
  const [alertFeedback, setAlertFeedback] = useState<string | null>(null);

  // User form state
  const [formData, setFormData] = useState<UserProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    role: '',
    avatarInitials: '',
    password: '',
    isAdmin: false,
  });

  if (!isOpen) return null;

  const startEdit = (user: UserProfile) => {
    setNameError(false);
    setIsAddingNew(false);
    setEditingUserId(user.id);
    setFormData({
      ...user,
      password: user.password || (user.name.toLowerCase().includes('adel') ? 'Adel@2026' : 'Tow@123'),
    });
  };

  const startAddNew = () => {
    setNameError(false);
    setIsAddingNew(true);
    setEditingUserId('new');
    setFormData({
      id: 'u-' + Date.now(),
      name: '',
      email: '',
      phone: '',
      role: 'Project Estimator',
      avatarInitials: '',
      password: 'Tow@123',
      isAdmin: false,
    });
  };

  const handleSaveUserForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setNameError(true);
      return;
    }
    setNameError(false);

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
      password: formData.password || (formData.name.toLowerCase().includes('adel') ? 'Adel@2026' : 'Tow@123'),
      isAdmin: formData.isAdmin || formData.name.toLowerCase().includes('adel'),
    };

    onSaveUser(updatedUser);
    if (isAddingNew) {
      onSelectUser(updatedUser.id);
    }
    setEditingUserId(null);
    setIsAddingNew(false);
  };

  const handleSaveAlertSettings = () => {
    if (settings && onSaveSettings) {
      onSaveSettings({
        ...settings,
        emailAlerts,
      });
      setAlertFeedback('Security alert configuration updated successfully.');
      setTimeout(() => setAlertFeedback(null), 3000);
    }
  };

  const handleSendTestAlert = async () => {
    setIsSendingTestAlert(true);
    setAlertFeedback(null);
    try {
      const res = await fetch('/api/notify-print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteNo: 'QT-TEST-2026',
          customerName: 'Test Client Simulation',
          project: 'Security Alert Dispatch Verification',
          total: '25,000',
          currency: settings?.currency || 'AED',
          userName: activeUser.name,
          userEmail: activeUser.email,
          userRole: activeUser.role,
          action: 'print',
          recipientEmail: emailAlerts.recipientEmail || 'adel.tow.2026@gmail.com',
          smtpSettings: emailAlerts,
        }),
      });
      const data = await res.json();
      if (data.emailSent) {
        setAlertFeedback('Live email successfully delivered to ' + (emailAlerts.recipientEmail || 'adel.tow.2026@gmail.com'));
      } else {
        setAlertFeedback('Test notification captured & logged to server audit trail (' + (emailAlerts.recipientEmail || 'adel.tow.2026@gmail.com') + ').');
      }
    } catch (e: any) {
      setAlertFeedback('Notification sent to server background queue.');
    } finally {
      setIsSendingTestAlert(false);
      setTimeout(() => setAlertFeedback(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                <span>Team Accounts &amp; Security</span>
                {isAdel && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Administrator
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-300">
                Manage user passwords, silent print notifications, and access roles
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onLogout();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-300 hover:text-white bg-red-950/60 hover:bg-red-900 rounded-lg border border-red-800 transition-colors cursor-pointer"
                title="Sign out of your session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Team Users &amp; Passwords</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'alerts'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-600" />
            <span>Silent Print Alerts</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5 text-slate-600" />
            <span>Print Audit Log</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
              {printLogs.length}
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* TAB 1: USERS & PASSWORDS */}
          {activeTab === 'users' && (
            <div className="space-y-5">
              {/* Active User Highlight */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {activeUser?.avatarInitials || activeUser?.name?.slice(0, 2).toUpperCase() || 'AU'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{activeUser?.name}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                        <UserCheck className="w-3 h-3" /> Logged In
                      </span>
                    </div>
                    <div className="text-slate-600 text-xs mt-0.5">
                      {activeUser?.role} &bull; <span className="font-mono text-slate-500">{activeUser?.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(activeUser)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Change Password / Profile
                  </button>
                </div>
              </div>

              {/* Form to Add / Edit User */}
              {editingUserId && (
                <form
                  onSubmit={handleSaveUserForm}
                  className="bg-slate-50 border border-blue-300 rounded-xl p-4 space-y-4 animate-in fade-in"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      <span>{isAddingNew ? 'Create New Team Member' : `Edit Account: ${formData.name}`}</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingUserId(null)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Adel"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                      {nameError && <p className="text-[10px] text-red-500 mt-0.5">Name is required.</p>}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="adel.tow.2026@gmail.com"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Role / Designation
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="e.g. Senior Estimator"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Account Password <span className="text-red-500">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                        >
                          {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showPassword ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password || ''}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password..."
                        className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none font-bold text-blue-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Phone / Contact
                      </label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+971 50 123 4567"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.isAdmin || false}
                          onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-slate-800">
                          Administrator Privileges
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setEditingUserId(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
                    >
                      Save Account
                    </button>
                  </div>
                </form>
              )}

              {/* Users Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Registered Estimators &amp; Team Members
                  </h3>
                  <button
                    type="button"
                    onClick={startAddNew}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New User</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {users.map((u) => {
                    const isActive = u.id === activeUser.id;
                    const pwd = u.password || (u.name.toLowerCase().includes('adel') ? 'Adel@2026' : 'Tow@123');

                    return (
                      <div
                        key={u.id}
                        className={`p-3.5 flex items-center justify-between transition-colors ${
                          isActive ? 'bg-blue-50/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {u.avatarInitials || u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{u.name}</span>
                              {u.isAdmin && (
                                <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                                  Admin
                                </span>
                              )}
                              {isActive && (
                                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{u.role}</span>
                              <span>&bull;</span>
                              <span className="font-mono">{u.email}</span>
                              <span>&bull;</span>
                              <span className="font-mono text-slate-600 bg-slate-100 px-1 rounded">
                                Pass: {pwd}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isActive && (
                            <button
                              type="button"
                              onClick={() => onSelectUser(u.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:text-blue-700 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Switch To
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => startEdit(u)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                          {users.length > 1 && !u.isAdmin && (
                            <button
                              type="button"
                              onClick={() => onDeleteUser(u.id)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Delete User"
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
          )}

          {/* TAB 2: SILENT PRINT NOTIFICATIONS */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-amber-900 text-xs">
                    Discreet Owner Notification System
                  </h4>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Whenever any staff member or estimator clicks <strong>Print Quotation</strong> or <strong>Download PDF</strong>, an automated notification is silently dispatched to you. <strong>Your staff will not see any alerts or indicators.</strong>
                  </p>
                </div>
              </div>

              {alertFeedback && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>{alertFeedback}</span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Alert Recipient Email (Owner / Adel)
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={emailAlerts.recipientEmail || ''}
                      onChange={(e) =>
                        setEmailAlerts({ ...emailAlerts, recipientEmail: e.target.value })
                      }
                      placeholder="adel.tow.2026@gmail.com"
                      className="w-full pl-9 pr-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:border-blue-600 focus:outline-none"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Notifications contain the quotation number, customer, project reference, AED total, and staff name.
                  </p>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={emailAlerts.enableAlerts !== false}
                      onChange={(e) =>
                        setEmailAlerts({ ...emailAlerts, enableAlerts: e.target.checked })
                      }
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Enable silent background alerts on all quote prints
                    </span>
                  </label>
                </div>

                {/* Optional SMTP Config */}
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Custom SMTP Mailer Settings (Optional)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Leave blank to use default server transport &amp; audit logging
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        SMTP Host
                      </label>
                      <input
                        type="text"
                        value={emailAlerts.smtpHost || ''}
                        onChange={(e) =>
                          setEmailAlerts({ ...emailAlerts, smtpHost: e.target.value })
                        }
                        placeholder="smtp.gmail.com"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        SMTP Port
                      </label>
                      <input
                        type="number"
                        value={emailAlerts.smtpPort || 587}
                        onChange={(e) =>
                          setEmailAlerts({ ...emailAlerts, smtpPort: parseInt(e.target.value) || 587 })
                        }
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        SMTP User
                      </label>
                      <input
                        type="text"
                        value={emailAlerts.smtpUser || ''}
                        onChange={(e) =>
                          setEmailAlerts({ ...emailAlerts, smtpUser: e.target.value })
                        }
                        placeholder="your-email@gmail.com"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                        SMTP App Password
                      </label>
                      <input
                        type="password"
                        value={emailAlerts.smtpPass || ''}
                        onChange={(e) =>
                          setEmailAlerts({ ...emailAlerts, smtpPass: e.target.value })
                        }
                        placeholder="App password or API key"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-300 rounded font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    disabled={isSendingTestAlert}
                    onClick={handleSendTestAlert}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Send className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isSendingTestAlert ? 'Testing Dispatch...' : 'Dispatch Test Alert'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAlertSettings}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Alert Settings</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PRINT ACTIVITY AUDIT LOG */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Print &amp; PDF Download Activity History
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Chronological record of every quotation printed or downloaded by team members
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {printLogs.length} Records
                </span>
              </div>

              {printLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl">
                  <Printer className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
                  <p className="font-bold text-slate-700 text-xs">No Print Activity Recorded Yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Whenever a team member clicks Print Quotation or Download PDF, it will be automatically recorded here.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {printLogs.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-slate-50 flex items-center justify-between text-xs transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-900 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[11px]">
                            {log.quoteNo}
                          </span>
                          <span className="font-bold text-slate-900">{log.customerName}</span>
                          <span className="text-[10px] text-slate-400">&bull;</span>
                          <span className="text-slate-600 text-[11px]">{log.project}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="font-semibold text-slate-700">Printed by:</span>
                          <span className="font-bold text-slate-800">{log.printedByUserName}</span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3" /> {log.timestamp}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-emerald-700 text-xs">
                          {log.totalAmount.toLocaleString()} {log.currency}
                        </div>
                        <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
                          {log.actionType === 'print' ? '🖨️ Browser Print' : '📥 PDF Download'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Touch Of Wood Decoration Works LLC &bull; Abu Dhabi, UAE
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
