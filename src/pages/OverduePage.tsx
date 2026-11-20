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
import {
  addCurrency,
  computeMemberYearTotals,
  formatCurrency,
  isSubscriptionRowOverdue,
  toHalalas,
} from '../utils/formatters';

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

  const [yearFilter, setYearFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [memberSearch, setMemberSearch] = useState<string>('');

  // Build per-(member, year) overdue records so arrears in older years (e.g. 1447) NEVER merge or disappear
  const allOverdueRows = scopedMembers.flatMap((member) => {
    const memberSubs = subscriptions.filter((s) => s.memberId === member.id);
    return memberSubs
      .map((sub) => {
        const cfg = yearConfigs.find((y) => y.year === sub.year);
        const totals = computeMemberYearTotals(sub, cfg);
        const statusLabel =
          toHalalas(totals.totalPaid) > 0 ? ('مسدد جزئياً' as const) : ('متأخر' as const);
        return { member, year: sub.year, sub, totals, statusLabel };
      })
      .filter((row) => isSubscriptionRowOverdue(row.sub, row.totals, row.year));
  });

  const filteredRows = allOverdueRows
    .filter((row) => {
      const q = memberSearch.trim();
      const matchesSearch =
        !q ||
        row.member.name.includes(q) ||
        row.member.nationalId.includes(q) ||
        row.member.groupName.includes(q);
      const matchesYear = yearFilter === 'all' || String(row.year) === yearFilter;
      const matchesGroup = groupFilter === 'all' || row.member.groupId === groupFilter;
      const matchesStatus = statusFilter === 'all' || row.statusLabel === statusFilter;
      return matchesSearch && matchesYear && matchesGroup && matchesStatus;
    })
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.totals.remaining - a.totals.remaining;
    });

  const totalOverdueSum = addCurrency(...filteredRows.map((r) => r.totals.remaining));
  const uniqueOverdueMembers = new Set(filteredRows.map((r) => r.member.id)).size;
  const highestOverdue = filteredRows.reduce(
    (max, r) => Math.max(max, r.totals.remaining),
    0
  );

  const groupCounts: Record<string, number> = {};
  filteredRows.forEach((r) => {
    groupCounts[r.member.groupName] = addCurrency(
      groupCounts[r.member.groupName] || 0,
      r.totals.remaining
    );
  });
  const topOverdueGroup =
    Object.entries(groupCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'لا يوجد';

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="المتأخرات"
        description="متابعة المتأخرات لكل عضو وسنة مالية بشكل مستقل (رسوم التأسيس والأشهر غير المسددة)."
        action={
          currentUser.permissions.includes('payments') ? (
            <button
              type="button"
              onClick={() => onNavigate('payments')}
              className="w-full sm:w-auto h-10 px-4 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="إجمالي المتأخرات"
          value={formatCurrency(totalOverdueSum)}
          subtitle={yearFilter === 'all' ? 'لجميع السنوات المالية' : `للسنة المالية ${yearFilter}`}
          icon={AlertOctagon}
          accent="red"
        />
        <StatCard
          title="عدد الأعضاء المتأخرين"
          value={`${uniqueOverdueMembers} عضو`}
          subtitle={`${filteredRows.length} سجل سنة مالية غير مكتمل`}
          icon={Users}
          accent="amber"
        />
        <StatCard
          title="أعلى مبلغ متأخر"
          value={formatCurrency(highestOverdue)}
          subtitle="أعلى رصيد مستحق في سجل واحد"
          icon={TrendingUp}
          accent="royal"
        />
        <StatCard
          title="أكثر مجموعة متأخرة"
          value={topOverdueGroup.replace('مجموعة ', '')}
          subtitle="الأعلى في إجمالي المبالغ المتبقية"
          icon={Layers}
          accent="blue"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#748399] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            placeholder="ابحث باسم العضو أو الهوية..."
            className="w-full h-11 pr-10 pl-4 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm focus:bg-white focus:outline-none focus:border-[#2878C8]"
          />
        </div>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="h-11 px-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
        >
          <option value="all">جميع السنوات المالية</option>
          {yearConfigs.map((y) => (
            <option key={y.year} value={String(y.year)}>
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

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 px-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
        >
          <option value="all">جميع الحالات</option>
          <option value="متأخر">متأخر (لم يسدد)</option>
          <option value="مسدد جزئياً">مسدد جزئياً</option>
        </select>
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
                    <th className="py-3.5 px-4">متبقي التأسيس</th>
                    <th className="py-3.5 px-4 text-center">الأشهر المتبقية</th>
                    <th className="py-3.5 px-4">تفصيل الأشهر</th>
                    <th className="py-3.5 px-4">المستحق</th>
                    <th className="py-3.5 px-4">المسدد</th>
                    <th className="py-3.5 px-4">المتبقي</th>
                    <th className="py-3.5 px-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRows.map(({ member, year, totals, statusLabel }) => (
                    <tr key={`${member.id}-${year}`} className="hover:bg-[#F8FAFC]">
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
                      <td className="py-3.5 px-4 text-xs font-bold text-[#123B70] tabular-nums">
                        {year}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold tabular-nums whitespace-nowrap">
                        {totals.foundingRemaining > 0 ? (
                          <span className="text-[#DC5555]">
                            {formatCurrency(totals.foundingRemaining)}
                          </span>
                        ) : (
                          <span className="text-[#16A36A]">مسددة</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-[#DC5555] tabular-nums whitespace-nowrap">
                        {totals.overdueMonths.length} شهر
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#748399] max-w-[200px]">
                        {totals.overdueMonths.length > 0 ? totals.overdueMonths.join('، ') : '—'}
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
                          label={statusLabel}
                          tone={statusLabel === 'متأخر' ? 'danger' : 'warning'}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filteredRows.map(({ member, year, totals, statusLabel }) => (
              <div
                key={`${member.id}-${year}`}
                className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectMember(member.id)}
                      className="text-sm font-bold text-[#123B70] truncate block"
                    >
                      {member.name}
                    </button>
                    <div className="text-[11px] text-[#748399] truncate">
                      {member.groupName} · <strong className="text-[#123B70] tabular-nums">سنة {year}</strong>
                    </div>
                  </div>
                  <StatusIndicator
                    label={statusLabel}
                    tone={statusLabel === 'متأخر' ? 'danger' : 'warning'}
                  />
                </div>
                <div className="text-xs text-[#748399]">
                  التأسيس المتبقي:{' '}
                  <strong className="text-[#172B45] tabular-nums">
                    {formatCurrency(totals.foundingRemaining)}
                  </strong>{' '}
                  · الأشهر المتبقية:{' '}
                  <strong className="text-[#DC5555] tabular-nums">
                    {totals.overdueMonths.length}
                  </strong>
                </div>
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#F8FAFC] text-center text-[11px] tabular-nums">
                  <div>
                    <div className="text-[#748399]">المستحق</div>
                    <div className="font-bold text-[#172B45]">{formatCurrency(totals.totalDue)}</div>
                  </div>
                  <div>
                    <div className="text-[#748399]">المسدد</div>
                    <div className="font-bold text-[#16A36A]">{formatCurrency(totals.totalPaid)}</div>
                  </div>
                  <div>
                    <div className="text-[#748399]">المتبقي</div>
                    <div className="font-bold text-[#DC5555]">{formatCurrency(totals.remaining)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
