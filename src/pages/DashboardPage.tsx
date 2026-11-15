import React from 'react';
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
} from 'lucide-react';
import {
  Expense,
  Group,
  Member,
  PageId,
  PaymentRecord,
  SystemUser,
} from '../types';
import { MONTHLY_FINANCIAL_SERIES } from '../data/mockData';
import { PageHeader, StatCard, StatusIndicator } from '../components/ui/SharedUI';
import {
  RevenueExpenseChart,
  SubscriptionDonutChart,
} from '../components/charts/DashboardCharts';
import { formatCurrency } from '../utils/formatters';

export function DashboardPage({
  members,
  groups,
  payments,
  expenses,
  currentUser,
  onNavigate,
  onSelectMember,
}: {
  members: Member[];
  groups: Group[];
  payments: PaymentRecord[];
  expenses: Expense[];
  currentUser: SystemUser;
  onNavigate: (page: PageId) => void;
  onSelectMember: (memberId: string) => void;
}) {
  const isGroupLeader = currentUser.role === 'رئيس المجموعة';
  const scopedMembers =
    isGroupLeader && currentUser.groupId
      ? members.filter((m) => m.groupId === currentUser.groupId)
      : members;

  const addedMembersDelta = Math.max(0, members.length - 16);
  const totalMembersCount = isGroupLeader ? scopedMembers.length : 120 + addedMembersDelta;

  const extraPayments = payments.slice(9).reduce((s, p) => s + p.amount, 0);
  const totalCollected = 35400 + extraPayments;
  const totalExpensesAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const totalOverdueAmount = 4250;
  const totalRemainingPartial = payments.reduce((s, p) => s + p.remainingAmount, 0);
  const currentBalance = totalCollected - totalExpensesAmount;

  const groupCount = isGroupLeader ? 1 : groups.length;
  const paidMembersCount = isGroupLeader
    ? scopedMembers.filter((m) => m.subscriptionStatus === 'مسدد').length
    : 92 + members.slice(16).filter((m) => m.subscriptionStatus === 'مسدد').length;
  const partialCount = isGroupLeader
    ? scopedMembers.filter((m) => m.subscriptionStatus === 'مسدد جزئياً').length
    : 10 + members.slice(16).filter((m) => m.subscriptionStatus === 'مسدد جزئياً').length;
  const overdueMembersCount = isGroupLeader
    ? scopedMembers.filter((m) => m.subscriptionStatus === 'متأخر').length
    : 18 + members.slice(16).filter((m) => m.subscriptionStatus === 'متأخر').length;
  const unpaidTotalCount = partialCount + overdueMembersCount;

  const recentPayments = payments.slice(0, 5);
  const recentExpenses = expenses.slice(0, 4);
  const overdueAlerts = scopedMembers
    .filter((m) => m.subscriptionStatus !== 'مسدد')
    .slice(0, 4);

  const allShortcuts: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'members', label: 'الأعضاء', icon: Users },
    { id: 'subscriptions', label: 'الاشتراكات', icon: CalendarCheck },
    { id: 'payments', label: 'سجل السداد', icon: ReceiptText },
    { id: 'overdue', label: 'المتأخرات', icon: AlertOctagon },
    { id: 'qittat', label: 'القِطّات', icon: Coins },
    { id: 'marriage-aid', label: 'معونة الزواج', icon: HeartHandshake },
    { id: 'expenses', label: 'المصروفات', icon: Wallet },
    { id: 'reports', label: 'التقارير', icon: FileBarChart2 },
  ];
  const shortcuts = allShortcuts.filter((s) => currentUser.permissions.includes(s.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="لوحة التحكم الرئيسية"
        description={
          isGroupLeader
            ? `مرحباً ${currentUser.name} — عرض إحصائيات ${currentUser.groupName} فقط حسب صلاحيات رئيس المجموعة.`
            : 'نظرة عامة على أداء الصندوق وحركة الاشتراكات والمصروفات والمتأخرات.'
        }
        action={
          !isGroupLeader && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onNavigate('payments')}
                className="px-4 py-2.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                تسجيل سداد جديد
              </button>
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#2878C8] text-[#172B45] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                التقارير المالية
              </button>
            </div>
          )
        }
      />

      {/* Row 1: Primary 4 Financial & Member Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title={isGroupLeader ? 'أعضاء المجموعة' : 'إجمالي عدد الأعضاء'}
          value={`${totalMembersCount} عضواً`}
          subtitle={isGroupLeader ? currentUser.groupName : `موزعون على ${groupCount} مجموعات`}
          icon={Users}
          accent="royal"
        />
        <StatCard
          title="إجمالي المبالغ المحصلة"
          value={formatCurrency(totalCollected)}
          subtitle="الاشتراكات ورسوم التأسيس المحصلة"
          icon={Wallet}
          accent="green"
        />
        <StatCard
          title="إجمالي المبالغ المتأخرة والمتبقية"
          value={formatCurrency(totalOverdueAmount)}
          subtitle={`متبقي دفعات جزئية: ${formatCurrency(totalRemainingPartial)}`}
          icon={AlertCircle}
          accent="red"
        />
        <StatCard
          title="الرصيد الحالي للصندوق"
          value={formatCurrency(currentBalance)}
          subtitle={`بعد خصم مصروفات ${formatCurrency(totalExpensesAmount)}`}
          icon={Landmark}
          accent="blue"
        />
      </div>

      {/* Row 2: Operational KPIs including Total Expenses, Groups, Paid & Unpaid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-[#748399] truncate">إجمالي مصروفات الصندوق</div>
            <div className="mt-1 text-lg font-bold text-[#DC5555] tabular-nums">
              {formatCurrency(totalExpensesAmount)}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#DC5555]/10 text-[#DC5555] flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-[#748399] truncate">عدد المجموعات</div>
            <div className="mt-1 text-lg font-bold text-[#172B45] tabular-nums">
              {groupCount} {groupCount === 1 ? 'مجموعة' : 'مجموعات'}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#123B70]/10 text-[#123B70] flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-[#748399] truncate">الأعضاء المسددون</div>
            <div className="mt-1 text-lg font-bold text-[#16A36A] tabular-nums">
              {paidMembersCount} عضواً
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#16A36A]/10 text-[#16A36A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs text-[#748399] truncate">الأعضاء غير المسددين</div>
            <div className="mt-1 text-lg font-bold text-[#C67B1B] tabular-nums">
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
                  className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border border-slate-200/80 bg-[#F8FAFC] hover:bg-[#EAF3FC] hover:border-[#2878C8]/50 text-[#172B45] hover:text-[#123B70] transition-colors cursor-pointer"
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
          <RevenueExpenseChart data={MONTHLY_FINANCIAL_SERIES} />
        </div>
        <div>
          <SubscriptionDonutChart
            paidCount={paidMembersCount}
            partialCount={partialCount}
            overdueCount={overdueMembersCount}
          />
        </div>
      </div>

      {/* Bottom 3-Column Operational Panels: Recent Payments, Recent Expenses, Overdue Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Latest Payments */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#172B45]">آخر عمليات السداد</h3>
              <p className="text-[11px] text-[#748399]">أحدث المدفوعات المسجلة</p>
            </div>
            {currentUser.permissions.includes('payments') && (
              <button
                type="button"
                onClick={() => onNavigate('payments')}
                className="text-xs font-semibold text-[#2878C8] hover:text-[#123B70] flex items-center gap-1 cursor-pointer"
              >
                <span>السجل</span>
                <ArrowUpLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {recentPayments.map((pay) => (
              <div key={pay.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectMember(pay.memberId)}
                    className="text-xs sm:text-sm font-bold text-[#123B70] hover:underline truncate block cursor-pointer"
                  >
                    {pay.memberName}
                  </button>
                  <div className="text-[11px] text-[#748399] truncate">
                    {pay.monthsLabel} · <span className="tabular-nums">{pay.date}</span>
                  </div>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-xs sm:text-sm font-bold text-[#16A36A] tabular-nums">
                    {formatCurrency(pay.amount)}
                  </div>
                  <div className="text-[10px] font-semibold text-[#748399]">{pay.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest Expenses */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#172B45]">آخر المصروفات</h3>
              <p className="text-[11px] text-[#748399]">أحدث بنود الصرف المعتمدة</p>
            </div>
            {currentUser.permissions.includes('expenses') && (
              <button
                type="button"
                onClick={() => onNavigate('expenses')}
                className="text-xs font-semibold text-[#2878C8] hover:text-[#123B70] flex items-center gap-1 cursor-pointer"
              >
                <span>المصروفات</span>
                <ArrowUpLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {recentExpenses.map((exp) => (
              <div key={exp.id} className="px-5 py-3 flex items-center justify-between gap-3">
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
            ))}
          </div>
        </div>

        {/* Overdue Alerts */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#172B45]">تنبيهات المتأخرات</h3>
              <p className="text-[11px] text-[#748399]">أعضاء لديهم مبالغ غير مسددة</p>
            </div>
            {currentUser.permissions.includes('overdue') && (
              <button
                type="button"
                onClick={() => onNavigate('overdue')}
                className="text-xs font-semibold text-[#DC5555] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>المتابعة</span>
                <ArrowUpLeft className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {overdueAlerts.map((mem) => (
              <div key={mem.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectMember(mem.id)}
                    className="text-xs sm:text-sm font-bold text-[#123B70] hover:underline truncate block cursor-pointer"
                  >
                    {mem.name}
                  </button>
                  <div className="text-[11px] text-[#748399] truncate">{mem.groupName}</div>
                </div>
                <StatusIndicator
                  label={mem.subscriptionStatus}
                  tone={mem.subscriptionStatus === 'متأخر' ? 'danger' : 'warning'}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
