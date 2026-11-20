import React, { useMemo, useState } from 'react';
import {
  Plus,
  Wallet,
  Calendar,
  FileSpreadsheet,
  Landmark,
  Search,
  Eye,
  Pencil,
  AlertTriangle,
} from 'lucide-react';
import {
  Expense,
  ExpenseCategory,
  PaymentRecord,
  SystemUser,
  YearConfig,
} from '../types';
import { Modal, PageHeader, StatCard } from '../components/ui/SharedUI';
import { ExpenseCategoryChart } from '../components/charts/DashboardCharts';
import {
  ARABIC_MONTHS,
  addCurrency,
  formatCurrency,
  fromHalalas,
  getDefaultActiveYear,
  getTodayIsoDate,
  subtractCurrency,
  toHalalas,
} from '../utils/formatters';

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
  yearConfigs,
  currentUser,
  onAddExpense,
  onUpdateExpense,
}: {
  expenses: Expense[];
  payments: PaymentRecord[];
  yearConfigs: YearConfig[];
  currentUser: SystemUser;
  onAddExpense: (
    expense: Omit<
      Expense,
      'id' | 'operationNumber' | 'balanceBefore' | 'balanceAfter' | 'recordedBy'
    >
  ) => void;
  onUpdateExpense: (expense: Expense) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null);

  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ExpenseCategory>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest'>('newest');

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState(500);
  const [date, setDate] = useState(getTodayIsoDate());
  const [year, setYear] = useState<number>(() => getDefaultActiveYear(yearConfigs));
  const [category, setCategory] = useState<ExpenseCategory>('ضيافة ومناسبات');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Real total fund revenue & expenses computed across actual records
  const totalRevenue = useMemo(
    () => fromHalalas(payments.reduce((acc, p) => acc + toHalalas(p.amount), 0)),
    [payments]
  );
  const totalExpensesAll = useMemo(
    () => addCurrency(...expenses.map((e) => e.amount)),
    [expenses]
  );
  const currentFundBalance = subtractCurrency(totalRevenue, totalExpensesAll);

  const currentMonthPrefix = getTodayIsoDate().slice(0, 7);
  const currentMonthIdx = Number(currentMonthPrefix.slice(5, 7)) - 1;
  const currentMonthLabel = `${ARABIC_MONTHS[currentMonthIdx] ?? ''} ${currentMonthPrefix.slice(0, 4)}`;

  const filteredExpenses = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = expenses.filter((e) => {
      const matchSearch =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.reason.toLowerCase().includes(q) ||
        e.operationNumber.toLowerCase().includes(q);
      const matchYear = yearFilter === 'all' || e.year === Number(yearFilter);
      const matchCategory = categoryFilter === 'all' || e.category === categoryFilter;
      return matchSearch && matchYear && matchCategory;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'highest') return toHalalas(b.amount) - toHalalas(a.amount);
      if (sortBy === 'oldest') return a.date.localeCompare(b.date);
      return b.date.localeCompare(a.date);
    });
  }, [expenses, search, yearFilter, categoryFilter, sortBy]);

  const filteredExpensesTotal = useMemo(
    () => addCurrency(...filteredExpenses.map((e) => e.amount)),
    [filteredExpenses]
  );

  const monthExpenses = useMemo(
    () =>
      addCurrency(
        ...filteredExpenses
          .filter((e) => e.date.startsWith(currentMonthPrefix))
          .map((e) => e.amount)
      ),
    [filteredExpenses, currentMonthPrefix]
  );

  const categoryTotals = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        category: cat,
        amount: addCurrency(
          ...filteredExpenses.filter((e) => e.category === cat).map((e) => e.amount)
        ),
      })).filter((c) => c.amount > 0),
    [filteredExpenses]
  );

  const openAddModal = () => {
    setEditingExpense(null);
    setTitle('');
    setAmount(500);
    setDate(getTodayIsoDate());
    setYear(getDefaultActiveYear(yearConfigs));
    setCategory('ضيافة ومناسبات');
    setReason('');
    setNotes('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp);
    setTitle(exp.title);
    setAmount(exp.amount);
    setDate(exp.date);
    setYear(exp.year);
    setCategory(exp.category);
    setReason(exp.reason);
    setNotes(exp.notes);
    setFormError('');
    setModalOpen(true);
  };

  const safeAmount = Number.isFinite(amount) ? amount : 0;

  const projectedBalanceAfter = editingExpense
    ? subtractCurrency(addCurrency(currentFundBalance, editingExpense.amount), safeAmount)
    : subtractCurrency(currentFundBalance, safeAmount);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!title.trim()) {
      setFormError('يرجى إدخال اسم المصروف.');
      return;
    }
    if (toHalalas(safeAmount) <= 0) {
      setFormError('يجب إدخال مبلغ مصروف أكبر من صفر.');
      return;
    }

    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        title: title.trim(),
        amount: fromHalalas(toHalalas(safeAmount)),
        date,
        year,
        category,
        reason: reason.trim() || title.trim(),
        notes: notes.trim() || 'تم الصرف بموجب سند معتمد.',
      });
    } else {
      onAddExpense({
        title: title.trim(),
        amount: fromHalalas(toHalalas(safeAmount)),
        date,
        year,
        category,
        reason: reason.trim() || title.trim(),
        notes: notes.trim() || 'تم الصرف بموجب سند معتمد.',
      });
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="مصروفات الصندوق"
        description="توثيق ومراقبة جميع بنود الصرف وأثر كل مصروف على رصيد الصندوق الفعلي."
        action={
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
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
          value={formatCurrency(filteredExpensesTotal)}
          subtitle="وفق التصفية الحالية"
          icon={Wallet}
          accent="red"
        />
        <StatCard
          title="مصروفات الشهر الحالي"
          value={formatCurrency(monthExpenses)}
          subtitle={currentMonthLabel}
          icon={Calendar}
          accent="amber"
        />
        <StatCard
          title="عدد عمليات الصرف"
          value={`${filteredExpenses.length} عمليات`}
          subtitle="سندات صرف مسجلة"
          icon={FileSpreadsheet}
          accent="royal"
        />
        <StatCard
          title="رصيد الصندوق بعد المصروفات"
          value={formatCurrency(currentFundBalance)}
          subtitle={`إجمالي التحصيل ${formatCurrency(totalRevenue)}`}
          icon={Landmark}
          accent={currentFundBalance >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(18,59,112,0.04)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-[#748399] absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم العملية أو عنوان المصروف أو السبب..."
            className="w-full h-10 pr-10 pl-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm focus:outline-none focus:border-[#2878C8]"
          />
        </div>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
        >
          <option value="all">جميع السنوات</option>
          {yearConfigs.map((y) => (
            <option key={y.year} value={y.year}>
              سنة {y.year}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as 'all' | ExpenseCategory)}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
        >
          <option value="all">جميع التصنيفات</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'highest')}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
        >
          <option value="newest">الأحدث أولاً</option>
          <option value="oldest">الأقدم أولاً</option>
          <option value="highest">الأعلى مبلغاً</option>
        </select>
      </div>

      {/* Category Chart + Expenses Table */}
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
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-sm text-[#748399]">
                      لا توجد مصروفات مطابقة للتصفية الحالية.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
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
                      <td
                        className={`py-3.5 px-4 text-xs font-bold tabular-nums whitespace-nowrap ${
                          exp.balanceAfter < 0 ? 'text-[#DC5555]' : 'text-[#123B70]'
                        }`}
                      >
                        {formatCurrency(exp.balanceAfter)}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#748399] tabular-nums whitespace-nowrap">
                        {exp.date}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailExpense(exp)}
                            title="تفاصيل سند الصرف"
                            className="p-2 rounded-lg text-[#2878C8] hover:bg-[#EAF3FC] transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(exp)}
                            title="تعديل المصروف"
                            className="p-2 rounded-lg text-[#748399] hover:text-[#123B70] hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-slate-100">
            {filteredExpenses.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#748399]">
                لا توجد مصروفات مطابقة للتصفية الحالية.
              </div>
            ) : (
              filteredExpenses.map((exp) => (
                <div key={exp.id} className="p-4 space-y-2.5">
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
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#F8FAFC] text-[11px] tabular-nums">
                    <div>قبل: {formatCurrency(exp.balanceBefore)}</div>
                    <div
                      className={`font-bold ${
                        exp.balanceAfter < 0 ? 'text-[#DC5555]' : 'text-[#123B70]'
                      }`}
                    >
                      بعد: {formatCurrency(exp.balanceAfter)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#748399]">
                    <span>{exp.category}</span>
                    <span className="tabular-nums">{exp.date}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDetailExpense(exp)}
                      className="h-9 rounded-lg bg-[#EAF3FC] text-[#123B70] text-xs font-bold cursor-pointer"
                    >
                      التفاصيل
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(exp)}
                      className="h-9 rounded-lg bg-slate-100 text-[#172B45] text-xs font-bold cursor-pointer"
                    >
                      تعديل
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      <Modal
        isOpen={Boolean(detailExpense)}
        onClose={() => setDetailExpense(null)}
        title="تفاصيل سند الصرف"
        subtitle={detailExpense?.operationNumber}
        size="sm"
      >
        {detailExpense && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-[#748399]">العنوان:</span>
                <strong className="text-[#172B45]">{detailExpense.title}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">التصنيف:</span>
                <strong>{detailExpense.category}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">السنة المالية:</span>
                <strong className="tabular-nums">{detailExpense.year}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">تاريخ الصرف:</span>
                <strong className="tabular-nums">{detailExpense.date}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">المبلغ المصروف:</span>
                <strong className="text-[#DC5555] tabular-nums">
                  {formatCurrency(detailExpense.amount)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">الرصيد قبل الصرف:</span>
                <strong className="tabular-nums">
                  {formatCurrency(detailExpense.balanceBefore)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">الرصيد بعد الصرف:</span>
                <strong className="text-[#123B70] tabular-nums">
                  {formatCurrency(detailExpense.balanceAfter)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">مسجل العملية:</span>
                <strong>{detailExpense.recordedBy}</strong>
              </div>
            </div>
            <div>
              <div className="font-bold text-[#172B45] mb-1">السبب والملاحظات:</div>
              <p className="p-3 rounded-xl border border-slate-200 text-[#748399] leading-relaxed">
                {detailExpense.reason}
                {detailExpense.notes ? ` — ${detailExpense.notes}` : ''}
              </p>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDetailExpense(null)}
                className="h-10 px-5 rounded-xl bg-[#2878C8] text-white font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Expense Modal with Live Balance Impact */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingExpense ? 'تعديل سند مصروف' : 'تسجيل مصروف جديد'}
        subtitle={`المسؤول: ${currentUser.name} · معاينة الأثر الفوري على رصيد الصندوق`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#DC5555]/10 border border-[#DC5555]/25 text-[#DC5555] text-xs font-semibold">
              {formError}
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">اسم المصروف</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setFormError('');
              }}
              placeholder="مثال: ضيافة الاجتماع السنوي"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">المبلغ (ر.س)</label>
              <input
                type="number"
                required
                step="0.01"
                min={0.01}
                value={amount}
                onChange={(e) => {
                  setAmount(Number(e.target.value) || 0);
                  setFormError('');
                }}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">السنة المالية</label>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:border-[#2878C8]"
              >
                {yearConfigs.map((y) => (
                  <option key={y.year} value={y.year}>
                    {y.year}
                  </option>
                ))}
              </select>
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
              <span>رصيد الصندوق الحالي:</span>
              <strong>{formatCurrency(currentFundBalance)}</strong>
            </div>
            <div className="flex justify-between text-[#123B70]">
              <span>رصيد الصندوق بعد الحفظ:</span>
              <strong
                className={projectedBalanceAfter < 0 ? 'text-[#DC5555]' : 'text-[#16A36A]'}
              >
                {formatCurrency(projectedBalanceAfter)}
              </strong>
            </div>
          </div>

          {projectedBalanceAfter < 0 && (
            <div className="p-3 rounded-xl bg-[#E99A35]/15 border border-[#E99A35]/35 text-[#8A530B] text-xs font-semibold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                تنبيه: قيمة المصروف تتجاوز رصيد الصندوق المتاح، وسيظهر الرصيد بالسالب لحين
                تحصيل إيرادات إضافية أو مراجعة قرار الصرف.
              </span>
            </div>
          )}

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
              className="h-10 px-4 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
            >
              {editingExpense ? 'حفظ التعديلات' : 'حفظ المصروف'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
