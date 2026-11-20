import React, { useState } from 'react';
import {
  CalendarPlus,
  Check,
  Clock,
  Minus,
  X as XIcon,
  Coins,
  CalendarDays,
  Calculator,
  Search,
  Pencil,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import {
  Member,
  MemberYearSubscription,
  MonthCellStatus,
  SystemUser,
  YearConfig,
} from '../types';
import { ARABIC_MONTHS } from '../data/mockData';
import { Modal, PageHeader, StatCard, StatusIndicator } from '../components/ui/SharedUI';
import {
  addCurrency,
  computeMemberYearTotals,
  createDefaultSubscription,
  formatCurrency,
  getDefaultActiveYear,
  isFutureScheduledYear,
  roundCurrency,
  toHalalas,
} from '../utils/formatters';

function MonthCellBadge({
  status,
  paidAmt,
  monthlyFee,
  disabled,
  onClick,
}: {
  status: MonthCellStatus;
  paidAmt: number;
  monthlyFee: number;
  disabled: boolean;
  onClick: () => void;
}) {
  const styles: Record<MonthCellStatus, string> = {
    paid: 'bg-[#16A36A]/12 text-[#16A36A] border-[#16A36A]/30 hover:bg-[#16A36A]/20',
    overdue: 'bg-[#DC5555]/12 text-[#DC5555] border-[#DC5555]/30 hover:bg-[#DC5555]/20',
    partial: 'bg-[#E99A35]/15 text-[#C67B1B] border-[#E99A35]/35 hover:bg-[#E99A35]/25',
    upcoming: 'bg-slate-100 text-[#748399] border-slate-200 hover:bg-slate-200/70',
  };

  const titleMap: Record<MonthCellStatus, string> = {
    paid: `مسدد (${paidAmt}/${monthlyFee})`,
    overdue: `متأخر (0/${monthlyFee})`,
    partial: `مسدد جزئياً (${paidAmt} من ${monthlyFee})`,
    upcoming: 'لم يُسدد بعد',
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? titleMap[status] : `${titleMap[status]} — اضغط لتبديل الحالة`}
      className={`w-8 h-7 rounded-md border text-[11px] font-bold inline-flex items-center justify-center transition-colors ${
        disabled ? 'cursor-default opacity-90' : 'cursor-pointer'
      } ${styles[status]}`}
    >
      {status === 'paid' && <Check className="w-3.5 h-3.5" />}
      {status === 'overdue' && <XIcon className="w-3.5 h-3.5" />}
      {status === 'partial' && <Clock className="w-3.5 h-3.5" />}
      {status === 'upcoming' && <Minus className="w-3.5 h-3.5" />}
    </button>
  );
}

