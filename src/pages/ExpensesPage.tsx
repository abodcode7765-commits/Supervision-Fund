import React, { useState } from 'react';
import {
  Plus,
  Wallet,
  Calendar,
  FileSpreadsheet,
  Landmark,
} from 'lucide-react';
import { Expense, ExpenseCategory, PaymentRecord } from '../types';
import { Modal, PageHeader, StatCard } from '../components/ui/SharedUI';
import { ExpenseCategoryChart } from '../components/charts/DashboardCharts';
import { formatCurrency } from '../utils/formatters';

const CATEGORIES: ExpenseCategory[] = [
  'ضيافة ومناسبات',
  'مساعدات عاجلة',
  'تشغيل وإدارة',
  'صيانة ومرافق',
  'دعم أسري',
];

export function ExpensesPage({
  expenses,
  payments,
  onAddExpense,
}: {
  expenses: Expense[];
  payments: PaymentRecord[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'operationNumber'>) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(500);
  const [date, setDate] = useState('2026-11-15');
  const [category, setCategory] = useState<ExpenseCategory>('ضيافة ومناسبات');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const extraPayments = payments.slice(9).reduce((s, p) => s + p.amount, 0);
  const totalRevenue = 35400 + extraPayments;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const currentFundBalance = totalRevenue - totalExpenses;
  const monthExpenses = expenses
    .filter((e) => e.date.startsWith('2026-11'))
    .reduce((s, e) => s + e.amount, 0);

  const categoryTotals = CATEGORIES.map((cat) => ({
    category: cat,
    amount: expenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.amount > 0);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddExpense({
      title: title.trim(),
      amount,
      balanceBefore: currentFundBalance,
      balanceAfter: currentFundBalance - amount,
      date,
      category,
      reason: reason.trim() || title.trim(),
      recordedBy: 'محمد محسن',
      notes: notes.trim() || 'تم الصرف بموجب سند معتمد.',
    });
    setTitle('');
    setReason('');
    setNotes('');
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="مصروفات الصندوق"
        description="توثيق ومراقبة جميع بنود الصرف وأثر كل مصروف على رصيد الصندوق."
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل مصروف جديد</span>
          </button>
        }
      />

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي المصروفات"
          value={formatCurrency(totalExpenses)}
          subtitle="مجموع المصروفات الموثقة"
          icon={Wallet}
          accent="red"
        />
        <StatCard
          title="مصروفات الشهر الحالي"
          value={formatCurrency(monthExpenses)}
          subtitle="نوفمبر 2026"
          icon={Calendar}
          accent="amber"
        />
        <StatCard
          title="عدد عمليات الصرف"
          value={`${expenses.length} عمليات`}
          subtitle="سندات صرف مسجلة"
          icon={FileSpreadsheet}
          accent="royal"
        />
        <StatCard
          title="رصيد الصندوق بعد المصروفات"
          value={formatCurrency(currentFundBalance)}
          subtitle={`الإيرادات ${formatCurrency(totalRevenue)}`}
          icon={Landmark}
          accent="green"
        />
      </div>

      {/* Category Chart + Expenses Table with Before/After Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <ExpenseCategoryChart items={categoryTotals} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-bold text-[#172B45]">
              سجل عمليات الصرف وأثرها على الرصيد
            </h3>
            <span className="text-xs font-semibold text-[#123B70] tabular-nums">
              الرصيد الحالي: {formatCurrency(currentFundBalance)}
            </span>
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold text-[#748399]">
                  <th className="py-3 px-4">رقم العملية</th>
                  <th className="py-3 px-4">عنوان المصروف والسبب</th>
                  <th className="py-3 px-4">التصنيف</th>
                  <th className="py-3 px-4">المبلغ</th>
                  <th className="py-3 px-4">الرصيد قبل</th>
                  <th className="py-3 px-4">الرصيد بعد</th>
                  <th className="py-3 px-4">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3.5 px-4 text-xs font-bold text-[#2878C8] tabular-nums whitespace-nowrap">
                      {exp.operationNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#172B45]">{exp.title}</div>
                      <div className="text-[11px] text-[#748399]">{exp.reason}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#172B45] whitespace-nowrap">
                      {exp.category}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#DC5555] tabular-nums whitespace-nowrap">
                      -{formatCurrency(exp.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#748399] tabular-nums whitespace-nowrap">
                      {formatCurrency(exp.balanceBefore)}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-[#123B70] tabular-nums whitespace-nowrap">
                      {formatCurrency(exp.balanceAfter)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#748399] tabular-nums whitespace-nowrap">
                      {exp.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-slate-100">
            {expenses.map((exp) => (
              <div key={exp.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#2878C8] tabular-nums">
                    {exp.operationNumber}
                  </span>
                  <span className="text-sm font-bold text-[#DC5555] tabular-nums">
                    -{formatCurrency(exp.amount)}
                  </span>
                </div>
                <div className="text-sm font-bold text-[#172B45]">{exp.title}</div>
                <div className="text-xs text-[#748399]">{exp.reason}</div>
                <div className="grid grid-cols-2 gap-2 p-2 rounded-lg bg-[#F8FAFC] text-[11px] tabular-nums">
                  <div>قبل: {formatCurrency(exp.balanceBefore)}</div>
                  <div className="font-bold text-[#123B70]">
                    بعد: {formatCurrency(exp.balanceAfter)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#748399]">
                  <span>{exp.category}</span>
                  <span className="tabular-nums">{exp.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Expense Modal with Live Balance Impact */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تسجيل مصروف جديد"
        subtitle="وثّق عملية الصرف مع معاينة أثرها المباشر على رصيد الصندوق"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">اسم المصروف</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: ضيافة الاجتماع السنوي"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">المبلغ (ر.س)</label>
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">تاريخ الصرف</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>
          </div>

          {/* Live Fund Balance Impact Box */}
          <div className="p-3 rounded-xl bg-[#EAF3FC] border border-[#4A90D9]/35 text-xs space-y-1.5 tabular-nums">
            <div className="flex justify-between text-[#123B70]">
              <span>رصيد الصندوق قبل المصروف:</span>
              <strong>{formatCurrency(currentFundBalance)}</strong>
            </div>
            <div className="flex justify-between text-[#123B70]">
              <span>رصيد الصندوق بعد المصروف:</span>
              <strong
                className={
                  currentFundBalance - amount < 0 ? 'text-[#DC5555]' : 'text-[#16A36A]'
                }
              >
                {formatCurrency(currentFundBalance - amount)}
              </strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">تصنيف المصروف</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">وصف أو سبب الصرف</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="سبب الصرف التفصيلي..."
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">ملاحظات</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="رقم الفاتورة أو أي ملاحظات إضافية..."
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
              className="px-5 py-2.5 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
            >
              حفظ المصروف
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
