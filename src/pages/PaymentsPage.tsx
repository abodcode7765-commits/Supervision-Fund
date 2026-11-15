import React, { useState } from 'react';
import {
  Plus,
  ReceiptText,
  Wallet,
  Clock,
  CalendarCheck,
  Search,
} from 'lucide-react';
import {
  Member,
  PaymentMethod,
  PaymentRecord,
  YearConfig,
} from '../types';
import { ARABIC_MONTHS } from '../data/mockData';
import { Modal, PageHeader, StatCard, StatusIndicator } from '../components/ui/SharedUI';
import { formatCurrency } from '../utils/formatters';

export function PaymentsPage({
  payments,
  members,
  yearConfigs,
  onAddPayment,
  onSelectMember,
}: {
  payments: PaymentRecord[];
  members: Member[];
  yearConfigs: YearConfig[];
  onAddPayment: (record: Omit<PaymentRecord, 'id'>) => void;
  onSelectMember: (memberId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const [memberId, setMemberId] = useState(members[0]?.id ?? '');
  const [year, setYear] = useState(yearConfigs[0]?.year ?? 2026);
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['أغسطس', 'سبتمبر', 'أكتوبر']);
  const [dueAmount, setDueAmount] = useState(300);
  const [paidAmount, setPaidAmount] = useState(100);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('تحويل بنكي');
  const [date, setDate] = useState('2026-11-15');
  const [notes, setNotes] = useState('');

  const remainingCalc = Math.max(0, dueAmount - paidAmount);
  const derivedStatus = remainingCalc > 0 ? 'مدفوع جزئياً' : 'مكتمل';

  const totalPaid = 35400 + payments.slice(9).reduce((s, p) => s + p.amount, 0);
  const operationsCount = 148 + Math.max(0, payments.length - 9);
  const remainingPartialTotal = payments.reduce((s, p) => s + p.remainingAmount, 0);
  const thisMonthCount = payments.filter((p) => p.date.startsWith('2026-11')).length + 18;

  const toggleMonth = (month: string) => {
    const cfg = yearConfigs.find((y) => y.year === year);
    const monthlyFee = cfg?.monthlyFee ?? 50;
    const next = selectedMonths.includes(month)
      ? selectedMonths.filter((m) => m !== month)
      : [...selectedMonths, month];
    setSelectedMonths(next);
    const computedDue = Math.max(monthlyFee, next.length * monthlyFee);
    setDueAmount(computedDue);
    setPaidAmount(computedDue);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const member = members.find((m) => m.id === memberId);
    if (!member || paidAmount <= 0) return;

    const actualPaid = Math.min(paidAmount, dueAmount);
    const actualRemaining = Math.max(0, dueAmount - actualPaid);
    const finalStatus = actualRemaining > 0 ? 'مدفوع جزئياً' : 'مكتمل';

    onAddPayment({
      memberId: member.id,
      memberName: member.name,
      nationalId: member.nationalId,
      groupName: member.groupName,
      year,
      monthsLabel:
        selectedMonths.length > 0
          ? `${selectedMonths.join(' - ')}${actualRemaining > 0 ? ' (دفعة جزئية)' : ''}`
          : 'دفعة اشتراك',
      dueAmount,
      amount: actualPaid,
      remainingAmount: actualRemaining,
      paymentMethod,
      date,
      status: finalStatus,
      notes:
        notes.trim() ||
        (actualRemaining > 0
          ? `سداد جزئي بمبلغ ${actualPaid} ر.س من أصل ${dueAmount} ر.س.`
          : 'سداد مكتمل.'),
    });
    setModalOpen(false);
    setNotes('');
  };

  const filtered = payments.filter((p) => {
    const q = search.trim();
    const matchesSearch =
      !q ||
      p.memberName.includes(q) ||
      p.nationalId.includes(q) ||
      p.groupName.includes(q);
    const matchesYear = yearFilter === 'all' || String(p.year) === yearFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesYear && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="سجل السداد والمدفوعات"
        description="تسجيل المدفوعات الكاملة والجزئية ومتابعة المبالغ المستحقة والمدفوعة والمتبقية."
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل سداد جديد</span>
          </button>
        }
      />

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المبالغ المسددة"
          value={formatCurrency(totalPaid)}
          subtitle="مجموع التحصيل الموثق بالصندوق"
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
          title="المبالغ المتبقية من الدفعات"
          value={formatCurrency(remainingPartialTotal)}
          subtitle="متبقي السداد الجزئي في السجل"
          icon={Clock}
          accent="amber"
        />
        <StatCard
          title="عمليات السداد لهذا الشهر"
          value={`${thisMonthCount} عملية`}
          subtitle="شهر نوفمبر 2026"
          icon={CalendarCheck}
          accent="blue"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-[#748399] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم العضو، رقم الهوية، أو المجموعة..."
            className="w-full h-11 pr-10 pl-4 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm focus:bg-white focus:outline-none focus:border-[#2878C8]"
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
          >
            <option value="all">جميع السنوات</option>
            {yearConfigs.map((y) => (
              <option key={y.year} value={String(y.year)}>
                سنة {y.year}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
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
                <th className="py-3.5 px-4">المستحق</th>
                <th className="py-3.5 px-4">المدفوع</th>
                <th className="py-3.5 px-4">المتبقي</th>
                <th className="py-3.5 px-4">طريقة الدفع</th>
                <th className="py-3.5 px-4">تاريخ السداد</th>
                <th className="py-3.5 px-4">الحالة</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((pay) => (
          <div key={pay.id} className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <button
                  type="button"
                  onClick={() => onSelectMember(pay.memberId)}
                  className="text-sm font-bold text-[#123B70]"
                >
                  {pay.memberName}
                </button>
                <div className="text-[11px] text-[#748399]">
                  {pay.groupName} · {pay.paymentMethod}
                </div>
              </div>
              <StatusIndicator
                label={pay.status}
                tone={pay.status === 'مكتمل' ? 'success' : 'warning'}
              />
            </div>

            <div className="text-xs text-[#172B45]">
              {pay.year} · {pay.monthsLabel}
            </div>

            <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-[#F8FAFC] text-center text-[11px] tabular-nums">
              <div>
                <div className="text-[#748399]">المستحق</div>
                <div className="font-bold text-[#172B45]">{formatCurrency(pay.dueAmount)}</div>
              </div>
              <div>
                <div className="text-[#748399]">المدفوع</div>
                <div className="font-bold text-[#16A36A]">{formatCurrency(pay.amount)}</div>
              </div>
              <div>
                <div className="text-[#748399]">المتبقي</div>
                <div
                  className={`font-bold ${
                    pay.remainingAmount > 0 ? 'text-[#DC5555]' : 'text-[#748399]'
                  }`}
                >
                  {formatCurrency(pay.remainingAmount)}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#748399] tabular-nums text-left">{pay.date}</div>
          </div>
        ))}
      </div>

      {/* Record Payment Modal with Partial Payment Support */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تسجيل سداد جديد (دعم الدفع الكامل والجزئي)"
        subtitle="أدخل المبلغ المستحق والمبلغ المدفوع ليتم حساب المتبقي وتحديد الحالة تلقائياً"
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">اختيار العضو</label>
              <select
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
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
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              >
                {yearConfigs.map((y) => (
                  <option key={y.year} value={y.year}>
                    {y.year} (الاشتراك الشهري {y.monthlyFee} ر.س)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-2">
              الأشهر التي تغطيها الدفعة
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {ARABIC_MONTHS.map((m) => {
                const checked = selectedMonths.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => toggleMonth(m)}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                إجمالي المبلغ المستحق (ر.س)
              </label>
              <input
                type="number"
                required
                min={1}
                value={dueAmount}
                onChange={(e) => setDueAmount(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                المبلغ المدفوع فعلياً (ر.س)
              </label>
              <input
                type="number"
                required
                min={1}
                max={dueAmount}
                value={paidAmount}
                onChange={(e) => setPaidAmount(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold text-[#16A36A] tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                المبلغ المتبقي (تلقائي)
              </label>
              <div className="h-11 px-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] flex items-center justify-between text-sm font-bold tabular-nums">
                <span className={remainingCalc > 0 ? 'text-[#DC5555]' : 'text-[#16A36A]'}>
                  {formatCurrency(remainingCalc)}
                </span>
              </div>
            </div>
          </div>

          {/* Live Partial Payment Preview Strip */}
          <div
            className={`p-3 rounded-xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
              remainingCalc > 0
                ? 'bg-[#E99A35]/12 border-[#E99A35]/35 text-[#9A5B0D]'
                : 'bg-[#16A36A]/10 border-[#16A36A]/25 text-[#16A36A]'
            }`}
          >
            <span>
              حالة السداد المحتسبة: <strong>{derivedStatus}</strong>
            </span>
            <span className="tabular-nums">
              المستحق: {formatCurrency(dueAmount)} · المدفوع: {formatCurrency(paidAmount)} ·
              المتبقي: {formatCurrency(remainingCalc)}
            </span>
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
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-sm font-semibold text-white cursor-pointer"
            >
              حفظ الدفعة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
