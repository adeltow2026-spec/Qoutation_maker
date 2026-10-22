import React, { useState } from 'react';
import { UserProfile, CompanySettings } from '../types';
import { Lock, Mail, ShieldCheck, ArrowRight, Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react';

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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
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
        setError('Invalid email or username. Please check your credentials.');
        setIsLoading(false);
        return;
      }

      const expectedPassword = targetUser.password || (targetUser.name.toLowerCase().includes('adel') ? 'Adel@2026' : 'Tow@123');

      if (password !== expectedPassword) {
        setError('Incorrect password. Please try again.');
        setIsLoading(false);
        return;
      }

      setIsLoading(false);
      onLoginSuccess(targetUser);
    }, 250);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Subtle Ambient Glow */}
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
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Secure Staff Portal
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
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
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Enter your email or username..."
                className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700">Password</label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password..."
                className="w-full pl-9 pr-10 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all placeholder:text-slate-400"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-2.5 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !identifier.trim() || !password.trim()}
            className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        </form>
      </div>

      <p className="text-[11px] text-slate-500 mt-6 text-center">
        Touch of Wood Decoration Works LLC &bull; Abu Dhabi, UAE
      </p>
    </div>
  );
};
