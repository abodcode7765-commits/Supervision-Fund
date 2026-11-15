import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Filter,
} from 'lucide-react';
import {
  Expense,
  Group,
  MarriageAid,
  Member,
  MemberYearSubscription,
  PaymentRecord,
  Qitta,
  YearConfig,
} from '../types';
import { LogoMark, PageHeader } from '../components/ui/SharedUI';
import { computeMemberYearTotals, formatCurrency, getTodayArabicDate } from '../utils/formatters';
import { ARABIC_MONTHS } from '../data/mockData';

type ReportType =
  | 'members'
  | 'groups'
  | 'annual-subs'
  | 'monthly-subs'
  | 'payments'
  | 'overdue'
  | 'expenses'
  | 'qittat'
  | 'marriage-aid'
  | 'comprehensive';

const REPORT_OPTIONS: { id: ReportType; label: string }[] = [
  { id: 'comprehensive', label: 'التقرير المالي الشامل للصندوق' },
  { id: 'members', label: 'تقرير الأعضاء' },
  { id: 'groups', label: 'تقرير المجموعات' },
  { id: 'annual-subs', label: 'تقرير الاشتراكات السنوية' },
  { id: 'monthly-subs', label: 'تقرير الاشتراكات الشهرية' },
  { id: 'payments', label: 'تقرير المدفوعات' },
  { id: 'overdue', label: 'تقرير المتأخرات' },
  { id: 'expenses', label: 'تقرير المصروفات' },
  { id: 'qittat', label: 'تقرير القطات' },
  { id: 'marriage-aid', label: 'تقرير مساعدات الزواج' },
];

