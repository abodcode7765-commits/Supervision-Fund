import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ArrowLeft, ShieldCheck, AlertCircle, Users, Layers } from 'lucide-react';
import { LogoMark } from '../ui/SharedUI';
import { SystemUser } from '../../types';
import { authenticateMockUser } from '../../services/contracts';

export function LoginPage({
  users,
  membersCount,
  groupsCount,
  onLogin,
}: {
  users: SystemUser[];
  membersCount: number;
  groupsCount: number;
  onLogin: (user: SystemUser) => void;
}) {
  const [username, setUsername] = useState('m.mohsen');
  const [password, setPassword] = useState('ishraf2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = authenticateMockUser(users, { username, password });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    onLogin(result.session.user);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col">
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          {/* Login Form Section */}
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-8 shadow-[0_8px_30px_rgba(18,59,112,0.06)]">
            <div className="flex flex-col items-center text-center mb-6">
              <LogoMark size={54} />
              <h1 className="mt-4 text-xl sm:text-2xl font-bold text-[#172B45]">
                مرحباً بك في صندوق الإشراف
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#748399]">
                نظام إدارة الصندوق العائلي – ذوي محسن
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-[#DC5555]/10 border border-[#DC5555]/25 text-[#DC5555] text-xs font-semibold flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="login-username"
                  className="block text-sm font-semibold text-[#172B45] mb-1.5"
                >
                  اسم المستخدم
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#748399] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="أدخل اسم المستخدم"
                    className="w-full h-11 pr-10 pl-4 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm text-[#172B45] focus:bg-white focus:outline-none focus:border-[#2878C8] focus:ring-2 focus:ring-[#2878C8]/15 transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-sm font-semibold text-[#172B45] mb-1.5"
                >
                  كلمة المرور
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#748399] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="أدخل كلمة المرور"
                    className="w-full h-11 pr-10 pl-11 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm text-[#172B45] focus:bg-white focus:outline-none focus:border-[#2878C8] focus:ring-2 focus:ring-[#2878C8]/15 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#748399] hover:text-[#172B45] p-1"
                    aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>تسجيل الدخول</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Section Divider */}
          <div
            className="w-full max-w-md h-px bg-slate-200/90 lg:w-px lg:h-auto lg:self-stretch lg:my-6"
            aria-hidden="true"
          />

          {/* Executive Info Section (Clean Surface, No Logo, With Dividers) */}
          <div className="w-full max-w-md lg:max-w-sm flex flex-col gap-5 text-[#172B45]">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold leading-snug text-[#123B70]">
                إدارة مالية عائلية منظمة وشفافة
              </h2>
              <p className="mt-2.5 text-xs sm:text-sm text-[#748399] leading-relaxed">
                منصة إدارية متكاملة لمتابعة اشتراكات الأعضاء السنوية والشهرية، تنظيم المجموعات،
                إدارة القطات ومعونة الزواج، وإصدار التقارير المالية الدقيقة.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200/90 grid grid-cols-2 gap-3.5">
              <div className="h-full bg-white rounded-xl border border-slate-200/85 p-4 shadow-[0_2px_8px_rgba(18,59,112,0.04)] hover:border-[#4A90D9]/60 transition-colors flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#EAF3FC] text-[#2878C8] flex items-center justify-center mb-2.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold tabular-nums text-[#123B70]">
                    {membersCount}
                  </div>
                  <div className="text-xs font-medium text-[#748399] mt-1">عضو مسجل بالصندوق</div>
                </div>
              </div>
              <div className="h-full bg-white rounded-xl border border-slate-200/85 p-4 shadow-[0_2px_8px_rgba(18,59,112,0.04)] hover:border-[#4A90D9]/60 transition-colors flex flex-col justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#123B70]/10 text-[#123B70] flex items-center justify-center mb-2.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold tabular-nums text-[#123B70]">
                    {groupsCount}
                  </div>
                  <div className="text-xs font-medium text-[#748399] mt-1">مجموعات عائلية منظمة</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200/90 flex items-center gap-2 text-xs text-[#748399]">
              <ShieldCheck className="w-4 h-4 shrink-0 text-[#2878C8]" />
              <span>نظام إداري خاص بصندوق الإشراف – ذوي محسن</span>
            </div>
          </div>
        </div>
      </div>

      {/* Page Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 py-3.5 px-4 text-center text-xs text-[#748399]">
        جميع الحقوق محفوظة لصندوق الإشراف – ذوي محسن © 2026
      </footer>
    </div>
  );
}
