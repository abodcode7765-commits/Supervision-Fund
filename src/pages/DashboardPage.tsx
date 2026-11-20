import React, { useState } from 'react';
import {
  Users,
  Wallet,
  AlertCircle,
  Landmark,
  Layers,
  CheckCircle2,
  Clock,
  ArrowUpLeft,
  ArrowDownLeft,
  ReceiptText,
  Coins,
  HeartHandshake,
  FileBarChart2,
  CalendarCheck,
  AlertOctagon,
  UserPlus,
  ClipboardList,
} from 'lucide-react';
import {
  Expense,
  Group,
  Member,
  MemberYearSubscription,
  PageId,
  PaymentRecord,
  SystemUser,
  YearConfig,
} from '../types';
import { PageHeader, StatCard, StatusIndicator } from '../components/ui/SharedUI';
import {
  RevenueExpenseChart,
  SubscriptionDonutChart,
} from '../components/charts/DashboardCharts';
import {
  addCurrency,
  buildMonthlyFinancialSeries,
  computeMemberYearTotals,
  createDefaultSubscription,
  formatCurrency,
  getDefaultActiveYear,
  isFutureScheduledYear,
  isSubscriptionRowOverdue,
  subtractCurrency,
  toHalalas,
} from '../utils/formatters';

export function DashboardPage({
  members,
  groups,
  yearConfigs,
  subscriptions,
  payments,
  expenses,
  currentUser,
  onNavigate,
  onSelectMember,
}: {
  members: Member[];
  groups: Group[];
  yearConfigs: YearConfig[];
  subscriptions: MemberYearSubscription[];
  payments: PaymentRecord[];
  expenses: Expense[];
  currentUser: SystemUser;
  onNavigate: (page: PageId) => void;
  onSelectMember: (memberId: string) => void;
}) {
  const isGroupLeader = currentUser.role === 'رئيس المجموعة';
  const [selectedYear, setSelectedYear] = useState<number>(() =>
    getDefaultActiveYear(yearConfigs)
  );
  const activeConfig = yearConfigs.find((y) => y.year === selectedYear) ?? yearConfigs[0];
  const isSelectedFutureYear = isFutureScheduledYear(selectedYear);

  const scopedMembers =
    isGroupLeader && currentUser.groupId
      ? members.filter((m) => m.groupId === currentUser.groupId)
      : members;

  const scopedMemberIds = new Set(scopedMembers.map((m) => m.id));
  const scopedPayments = isGroupLeader
    ? payments.filter((p) => scopedMemberIds.has(p.memberId))
    : payments;

  // Dynamic subscription calculations for selectedYear
  let totalDueYear = 0;
  let totalCollectedSubsYear = 0;
  let totalOverdueYear = 0;
  let paidMembersCount = 0;
  let partialCount = 0;
  let overdueMembersCount = 0;

  const memberYearRows = scopedMembers.map((m) => {
    const sub =
      subscriptions.find((s) => s.memberId === m.id && s.year === selectedYear) ??
      (activeConfig ? createDefaultSubscription(m.id, activeConfig.year) : undefined);
    const totals = computeMemberYearTotals(sub, activeConfig);
    totalDueYear = addCurrency(totalDueYear, totals.totalDue);
    totalCollectedSubsYear = addCurrency(totalCollectedSubsYear, totals.totalPaid);
    if (isSubscriptionRowOverdue(sub, totals, selectedYear)) {
      totalOverdueYear = addCurrency(totalOverdueYear, totals.remaining);
    }

    if (sub && activeConfig) {
      if (toHalalas(totals.remaining) === 0 && toHalalas(totals.totalDue) > 0) {
        paidMembersCount += 1;
      } else if (toHalalas(totals.totalPaid) > 0) {
        partialCount += 1;
      } else if (isSubscriptionRowOverdue(sub, totals, selectedYear)) {
        overdueMembersCount += 1;
      }
    }
    return { member: m, sub, totals };
  });

  // Fund-wide cumulative balance (admin only)
  const totalAllYearsRevenue = addCurrency(...payments.map((p) => p.amount));
  const totalAllYearsExpenses = addCurrency(...expenses.map((e) => e.amount));
  const currentFundBalance = subtractCurrency(totalAllYearsRevenue, totalAllYearsExpenses);

  const yearPaymentsSum = addCurrency(
    ...scopedPayments.filter((p) => p.year === selectedYear).map((p) => p.amount)
  );
  // Show real payments sum for selected year (or subscription paid if no separate payment breakdown exists in legacy year)
  const displayCollectedYear =
    yearPaymentsSum > 0 ? yearPaymentsSum : totalCollectedSubsYear;

  const unpaidTotalCount = partialCount + overdueMembersCount;

  const recentPayments = [...scopedPayments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const recentExpenses = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const overdueAlerts = memberYearRows
    .filter((r) => isSubscriptionRowOverdue(r.sub, r.totals, selectedYear))
    .sort((a, b) => b.totals.remaining - a.totals.remaining)
    .slice(0, 5);
  const recentlyAddedMembers = [...scopedMembers]
    .sort((a, b) => {
      const dateCmp = b.joinDate.localeCompare(a.joinDate);
      return dateCmp !== 0 ? dateCmp : b.serial - a.serial;
    })
    .slice(0, 5);

  const monthlySeries = buildMonthlyFinancialSeries(
    scopedPayments,
    isGroupLeader ? [] : expenses,
    selectedYear
  );

  const allShortcuts: {
    id: PageId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'members', label: 'الأعضاء', icon: Users },
    { id: 'subscriptions', label: 'الاشتراكات', icon: CalendarCheck },
    { id: 'payments', label: 'سجل السداد', icon: ReceiptText },
    { id: 'overdue', label: 'المتأخرات', icon: AlertOctagon },
    { id: 'qittat', label: 'القطات', icon: Coins },
    { id: 'marriage-aid', label: 'معونة الزواج', icon: HeartHandshake },
    { id: 'expenses', label: 'المصروفات', icon: Wallet },
    { id: 'reports', label: 'التقارير', icon: FileBarChart2 },
  ];
  const shortcuts = allShortcuts.filter((s) => currentUser.permissions.includes(s.id));

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="لوحة التحكم الرئيسية"
        description={
          isGroupLeader
            ? `مرحباً ${currentUser.name} — عرض إحصائيات ${currentUser.groupName} فقط حسب صلاحيات رئيس المجموعة.`
            : 'نظرة عامة على أداء الصندوق وحركة الاشتراكات والمصروفات والمتأخرات من البيانات الفعلية.'
        }
        action={
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-[#123B70] focus:outline-none focus:border-[#2878C8]"
              aria-label="السنة المالية في لوحة التحكم"
            >
              {yearConfigs.map((y) => (
                <option key={y.year} value={y.year}>
                  السنة المالية {y.year}
                </option>
              ))}
            </select>
            {!isGroupLeader && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigate('payments')}
                  className="h-10 px-3.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  تسجيل سداد جديد
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('reports')}
                  className="h-10 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-[#2878C8] text-[#172B45] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  التقارير المالية
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Row 1: Primary 4 Financial & Member Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title={isGroupLeader ? 'أعضاء المجموعة' : 'إجمالي عدد الأعضاء'}
          value={`${scopedMembers.length} عضواً`}
          subtitle={isGroupLeader ? currentUser.groupName : `موزعون على ${groups.length} مجموعات`}
          icon={Users}
          accent="royal"
        />
        <StatCard
          title={`الاشتراكات المطلوبة (${selectedYear})`}
          value={formatCurrency(totalDueYear)}
          subtitle={`بمعدل ${formatCurrency(
            activeConfig ? activeConfig.foundingFee + activeConfig.monthlyFee * activeConfig.monthsCount : 0
          )} للعضو`}
          icon={ClipboardList}
          accent="blue"
        />
        <StatCard
          title={`المبالغ المحصلة (${selectedYear})`}
          value={formatCurrency(displayCollectedYear)}
          subtitle="الاشتراكات ورسوم التأسيس المحصلة"
          icon={Wallet}
          accent="green"
        />
        <StatCard
          title={
            isSelectedFutureYear
              ? `المتأخرات المستحقة (${selectedYear})`
              : `إجمالي المتأخرات (${selectedYear})`
          }
          value={formatCurrency(totalOverdueYear)}
          subtitle={
            isSelectedFutureYear && unpaidTotalCount === 0
              ? 'سنة مستقبلية مجدولة بدون متأخرات'
              : `على ${unpaidTotalCount} عضو لديهم مستحقات`
          }
          icon={AlertCircle}
          accent="red"
        />
      </div>

      {/* Row 2: Operational KPIs (Uniform Card Height on Mobile & Desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {!isGroupLeader ? (
          <>
            <div className="h-full bg-white rounded-xl border border-slate-200/80 p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs text-[#748399] truncate">
                  الرصيد الحالي للصندوق
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold text-[#123B70] tabular-nums">
                  {formatCurrency(currentFundBalance)}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#EAF3FC] text-[#2878C8] flex items-center justify-center shrink-0">
                <Landmark className="w-4 h-4" />
              </div>
            </div>

            <div className="h-full bg-white rounded-xl border border-slate-200/80 p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs text-[#748399] truncate">
                  إجمالي مصروفات الصندوق
                </div>
                <div className="mt-1 text-base sm:text-lg font-bold text-[#DC5555] tabular-nums">
                  {formatCurrency(totalAllYearsExpenses)}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#DC5555]/10 text-[#DC5555] flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="h-full bg-white rounded-xl border border-slate-200/80 p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs text-[#748399] truncate">المجموعة</div>
                <div className="mt-1 text-sm sm:text-base font-bold text-[#123B70] truncate">
                  {currentUser.groupName}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#123B70]/10 text-[#123B70] flex items-center justify-center shrink-0">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            <div className="h-full bg-white rounded-xl border border-slate-200/80 p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="text-[11px] sm:text-xs text-[#748399] truncate">نسبة التحصيل</div>
                <div className="mt-1 text-base sm:text-lg font-bold text-[#2878C8] tabular-nums">
                  {totalDueYear > 0
                    ? `${Math.round((totalCollectedSubsYear / totalDueYear) * 100)}%`
                    : '0%'}
                </div>
              </div>
              <div className="w-9 h-9 rounded-lg bg-[#EAF3FC] text-[#2878C8] flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
          </>
        )}

        <div className="h-full bg-white rounded-xl border border-slate-200/80 p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2.5">
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-[#748399] truncate">الأعضاء المسددون</div>
            <div className="mt-1 text-base sm:text-lg font-bold text-[#16A36A] tabular-nums">
              {paidMembersCount} عضواً
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#16A36A]/10 text-[#16A36A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="h-full bg-white rounded-xl border border-slate-200/80 p-3.5 sm:px-4 sm:py-3.5 flex items-center justify-between gap-2.5">
          <div className="min-w-0">
            <div className="text-[11px] sm:text-xs text-[#748399] truncate">غير المسددين</div>
            <div className="mt-1 text-base sm:text-lg font-bold text-[#C67B1B] tabular-nums">
              {unpaidTotalCount} عضواً
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#E99A35]/14 text-[#C67B1B] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Quick Shortcuts Strip */}
      {shortcuts.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(18,59,112,0.04)]">
          <div className="text-xs font-bold text-[#748399] mb-3">اختصارات الأقسام المهمة</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
            {shortcuts.map((sc) => {
              const Icon = sc.icon;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => onNavigate(sc.id)}
                  className="h-full min-h-[72px] flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border border-slate-200/80 bg-[#F8FAFC] hover:bg-[#EAF3FC] hover:border-[#2878C8]/50 text-[#172B45] hover:text-[#123B70] transition-colors cursor-pointer"
                >
                  <Icon className="w-5 h-5 text-[#2878C8]" />
                  <span className="text-xs font-semibold whitespace-nowrap">{sc.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <RevenueExpenseChart data={monthlySeries} year={selectedYear} />
        </div>
        <div>
          <SubscriptionDonutChart
            paidCount={paidMembersCount}
            partialCount={partialCount}
            overdueCount={overdueMembersCount}
            year={selectedYear}
          />
        </div>
      </div>

      {/* Bottom Operational Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* Latest Payments (Scoped) */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden flex flex-col">
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#172B45]">آخر عمليات السداد</h3>
              <p className="text-[11px] text-[#748399]">أحدث المدفوعات المسجلة</p>
            </div>
            {currentUser.permissions.includes('payments') && (
              <button
                type="button"
                onClick={() => onNavigate('payments')}
                className="text-xs font-semibold text-[#2878C8] hover:text-[#123B70] flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>السجل</span>
                <ArrowUpLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {recentPayments.length === 0 ? (
              <div className="p-5 text-center text-xs text-[#748399]">
                لا توجد عمليات سداد مسجلة حالياً.
              </div>
            ) : (
              recentPayments.map((pay) => (
                <div key={pay.id} className="px-4 py-3 flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectMember(pay.memberId)}
                      className="text-xs sm:text-sm font-bold text-[#123B70] hover:underline truncate block cursor-pointer"
                    >
                      {pay.memberName}
                    </button>
                    <div className="text-[11px] text-[#748399] truncate">
                      {pay.year} · <span className="tabular-nums">{pay.date}</span>
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-xs sm:text-sm font-bold text-[#16A36A] tabular-nums">
                      {formatCurrency(pay.amount)}
                    </div>
                    <div className="text-[10px] font-semibold text-[#748399]">{pay.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Latest Expenses (Admin) OR Group Subscription Info */}
        {!isGroupLeader && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden flex flex-col">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-[#172B45]">آخر المصروفات</h3>
                <p className="text-[11px] text-[#748399]">أحدث بنود الصرف المعتمدة</p>
              </div>
              {currentUser.permissions.includes('expenses') && (
                <button
                  type="button"
                  onClick={() => onNavigate('expenses')}
                  className="text-xs font-semibold text-[#2878C8] hover:text-[#123B70] flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <span>المصروفات</span>
                  <ArrowUpLeft className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="divide-y divide-slate-100 flex-1">
              {recentExpenses.length === 0 ? (
                <div className="p-5 text-center text-xs text-[#748399]">لا توجد مصروفات مسجلة.</div>
              ) : (
                recentExpenses.map((exp) => (
                  <div key={exp.id} className="px-4 py-3 flex items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-bold text-[#172B45] truncate">
                        {exp.title}
                      </div>
                      <div className="text-[11px] text-[#748399] truncate">
                        {exp.category} · <span className="tabular-nums">{exp.date}</span>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-[#DC5555] tabular-nums shrink-0">
                      -{formatCurrency(exp.amount)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Overdue Alerts */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden flex flex-col">
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#172B45]">تنبيهات المتأخرات ({selectedYear})</h3>
              <p className="text-[11px] text-[#748399]">أعضاء لديهم مبالغ غير مسددة</p>
            </div>
            {currentUser.permissions.includes('overdue') && (
              <button
                type="button"
                onClick={() => onNavigate('overdue')}
                className="text-xs font-semibold text-[#DC5555] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>المتابعة</span>
                <ArrowUpLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {overdueAlerts.length === 0 ? (
              <div className="p-5 text-center text-xs text-[#16A36A] font-semibold">
                {isSelectedFutureYear
                  ? `لا توجد متأخرات مستحقة لسنة ${selectedYear} (سنة مستقبلية مجدولة).`
                  : `جميع الأعضاء مسددون لسنة ${selectedYear}.`}
              </div>
            ) : (
              overdueAlerts.map(({ member, totals }) => (
                <div key={member.id} className="px-4 py-3 flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectMember(member.id)}
                      className="text-xs sm:text-sm font-bold text-[#123B70] hover:underline truncate block cursor-pointer"
                    >
                      {member.name}
                    </button>
                    <div className="text-[11px] text-[#748399] truncate">{member.groupName}</div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-xs font-bold text-[#DC5555] tabular-nums">
                      {formatCurrency(totals.remaining)}
                    </div>
                    <div className="text-[10px] text-[#748399]">متبقي</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recently Added Members */}
        <div
          className={`bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden flex flex-col ${
            isGroupLeader ? 'md:col-span-2 xl:col-span-2' : ''
          }`}
        >
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <UserPlus className="w-4 h-4 text-[#2878C8] shrink-0" />
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#172B45] truncate">
                  آخر الأعضاء المضافين حديثاً
                </h3>
                <p className="text-[11px] text-[#748399] truncate">الأحدث انضماماً حسب التاريخ</p>
              </div>
            </div>
            {currentUser.permissions.includes('members') && (
              <button
                type="button"
                onClick={() => onNavigate('members')}
                className="text-xs font-semibold text-[#2878C8] hover:text-[#123B70] flex items-center gap-1 cursor-pointer shrink-0"
              >
                <span>الأعضاء</span>
                <ArrowUpLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {recentlyAddedMembers.map((mem) => (
              <div key={mem.id} className="px-4 py-3 flex items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectMember(mem.id)}
                    className="text-xs sm:text-sm font-bold text-[#123B70] hover:underline truncate block cursor-pointer"
                  >
                    {mem.name}
                  </button>
                  <div className="text-[11px] text-[#748399] truncate">
                    {mem.groupName} · <span className="tabular-nums">{mem.nationalId}</span>
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <StatusIndicator label={mem.joinDate} tone="info" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
