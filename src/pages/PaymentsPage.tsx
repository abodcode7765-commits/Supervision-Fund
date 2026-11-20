import React, { useState } from 'react';
import {
  Plus,
  ReceiptText,
  Wallet,
  Clock,
  CalendarCheck,
  Search,
  Eye,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import {
  Group,
  Member,
  MemberYearSubscription,
  PaymentMethod,
  PaymentRecord,
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
  getTodayIsoDate,
  roundCurrency,
  subtractCurrency,
  toHalalas,
} from '../utils/formatters';

export function PaymentsPage({
  payments,
  members,
  groups,
  yearConfigs,
  subscriptions,
  onAddPayment,
  onUpdatePayment,
  onSelectMember,
}: {
  payments: PaymentRecord[];
  members: Member[];
  groups: Group[];
  yearConfigs: YearConfig[];
  subscriptions: MemberYearSubscription[];
  onAddPayment: (record: Omit<PaymentRecord, 'id'>) => { ok: boolean; error?: string };
  onUpdatePayment: (record: PaymentRecord) => { ok: boolean; error?: string };
  onSelectMember: (memberId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [detailPayment, setDetailPayment] = useState<PaymentRecord | null>(null);

  const [memberId, setMemberId] = useState(members[0]?.id ?? '');
  const [year, setYear] = useState(() => getDefaultActiveYear(yearConfigs));
  const [includeFounding, setIncludeFounding] = useState(true);
  const [selectedMonthIndices, setSelectedMonthIndices] = useState<number[]>([]);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('تحويل بنكي');
  const [date, setDate] = useState(getTodayIsoDate());
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real dynamic KPIs
  const totalPaidAll = addCurrency(...payments.map((p) => p.amount));
  const operationsCount = payments.length;
  const currentMonthPrefix = getTodayIsoDate().slice(0, 7);
  const thisMonthCount = payments.filter((p) => p.date.startsWith(currentMonthPrefix)).length;

  // Real remaining partial arrears across subscriptions for active current year
  const latestYear = getDefaultActiveYear(yearConfigs);
  const latestCfg = yearConfigs.find((y) => y.year === latestYear);
  const totalOutstandingSubscriptions = addCurrency(
    ...members.map((m) => {
      const sub =
        subscriptions.find((s) => s.memberId === m.id && s.year === latestYear) ??
        createDefaultSubscription(m.id, latestYear);
      return computeMemberYearTotals(sub, latestCfg).remaining;
    })
  );

  // Selected member & year subscription calculation for modal preview
  const activeCfg = yearConfigs.find((y) => y.year === year) ?? yearConfigs[0];
  const currentSub =
    subscriptions.find((s) => s.memberId === memberId && s.year === year) ??
    (memberId ? createDefaultSubscription(memberId, year) : undefined);
  const currentTotals = computeMemberYearTotals(currentSub, activeCfg);

  const availableRemainingForModal = editingPayment
    ? addCurrency(
        currentTotals.remaining,
        editingPayment.memberId === memberId && editingPayment.year === year
          ? editingPayment.amount
          : 0
      )
    : currentTotals.remaining;

  const openAddModal = () => {
    const defaultMember = members[0];
    const defaultYear = getDefaultActiveYear(yearConfigs);
    const sub = defaultMember
      ? subscriptions.find(
          (s) => s.memberId === defaultMember.id && s.year === defaultYear
        ) ?? createDefaultSubscription(defaultMember.id, defaultYear)
      : undefined;
    const cfg = yearConfigs.find((y) => y.year === defaultYear);
    const totals = computeMemberYearTotals(sub, cfg);

    setEditingPayment(null);
    setMemberId(defaultMember?.id ?? '');
    setYear(defaultYear);
    setIncludeFounding(totals.foundingRemaining > 0);
    setSelectedMonthIndices(totals.unpaidMonthIndices.slice(0, 1));
    setPaidAmount(totals.remaining);
    setPaymentMethod('تحويل بنكي');
    setDate(getTodayIsoDate());
    setNotes('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (pay: PaymentRecord) => {
    setEditingPayment(pay);
    setMemberId(pay.memberId);
    setYear(pay.year);
    setIncludeFounding((pay.allocatedToFounding ?? 0) > 0);
    setSelectedMonthIndices(pay.allocatedMonthIndices ?? []);
    setPaidAmount(pay.amount);
    setPaymentMethod(pay.paymentMethod);
    setDate(pay.date);
    setNotes(pay.notes);
    setFormError('');
    setModalOpen(true);
  };

  const handleMemberOrYearChange = (nextMemberId: string, nextYear: number) => {
    setMemberId(nextMemberId);
    setYear(nextYear);
    setFormError('');
    if (!editingPayment) {
      const sub = nextMemberId
        ? subscriptions.find(
            (s) => s.memberId === nextMemberId && s.year === nextYear
          ) ?? createDefaultSubscription(nextMemberId, nextYear)
        : undefined;
      const cfg = yearConfigs.find((y) => y.year === nextYear);
      const totals = computeMemberYearTotals(sub, cfg);
      setIncludeFounding(totals.foundingRemaining > 0);
      setSelectedMonthIndices(totals.unpaidMonthIndices.slice(0, 1));
      setPaidAmount(totals.remaining);
    }
  };

  const toggleMonthIndex = (idx: number) => {
    setSelectedMonthIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx].sort((a, b) => a - b)
    );
  };

  const buildLabelFromSelection = (isPartial: boolean) => {
    const parts: string[] = [];
    if (includeFounding && currentTotals.foundingRemaining > 0) {
      parts.push('رسوم التأسيس');
    }
    if (selectedMonthIndices.length > 0) {
      parts.push(selectedMonthIndices.map((i) => ARABIC_MONTHS[i]).join(' - '));
    }
    if (parts.length === 0) {
      parts.push(`سداد اشتراك ${year}`);
    }
    return `${parts.join(' + ')}${isPartial ? ' (دفعة جزئية)' : ''}`;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const member = members.find((m) => m.id === memberId);
    if (!member) {
      setFormError('يرجى اختيار عضو صحيح.');
      return;
    }
    if (toHalalas(paidAmount) <= 0) {
      setFormError('يجب إدخال مبلغ مدفوع أكبر من صفر.');
      return;
    }
    if (toHalalas(paidAmount) > toHalalas(availableRemainingForModal)) {
      setFormError(
        `المبلغ المدفوع (${formatCurrency(paidAmount)}) يتجاوز إجمالي المتبقي على العضو (${formatCurrency(availableRemainingForModal)}).`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const remAfter = Math.max(0, subtractCurrency(availableRemainingForModal, paidAmount));
      const isPartial = toHalalas(remAfter) > 0;
      const allocFounding =
        includeFounding && currentTotals.foundingRemaining > 0
          ? Math.min(roundCurrency(paidAmount), currentTotals.foundingRemaining)
          : 0;

      if (editingPayment) {
        const res = onUpdatePayment({
          ...editingPayment,
          memberId: member.id,
          memberName: member.name,
          nationalId: member.nationalId,
          groupId: member.groupId,
          groupName: member.groupName,
          year,
          monthsLabel: buildLabelFromSelection(isPartial),
          allocatedToFounding: allocFounding,
          allocatedMonthIndices: selectedMonthIndices,
          dueAmount: availableRemainingForModal,
          amount: roundCurrency(paidAmount),
          remainingAmount: remAfter,
          paymentMethod,
          date,
          status: isPartial ? 'مدفوع جزئياً' : 'مكتمل',
          notes: notes.trim() || editingPayment.notes,
        });
        if (!res.ok) {
          setFormError(res.error ?? 'تعذر تحديث السداد.');
          return;
        }
      } else {
        const res = onAddPayment({
          memberId: member.id,
          memberName: member.name,
          nationalId: member.nationalId,
          groupId: member.groupId,
          groupName: member.groupName,
          year,
          monthsLabel: buildLabelFromSelection(isPartial),
          allocatedToFounding: allocFounding,
          allocatedMonthIndices: selectedMonthIndices,
          dueAmount: availableRemainingForModal,
          amount: roundCurrency(paidAmount),
          remainingAmount: remAfter,
          paymentMethod,
          date,
          status: isPartial ? 'مدفوع جزئياً' : 'مكتمل',
          notes:
            notes.trim() ||
            (isPartial
              ? `سداد جزئي بمبلغ ${formatCurrency(paidAmount)} والمتبقي السنوي ${formatCurrency(remAfter)}.`
              : `سداد مكتمل لسنة ${year}.`),
        });
        if (!res.ok) {
          setFormError(res.error ?? 'تعذر تسجيل السداد.');
          return;
        }
      }

      setModalOpen(false);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = payments.filter((p) => {
    const q = search.trim();
    const matchesSearch =
      !q ||
      p.memberName.includes(q) ||
      p.nationalId.includes(q) ||
      p.groupName.includes(q) ||
      p.monthsLabel.includes(q);
    const matchesYear = yearFilter === 'all' || String(p.year) === yearFilter;
    const grp = groups.find((g) => g.id === groupFilter);
    const matchesGroup =
      groupFilter === 'all' || p.groupId === groupFilter || p.groupName === grp?.name;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesYear && matchesGroup && matchesStatus;
  });

  const modalRemainingPreview = Math.max(
    0,
    subtractCurrency(
      availableRemainingForModal,
      Math.max(0, Number.isFinite(paidAmount) ? paidAmount : 0)
    )
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        title="سجل السداد والمدفوعات"
        description="تسجيل المدفوعات الكاملة والجزئية وربطها المباشر بجدول اشتراكات العضو ومتأخراته."
        action={
          <button
            type="button"
            onClick={openAddModal}
            className="w-full sm:w-auto h-10 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل سداد جديد</span>
          </button>
        }
      />

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4">
        <StatCard
          title="إجمالي المبالغ المسددة"
          value={formatCurrency(totalPaidAll)}
          subtitle="مجموع التحصيل الفعلي المسجل"
          icon={Wallet}
          accent="green"
        />
        <StatCard
          title="عدد عمليات السداد"
          value={`${operationsCount} عملية`}
          subtitle="كافة السندات والدفعات المسجلة"
          icon={ReceiptText}
          accent="royal"
        />
        <StatCard
          title={`المتبقي للتحصيل (${latestYear})`}
          value={formatCurrency(totalOutstandingSubscriptions)}
          subtitle="إجمالي المتبقي على الأعضاء في السنة الحالية"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          title="عمليات هذا الشهر"
          value={`${thisMonthCount} عملية`}
          subtitle={`الشهر الحالي (${currentMonthPrefix})`}
          icon={CalendarCheck}
          accent="blue"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-5 relative">
          <Search className="w-4 h-4 text-[#748399] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم العضو، رقم الهوية، أو البيان..."
            className="w-full h-11 pr-10 pl-4 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm focus:bg-white focus:outline-none focus:border-[#2878C8]"
          />
        </div>
        <div className="lg:col-span-2">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
          >
            <option value="all">جميع السنوات</option>
            {yearConfigs.map((y) => (
              <option key={y.year} value={String(y.year)}>
                سنة {y.year}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-3">
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
          >
            <option value="all">جميع المجموعات</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="lg:col-span-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
          >
            <option value="all">جميع الحالات</option>
            <option value="مكتمل">مكتمل</option>
            <option value="مدفوع جزئياً">مدفوع جزئياً</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold text-[#748399]">
                <th className="py-3.5 px-4">اسم العضو</th>
                <th className="py-3.5 px-4">المجموعة</th>
                <th className="py-3.5 px-4">السنة</th>
                <th className="py-3.5 px-4">الأشهر / البيان</th>
                <th className="py-3.5 px-4">المستحق قبل</th>
                <th className="py-3.5 px-4">المدفوع</th>
                <th className="py-3.5 px-4">المتبقي بعد</th>
                <th className="py-3.5 px-4">طريقة الدفع</th>
                <th className="py-3.5 px-4">التاريخ</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filtered.map((pay) => (
                <tr key={pay.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectMember(pay.memberId)}
                      className="font-bold text-[#123B70] hover:text-[#2878C8] hover:underline cursor-pointer"
                    >
                      {pay.memberName}
                    </button>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#748399] whitespace-nowrap">
                    {pay.groupName}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-bold tabular-nums">{pay.year}</td>
                  <td className="py-3.5 px-4 text-xs text-[#172B45] max-w-[200px]">
                    {pay.monthsLabel}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-[#172B45] tabular-nums whitespace-nowrap">
                    {formatCurrency(pay.dueAmount)}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#16A36A] tabular-nums whitespace-nowrap">
                    {formatCurrency(pay.amount)}
                  </td>
                  <td
                    className={`py-3.5 px-4 font-bold tabular-nums whitespace-nowrap ${
                      pay.remainingAmount > 0 ? 'text-[#DC5555]' : 'text-[#748399]'
                    }`}
                  >
                    {formatCurrency(pay.remainingAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#172B45] whitespace-nowrap">
                    {pay.paymentMethod}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#748399] tabular-nums whitespace-nowrap">
                    {pay.date}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusIndicator
                      label={pay.status}
                      tone={pay.status === 'مكتمل' ? 'success' : 'warning'}
                    />
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => setDetailPayment(pay)}
                        title="عرض تفاصيل السداد"
                        className="p-2 rounded-lg text-[#2878C8] hover:bg-[#EAF3FC] cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(pay)}
                        title="تعديل عملية السداد"
                        className="p-2 rounded-lg text-[#172B45] hover:bg-slate-100 cursor-pointer"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards (Uniform height and equal action button sizing) */}
      <div className="md:hidden space-y-3">
        {filtered.map((pay) => (
          <div key={pay.id} className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <button
                  type="button"
                  onClick={() => onSelectMember(pay.memberId)}
                  className="text-sm font-bold text-[#123B70] truncate block"
                >
                  {pay.memberName}
                </button>
                <div className="text-[11px] text-[#748399] truncate">
                  {pay.groupName} · {pay.paymentMethod}
                </div>
              </div>
              <StatusIndicator
                label={pay.status}
                tone={pay.status === 'مكتمل' ? 'success' : 'warning'}
              />
            </div>

            <div className="text-xs text-[#172B45]">
              <span className="font-bold tabular-nums">{pay.year}</span> · {pay.monthsLabel}
            </div>

            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#F8FAFC] text-center text-[11px] tabular-nums">
              <div>
                <div className="text-[#748399]">المستحق قبل</div>
                <div className="font-bold text-[#172B45]">{formatCurrency(pay.dueAmount)}</div>
              </div>
              <div>
                <div className="text-[#748399]">المدفوع</div>
                <div className="font-bold text-[#16A36A]">{formatCurrency(pay.amount)}</div>
              </div>
              <div>
                <div className="text-[#748399]">المتبقي بعد</div>
                <div
                  className={`font-bold ${
                    pay.remainingAmount > 0 ? 'text-[#DC5555]' : 'text-[#748399]'
                  }`}
                >
                  {formatCurrency(pay.remainingAmount)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-[#748399] tabular-nums">
              <span>تاريخ العملية: {pay.date}</span>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDetailPayment(pay)}
                className="h-9 rounded-lg bg-[#EAF3FC] text-[#2878C8] text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>التفاصيل</span>
              </button>
              <button
                type="button"
                onClick={() => openEditModal(pay)}
                className="h-9 rounded-lg bg-slate-100 text-[#172B45] text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>تعديل</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* View Payment Details Modal */}
      <Modal
        isOpen={Boolean(detailPayment)}
        onClose={() => setDetailPayment(null)}
        title="تفاصيل عملية السداد"
        subtitle={detailPayment?.memberName}
        size="sm"
      >
        {detailPayment && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#748399]">العضو:</span>
                <strong className="text-[#123B70]">{detailPayment.memberName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">المجموعة:</span>
                <strong>{detailPayment.groupName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">السنة المالية:</span>
                <strong className="tabular-nums">{detailPayment.year}</strong>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#748399] shrink-0">البيان:</span>
                <strong className="text-left">{detailPayment.monthsLabel}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">المستحق قبل السداد:</span>
                <strong className="tabular-nums">{formatCurrency(detailPayment.dueAmount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">المبلغ المدفوع:</span>
                <strong className="text-[#16A36A] tabular-nums">
                  {formatCurrency(detailPayment.amount)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">المتبقي بعد السداد:</span>
                <strong className="text-[#DC5555] tabular-nums">
                  {formatCurrency(detailPayment.remainingAmount)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">طريقة الدفع:</span>
                <strong>{detailPayment.paymentMethod}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">تاريخ السداد:</span>
                <strong className="tabular-nums">{detailPayment.date}</strong>
              </div>
            </div>

            {detailPayment.notes && (
              <div className="p-3 rounded-xl border border-slate-200 text-[#748399]">
                <div className="font-bold text-[#172B45] mb-1">ملاحظات:</div>
                {detailPayment.notes}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDetailPayment(null)}
                className="h-10 px-5 rounded-xl bg-[#2878C8] text-white font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Record / Edit Payment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPayment ? 'تعديل عملية السداد' : 'تسجيل سداد جديد (دعم الدفع الكامل والجزئي)'}
        subtitle="ينعكس المبلغ المدفوع مباشرة على اشتراك العضو ومتأخراته ورصيد الصندوق"
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#DC5555]/10 border border-[#DC5555]/25 text-[#DC5555] text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">اختيار العضو</label>
              <select
                value={memberId}
                disabled={Boolean(editingPayment)}
                onChange={(e) => handleMemberOrYearChange(e.target.value, year)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm disabled:bg-slate-100 focus:outline-none focus:border-[#2878C8]"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.groupName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">السنة المالية</label>
              <select
                value={year}
                disabled={Boolean(editingPayment)}
                onChange={(e) => handleMemberOrYearChange(memberId, Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm disabled:bg-slate-100 focus:outline-none focus:border-[#2878C8]"
              >
                {yearConfigs.map((y) => (
                  <option key={y.year} value={y.year}>
                    {y.year} (التأسيس {y.foundingFee} + الشهري {y.monthlyFee} ر.س)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Live Member Annual Account Snapshot */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-center text-xs tabular-nums">
            <div>
              <div className="text-[11px] text-[#748399]">إجمالي السنة</div>
              <div className="font-bold text-[#172B45] mt-0.5">
                {formatCurrency(currentTotals.totalDue)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#748399]">المسدد مسبقاً</div>
              <div className="font-bold text-[#16A36A] mt-0.5">
                {formatCurrency(currentTotals.totalPaid)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#748399]">المتبقي القابل للسداد</div>
              <div className="font-bold text-[#DC5555] mt-0.5">
                {formatCurrency(availableRemainingForModal)}
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold text-[#172B45]">
                توجيه السداد (اختياري — يتوزع تلقائياً إن لم تحدد)
              </label>
              {currentTotals.foundingRemaining > 0 && (
                <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#123B70] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFounding}
                    onChange={(e) => setIncludeFounding(e.target.checked)}
                    className="w-4 h-4 accent-[#2878C8]"
                  />
                  <span>يشمل رسوم التأسيس ({formatCurrency(currentTotals.foundingRemaining)})</span>
                </label>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ARABIC_MONTHS.map((m, idx) => {
                const checked = selectedMonthIndices.includes(idx);
                const monthPaid = currentTotals.monthPaidAmounts[idx] ?? 0;
                const isAlreadyPaid =
                  !editingPayment &&
                  activeCfg &&
                  toHalalas(monthPaid) >= toHalalas(activeCfg.monthlyFee);
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={isAlreadyPaid}
                    onClick={() => toggleMonthIndex(idx)}
                    className={`h-9 px-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
                      checked
                        ? 'bg-[#2878C8] text-white border-[#2878C8]'
                        : 'bg-[#F8FAFC] text-[#172B45] border-slate-200 hover:border-[#2878C8]'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                المبلغ المدفوع فعلياً (ر.س)
              </label>
              <input
                type="number"
                required
                min={0.01}
                step="0.01"
                value={paidAmount}
                onChange={(e) => {
                  setPaidAmount(Number(e.target.value) || 0);
                  setFormError('');
                }}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-[#16A36A] tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                المتبقي على العضو بعد الدفعة
              </label>
              <div className="h-11 px-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] flex items-center justify-between text-sm font-bold tabular-nums">
                <span className={modalRemainingPreview > 0 ? 'text-[#DC5555]' : 'text-[#16A36A]'}>
                  {formatCurrency(modalRemainingPreview)}
                </span>
                <span className="text-[11px] font-semibold text-[#748399]">
                  {modalRemainingPreview > 0 ? 'مدفوع جزئياً' : 'مكتمل'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">طريقة الدفع</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              >
                <option value="تحويل بنكي">تحويل بنكي</option>
                <option value="نقدي">نقدي</option>
                <option value="شيك">شيك</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">تاريخ الدفع</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">ملاحظات</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="رقم الحوالة أو تفاصيل الدفعة الجزئية..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="h-10 px-4 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || availableRemainingForModal <= 0}
              className="h-10 px-5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] disabled:opacity-50 text-sm font-semibold text-white cursor-pointer"
            >
              {editingPayment ? 'حفظ التعديلات' : 'حفظ الدفعة'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
