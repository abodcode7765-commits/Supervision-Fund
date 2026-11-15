import React, { useState } from 'react';
import { Eye, EyeOff, Lock, User, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react';
import { LogoMark } from '../ui/SharedUI';
import { SystemUser } from '../../types';

export function LoginPage({
  users,
  onLogin,
}: {
  users: SystemUser[];
  onLogin: (user: SystemUser) => void;
}) {
  const [username, setUsername] = useState('m.mohsen');
  const [password, setPassword] = useState('ishraf2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUser = username.trim();
    const trimmedPass = password.trim();

    if (!trimmedUser || !trimmedPass) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور للدخول إلى النظام.');
      return;
    }

    const matchedUser = users.find((u) => u.username === trimmedUser);
    if (!matchedUser) {
      setError('اسم المستخدم غير مسجل. اختر أحد الحسابات التجريبية أدناه أو أدخل m.mohsen.');
      return;
    }

    if (trimmedPass !== 'ishraf2026' && trimmedPass.length < 4) {
      setError('كلمة المرور غير صحيحة. كلمة المرور التجريبية الافتراضية هي: ishraf2026');
      return;
    }

    if (matchedUser.status === 'معطل') {
      setError('هذا الحساب معطّل حالياً. يرجى التواصل مع مدير الصندوق.');
      return;
    }

    setError('');
    onLogin(matchedUser);
  };

  const quickAccounts = users.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex flex-col lg:flex-row">
      {/* Decorative Royal Blue Executive Panel */}
      <div className="relative lg:w-5/12 bg-gradient-to-br from-[#123B70] via-[#164A8A] to-[#2878C8] text-white p-8 sm:p-12 flex flex-col justify-between overflow-hidden">
        <svg
          className="absolute -bottom-24 -left-24 w-96 h-96 text-white/5 pointer-events-none"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="90" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="65" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="100" cy="100" r="40" stroke="currentColor" strokeWidth="1.5" />
        </svg>

        <div className="relative z-10 flex items-center gap-3.5">
          <LogoMark size={46} light />
          <div>
            <div className="text-lg font-bold tracking-tight">صندوق الإشراف</div>
            <div className="text-xs text-[#BFD9F7]">ذوي محسن</div>
          </div>
        </div>

        <div className="relative z-10 my-10 lg:my-0 max-w-md">
          <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
            إدارة مالية عائلية منظمة وشفافة
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[#D7E8FA] leading-relaxed">
            منصة إدارية متكاملة لمتابعة اشتراكات الأعضاء السنوية والشهرية، تنظيم المجموعات،
            إدارة القِطّات ومعونة الزواج، وإصدار التقارير المالية الدقيقة.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 pt-6 border-t border-white/15">
            <div>
              <div className="text-2xl font-bold tabular-nums">120+</div>
              <div className="text-xs text-[#BFD9F7] mt-0.5">عضو مسجل بالصندوق</div>
            </div>
            <div>
              <div className="text-2xl font-bold tabular-nums">5</div>
              <div className="text-xs text-[#BFD9F7] mt-0.5">مجموعات عائلية منظمة</div>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-2 text-xs text-[#BFD9F7]">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>نظام إداري خاص بصندوق الإشراف – ذوي محسن</span>
        </div>
      </div>

      {/* Login Form Side */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 bg-white lg:bg-[#F5F7FA]">
        <div className="w-full max-w-md bg-white lg:rounded-2xl lg:border lg:border-slate-200/90 lg:p-9 lg:shadow-[0_8px_30px_rgba(18,59,112,0.06)]">
          <div className="flex flex-col items-center text-center mb-6">
            <LogoMark size={54} />
            <h1 className="mt-4 text-2xl font-bold text-[#172B45]">
              مرحباً بك في صندوق الإشراف
            </h1>
            <p className="mt-1.5 text-sm text-[#748399]">
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

          {/* Quick Role Demo Accounts */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-bold text-[#748399] mb-2.5 text-center">
              اختيار حساب تجريبي لمعاينة الصلاحيات:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {quickAccounts.map((acc) => {
                const isSelected = username === acc.username;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setUsername(acc.username);
                      setPassword('ishraf2026');
                      setError('');
                    }}
                    className={`p-2 rounded-xl border text-center transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#EAF3FC] border-[#2878C8] text-[#123B70]'
                        : 'bg-[#F8FAFC] border-slate-200 text-[#172B45] hover:border-[#4A90D9]'
                    }`}
                  >
                    <div className="text-[11px] font-bold truncate">{acc.role}</div>
                    <div className="text-[10px] text-[#748399] truncate mt-0.5">{acc.name}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="mt-6 pt-5 border-t border-slate-100 text-center text-xs text-[#748399]">
            جميع الحقوق محفوظة لصندوق الإشراف – ذوي محسن © 2026
          </p>
        </div>
      </div>
    </div>
  );
}
