import React, { useMemo, useRef, useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  Filter,
  Loader2,
  UserCheck,
} from 'lucide-react';
import {
  Expense,
  FundSettings,
  Group,
  MarriageAid,
  Member,
  MemberYearSubscription,
  PaymentRecord,
  Qitta,
  ReportType,
  SystemUser,
  YearConfig,
} from '../types';
import { LogoMark, PageHeader } from '../components/ui/SharedUI';
import {
  ARABIC_MONTHS,
  addCurrency,
  computeMemberYearTotals,
  formatCurrency,
  fromHalalas,
  getDefaultActiveYear,
  getTodayArabicDate,
  getTodayIsoDate,
  isFutureScheduledYear,
  isSubscriptionRowOverdue,
  subtractCurrency,
  toHalalas,
} from '../utils/formatters';
import {
  downloadReportExcel,
  downloadReportPdfFromElement,
} from '../utils/exportReports';

const REPORT_OPTIONS: { id: ReportType; label: string }[] = [
  { id: 'comprehensive', label: 'التقرير المالي الشامل للصندوق' },
  { id: 'members', label: 'تقرير الأعضاء' },
  { id: 'member-statement', label: 'كشف حساب عضو محدد' },
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
  settings,
  currentUser,
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
  settings: FundSettings;
  currentUser: SystemUser;
  onNotify: (msg: string) => void;
}) {
  const isGroupLeader = currentUser.role === 'رئيس المجموعة' && Boolean(currentUser.groupId);

  const visibleReportOptions = useMemo(() => {
    if (!isGroupLeader) return REPORT_OPTIONS;
    // Group leader sees member/group/subscription/payment/overdue reports only, no fund-wide expenses/qittat/marriage-aid
    return REPORT_OPTIONS.filter((o) =>
      [
        'comprehensive',
        'members',
        'member-statement',
        'groups',
        'annual-subs',
        'monthly-subs',
        'payments',
        'overdue',
      ].includes(o.id)
    );
  }, [isGroupLeader]);

  const [reportType, setReportType] = useState<ReportType>('comprehensive');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(() =>
    getDefaultActiveYear(yearConfigs)
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    isGroupLeader && currentUser.groupId ? currentUser.groupId : 'all'
  );
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [operationType, setOperationType] = useState<
    'all' | 'subscriptions' | 'expenses' | 'qittat' | 'marriage-aid'
  >('all');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState(getTodayIsoDate());
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const reportDocRef = useRef<HTMLDivElement>(null);

  const effectiveGroupId =
    isGroupLeader && currentUser.groupId ? currentUser.groupId : selectedGroupId;

  const activeReportLabel =
    visibleReportOptions.find((r) => r.id === reportType)?.label ?? 'التقرير المالي';

  const activeConfig = useMemo(() => {
    if (selectedYear === 'all') return yearConfigs[0];
    return yearConfigs.find((y) => y.year === selectedYear) ?? yearConfigs[0];
  }, [selectedYear, yearConfigs]);

  const scopedGroups = useMemo(() => {
    if (effectiveGroupId === 'all') return groups;
    return groups.filter((g) => g.id === effectiveGroupId);
  }, [groups, effectiveGroupId]);

  const scopedMembers = useMemo(() => {
    return members.filter((m) => {
      const matchGrp = effectiveGroupId === 'all' || m.groupId === effectiveGroupId;
      const matchMem = selectedMemberId === 'all' || m.id === selectedMemberId;
      const matchStatus = statusFilter === 'all' || m.subscriptionStatus === statusFilter;
      return matchGrp && matchMem && matchStatus;
    });
  }, [members, effectiveGroupId, selectedMemberId, statusFilter]);

  const memberIdsInScope = useMemo(() => {
    return new Set(
      members
        .filter((m) => {
          const matchGrp = effectiveGroupId === 'all' || m.groupId === effectiveGroupId;
          const matchMem = selectedMemberId === 'all' || m.id === selectedMemberId;
          return matchGrp && matchMem;
        })
        .map((m) => m.id)
    );
  }, [members, effectiveGroupId, selectedMemberId]);

  const inDateRange = (dateStr: string) => {
    if (!dateStr || dateStr === '—') return true;
    const afterFrom = !fromDate || dateStr >= fromDate;
    const beforeTo = !toDate || dateStr <= toDate;
    return afterFrom && beforeTo;
  };

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchScope = memberIdsInScope.has(p.memberId);
      const matchYear = selectedYear === 'all' || p.year === selectedYear;
      const matchDate = inDateRange(p.date);
      const matchStatus =
        statusFilter === 'all' ||
        p.status === statusFilter ||
        (statusFilter === 'مسدد' && p.status === 'مكتمل') ||
        (statusFilter === 'مسدد جزئياً' && p.status === 'مدفوع جزئياً');
      return matchScope && matchYear && matchDate && matchStatus;
    });
  }, [payments, memberIdsInScope, selectedYear, fromDate, toDate, statusFilter]);

  const filteredExpenses = useMemo(() => {
    if (isGroupLeader) return [];
    return expenses.filter((e) => {
      const matchYear = selectedYear === 'all' || e.year === selectedYear;
      const matchDate = inDateRange(e.date);
      return matchYear && matchDate;
    });
  }, [expenses, isGroupLeader, selectedYear, fromDate, toDate]);

  const filteredQittat = useMemo(() => {
    if (isGroupLeader) return [];
    return qittat.filter((q) => {
      const matchDate = inDateRange(q.createdAt);
      const matchMember =
        selectedMemberId === 'all' ||
        q.participants.some((pt) => pt.memberId === selectedMemberId);
      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchDate && matchMember && matchStatus;
    });
  }, [qittat, isGroupLeader, fromDate, toDate, selectedMemberId, statusFilter]);

  const filteredMarriageAids = useMemo(() => {
    if (isGroupLeader) return [];
    return marriageAids.filter((a) => {
      const matchScope = memberIdsInScope.has(a.memberId);
      const matchDate = inDateRange(a.dueDate);
      const matchStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchScope && matchDate && matchStatus;
    });
  }, [marriageAids, isGroupLeader, memberIdsInScope, fromDate, toDate, statusFilter]);

  // Member-year subscription breakdown rows (respecting 'all' or specific year + member/group filter)
  const memberSubRows = useMemo(() => {
    const targetConfigs =
      selectedYear === 'all'
        ? yearConfigs
        : yearConfigs.filter((y) => y.year === selectedYear);

    const rows: {
      member: Member;
      year: number;
      config: YearConfig;
      sub: MemberYearSubscription | undefined;
      totals: ReturnType<typeof computeMemberYearTotals>;
    }[] = [];

    scopedMembers.forEach((m) => {
      targetConfigs.forEach((cfg) => {
        const sub = subscriptions.find((s) => s.memberId === m.id && s.year === cfg.year);
        if (!sub && selectedYear === 'all') return;
        const totals = computeMemberYearTotals(sub, cfg);
        rows.push({ member: m, year: cfg.year, config: cfg, sub, totals });
      });
    });

    return rows;
  }, [scopedMembers, yearConfigs, selectedYear, subscriptions]);

  const overdueSubRows = useMemo(
    () => memberSubRows.filter((r) => isSubscriptionRowOverdue(r.sub, r.totals, r.year)),
    [memberSubRows]
  );

  // Real financial KPIs
  const totalCollectedPayments = useMemo(
    () => fromHalalas(filteredPayments.reduce((acc, p) => acc + toHalalas(p.amount), 0)),
    [filteredPayments]
  );
  const totalExpensesVal = useMemo(
    () => addCurrency(...filteredExpenses.map((e) => e.amount)),
    [filteredExpenses]
  );
  const totalOverdueRemaining = useMemo(
    () => addCurrency(...overdueSubRows.map((r) => r.totals.remaining)),
    [overdueSubRows]
  );
  const totalQittatCollected = useMemo(
    () =>
      addCurrency(
        ...filteredQittat.flatMap((q) => q.participants.map((p) => p.paidAmount))
      ),
    [filteredQittat]
  );
  const totalMarriageDisbursed = useMemo(
    () =>
      addCurrency(
        ...filteredMarriageAids
          .filter((a) => a.status === 'تم الصرف')
          .map((a) => a.amount)
      ),
    [filteredMarriageAids]
  );
  const netFundBalance = subtractCurrency(totalCollectedPayments, totalExpensesVal);

  // Individual member statement target (defaults to selectedMemberId or first scoped member)
  const statementMember = useMemo(() => {
    if (selectedMemberId !== 'all') {
      return members.find((m) => m.id === selectedMemberId) ?? null;
    }
    return scopedMembers[0] ?? null;
  }, [selectedMemberId, members, scopedMembers]);

  const statementData = useMemo(() => {
    if (!statementMember) return null;
    const memSubs = yearConfigs
      .filter((cfg) => selectedYear === 'all' || cfg.year === selectedYear)
      .map((cfg) => {
        const sub = subscriptions.find(
          (s) => s.memberId === statementMember.id && s.year === cfg.year
        );
        return sub ? { cfg, sub, totals: computeMemberYearTotals(sub, cfg) } : null;
      })
      .filter(Boolean) as {
      cfg: YearConfig;
      sub: MemberYearSubscription;
      totals: ReturnType<typeof computeMemberYearTotals>;
    }[];

    const memPayments = payments.filter(
      (p) =>
        p.memberId === statementMember.id &&
        (selectedYear === 'all' || p.year === selectedYear) &&
        inDateRange(p.date)
    );
    const memQittat = isGroupLeader
      ? []
      : qittat
          .map((q) => {
            const pt = q.participants.find((p) => p.memberId === statementMember.id);
            return pt ? { qitta: q, participant: pt } : null;
          })
          .filter(Boolean) as { qitta: Qitta; participant: Qitta['participants'][number] }[];

    const memMarriageAids = isGroupLeader
      ? []
      : marriageAids.filter((a) => a.memberId === statementMember.id);

    const activeStatementSubs = memSubs.filter(
      (s) =>
        selectedYear !== 'all' ||
        !isFutureScheduledYear(s.cfg.year) ||
        toHalalas(s.totals.totalPaid) > 0 ||
        isSubscriptionRowOverdue(s.sub, s.totals, s.cfg.year)
    );
    const totalDue = addCurrency(...activeStatementSubs.map((s) => s.totals.totalDue));
    const totalPaid = addCurrency(...memSubs.map((s) => s.totals.totalPaid));
    const totalRemaining = addCurrency(
      ...activeStatementSubs.map((s) => s.totals.remaining)
    );

    return {
      memSubs,
      memPayments,
      memQittat,
      memMarriageAids,
      totalDue,
      totalPaid,
      totalRemaining,
    };
  }, [
    statementMember,
    yearConfigs,
    selectedYear,
    subscriptions,
    payments,
    qittat,
    marriageAids,
    isGroupLeader,
    fromDate,
    toDate,
  ]);

  // Build tabular Excel export payload matching exact current view & filters
  const buildExcelPayload = () => {
    const yearLabel = selectedYear === 'all' ? 'جميع السنوات' : String(selectedYear);
    const metaLines = [
      `الجهة: ${settings.fundName} – ${settings.subName}`,
      `نوع التقرير: ${activeReportLabel}`,
      `السنة المالية: ${yearLabel}`,
      `الفترة: من ${fromDate} إلى ${toDate}`,
      `تاريخ الإصدار: ${getTodayArabicDate()}`,
    ];

    const summaryRows = isGroupLeader
      ? [
          { label: 'عدد الأعضاء المشمولين', value: scopedMembers.length },
          { label: 'إجمالي التحصيل (ر.س)', value: totalCollectedPayments },
          { label: 'إجمالي المتأخرات (ر.س)', value: totalOverdueRemaining },
        ]
      : [
          { label: 'عدد الأعضاء المشمولين', value: scopedMembers.length },
          { label: 'إجمالي التحصيل (ر.س)', value: totalCollectedPayments },
          { label: 'إجمالي المصروفات (ر.س)', value: totalExpensesVal },
          { label: 'صافي الرصيد (ر.س)', value: netFundBalance },
        ];

    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (reportType === 'comprehensive') {
      headers = ['البند المالي', 'الوصف', `القيمة (${settings.currency})`, 'التصنيف'];
      rows = [
        ['إيرادات الاشتراكات والتأسيس', 'مجموع المدفوعات المسجلة', totalCollectedPayments, 'إيراد'],
        ['الاشتراكات المتأخرة قيد التحصيل', 'رصيد المستحقات المتبقية على الأعضاء', totalOverdueRemaining, 'مستحق'],
      ];
      if (!isGroupLeader) {
        rows.push(
          ['متحصلات القطات المشتركة', `إجمالي المحصل في ${filteredQittat.length} قطات`, totalQittatCollected, 'تشاركي'],
          ['المصروفات التشغيلية والإدارية', `إجمالي ${filteredExpenses.length} سندات صرف`, totalExpensesVal, 'مصروف'],
          ['معونات الزواج المصروفة', 'إجمالي المعونات المسلمة', totalMarriageDisbursed, 'منصرف'],
          ['صافي رصيد الصندوق', 'التحصيل ناقص المصروفات', netFundBalance, 'رصيد']
        );
      }
    } else if (reportType === 'groups') {
      headers = ['اسم المجموعة', 'رئيس المجموعة', 'عدد الأعضاء', `المستحق (${yearLabel})`, 'المسدد', 'المتبقي', 'عدد المتأخرين'];
      rows = scopedGroups.map((g) => {
        const gMembers = members.filter((m) => m.groupId === g.id);
        const gSubRows = memberSubRows.filter((r) => r.member.groupId === g.id);
        const due = addCurrency(...gSubRows.map((r) => r.totals.totalDue));
        const paid = addCurrency(...gSubRows.map((r) => r.totals.totalPaid));
        const rem = addCurrency(...gSubRows.map((r) => r.totals.remaining));
        const overdueCnt = new Set(
          gSubRows
            .filter((r) => isSubscriptionRowOverdue(r.sub, r.totals, r.year))
            .map((r) => r.member.id)
        ).size;
        return [g.name, g.leaderName, gMembers.length, due, paid, rem, overdueCnt];
      });
    } else if (
      reportType === 'members' ||
      reportType === 'annual-subs' ||
      reportType === 'overdue'
    ) {
      const target = reportType === 'overdue' ? overdueSubRows : memberSubRows;
      headers = ['العضو', 'رقم الهوية', 'المجموعة', 'السنة', 'المستحق', 'المسدد', 'المتبقي', 'الحالة'];
      rows = target.map((r) => {
        const isFutureUntouched =
          isFutureScheduledYear(r.year) &&
          toHalalas(r.totals.totalPaid) === 0 &&
          !isSubscriptionRowOverdue(r.sub, r.totals, r.year);
        const statusStr =
          toHalalas(r.totals.remaining) === 0
            ? 'مسدد'
            : isFutureUntouched
              ? 'قادم'
              : toHalalas(r.totals.totalPaid) > 0
                ? 'مسدد جزئياً'
                : 'متأخر';
        return [
          r.member.name,
          r.member.nationalId,
          r.member.groupName,
          r.year,
          r.totals.totalDue,
          r.totals.totalPaid,
          r.totals.remaining,
          statusStr,
        ];
      });
    } else if (reportType === 'monthly-subs' && activeConfig) {
      headers = ['الشهر', 'قيمة الاشتراك الشهري', 'إجمالي المسددين', 'جزئي/متأخر', 'نسبة الالتزام %'];
      rows = ARABIC_MONTHS.slice(0, activeConfig.monthsCount).map((month, idx) => {
        const paidCnt = scopedMembers.filter((m) => {
          const sub = subscriptions.find(
            (s) => s.memberId === m.id && s.year === activeConfig.year
          );
          return sub?.months[idx] === 'paid';
        }).length;
        const totalCnt = scopedMembers.length;
        const pct = totalCnt > 0 ? Math.round((paidCnt / totalCnt) * 100) : 0;
        return [month, activeConfig.monthlyFee, paidCnt, totalCnt - paidCnt, `${pct}%`];
      });
    } else if (reportType === 'payments') {
      headers = ['العضو', 'المجموعة', 'السنة', 'المستحق', 'المدفوع', 'المتبقي', 'طريقة الدفع', 'التاريخ', 'الحالة'];
      rows = filteredPayments.map((p) => [
        p.memberName,
        p.groupName,
        p.year,
        p.dueAmount,
        p.amount,
        p.remainingAmount,
        p.paymentMethod,
        p.date,
        p.status,
      ]);
    } else if (reportType === 'expenses') {
      headers = ['رقم العملية', 'عنوان المصروف', 'التصنيف', 'السنة', 'المبلغ', 'الرصيد قبل', 'الرصيد بعد', 'التاريخ'];
      rows = filteredExpenses.map((e) => [
        e.operationNumber,
        e.title,
        e.category,
        e.year,
        e.amount,
        e.balanceBefore,
        e.balanceAfter,
        e.date,
      ]);
    } else if (reportType === 'qittat') {
      headers = ['اسم القطة', 'السبب', 'التاريخ', 'عدد المشاركين', 'المبلغ المطلوب', 'المحصل', 'المتبقي', 'الحالة'];
      rows = filteredQittat.map((q) => {
        const col = addCurrency(...q.participants.map((p) => p.paidAmount));
        const rem = Math.max(0, subtractCurrency(q.totalAmount, col));
        return [
          q.name,
          q.reason,
          q.createdAt,
          q.participants.length,
          q.totalAmount,
          col,
          rem,
          q.status,
        ];
      });
    } else if (reportType === 'marriage-aid') {
      headers = ['اسم العضو', 'رقم الهوية', 'قيمة المعونة', 'تاريخ الاستحقاق', 'تاريخ الصرف', 'الحالة'];
      rows = filteredMarriageAids.map((a) => [
        a.memberName,
        a.nationalId,
        a.amount,
        a.dueDate,
        a.disbursementDate,
        a.status,
      ]);
    } else if (reportType === 'member-statement' && statementMember && statementData) {
      headers = ['النوع', 'البيان / السنة', 'التاريخ', 'المستحق / النصيب', 'المدفوع', 'المتبقي', 'الحالة'];
      rows = [
        ...statementData.memSubs.map((s) => [
          'اشتراك سنوي',
          `سنة ${s.cfg.year}`,
          '—',
          s.totals.totalDue,
          s.totals.totalPaid,
          s.totals.remaining,
          s.totals.remaining === 0
            ? 'مسدد'
            : isFutureScheduledYear(s.cfg.year) &&
                toHalalas(s.totals.totalPaid) === 0 &&
                !isSubscriptionRowOverdue(s.sub, s.totals, s.cfg.year)
              ? 'قادم'
              : 'متبقي',
        ]),
        ...statementData.memPayments.map((p) => [
          'سند سداد',
          `${p.paymentMethod} (${p.year})`,
          p.date,
          p.dueAmount,
          p.amount,
          p.remainingAmount,
          p.status,
        ]),
        ...statementData.memQittat.map((item) => [
          'قطة',
          item.qitta.name,
          item.qitta.createdAt,
          item.participant.shareAmount,
          item.participant.paidAmount,
          Math.max(0, subtractCurrency(item.participant.shareAmount, item.participant.paidAmount)),
          item.participant.status,
        ]),
      ];
    }

    return {
      filename: `تقرير-${reportType}-${yearLabel}`,
      sheetName: activeReportLabel,
      title: `${settings.fundName} – ${settings.subName} | ${activeReportLabel}`,
      metaLines,
      summaryRows,
      headers,
      rows,
    };
  };

  const handleExportExcel = () => {
    try {
      const payload = buildExcelPayload();
      downloadReportExcel(payload);
      onNotify(`تم تنزيل ملف Excel لـ "${activeReportLabel}" بنجاح.`);
    } catch {
      onNotify('تعذر إنشاء ملف Excel، يرجى المحاولة مجدداً.');
    }
  };

  const handleExportPdf = async () => {
    if (!reportDocRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const yearLabel = selectedYear === 'all' ? 'جميع-السنوات' : String(selectedYear);
      await downloadReportPdfFromElement(
        reportDocRef.current,
        `تقرير-${reportType}-${yearLabel}`
      );
      onNotify(`تم تنزيل ملف PDF لـ "${activeReportLabel}" بنجاح.`);
    } catch {
      onNotify('تعذر إنشاء ملف PDF، يمكنك استخدام زر الطباعة كبديل.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="no-print">
        <PageHeader
          title="التقارير والكشوفات"
          description="إصدار ومعاينة وتصدير التقارير المالية والإدارية التفصيلية لصندوق الإشراف بصيغ Excel وPDF."
          action={
            <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                disabled={isExportingPdf}
                onClick={handleExportPdf}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3 sm:px-3.5 rounded-xl bg-[#123B70] hover:bg-[#0e2e58] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                {isExportingPdf ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">{isExportingPdf ? 'جاري...' : 'تصدير PDF'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3 sm:px-3.5 rounded-xl bg-[#16A36A] hover:bg-[#128a59] text-white text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span className="truncate">تصدير Excel</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onNotify('جاري فتح نافذة الطباعة...');
                  window.print();
                }}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3 sm:px-3.5 rounded-xl bg-white border border-slate-200 hover:border-[#2878C8] text-[#172B45] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#2878C8] shrink-0" />
                <span className="truncate">طباعة</span>
              </button>
            </div>
          }
        />
      </div>

      {/* Report Types & Filters Panel */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_1px_3px_rgba(18,59,112,0.04)] space-y-4 no-print">
        <div className="flex items-center gap-2 text-sm font-bold text-[#123B70]">
          <Filter className="w-4 h-4 text-[#2878C8]" />
          <span>إعدادات التقرير ومعايير التصفية</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {visibleReportOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setReportType(opt.id)}
              className={`h-9 px-3.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                reportType === opt.id
                  ? 'bg-[#2878C8] text-white border-[#2878C8]'
                  : 'bg-[#F8FAFC] text-[#172B45] border-slate-200 hover:border-[#2878C8]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-[#748399] mb-1">السنة المالية</label>
            <select
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs sm:text-sm font-medium focus:outline-none focus:border-[#2878C8]"
            >
              <option value="all">جميع السنوات</option>
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
              value={effectiveGroupId}
              disabled={isGroupLeader}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs sm:text-sm font-medium disabled:opacity-70 focus:outline-none focus:border-[#2878C8]"
            >
              {!isGroupLeader && <option value="all">جميع المجموعات</option>}
              {groups
                .filter((g) => !isGroupLeader || g.id === currentUser.groupId)
                .map((g) => (
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
              {members
                .filter((m) => effectiveGroupId === 'all' || m.groupId === effectiveGroupId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#748399] mb-1">الحالة</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs sm:text-sm font-medium focus:outline-none focus:border-[#2878C8]"
            >
              <option value="all">جميع الحالات</option>
              <option value="مسدد">مسدد / مكتمل</option>
              <option value="مسدد جزئياً">مسدد جزئياً</option>
              <option value="متأخر">متأخر</option>
              {!isGroupLeader && <option value="تم الصرف">تم الصرف (معونة)</option>}
              {!isGroupLeader && <option value="مستحقة">مستحقة (معونة)</option>}
            </select>
          </div>

          {!isGroupLeader && (
            <div>
              <label className="block text-[11px] font-bold text-[#748399] mb-1">نوع العملية</label>
              <select
                value={operationType}
                onChange={(e) =>
                  setOperationType(
                    e.target.value as
                      | 'all'
                      | 'subscriptions'
                      | 'expenses'
                      | 'qittat'
                      | 'marriage-aid'
                  )
                }
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-xs sm:text-sm font-medium focus:outline-none focus:border-[#2878C8]"
              >
                <option value="all">كافة العمليات</option>
                <option value="subscriptions">الاشتراكات</option>
                <option value="expenses">المصروفات</option>
                <option value="qittat">القطات</option>
                <option value="marriage-aid">معونة الزواج</option>
              </select>
            </div>
          )}

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
      <div
        ref={reportDocRef}
        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 shadow-[0_2px_10px_rgba(18,59,112,0.05)] print-only-area space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-[#123B70]/15">
          <div className="flex items-center gap-3.5">
            <LogoMark size={48} />
            <div>
              <div className="text-lg font-extrabold text-[#123B70]">
                {settings.fundName} – {settings.subName}
              </div>
              <div className="text-sm font-bold text-[#2878C8] mt-0.5">{activeReportLabel}</div>
            </div>
          </div>

          <div className="text-xs text-[#748399] sm:text-left space-y-1">
            <div>
              السنة المالية:{' '}
              <strong className="text-[#172B45] tabular-nums">
                {selectedYear === 'all' ? 'جميع السنوات' : selectedYear}
              </strong>
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
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col justify-between">
            <div className="text-[11px] text-[#748399]">إجمالي الأعضاء المشمولين</div>
            <div className="text-base sm:text-lg font-bold text-[#123B70] mt-1 tabular-nums">
              {scopedMembers.length} عضو
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col justify-between">
            <div className="text-[11px] text-[#748399]">إجمالي التحصيل</div>
            <div className="text-base sm:text-lg font-bold text-[#16A36A] mt-1 tabular-nums">
              {formatCurrency(totalCollectedPayments, settings.currency)}
            </div>
          </div>
          {isGroupLeader ? (
            <>
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col justify-between">
                <div className="text-[11px] text-[#748399]">المبالغ المتبقية للمجموعة</div>
                <div className="text-base sm:text-lg font-bold text-[#DC5555] mt-1 tabular-nums">
                  {formatCurrency(totalOverdueRemaining, settings.currency)}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#EAF3FC] border border-[#4A90D9]/30 flex flex-col justify-between">
                <div className="text-[11px] text-[#123B70]">الأعضاء المتأخرون</div>
                <div className="text-base sm:text-lg font-bold text-[#123B70] mt-1 tabular-nums">
                  {scopedMembers.filter((m) => m.subscriptionStatus !== 'مسدد').length} عضو
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80 flex flex-col justify-between">
                <div className="text-[11px] text-[#748399]">إجمالي المصروفات</div>
                <div className="text-base sm:text-lg font-bold text-[#DC5555] mt-1 tabular-nums">
                  {formatCurrency(totalExpensesVal, settings.currency)}
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#EAF3FC] border border-[#4A90D9]/30 flex flex-col justify-between">
                <div className="text-[11px] text-[#123B70]">صافي رصيد الصندوق</div>
                <div className="text-base sm:text-lg font-bold text-[#123B70] mt-1 tabular-nums">
                  {formatCurrency(netFundBalance, settings.currency)}
                </div>
              </div>
            </>
          )}
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
                {(operationType === 'all' || operationType === 'subscriptions') && (
                  <>
                    <tr>
                      <td className="py-3 px-4 font-bold">إيرادات الاشتراكات والتأسيس</td>
                      <td className="py-3 px-4 text-xs text-[#748399]">
                        مجموع تحصيل الرسوم السنوية والشهرية ({filteredPayments.length} عملية سداد)
                      </td>
                      <td className="py-3 px-4 font-bold text-[#16A36A] tabular-nums">
                        {formatCurrency(totalCollectedPayments, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-xs">إيراد</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-bold">الاشتراكات المتأخرة قيد التحصيل</td>
                      <td className="py-3 px-4 text-xs text-[#748399]">
                        رصيد المستحقات المتبقية فعلياً ({overdueSubRows.length} سجل سنة)
                      </td>
                      <td className="py-3 px-4 font-bold text-[#C67B1B] tabular-nums">
                        {formatCurrency(totalOverdueRemaining, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-xs">مستحق</td>
                    </tr>
                  </>
                )}

                {!isGroupLeader && (operationType === 'all' || operationType === 'qittat') && (
                  <tr>
                    <td className="py-3 px-4 font-bold">متحصلات القطات المشتركة</td>
                    <td className="py-3 px-4 text-xs text-[#748399]">
                      إجمالي المبالغ المحصلة في قسم القطات ({filteredQittat.length} قطات)
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2878C8] tabular-nums">
                      {formatCurrency(totalQittatCollected, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-xs">تشاركي</td>
                  </tr>
                )}

                {!isGroupLeader && (operationType === 'all' || operationType === 'expenses') && (
                  <tr>
                    <td className="py-3 px-4 font-bold">المصروفات التشغيلية والإدارية</td>
                    <td className="py-3 px-4 text-xs text-[#748399]">
                      إجمالي سندات الصرف المسجلة ({filteredExpenses.length} سندات)
                    </td>
                    <td className="py-3 px-4 font-bold text-[#DC5555] tabular-nums">
                      {formatCurrency(totalExpensesVal, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-xs">مصروف</td>
                  </tr>
                )}

                {!isGroupLeader &&
                  (operationType === 'all' || operationType === 'marriage-aid') && (
                    <tr>
                      <td className="py-3 px-4 font-bold">معونات الزواج المصروفة</td>
                      <td className="py-3 px-4 text-xs text-[#748399]">
                        إجمالي المعونات المسلمة للمتزوجين (بند مستقل)
                      </td>
                      <td className="py-3 px-4 font-bold text-[#123B70] tabular-nums">
                        {formatCurrency(totalMarriageDisbursed, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-xs">منصرف</td>
                    </tr>
                  )}
              </tbody>
            </table>
          )}

          {reportType === 'member-statement' && statementMember && statementData && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#EAF3FC]/70 border border-[#4A90D9]/30 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-5 h-5 text-[#2878C8]" />
                  <div>
                    <div className="text-sm font-bold text-[#123B70]">
                      كشف حساب: {statementMember.name}
                    </div>
                    <div className="text-xs text-[#748399]">
                      الهوية: {statementMember.nationalId} · {statementMember.groupName}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs tabular-nums">
                  <span>
                    المستحق: <strong>{formatCurrency(statementData.totalDue)}</strong>
                  </span>
                  <span className="text-[#16A36A]">
                    المسدد: <strong>{formatCurrency(statementData.totalPaid)}</strong>
                  </span>
                  <span className="text-[#DC5555]">
                    المتبقي: <strong>{formatCurrency(statementData.totalRemaining)}</strong>
                  </span>
                </div>
              </div>

              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#123B70] text-white text-xs font-bold">
                    <th className="py-3 px-4">النوع</th>
                    <th className="py-3 px-4">البيان / السنة</th>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">المستحق / النصيب</th>
                    <th className="py-3 px-4">المدفوع</th>
                    <th className="py-3 px-4">المتبقي</th>
                    <th className="py-3 px-4">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {statementData.memSubs.map((s) => (
                    <tr key={`sub-${s.cfg.year}`}>
                      <td className="py-3 px-4 font-bold text-[#123B70]">اشتراك سنوي</td>
                      <td className="py-3 px-4">سنة {s.cfg.year}</td>
                      <td className="py-3 px-4 text-xs text-[#748399]">—</td>
                      <td className="py-3 px-4 tabular-nums">
                        {formatCurrency(s.totals.totalDue, settings.currency)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#16A36A] tabular-nums">
                        {formatCurrency(s.totals.totalPaid, settings.currency)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#DC5555] tabular-nums">
                        {formatCurrency(s.totals.remaining, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold">
                        {s.totals.remaining === 0
                          ? 'مسدد'
                          : isFutureScheduledYear(s.cfg.year) &&
                              toHalalas(s.totals.totalPaid) === 0 &&
                              !isSubscriptionRowOverdue(s.sub, s.totals, s.cfg.year)
                            ? 'قادم'
                            : 'متبقي'}
                      </td>
                    </tr>
                  ))}
                  {statementData.memPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="py-3 px-4 font-semibold">سند سداد</td>
                      <td className="py-3 px-4 text-xs">
                        {p.paymentMethod} — سنة {p.year}
                      </td>
                      <td className="py-3 px-4 text-xs tabular-nums">{p.date}</td>
                      <td className="py-3 px-4 tabular-nums">
                        {formatCurrency(p.dueAmount, settings.currency)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#16A36A] tabular-nums">
                        {formatCurrency(p.amount, settings.currency)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#DC5555] tabular-nums">
                        {formatCurrency(p.remainingAmount, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold">{p.status}</td>
                    </tr>
                  ))}
                  {statementData.memQittat.map(({ qitta, participant }) => (
                    <tr key={qitta.id}>
                      <td className="py-3 px-4 font-semibold">قطة تشاركية</td>
                      <td className="py-3 px-4">{qitta.name}</td>
                      <td className="py-3 px-4 text-xs tabular-nums">{qitta.createdAt}</td>
                      <td className="py-3 px-4 tabular-nums">
                        {formatCurrency(participant.shareAmount, settings.currency)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#16A36A] tabular-nums">
                        {formatCurrency(participant.paidAmount, settings.currency)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#DC5555] tabular-nums">
                        {formatCurrency(
                          Math.max(
                            0,
                            subtractCurrency(participant.shareAmount, participant.paidAmount)
                          ),
                          settings.currency
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold">{participant.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'groups' && (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#123B70] text-white text-xs font-bold">
                  <th className="py-3 px-4">اسم المجموعة</th>
                  <th className="py-3 px-4">رئيس المجموعة</th>
                  <th className="py-3 px-4">عدد الأعضاء</th>
                  <th className="py-3 px-4">إجمالي المستحق</th>
                  <th className="py-3 px-4">إجمالي المسدد</th>
                  <th className="py-3 px-4">المتبقي</th>
                  <th className="py-3 px-4">عدد المتأخرين</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {scopedGroups.map((g) => {
                  const gMembers = members.filter((m) => m.groupId === g.id);
                  const gSubRows = memberSubRows.filter((r) => r.member.groupId === g.id);
                  const due = addCurrency(...gSubRows.map((r) => r.totals.totalDue));
                  const paid = addCurrency(...gSubRows.map((r) => r.totals.totalPaid));
                  const rem = addCurrency(...gSubRows.map((r) => r.totals.remaining));
                  const overdueCnt = new Set(
                    gSubRows
                      .filter((r) => isSubscriptionRowOverdue(r.sub, r.totals, r.year))
                      .map((r) => r.member.id)
                  ).size;
                  return (
                    <tr key={g.id}>
                      <td className="py-3 px-4 font-bold text-[#172B45]">{g.name}</td>
                      <td className="py-3 px-4 text-xs font-semibold text-[#123B70]">
                        {g.leaderName}
                      </td>
                      <td className="py-3 px-4 tabular-nums">{gMembers.length} عضو</td>
                      <td className="py-3 px-4 font-bold text-[#2878C8] tabular-nums">
                        {formatCurrency(due, settings.currency)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#16A36A] tabular-nums">
                        {formatCurrency(paid, settings.currency)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#DC5555] tabular-nums">
                        {formatCurrency(rem, settings.currency)}
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
                  <th className="py-3 px-4">السنة</th>
                  <th className="py-3 px-4">المستحق</th>
                  <th className="py-3 px-4">المسدد</th>
                  <th className="py-3 px-4">المتبقي</th>
                  <th className="py-3 px-4">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {(reportType === 'overdue' ? overdueSubRows : memberSubRows).map((r) => {
                  const isFutureUntouched =
                    isFutureScheduledYear(r.year) &&
                    toHalalas(r.totals.totalPaid) === 0 &&
                    !isSubscriptionRowOverdue(r.sub, r.totals, r.year);
                  const rowStatus =
                    toHalalas(r.totals.remaining) === 0
                      ? 'مسدد'
                      : isFutureUntouched
                        ? 'قادم'
                        : toHalalas(r.totals.totalPaid) > 0
                          ? 'مسدد جزئياً'
                          : 'متأخر';
                  return (
                    <tr key={`${r.member.id}-${r.year}`}>
                      <td className="py-3 px-4 font-bold text-[#172B45]">{r.member.name}</td>
                      <td className="py-3 px-4 text-xs text-[#748399]">{r.member.groupName}</td>
                      <td className="py-3 px-4 text-xs font-semibold tabular-nums">{r.year}</td>
                      <td className="py-3 px-4 tabular-nums">
                        {formatCurrency(r.totals.totalDue, settings.currency)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#16A36A] tabular-nums">
                        {formatCurrency(r.totals.totalPaid, settings.currency)}
                      </td>
                      <td
                        className={`py-3 px-4 font-bold tabular-nums ${
                          r.totals.remaining > 0
                            ? isFutureUntouched
                              ? 'text-[#748399]'
                              : 'text-[#DC5555]'
                            : 'text-[#748399]'
                        }`}
                      >
                        {formatCurrency(r.totals.remaining, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold">{rowStatus}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'monthly-subs' && activeConfig && (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#123B70] text-white text-xs font-bold">
                  <th className="py-3 px-4">الشهر ({activeConfig.year})</th>
                  <th className="py-3 px-4">قيمة الاشتراك الشهري</th>
                  <th className="py-3 px-4">إجمالي المسددين</th>
                  <th className="py-3 px-4">المتأخرين / الجزئي</th>
                  <th className="py-3 px-4">نسبة الالتزام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {ARABIC_MONTHS.slice(0, activeConfig.monthsCount).map((month, idx) => {
                  const paidCnt = scopedMembers.filter((m) => {
                    const sub = subscriptions.find(
                      (s) => s.memberId === m.id && s.year === activeConfig.year
                    );
                    return sub?.months[idx] === 'paid';
                  }).length;
                  const totalCnt = scopedMembers.length;
                  const pct = totalCnt > 0 ? Math.round((paidCnt / totalCnt) * 100) : 0;
                  return (
                    <tr key={month}>
                      <td className="py-3 px-4 font-bold">{month}</td>
                      <td className="py-3 px-4 tabular-nums">
                        {formatCurrency(activeConfig.monthlyFee, settings.currency)}
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
                  <th className="py-3 px-4">السنة</th>
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
                    <td className="py-3 px-4 text-xs tabular-nums">{p.year}</td>
                    <td className="py-3 px-4 tabular-nums">
                      {formatCurrency(p.dueAmount, settings.currency)}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#16A36A] tabular-nums">
                      {formatCurrency(p.amount, settings.currency)}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#DC5555] tabular-nums">
                      {formatCurrency(p.remainingAmount, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-xs">{p.paymentMethod}</td>
                    <td className="py-3 px-4 text-xs tabular-nums">{p.date}</td>
                    <td className="py-3 px-4 text-xs font-semibold">{p.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'expenses' && !isGroupLeader && (
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#123B70] text-white text-xs font-bold">
                  <th className="py-3 px-4">رقم العملية</th>
                  <th className="py-3 px-4">عنوان المصروف</th>
                  <th className="py-3 px-4">التصنيف</th>
                  <th className="py-3 px-4">السنة</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">الرصيد بعد المصروف</th>
                  <th className="py-3 px-4">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredExpenses.map((e) => (
                  <tr key={e.id}>
                    <td className="py-3 px-4 font-bold tabular-nums">{e.operationNumber}</td>
                    <td className="py-3 px-4 font-semibold">{e.title}</td>
                    <td className="py-3 px-4 text-xs">{e.category}</td>
                    <td className="py-3 px-4 text-xs tabular-nums">{e.year}</td>
                    <td className="py-3 px-4 font-bold text-[#DC5555] tabular-nums">
                      {formatCurrency(e.amount, settings.currency)}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#123B70] tabular-nums">
                      {formatCurrency(e.balanceAfter, settings.currency)}
                    </td>
                    <td className="py-3 px-4 text-xs tabular-nums">{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {reportType === 'qittat' && !isGroupLeader && (
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
                {filteredQittat.map((q) => {
                  const col = addCurrency(...q.participants.map((p) => p.paidAmount));
                  return (
                    <tr key={q.id}>
                      <td className="py-3 px-4 font-bold">{q.name}</td>
                      <td className="py-3 px-4 text-xs text-[#748399]">{q.reason}</td>
                      <td className="py-3 px-4 tabular-nums">
                        {formatCurrency(q.totalAmount, settings.currency)}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#16A36A] tabular-nums">
                        {formatCurrency(col, settings.currency)}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold">{q.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {reportType === 'marriage-aid' && !isGroupLeader && (
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
                {filteredMarriageAids.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3 px-4 font-bold">{a.memberName}</td>
                    <td className="py-3 px-4 text-xs tabular-nums">{a.nationalId}</td>
                    <td className="py-3 px-4 font-bold text-[#123B70] tabular-nums">
                      {formatCurrency(a.amount, settings.currency)}
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
          <div>
            تم إنشاء هذا الكشف آلياً من نظام {settings.fundName} – {settings.subName}
          </div>
          <div className="flex items-center gap-8 font-semibold text-[#172B45]">
            <span>المُصدر: {currentUser.name}</span>
            <span>الختم والاعتماد: إدارة الصندوق</span>
          </div>
        </div>
      </div>
    </div>
  );
}
