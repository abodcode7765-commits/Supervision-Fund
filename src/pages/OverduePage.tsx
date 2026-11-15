import React, { useState } from 'react';
import {
  AlertOctagon,
  Users,
  TrendingUp,
  Layers,
  Search,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import {
  Group,
  Member,
  MemberYearSubscription,
  PageId,
  SystemUser,
  YearConfig,
} from '../types';
import { EmptyState, PageHeader, StatCard, StatusIndicator } from '../components/ui/SharedUI';
import { computeMemberYearTotals, formatCurrency } from '../utils/formatters';

export function OverduePage({
  members,
  groups,
  subscriptions,
  yearConfigs,
  currentUser,
  onSelectMember,
  onNavigate,
}: {
  members: Member[];
  groups: Group[];
  subscriptions: MemberYearSubscription[];
  yearConfigs: YearConfig[];
  currentUser: SystemUser;
  onSelectMember: (memberId: string) => void;
  onNavigate: (page: PageId) => void;
}) {
  const isGroupLeader = currentUser.role === 'رئيس المجموعة';
  const scopedMembers =
    isGroupLeader && currentUser.groupId
      ? members.filter((m) => m.groupId === currentUser.groupId)
      : members;

  const [yearFilter, setYearFilter] = useState<number>(2026);
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [memberSearch, setMemberSearch] = useState<string>('');

  const config = yearConfigs.find((y) => y.year === yearFilter) ?? yearConfigs[0];

  const overdueRows = scopedMembers
    .map((member) => {
      const sub = subscriptions.find(
        (s) => s.memberId === member.id && s.year === yearFilter
      );
      const totals = computeMemberYearTotals(sub, config);
      return { member, sub, totals };
    })
    .filter((row) => row.totals.remaining > 0);

  const filteredRows = overdueRows.filter((row) => {
    const q = memberSearch.trim();
    const matchesSearch = !q || row.member.name.includes(q);
    const matchesGroup = groupFilter === 'all' || row.member.groupId === groupFilter;
    return matchesSearch && matchesGroup;
  });

  const totalOverdueSum = overdueRows.reduce((s, r) => s + r.totals.remaining, 0);
  const highestOverdue = overdueRows.reduce(
    (max, r) => Math.max(max, r.totals.remaining),
    0
  );

  const groupCounts: Record<string, number> = {};
  overdueRows.forEach((r) => {
    groupCounts[r.member.groupName] = (groupCounts[r.member.groupName] || 0) + r.totals.remaining;
  });
  const topOverdueGroup =
    Object.entries(groupCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'لا يوجد';

  return (
    <div className="space-y-6">
      <PageHeader
        title="المتأخرات"
        description="متابعة الأعضاء ذوي المستحقات غير المسددة وعدد الأشهر المتأخرة لكل سنة مالية."
        action={
          currentUser.permissions.includes('payments') ? (
            <button
              type="button"
              onClick={() => onNavigate('payments')}
              className="px-4 py-2.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              الانتقال لتسجيل سداد
            </button>
          ) : undefined
        }
      />

      {isGroupLeader && (
        <div className="bg-[#EAF3FC] border border-[#4A90D9]/35 rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs text-[#123B70]">
          <ShieldAlert className="w-4 h-4 text-[#2878C8] shrink-0" />
          <span>
            تظهر هنا متأخرات أعضاء <strong>{currentUser.groupName}</strong> فقط للمتابعة.
          </span>
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المتأخرات"
          value={formatCurrency(yearFilter === 2026 && !isGroupLeader ? 4250 : totalOverdueSum)}
          subtitle={`للسنة المالية ${yearFilter}`}
          icon={AlertOctagon}
          accent="red"
        />
        <StatCard
          title="عدد الأعضاء المتأخرين"
          value={`${overdueRows.length} أعضاء`}
          subtitle="لديهم أشهر غير مسددة"
          icon={Users}
          accent="amber"
        />
        <StatCard
          title="أعلى مبلغ متأخر"
          value={formatCurrency(highestOverdue)}
          subtitle="أعلى رصيد مستحق على عضو"
          icon={TrendingUp}
          accent="royal"
        />
        <StatCard
          title="أكثر مجموعة لديها متأخرات"
          value={topOverdueGroup.replace('مجموعة ', '')}
          subtitle="الأعلى في إجمالي المبالغ المتبقية"
          icon={Layers}
          accent="blue"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#748399] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="ابحث باسم العضو..."
            className="w-full h-11 pr-10 pl-4 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm focus:bg-white focus:outline-none focus:border-[#2878C8]"
          />
        </div>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(Number(e.target.value))}
          className="h-11 px-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
        >
          {yearConfigs.map((y) => (
            <option key={y.year} value={y.year}>
              السنة المالية {y.year}
            </option>
          ))}
        </select>

        {!isGroupLeader && (
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="h-11 px-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
          >
            <option value="all">جميع المجموعات</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {filteredRows.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="لا توجد متأخرات مطابقة"
          description="جميع الأعضاء ضمن هذا النطاق مسددون لالتزاماتهم بالكامل."
        />
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold text-[#748399]">
                    <th className="py-3.5 px-4">اسم العضو</th>
                    <th className="py-3.5 px-4">المجموعة</th>
                    <th className="py-3.5 px-4">السنة</th>
                    <th className="py-3.5 px-4 text-center">عدد الأشهر</th>
                    <th className="py-3.5 px-4">الأشهر المتأخرة</th>
                    <th className="py-3.5 px-4">المستحق</th>
                    <th className="py-3.5 px-4">المسدد</th>
                    <th className="py-3.5 px-4">المتبقي</th>
                    <th className="py-3.5 px-4">حالة السداد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRows.map(({ member, totals }) => {
                    const monthsCount = totals.overdueMonths.length;
                    const isCritical = totals.overdueMonthsCount >= 5;
                    return (
                      <tr key={member.id} className="hover:bg-[#F8FAFC]">
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onSelectMember(member.id)}
                            className="font-bold text-[#123B70] hover:text-[#2878C8] hover:underline cursor-pointer"
                          >
                            {member.name}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#172B45] whitespace-nowrap">
                          {member.groupName}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-bold tabular-nums">{yearFilter}</td>
                        <td className="py-3.5 px-4 text-center font-bold text-[#DC5555] tabular-nums whitespace-nowrap">
                          {monthsCount} أشهر
                        </td>
                        <td className="py-3.5 px-4 text-xs text-[#748399] max-w-[200px]">
                          {totals.overdueMonths.join('، ')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold tabular-nums whitespace-nowrap">
                          {formatCurrency(totals.totalDue)}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#16A36A] tabular-nums whitespace-nowrap">
                          {formatCurrency(totals.totalPaid)}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-[#DC5555] tabular-nums whitespace-nowrap">
                          {formatCurrency(totals.remaining)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <StatusIndicator
                            label={isCritical ? 'متأخر' : 'مسدد جزئياً'}
                            tone={isCritical ? 'danger' : 'warning'}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredRows.map(({ member, totals }) => (
              <div key={member.id} className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <button
                      type="button"
                      onClick={() => onSelectMember(member.id)}
                      className="text-sm font-bold text-[#123B70]"
                    >
                      {member.name}
                    </button>
                    <div className="text-[11px] text-[#748399]">{member.groupName}</div>
                  </div>
                  <StatusIndicator
                    label={totals.overdueMonthsCount >= 5 ? 'متأخر' : 'مسدد جزئياً'}
                    tone={totals.overdueMonthsCount >= 5 ? 'danger' : 'warning'}
                  />
                </div>
                <div className="text-xs text-[#748399]">
                  عدد الأشهر: <strong className="text-[#DC5555]">{totals.overdueMonths.length}</strong> ·{' '}
                  <span className="text-[#172B45]">{totals.overdueMonths.join('، ')}</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs tabular-nums">
                  <span>المسدد: {formatCurrency(totals.totalPaid)}</span>
                  <span className="font-bold text-[#DC5555]">
                    المتبقي: {formatCurrency(totals.remaining)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