export function SubscriptionsPage({
  members,
  yearConfigs,
  subscriptions,
  currentUser,
  onAddYearConfig,
  onUpdateYearConfig,
  onToggleMonthStatus,
  onUpdateSubscriptionDetails,
  onSelectMember,
}: {
  members: Member[];
  yearConfigs: YearConfig[];
  subscriptions: MemberYearSubscription[];
  currentUser: SystemUser;
  onAddYearConfig: (config: YearConfig) => { ok: boolean; error?: string };
  onUpdateYearConfig: (config: YearConfig) => void;
  onToggleMonthStatus: (memberId: string, year: number, monthIndex: number) => void;
  onUpdateSubscriptionDetails: (
    memberId: string,
    year: number,
    foundingPaidAmount: number,
    monthPaidAmounts: number[]
  ) => void;
  onSelectMember: (memberId: string) => void;
}) {
  const isGroupLeader = currentUser.role === 'رئيس المجموعة';
  const canEdit = currentUser.role === 'مدير الصندوق';

  const scopedMembers =
    isGroupLeader && currentUser.groupId
      ? members.filter((m) => m.groupId === currentUser.groupId)
      : members;

  const [selectedYear, setSelectedYear] = useState<number>(() =>
    getDefaultActiveYear(yearConfigs)
  );
  const [search, setSearch] = useState('');
  const [addYearOpen, setAddYearOpen] = useState(false);
  const [editYearOpen, setEditYearOpen] = useState(false);

  const [newYear, setNewYear] = useState<number>(2036);
  const [newFoundingFee, setNewFoundingFee] = useState(200);
  const [newMonthlyFee, setNewMonthlyFee] = useState(50);
  const [yearError, setYearError] = useState('');

  const activeConfig =
    yearConfigs.find((y) => y.year === selectedYear) ?? yearConfigs[0];

  const [editFoundingFee, setEditFoundingFee] = useState(activeConfig?.foundingFee ?? 200);
  const [editMonthlyFee, setEditMonthlyFee] = useState(activeConfig?.monthlyFee ?? 50);

  // Detailed member-month partial edit modal
  const [detailEditMember, setDetailEditMember] = useState<Member | null>(null);
  const [detailFoundingPaid, setDetailFoundingPaid] = useState<number>(0);
  const [detailMonthAmounts, setDetailMonthAmounts] = useState<number[]>(Array(12).fill(0));

  const openDetailEdit = (member: Member) => {
    const sub =
      subscriptions.find((s) => s.memberId === member.id && s.year === selectedYear) ??
      createDefaultSubscription(member.id, selectedYear);
    const totals = computeMemberYearTotals(sub, activeConfig);
    setDetailEditMember(member);
    setDetailFoundingPaid(totals.foundingPaid);
    setDetailMonthAmounts(
      totals.monthPaidAmounts.length === 12 ? [...totals.monthPaidAmounts] : Array(12).fill(0)
    );
  };

  const expectedAnnualPerMember = roundCurrency(
    (activeConfig?.foundingFee ?? 0) +
      (activeConfig?.monthlyFee ?? 0) * (activeConfig?.monthsCount ?? 12)
  );

  // Compute dynamic totals across all scoped members for activeConfig.year
  let expectedTotalFund = 0;
  let totalCollectedFund = 0;
  let totalRemainingFund = 0;

  scopedMembers.forEach((m) => {
    const sub =
      subscriptions.find((s) => s.memberId === m.id && s.year === activeConfig.year) ??
      createDefaultSubscription(m.id, activeConfig.year);
    const t = computeMemberYearTotals(sub, activeConfig);
    expectedTotalFund = addCurrency(expectedTotalFund, t.totalDue);
    totalCollectedFund = addCurrency(totalCollectedFund, t.totalPaid);
    totalRemainingFund = addCurrency(totalRemainingFund, t.remaining);
  });

  const totalFoundingAll = roundCurrency(activeConfig.foundingFee * scopedMembers.length);

  const filteredMembers = scopedMembers.filter((m) =>
    !search.trim()
      ? true
      : m.name.includes(search.trim()) ||
        m.groupName.includes(search.trim()) ||
        String(m.serial).includes(search.trim())
  );

  const handleCreateYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!Number.isInteger(newYear) || newYear < 1300 || newYear > 2200) {
      setYearError('يرجى إدخال سنة مالية صحيحة (مثال: 1447 أو 2027).');
      return;
    }
    const res = onAddYearConfig({
      year: newYear,
      foundingFee: Math.max(0, newFoundingFee),
      monthlyFee: Math.max(0, newMonthlyFee),
      monthsCount: 12,
    });
    if (!res.ok) {
      setYearError(res.error ?? 'تعذر إضافة السنة المالية.');
      return;
    }
    setYearError('');
    setSelectedYear(newYear);
    setAddYearOpen(false);
  };

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="الاشتراكات والرسوم"
        description="إدارة رسوم التأسيس السنوية والاشتراكات الشهرية للأعضاء ومتابعة جدول السداد السنوي (يدعم السنوات الهجرية والميلادية)."
        action={
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-[#123B70] focus:outline-none focus:border-[#2878C8]"
              aria-label="اختيار السنة المالية"
            >
              {yearConfigs.map((cfg) => (
                <option key={cfg.year} value={cfg.year}>
                  السنة المالية {cfg.year}
                </option>
              ))}
            </select>
            {canEdit && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditFoundingFee(activeConfig.foundingFee);
                    setEditMonthlyFee(activeConfig.monthlyFee);
                    setEditYearOpen(true);
                  }}
                  className="h-10 inline-flex items-center gap-1.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-[#2878C8] text-[#172B45] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4 text-[#2878C8]" />
                  <span>تعديل رسوم {activeConfig.year}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const maxY =
                      yearConfigs.length > 0
                        ? Math.max(...yearConfigs.map((y) => y.year))
                        : 2035;
                    setNewYear(maxY + 1);
                    setYearError('');
                    setAddYearOpen(true);
                  }}
                  className="h-10 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>سنة مالية جديدة</span>
                </button>
              </>
            )}
          </div>
        }
      />

      {isGroupLeader && (
        <div className="bg-[#EAF3FC] border border-[#4A90D9]/35 rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs text-[#123B70]">
          <ShieldAlert className="w-4 h-4 text-[#2878C8] shrink-0" />
          <span>
            أنت تعرض جدول اشتراكات أعضاء <strong>{currentUser.groupName}</strong> فقط (للاطلاع دون
            صلاحية التعديل).
          </span>
        </div>
      )}

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="السنة المالية المختارة"
          value={`${activeConfig.year}`}
          subtitle="حسابات مستقلة عن السنوات الأخرى"
          icon={CalendarDays}
          accent="royal"
        />
        <StatCard
          title="إجمالي رسوم التأسيس"
          value={formatCurrency(totalFoundingAll)}
          subtitle={`${formatCurrency(activeConfig.foundingFee)} × ${scopedMembers.length} عضواً`}
          icon={Coins}
          accent="blue"
        />
        <StatCard
          title="الاشتراك الشهري المعتمد"
          value={formatCurrency(activeConfig.monthlyFee)}
          subtitle={`الالتزام السنوي للفرد: ${formatCurrency(expectedAnnualPerMember)}`}
          icon={Calculator}
          accent="amber"
        />
        <StatCard
          title="إجمالي المستحق الفعلي"
          value={formatCurrency(expectedTotalFund)}
          subtitle={`المحصل: ${formatCurrency(totalCollectedFund)} · المتبقي: ${formatCurrency(totalRemainingFund)}`}
          icon={Check}
          accent="green"
        />
      </div>

      {/* Year Fee Settings Summary Strip */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_1px_3px_rgba(18,59,112,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#172B45]">
              إعدادات الرسوم للسنة المالية {activeConfig.year}
            </h3>
            <p className="text-xs text-[#748399] mt-0.5">
              تتكرر رسوم التأسيس سنوياً، ولا يؤثر تعديل رسوم هذه السنة على حسابات السنوات السابقة.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
            <div className="px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/70">
              <div className="text-[11px] text-[#748399]">رسوم التأسيس</div>
              <div className="text-sm font-bold text-[#123B70] mt-0.5 tabular-nums">
                {formatCurrency(activeConfig.foundingFee)}
              </div>
            </div>
            <div className="px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/70">
              <div className="text-[11px] text-[#748399]">الاشتراك الشهري</div>
              <div className="text-sm font-bold text-[#2878C8] mt-0.5 tabular-nums">
                {formatCurrency(activeConfig.monthlyFee)}
              </div>
            </div>
            <div className="px-3 py-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200/70">
              <div className="text-[11px] text-[#748399]">عدد الأشهر</div>
              <div className="text-sm font-bold text-[#172B45] mt-0.5 tabular-nums">
                {activeConfig.monthsCount} شهراً
              </div>
            </div>
            <div className="px-3 py-2.5 rounded-xl bg-[#EAF3FC] border border-[#4A90D9]/30">
              <div className="text-[11px] text-[#123B70]">إجمالي الفرد السنوي</div>
              <div className="text-sm font-bold text-[#123B70] mt-0.5 tabular-nums">
                {formatCurrency(expectedAnnualPerMember)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Controls & Color Legend */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-[#748399] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالرقم التسلسلي أو الاسم أو المجموعة..."
              className="w-full h-10 pr-10 pl-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#2878C8]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 text-[#16A36A]">
              <span className="w-3 h-3 rounded bg-[#16A36A]/20 border border-[#16A36A]" />
              مسدد
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#DC5555]">
              <span className="w-3 h-3 rounded bg-[#DC5555]/20 border border-[#DC5555]" />
              متأخر
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#C67B1B]">
              <span className="w-3 h-3 rounded bg-[#E99A35]/20 border border-[#E99A35]" />
              مسدد جزئياً
            </span>
            <span className="inline-flex items-center gap-1.5 text-[#748399]">
              <span className="w-3 h-3 rounded bg-slate-200 border border-slate-300" />
              قادم
            </span>
          </div>
        </div>

        {/* Horizontally Scrollable Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[1280px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold text-[#748399]">
                <th className="py-3.5 px-3 text-center whitespace-nowrap">الرقم</th>
                <th className="py-3.5 px-4 sticky right-0 bg-[#F8FAFC] z-10 border-l border-slate-200/70 min-w-[160px]">
                  اسم العضو
                </th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">رسوم التأسيس</th>
                {ARABIC_MONTHS.map((m) => (
                  <th key={m} className="py-3.5 px-2 text-center whitespace-nowrap">
                    {m}
                  </th>
                ))}
                <th className="py-3.5 px-3 text-center whitespace-nowrap">المستحق</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">المدفوع</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">المتبقي</th>
                <th className="py-3.5 px-3 text-center whitespace-nowrap">الحالة</th>
                {canEdit && <th className="py-3.5 px-3 text-center whitespace-nowrap">تخصيص</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredMembers.map((member) => {
                const sub =
                  subscriptions.find(
                    (s) => s.memberId === member.id && s.year === selectedYear
                  ) ?? createDefaultSubscription(member.id, selectedYear);
                const totals = computeMemberYearTotals(sub, activeConfig);
                const isFutureUntouched =
                  isFutureScheduledYear(selectedYear) &&
                  toHalalas(totals.totalPaid) === 0 &&
                  !sub.months.some((m) => m === 'overdue' || m === 'partial');
                const yearStatusLabel =
                  toHalalas(totals.remaining) === 0 && toHalalas(totals.totalDue) > 0
                    ? 'مسدد'
                    : toHalalas(totals.totalPaid) > 0
                      ? 'مسدد جزئياً'
                      : isFutureUntouched
                        ? 'قادم'
                        : 'متأخر';

                return (
                  <tr key={member.id} className="hover:bg-[#F8FAFC]/80 group">
                    <td className="py-3 px-3 text-center font-bold text-[#748399] tabular-nums whitespace-nowrap">
                      #{member.serial}
                    </td>
                    <td className="py-3 px-4 sticky right-0 bg-white group-hover:bg-[#F8FAFC] z-10 border-l border-slate-200/70 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectMember(member.id)}
                        className="font-bold text-[#123B70] hover:text-[#2878C8] hover:underline cursor-pointer"
                      >
                        {member.name}
                      </button>
                      <div className="text-[10px] text-[#748399]">{member.groupName}</div>
                    </td>

                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md font-bold tabular-nums ${
                          sub.foundingStatus === 'paid'
                            ? 'bg-[#16A36A]/10 text-[#16A36A]'
                            : sub.foundingStatus === 'partial'
                              ? 'bg-[#E99A35]/15 text-[#C67B1B]'
                              : isFutureUntouched
                                ? 'bg-slate-100 text-[#748399]'
                                : 'bg-[#DC5555]/10 text-[#DC5555]'
                        }`}
                      >
                        {formatCurrency(totals.foundingPaid, '')}/{formatCurrency(activeConfig.foundingFee, '')}
                      </span>
                    </td>

                    {sub.months.map((status: MonthCellStatus, mIdx: number) => (
                      <td key={mIdx} className="py-3 px-1.5 text-center">
                        <MonthCellBadge
                          status={status}
                          paidAmt={totals.monthPaidAmounts[mIdx] ?? 0}
                          monthlyFee={activeConfig.monthlyFee}
                          disabled={!canEdit}
                          onClick={() => onToggleMonthStatus(member.id, selectedYear, mIdx)}
                        />
                      </td>
                    ))}

                    <td className="py-3 px-3 text-center font-bold text-[#172B45] tabular-nums whitespace-nowrap">
                      {formatCurrency(totals.totalDue)}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-[#16A36A] tabular-nums whitespace-nowrap">
                      {formatCurrency(totals.totalPaid)}
                    </td>
                    <td
                      className={`py-3 px-3 text-center font-bold tabular-nums whitespace-nowrap ${
                        totals.remaining > 0
                          ? isFutureUntouched
                            ? 'text-[#748399]'
                            : 'text-[#DC5555]'
                          : 'text-[#748399]'
                      }`}
                    >
                      {formatCurrency(totals.remaining)}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <StatusIndicator
                        label={yearStatusLabel}
                        tone={
                          yearStatusLabel === 'مسدد'
                            ? 'success'
                            : yearStatusLabel === 'مسدد جزئياً'
                              ? 'warning'
                              : yearStatusLabel === 'قادم'
                                ? 'neutral'
                                : 'danger'
                        }
                      />
                    </td>
                    {canEdit && (
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDetailEdit(member)}
                          className="p-1.5 rounded-lg text-[#2878C8] hover:bg-[#EAF3FC] transition-colors cursor-pointer"
                          title="تعديل المبالغ الجزئية للأشهر"
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Year Modal (Hijri & Gregorian support) */}
      <Modal
        isOpen={addYearOpen}
        onClose={() => setAddYearOpen(false)}
        title="إضافة سنة مالية جديدة"
        subtitle="تُقبل السنوات الهجرية (مثل 1447، 1448) أو الميلادية (مثل 2027) دون التأثير على السنوات السابقة"
        size="sm"
      >
        <form onSubmit={handleCreateYear} className="space-y-4">
          {yearError && (
            <div className="p-3 rounded-xl bg-[#DC5555]/10 border border-[#DC5555]/25 text-[#DC5555] text-xs font-semibold">
              {yearError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">
              السنة المالية (هـ أو م)
            </label>
            <input
              type="number"
              required
              min={1300}
              max={2200}
              value={newYear}
              onChange={(e) => setNewYear(Number(e.target.value) || 0)}
              placeholder="مثال: 1447 أو 2036"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">
              رسوم التأسيس السنوية لكل عضو (ر.س)
            </label>
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={newFoundingFee}
              onChange={(e) => setNewFoundingFee(Number(e.target.value) || 0)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">
              قيمة الاشتراك الشهري (ر.س)
            </label>
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={newMonthlyFee}
              onChange={(e) => setNewMonthlyFee(Number(e.target.value) || 0)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#EAF3FC] text-xs text-[#123B70] flex items-center justify-between">
            <span>إجمالي الاشتراك السنوي المتوقع للعضو:</span>
            <strong className="tabular-nums">
              {formatCurrency(
                roundCurrency(
                  (Number.isFinite(newFoundingFee) ? newFoundingFee : 0) +
                    (Number.isFinite(newMonthlyFee) ? newMonthlyFee : 0) * 12
                )
              )}
            </strong>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setAddYearOpen(false)}
              className="h-10 px-4 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
            >
              إضافة السنة
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Current Year Fees Modal */}
      <Modal
        isOpen={editYearOpen}
        onClose={() => setEditYearOpen(false)}
        title={`تعديل رسوم السنة المالية ${activeConfig.year}`}
        subtitle="التعديل يقتصر على هذه السنة فقط ولا يغيّر حسابات السنوات السابقة"
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onUpdateYearConfig({
              year: activeConfig.year,
              foundingFee: Math.max(0, editFoundingFee),
              monthlyFee: Math.max(0, editMonthlyFee),
              monthsCount: 12,
            });
            setEditYearOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">
              رسوم التأسيس السنوية (ر.س)
            </label>
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={editFoundingFee}
              onChange={(e) => setEditFoundingFee(Number(e.target.value) || 0)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">
              قيمة الاشتراك الشهري (ر.س)
            </label>
            <input
              type="number"
              required
              min={0}
              step="0.01"
              value={editMonthlyFee}
              onChange={(e) => setEditMonthlyFee(Number(e.target.value) || 0)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setEditYearOpen(false)}
              className="h-10 px-4 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
            >
              حفظ الرسوم
            </button>
          </div>
        </form>
      </Modal>

      {/* Detailed Partial Amounts Modal per Member-Year */}
      <Modal
        isOpen={Boolean(detailEditMember)}
        onClose={() => setDetailEditMember(null)}
        title={`تعديل تفاصيل اشتراك ${detailEditMember?.name ?? ''}`}
        subtitle={`السنة المالية ${selectedYear} — يمكن إدخال مبلغ جزئي دقيق لكل شهر أو لرسوم التأسيس`}
        size="lg"
      >
        {detailEditMember && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onUpdateSubscriptionDetails(
                detailEditMember.id,
                selectedYear,
                Math.min(activeConfig.foundingFee, Math.max(0, detailFoundingPaid)),
                detailMonthAmounts.map((v) =>
                  Math.min(activeConfig.monthlyFee, Math.max(0, roundCurrency(v)))
                )
              );
              setDetailEditMember(null);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                المدفوع من رسوم التأسيس (الحد الأقصى {formatCurrency(activeConfig.foundingFee)})
              </label>
              <input
                type="number"
                min={0}
                max={activeConfig.foundingFee}
                step="0.01"
                value={detailFoundingPaid}
                onChange={(e) => setDetailFoundingPaid(Number(e.target.value) || 0)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-2">
                المبالغ المدفوعة للأشهر (الحد الأقصى للشهر: {formatCurrency(activeConfig.monthlyFee)})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                {ARABIC_MONTHS.map((m, idx) => (
                  <div key={m} className="p-2.5 rounded-xl bg-[#F8FAFC] border border-slate-200">
                    <div className="text-[11px] font-bold text-[#172B45] mb-1">{m}</div>
                    <input
                      type="number"
                      min={0}
                      max={activeConfig.monthlyFee}
                      step="0.01"
                      value={detailMonthAmounts[idx] ?? 0}
                      onChange={(e) => {
                        const next = [...detailMonthAmounts];
                        next[idx] = Number(e.target.value) || 0;
                        setDetailMonthAmounts(next);
                      }}
                      className="w-full h-9 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold tabular-nums focus:outline-none focus:border-[#2878C8]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDetailEditMember(null)}
                className="h-10 px-4 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="h-10 px-5 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
              >
                اعتماد المبالغ
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
