import React, { useState } from 'react';
import {
  Building2,
  CalendarCog,
  Lock,
  Bell,
  Save,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { FundSettings, Group, PageId, SystemUser, YearConfig } from '../types';
import { PageHeader } from '../components/ui/SharedUI';
import { formatCurrency } from '../utils/formatters';

export function SettingsPage({
  settings,
  yearConfigs,
  groups,
  users,
  onSaveSettings,
  onUpdateYearConfig,
  onNavigate,
  onNotify,
}: {
  settings: FundSettings;
  yearConfigs: YearConfig[];
  groups: Group[];
  users: SystemUser[];
  onSaveSettings: (next: FundSettings) => void;
  onUpdateYearConfig: (cfg: YearConfig) => void;
  onNavigate: (page: PageId) => void;
  onNotify: (msg: string) => void;
}) {
  const [form, setForm] = useState<FundSettings>(settings);
  const [selectedYear, setSelectedYear] = useState<number>(yearConfigs[0]?.year ?? 2026);

  const activeYearCfg =
    yearConfigs.find((y) => y.year === selectedYear) ?? yearConfigs[0];
  const [foundingFee, setFoundingFee] = useState(activeYearCfg.foundingFee);
  const [monthlyFee, setMonthlyFee] = useState(activeYearCfg.monthlyFee);

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  const handleYearSelect = (yr: number) => {
    setSelectedYear(yr);
    const found = yearConfigs.find((y) => y.year === yr);
    if (found) {
      setFoundingFee(found.foundingFee);
      setMonthlyFee(found.monthlyFee);
    }
  };

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
  };

  const handleFeesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateYearConfig({
      year: selectedYear,
      foundingFee,
      monthlyFee,
      monthsCount: 12,
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass || !newPass) return;
    if (newPass !== confirmPass) {
      onNotify('كلمة المرور الجديدة وتأكيدها غير متطابقين.');
      return;
    }
    setCurrentPass('');
    setNewPass('');
    setConfirmPass('');
    onNotify('تم تحديث كلمة المرور بنجاح.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="إعدادات النظام"
        description="تخصيص معلومات صندوق الإشراف والسنوات المالية والرسوم وإدارة المستخدمين والواجهة."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Fund Info */}
        <form
          onSubmit={handleGeneralSubmit}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(18,59,112,0.04)] space-y-4"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-[#EAF3FC] text-[#2878C8] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172B45]">بيانات الصندوق الأساسية</h3>
              <p className="text-xs text-[#748399]">البيانات التعريفية الظاهرة في التقارير والنظام</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">اسم الصندوق</label>
              <input
                type="text"
                value={form.fundName}
                onChange={(e) => setForm({ ...form, fundName: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">الاسم الفرعي</label>
              <input
                type="text"
                value={form.subName}
                onChange={(e) => setForm({ ...form, subName: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">العملة المعتمدة</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">المدينة / المقر</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>حفظ معلومات الصندوق</span>
            </button>
          </div>
        </form>

        {/* 2. Financial Year & Fees Settings */}
        <form
          onSubmit={handleFeesSubmit}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(18,59,112,0.04)] space-y-4"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-[#EAF3FC] text-[#2878C8] flex items-center justify-center">
              <CalendarCog className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172B45]">
                إعدادات السنة المالية والرسوم
              </h3>
              <p className="text-xs text-[#748399]">تحديد رسوم التأسيس السنوية والاشتراك الشهري</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">السنة المالية</label>
            <select
              value={selectedYear}
              onChange={(e) => handleYearSelect(Number(e.target.value))}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-[#2878C8]"
            >
              {yearConfigs.map((y) => (
                <option key={y.year} value={y.year}>
                  السنة المالية {y.year}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                رسوم التأسيس السنوية (ر.س)
              </label>
              <input
                type="number"
                value={foundingFee}
                onChange={(e) => setFoundingFee(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                الاشتراك الشهري (ر.س)
              </label>
              <input
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/70 flex items-center justify-between text-xs">
            <span className="text-[#748399]">إجمالي الاشتراك السنوي للعضو في {selectedYear}:</span>
            <strong className="text-[#123B70] tabular-nums">
              {formatCurrency(foundingFee + monthlyFee * 12)}
            </strong>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>تحديث رسوم السنة</span>
            </button>
          </div>
        </form>

        {/* 3. Account & Password Settings */}
        <form
          onSubmit={handlePasswordSubmit}
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(18,59,112,0.04)] space-y-4"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-[#EAF3FC] text-[#2878C8] flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#172B45]">
                الحساب الشخصي وكلمة المرور
              </h3>
              <p className="text-xs text-[#748399]">تحديث بيانات الدخول الخاصة بحساب مدير النظام</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                كلمة المرور الحالية
              </label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="••••••••"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                  تأكيد كلمة المرور
                </label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#123B70] hover:bg-[#0e2e58] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              تغيير كلمة المرور
            </button>
          </div>
        </form>

        {/* 4. Notifications, General UI & Management Links */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(18,59,112,0.04)] space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-[#EAF3FC] text-[#2878C8] flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#172B45]">
                  إعدادات الإشعارات والواجهة العامة
                </h3>
                <p className="text-xs text-[#748399]">تخصيص التنبيهات وتفضيلات العرض</p>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              {[
                {
                  key: 'notifyOnPayment' as const,
                  label: 'إشعار عند تسجيل عملية سداد جديدة',
                },
                {
                  key: 'notifyOnOverdue' as const,
                  label: 'تنبيه شهري بالاشتراكات المتأخرة',
                },
                {
                  key: 'notifyOnMarriageAid' as const,
                  label: 'تنبيه عند استحقاق معونة زواج جديدة',
                },
                {
                  key: 'compactTables' as const,
                  label: 'عرض الجداول والمؤشرات بالوضع المضغوط',
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/70 cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-semibold text-[#172B45]">
                    {item.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={form[item.key]}
                    onChange={(e) => {
                      const next = { ...form, [item.key]: e.target.checked };
                      setForm(next);
                      onSaveSettings(next);
                    }}
                    className="w-4 h-4 accent-[#2878C8]"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#EAF3FC] text-[#123B70] flex items-center justify-center shrink-0">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-[#172B45] truncate">
                    المجموعات ({groups.length})
                  </div>
                  <div className="text-[11px] text-[#748399] truncate">تنظيم المجموعات</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('groups')}
                className="px-3 py-2 rounded-xl bg-[#EAF3FC] hover:bg-[#2878C8] text-[#123B70] hover:text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
              >
                فتح
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#EAF3FC] text-[#123B70] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm font-bold text-[#172B45] truncate">
                    المستخدمون ({users.length})
                  </div>
                  <div className="text-[11px] text-[#748399] truncate">إدارة الصلاحيات</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('users')}
                className="px-3 py-2 rounded-xl bg-[#EAF3FC] hover:bg-[#2878C8] text-[#123B70] hover:text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
              >
                فتح
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