export function ReportsPage({
  members,
  groups,
  yearConfigs,
  subscriptions,
  payments,
  expenses,
  qittat,
  marriageAids,
  onNotify,
}: {
  members: Member[];
  groups: Group[];
  yearConfigs: YearConfig[];
  subscriptions: MemberYearSubscription[];
  payments: PaymentRecord[];
  expenses: Expense[];
  qittat: Qitta[];
  marriageAids: MarriageAid[];
  onNotify: (msg: string) => void;
}) {
  const [reportType, setReportType] = useState<ReportType>('comprehensive');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-12-31');

  const activeReportLabel =
    REPORT_OPTIONS.find((r) => r.id === reportType)?.label ?? 'التقرير المالي';
  const activeConfig =
    yearConfigs.find((y) => y.year === selectedYear) ?? yearConfigs[0];

  const filteredMembers = members.filter((m) => {
    const matchGrp = selectedGroupId === 'all' || m.groupId === selectedGroupId;
    const matchMem = selectedMemberId === 'all' || m.id === selectedMemberId;
    return matchGrp && matchMem;
  });

  const filteredPayments = payments.filter((p) => {
    const matchMem = selectedMemberId === 'all' || p.memberId === selectedMemberId;
    const grp = groups.find((g) => g.id === selectedGroupId);
    const matchGrp = selectedGroupId === 'all' || p.groupName === grp?.name;
    return matchMem && matchGrp && p.year === selectedYear;
  });

  const totalCollected = 35400 + payments.slice(9).reduce((s, p) => s + p.amount, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalMarriage = marriageAids
    .filter((a) => a.status === 'تم الصرف')
    .reduce((s, a) => s + a.amount, 0);
  const totalQittatCollected = qittat.reduce(
    (s, q) => s + q.participants.reduce((ps, pt) => ps + pt.paidAmount, 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title="التقارير والكشوفات"
          description="إصدار ومعاينة التقارير المالية والإدارية التفصيلية لصندوق الإشراف."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onNotify(`جاري تجهيز ملف PDF لـ "${activeReportLabel}"...`)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#123B70] hover:bg-[#0e2e58] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>تصدير PDF</span>
              </button>
              <button
                type="button"
                onClick={() => onNotify(`تم تجهيز ملف Excel لـ "${activeReportLabel}" بنجاح.`)}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#16A36A] hover:bg-[#128a59] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onNotify('جاري فتح نافذة الطباعة...');
                  window.print();
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#2878C8] text-[#172B45] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#2878C8]" />
                <span>طباعة التقرير</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Report Types & Filters Panel */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(18,59,112,0.04)] space-y-4 no-print">
        <div className="flex items-center gap-2 text-sm font-bold text-[#123B70]">
          <Filter className="w-4 h-4 text-[#2878C8]" />
          <span>إعدادات التقرير ومعايير التصفية</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {REPORT_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setReportType(opt.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                reportType === opt.id
                  ? 'bg-[#2878C8] text-white border-[#2878C8]'
                  : 'bg-[#F8FAFC] text-[#172B45] border-slate-200 hover:border-[#2878C8]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-[#748399] mb-1">السنة المالية</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs sm:text-sm font-medium focus:outline-none focus:border-[#2878C8]"
            >
              {yearConfigs.map((y) => (
                <option key={y.year} value={y.year}>
                  {y.year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#748399] mb-1">المجموعة</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs sm:text-sm font-medium focus:outline-none focus:border-[#2878C8]"
            >
              <option value="all">جميع المجموعات</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#748399] mb-1">العضو</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs sm:text-sm font-medium focus:outline-none focus:border-[#2878C8]"
            >
              <option value="all">جميع الأعضاء</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#748399] mb-1">من تاريخ</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs sm:text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#748399] mb-1">إلى تاريخ</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs sm:text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
            />
          </div>
        </div>
      </div>

      {/* Formal Report Preview Document */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-[0_2px_10px_rgba(18,59,112,0.05)] print-only-area space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-[#123B70]/15">
          <div className="flex items-center gap-3.5">
            <LogoMark size={48} />
            <div>
              <div className="text-lg font-extrabold text-[#123B70]">
                صندوق الإشراف – ذوي محسن
              </div>
              <div className="text-sm font-bold text-[#2878C8] mt-0.5">{activeReportLabel}</div>
            </div>
          </div>

          <div className="text-xs text-[#748399] sm:text-left space-y-1">
            <div>
              السنة المالية: <strong className="text-[#172B45] tabular-nums">{selectedYear}</strong>
            </div>
            <div>
              الفترة:{' '}
              <span className="tabular-nums text-[#172B45]">
                {fromDate} إلى {toDate}
              </span>
            </div>
            <div>تاريخ الإصدار: {getTodayArabicDate()}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
            <div className="text-[11px] text-[#748399]">إجمالي الأعضاء المشمولين</div>
            <div className="text-lg font-bold text-[#123B70] mt-1 tabular-nums">
              {selectedGroupId === 'all' && selectedMemberId === 'all'
                ? '120 عضواً'
                : `${filteredMembers.length} عضو`}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
            <div className="text-[11px] text-[#748399]">إجمالي التحصيل</div>
            <div className="text-lg font-bold text-[#16A36A] mt-1 tabular-nums">
              {formatCurrency(totalCollected)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
            <div className="text-[11px] text-[#748399]">إجمالي المصروفات</div>
            <div className="text-lg font-bold text-[#DC5555] mt-1 tabular-nums">
              {formatCurrency(totalExpenses)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#EAF3FC] border border-[#4A90D9]/30">
            <div className="text-[11px] text-[#123B70]">صافي رصيد الصندوق</div>
            <div className="text-lg font-bold text-[#123B70] mt-1 tabular-nums">
              {formatCurrency(totalCollected - totalExpenses)}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {reportType === 'comprehensive' && (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#123B70] text-white text-xs font-bold">
                  <th className="py-3 px-4 rounded-tr-lg">البند المالي</th>
                  <th className="py-3 px-4">الوصف</th>
                  <th className="py-3 px-4">القيمة</th>
                  <th className="py-3 px-4 rounded-tl-lg">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                <tr>
                  <td className="py-3 px-4 font-bold">إيرادات الاشتراكات والتأسيس</td>
                  <td className="py-3 px-4 text-xs text-[#748399]">
                    مجموع تحصيل الرسوم السنوية والشهرية للأعضاء
                  </td>
                  <td className="py-3 px-4 font-bold text-[#16A36A] tabular-nums">
                    {formatCurrency(totalCollected)}
                  </td>
                  <td className="py-3 px-4 text-xs">إيراد</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold">متحصلات القطات المشتركة</td>
                  <td className="py-3 px-4 text-xs text-[#748399]">
                    إجمالي المبالغ المحصلة في قسم القطات ({qittat.length} قطات)
                  </td>
                  <td className="py-3 px-4 font-bold text-[#2878C8] tabular-nums">
                    {formatCurrency(totalQittatCollected)}
                  </td>
                  <td className="py-3 px-4 text-xs">تشاركي</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold">المصروفات التشغيلية والإدارية</td>
                  <td className="py-3 px-4 text-xs text-[#748399]">
                    إجمالي سندات الصرف المسجلة في مصروفات الصندوق
                  </td>
                  <td className="py-3 px-4 font-bold text-[#DC5555] tabular-nums">
                    {formatCurrency(totalExpenses)}
                  </td>
                  <td className="py-3 px-4 text-xs">مصروف</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold">معونات الزواج المصروفة</td>
                  <td className="py-3 px-4 text-xs text-[#748399]">
                    إجمالي المعونات المسلمة للمتزوجين
                  </td>
                  <td className="py-3 px-4 font-bold text-[#123B70] tabular-nums">
                    {formatCurrency(totalMarriage)}
                  </td>
                  <td className="py-3 px-4 text-xs">منصرف</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold">الاشتراكات المتأخرة قيد التحصيل</td>
                  <td className="py-3 px-4 text-xs text-[#748399]">
                    رصيد المستحقات المتبقية على الأعضاء المتأخرين
                  </td>
                  <td className="py-3 px-4 font-bold text-[#C67B1B] tabular-nums">
                    {formatCurrency(4250)}
                  </td>
                  <td className="py-3 px-4 text-xs">مستحق</td>
                </tr>
              </tbody>
            </table>
          )}

          {reportType === 'groups' && (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#123B70] text-white text-xs font-bold">
                  <th className="py-3 px-4">اسم المجموعة</th>
                  <th className="py-3 px-4">رئيس المجموعة</th>
                  <th className="py-3 px-4">عدد الأعضاء</th>
                  <th className="py-3 px-4">المستحق ({selectedYear})</th>
                  <th className="py-3 px-4">عدد المتأخرين</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {groups.map((g) => {
                  const gMembers = members.filter((m) => m.groupId === g.id);
                  const overdueCnt = gMembers.filter((m) => m.subscriptionStatus === 'متأخر').length;
                  const count = Math.max(gMembers.length, g.baseMemberCount);
                  return (
                    <tr key={g.id}>
                      <td className="py-3 px-4 font-bold text-[#172B45]">{g.name}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-[#123B70]">
                        {g.leaderName}
                      </td>
                      <td className="py-3 px-4 tabular-nums">{count} عضواً</td>
                      <td className="py-3 px-4 font-bold text-[#2878C8] tabular-nums">
                        {formatCurrency(count * (activeConfig.foundingFee + activeConfig.monthlyFee * 11))}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#DC5555] tabular-nums">
                        {overdueCnt}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {(reportType === 'members' ||
            reportType === 'annual-subs' ||
            reportType === 'overdue') && (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#123B70] text-white text-xs font-bold">
                  <th className="py-3 px-4">العضو</th>
                  <th className="py-3 px-4">المجموعة</th>
                  <th className="py-3 px-4">المستحق ({selectedYear})</th>
                  <th className="py-3 px-4">المسدد</th>
                  <th className="py-3 px-4">المتبقي</th>
                  <th className="py-3 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredMembers
                  .filter((m) =>
                    reportType === 'overdue' ? m.subscriptionStatus !== 'مسدد' : true
                  )
                  .map((m) => {
                    const sub = subscriptions.find(
                      (s) => s.memberId === m.id && s.year === selectedYear
                    );
                    const totals = computeMemberYearTotals(sub, activeConfig);
                    return (
                      <tr key={m.id}>
                        <td className="py-3 px-4 font-bold text-[#172B45]">{m.name}</td>
                        <td className="py-3 px-4 text-xs text-[#748399]">{m.groupName}</td>
                        <td className="py-3 px-4 tabular-nums">
                          {formatCurrency(totals.totalDue)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#16A36A] tabular-nums">
                          {formatCurrency(totals.totalPaid)}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#DC5555] tabular-nums">
                          {formatCurrency(totals.remaining)}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold">
                          {m.subscriptionStatus}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}

          {reportType === 'monthly-subs' && (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#123B70] text-white text-xs font-bold">
                  <th className="py-3 px-4">الشهر</th>
                  <th className="py-3 px-4">قيمة الاشتراك الشهري</th>
                  <th className="py-3 px-4">إجمالي المسددين</th>
                  <th className="py-3 px-4">المتأخرين</th>
                  <th className="py-3 px-4">نسبة الالتزام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {ARABIC_MONTHS.slice(0, 11).map((month, idx) => {
                  const paidCnt = filteredMembers.filter((m) => {
                    const sub = subscriptions.find(
                      (s) => s.memberId === m.id && s.year === selectedYear
                    );
                    return sub?.months[idx] === 'paid';
                  }).length;
                  const totalCnt = Math.max(1, filteredMembers.length);
                  const pct = Math.round((paidCnt / totalCnt) * 100);
                  return (
                    <tr key={month}>
                      <td className="py-3 px-4 font-bold">{month}</td>
                      <td className="py-3 px-4 tabular-nums">
                        {formatCurrency(activeConfig.monthlyFee)}
                      </td>
                      <td className="py-3 px-4 text-[#16A36A] font-semibold tabular-nums">
                        {paidCnt}
                      </td>
                      <td className="py-3 px-4 text-[#DC5555] font-semibold tabular-nums">
                        {totalCnt - paidCnt}
                      </td>
                      <td className="py-3 px-4 font-bold tabular-nums">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'payments' && (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#123B70] text-white text-xs font-bold">
                  <th className="py-3 px-4">العضو</th>
                  <th className="py-3 px-4">المستحق</th>
                  <th className="py-3 px-4">المدفوع</th>
                  <th className="py-3 px-4">المتبقي</th>
                  <th className="py-3 px-4">طريقة الدفع</th>
                  <th className="py-3 px-4">التاريخ</th>
                  <th className="py-3 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredPayments.map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 px-4 font-bold">{p.memberName}</td>
                    <td className="py-3 px-4 tabular-nums">{formatCurrency(p.dueAmount)}</td>
                    <td className="py-3 px-4 font-bold text-[#16A36A] tabular-nums">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#DC5555] tabular-nums">
                      {formatCurrency(p.remainingAmount)}
                    </td>
                    <td className="py-3 px-4 text-xs">{p.paymentMethod}</td>
                    <td className="py-3 px-4 text-xs tabular-nums">{p.date}</td>
                    <td className="py-3 px-4 text-xs font-semibold">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'expenses' && (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#123B70] text-white text-xs font-bold">
                  <th className="py-3 px-4">رقم العملية</th>
                  <th className="py-3 px-4">عنوان المصروف</th>
                  <th className="py-3 px-4">التصنيف</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">الرصيد بعد المصروف</th>
                  <th className="py-3 px-4">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="py-3 px-4 font-bold tabular-nums">{e.operationNumber}</td>
                    <td className="py-3 px-4 font-semibold">{e.title}</td>
                    <td className="py-3 px-4 text-xs">{e.category}</td>
                    <td className="py-3 px-4 font-bold text-[#DC5555] tabular-nums">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#123B70] tabular-nums">
                      {formatCurrency(e.balanceAfter)}
                    </td>
                    <td className="py-3 px-4 text-xs tabular-nums">{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'qittat' && (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#123B70] text-white text-xs font-bold">
                  <th className="py-3 px-4">اسم القطة</th>
                  <th className="py-3 px-4">السبب</th>
                  <th className="py-3 px-4">المبلغ المطلوب</th>
                  <th className="py-3 px-4">المحصل</th>
                  <th className="py-3 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {qittat.map((q) => {
                  const col = q.participants.reduce((s, p) => s + p.paidAmount, 0);
                  return (
                    <tr key={q.id}>
                      <td className="py-3 px-4 font-bold">{q.name}</td>
                      <td className="py-3 px-4 text-xs text-[#748399]">{q.reason}</td>
                      <td className="py-3 px-4 tabular-nums">{formatCurrency(q.totalAmount)}</td>
                      <td className="py-3 px-4 font-bold text-[#16A36A] tabular-nums">
                        {formatCurrency(col)}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold">{q.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'marriage-aid' && (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#123B70] text-white text-xs font-bold">
                  <th className="py-3 px-4">اسم العضو</th>
                  <th className="py-3 px-4">رقم الهوية</th>
                  <th className="py-3 px-4">قيمة المعونة</th>
                  <th className="py-3 px-4">تاريخ الاستحقاق</th>
                  <th className="py-3 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {marriageAids.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 px-4 font-bold">{a.memberName}</td>
                    <td className="py-3 px-4 text-xs tabular-nums">{a.nationalId}</td>
                    <td className="py-3 px-4 font-bold text-[#123B70] tabular-nums">
                      {formatCurrency(a.amount)}
                    </td>
                    <td className="py-3 px-4 text-xs tabular-nums">{a.dueDate}</td>
                    <td className="py-3 px-4 text-xs font-semibold">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#748399]">
          <div>تم إنشاء هذا الكشف آلياً من نظام صندوق الإشراف – ذوي محسن</div>
          <div className="flex items-center gap-8 font-semibold text-[#172B45]">
            <span>أمين الصندوق: محمد محسن</span>
            <span>الختم والاعتماد: إدارة الصندوق</span>
          </div>
        </div>
      </div>
    </div>
  );
}
