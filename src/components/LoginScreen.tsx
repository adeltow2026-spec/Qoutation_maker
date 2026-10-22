import React, { useState } from 'react';
import { UserProfile, CompanySettings } from '../types';
import { Lock, Mail, ShieldCheck, ArrowRight, Eye, EyeOff, User, AlertCircle, Building2 } from 'lucide-react';

interface LoginScreenProps {
  users: UserProfile[];
  settings: CompanySettings;
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  settings,
  onLoginSuccess,
}) => {
  const [identifier, setIdentifier] = useState('adel.tow.2026@gmail.com');
  const [password, setPassword] = useState('Adel@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const cleanIdent = identifier.trim().toLowerCase();
      const targetUser = users.find(
        (u) =>
          u.email.toLowerCase() === cleanIdent ||
          u.name.toLowerCase() === cleanIdent ||
          (cleanIdent === 'adel' && u.name.toLowerCase().includes('adel'))
      );

      if (!targetUser) {
        setError('No account found with that email or username.');
        setIsLoading(false);
        return;
      }

      const expectedPassword = targetUser.password || (targetUser.name.toLowerCase().includes('adel') ? 'Adel@2026' : 'Tow@123');

      if (password !== expectedPassword) {
        setError('Incorrect password. Please verify and try again.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onLoginSuccess(targetUser);
    }, 250);
  };

  const handleQuickSelect = (u: UserProfile) => {
    setIdentifier(u.email);
    setPassword(u.password || (u.name.toLowerCase().includes('adel') ? 'Adel@2026' : 'Tow@123'));
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden relative z-10">
        {/* Brand Header */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 text-white text-center border-b border-slate-800">
          <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-white/10 backdrop-blur-md p-1 border border-white/20 flex items-center justify-center shadow-inner">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.name}
                className="max-h-full max-w-full object-contain rounded"
              />
            ) : (
              <Building2 className="w-7 h-7 text-amber-400" />
            )}
          </div>
          <h1 className="text-base font-extrabold tracking-wide uppercase">
            Touch Of Wood
          </h1>
          <p className="text-xs text-slate-300 font-medium mt-0.5">
            Estimation &amp; Quotation Management Portal
          </p>
          <div className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] text-amber-300 font-semibold border border-white/15">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Secure Team Access
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email or Username
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@touchofwood.ae"
                className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Password</label>
              <span className="text-[11px] text-slate-400">Team Passcode</span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-10 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-600 absolute right-2.5 top-2 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Estimator Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick Demo Selector for Convenience */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 mb-2 text-center uppercase tracking-wider">
              Quick Select Team Profile
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.slice(0, 4).map((u) => {
                const isSelected = identifier.toLowerCase() === u.email.toLowerCase();
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickSelect(u)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50/70 text-blue-900 font-semibold shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                      {u.avatarInitials || u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{u.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{u.role}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 p-2 bg-slate-50 rounded-lg border border-slate-200 text-[10px] text-slate-500 text-center leading-relaxed">
              Default password for <strong>Adel</strong>: <code className="font-mono text-slate-700 font-bold bg-white px-1 py-0.5 rounded border border-slate-200">Adel@2026</code> &bull; Staff accounts: <code className="font-mono text-slate-700 font-bold bg-white px-1 py-0.5 rounded border border-slate-200">Tow@123</code>
            </div>
          </div>
        </form>
      </div>

      <p className="text-[11px] text-slate-400 mt-6 text-center">
        Touch of Wood Decoration Works LLC &bull; Abu Dhabi, UAE
      </p>
    </div>
  );
};
