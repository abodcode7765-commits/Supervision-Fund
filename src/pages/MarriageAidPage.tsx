import React, { useMemo, useState } from 'react';
import {
  Plus,
  HeartHandshake,
  Users,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Info,
} from 'lucide-react';
import { MarriageAid, MarriageAidStatus, Member } from '../types';
import { Modal, PageHeader, StatCard, StatusIndicator } from '../components/ui/SharedUI';
import {
  addCurrency,
  formatCurrency,
  getTodayIsoDate,
  subtractCurrency,
} from '../utils/formatters';

export function MarriageAidPage({
  marriageAids,
  members,
  onAddMarriageAid,
  onDisburseAid,
  onSelectMember,
}: {
  marriageAids: MarriageAid[];
  members: Member[];
  onAddMarriageAid: (aid: Omit<MarriageAid, 'id'>) => void;
  onDisburseAid: (aidId: string) => void;
  onSelectMember: (memberId: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailAid, setDetailAid] = useState<MarriageAid | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | MarriageAidStatus>('all');

  const [memberId, setMemberId] = useState(members[0]?.id ?? '');
  const [amount, setAmount] = useState(5000);
  const [dueDate, setDueDate] = useState(getTodayIsoDate());
  const [disbursementDate, setDisbursementDate] = useState('');
  const [status, setStatus] = useState<MarriageAidStatus>('مستحقة');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const filteredAids = useMemo(() => {
    const q = search.trim().toLowerCase();
    return marriageAids.filter((aid) => {
      const matchSearch =
        !q ||
        aid.memberName.toLowerCase().includes(q) ||
        aid.nationalId.includes(q);
      const matchStatus = statusFilter === 'all' || aid.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [marriageAids, search, statusFilter]);

  const totalAmount = useMemo(
    () => addCurrency(...filteredAids.map((a) => a.amount)),
    [filteredAids]
  );
  const disbursedAmount = useMemo(
    () =>
      addCurrency(
        ...filteredAids.filter((a) => a.status === 'تم الصرف').map((a) => a.amount)
      ),
    [filteredAids]
  );
  const remainingAmount = Math.max(0, subtractCurrency(totalAmount, disbursedAmount));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const targetMemberId = memberId || members[0]?.id || '';
    const member = members.find((m) => m.id === targetMemberId);
    if (!member) {
      setFormError('يرجى اختيار عضو مستفيد صحيح.');
      return;
    }
    const safeAmt = Number.isFinite(amount) ? amount : 0;
    if (safeAmt < 500) {
      setFormError('يجب أن لا تقل قيمة المعونة عن 500 ر.س.');
      return;
    }
    onAddMarriageAid({
      memberId: member.id,
      memberName: member.name,
      nationalId: member.nationalId,
      birthDate: member.birthDate,
      amount: safeAmt,
      dueDate,
      disbursementDate: status === 'تم الصرف' ? disbursementDate || dueDate : '—',
      status,
      notes: notes.trim() || 'مسجلة وفق لائحة معونة الزواج.',
    });
    setModalOpen(false);
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="معونة الزواج"
        description="إدارة ومتابعة معونات الزواج المستحقة والمصروفة لأعضاء صندوق الإشراف."
        action={
          <button
            type="button"
            onClick={() => {
              setMemberId(members[0]?.id ?? '');
              setAmount(5000);
              setDueDate(getTodayIsoDate());
              setDisbursementDate('');
              setStatus('مستحقة');
              setNotes('');
              setFormError('');
              setModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>تسجيل معونة جديدة</span>
          </button>
        }
      />

      {/* Accounting Policy Note Banner */}
      <div className="bg-[#EAF3FC] border border-[#4A90D9]/35 rounded-xl px-4 py-3 flex items-start sm:items-center gap-2.5 text-xs text-[#123B70]">
        <Info className="w-4 h-4 text-[#2878C8] shrink-0 mt-0.5 sm:mt-0" />
        <span>
          <strong>ملاحظة تنظيمية:</strong> سجل معونة الزواج يُدار كبند مستقل لمتابعة الاستحقاق
          والصرف، ولا يُخصم تلقائياً من رصيد الصندوق العام إلا عند توثيق سند صرف في قسم المصروفات.
        </span>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="عدد المستفيدين"
          value={`${filteredAids.length} مستفيدين`}
          subtitle="وفق التصفية الحالية"
          icon={Users}
          accent="royal"
        />
        <StatCard
          title="إجمالي المعونات"
          value={formatCurrency(totalAmount)}
          subtitle="المعتمدة في السجل"
          icon={HeartHandshake}
          accent="blue"
        />
        <StatCard
          title="المعونات المصروفة"
          value={formatCurrency(disbursedAmount)}
          subtitle="تم تسليمها للمستفيدين"
          icon={CheckCircle2}
          accent="green"
        />
        <StatCard
          title="المعونات المتبقية للصرف"
          value={formatCurrency(remainingAmount)}
          subtitle="مستحقة أو قيد الانتظار"
          icon={Clock}
          accent="amber"
        />
      </div>

      {/* Search & Status Filter */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(18,59,112,0.04)] grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-[#748399] absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم العضو أو رقم الهوية..."
            className="w-full h-10 pr-10 pl-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm focus:outline-none focus:border-[#2878C8]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | MarriageAidStatus)}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
        >
          <option value="all">جميع الحالات</option>
          <option value="مستحقة">مستحقة</option>
          <option value="تم الصرف">تم الصرف</option>
          <option value="قيد الانتظار">قيد الانتظار</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold text-[#748399]">
                <th className="py-3.5 px-4">اسم العضو</th>
                <th className="py-3.5 px-4">رقم الهوية</th>
                <th className="py-3.5 px-4">تاريخ الميلاد</th>
                <th className="py-3.5 px-4">قيمة المعونة</th>
                <th className="py-3.5 px-4">تاريخ الاستحقاق</th>
                <th className="py-3.5 px-4">تاريخ الدفع / الصرف</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredAids.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-sm text-[#748399]">
                    لا توجد سجلات مطابقة لمعايير البحث.
                  </td>
                </tr>
              ) : (
                filteredAids.map((aid) => (
                  <tr key={aid.id} className="hover:bg-[#F8FAFC]">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectMember(aid.memberId)}
                        className="font-bold text-[#123B70] hover:text-[#2878C8] hover:underline cursor-pointer"
                      >
                        {aid.memberName}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-xs tabular-nums">{aid.nationalId}</td>
                    <td className="py-3.5 px-4 text-xs text-[#748399] tabular-nums">
                      {aid.birthDate}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#123B70] tabular-nums whitespace-nowrap">
                      {formatCurrency(aid.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-xs tabular-nums">{aid.dueDate}</td>
                    <td className="py-3.5 px-4 text-xs tabular-nums">{aid.disbursementDate}</td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusIndicator
                        label={aid.status}
                        tone={
                          aid.status === 'تم الصرف'
                            ? 'success'
                            : aid.status === 'مستحقة'
                              ? 'info'
                              : 'warning'
                        }
                      />
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailAid(aid)}
                          title="عرض تفاصيل المساعدة"
                          className="p-2 rounded-lg text-[#2878C8] hover:bg-[#EAF3FC] transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {aid.status !== 'تم الصرف' && (
                          <button
                            type="button"
                            onClick={() => onDisburseAid(aid.id)}
                            className="h-8 px-3 rounded-lg bg-[#EAF3FC] hover:bg-[#2878C8] text-[#123B70] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            اعتماد الصرف
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filteredAids.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200/80 p-8 text-center text-sm text-[#748399]">
            لا توجد سجلات مطابقة لمعايير البحث.
          </div>
        ) : (
          filteredAids.map((aid) => (
            <div
              key={aid.id}
              className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectMember(aid.memberId)}
                    className="text-sm font-bold text-[#123B70] text-right truncate block"
                  >
                    {aid.memberName}
                  </button>
                  <div className="text-[11px] text-[#748399] tabular-nums">{aid.nationalId}</div>
                </div>
                <StatusIndicator
                  label={aid.status}
                  tone={
                    aid.status === 'تم الصرف'
                      ? 'success'
                      : aid.status === 'مستحقة'
                        ? 'info'
                        : 'warning'
                  }
                />
              </div>
              <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[#F8FAFC]">
                <span className="text-[#748399]">قيمة المعونة:</span>
                <span className="font-bold text-[#123B70] tabular-nums">
                  {formatCurrency(aid.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-[#748399] tabular-nums">
                <span>الاستحقاق: {aid.dueDate}</span>
                <span>الصرف: {aid.disbursementDate}</span>
              </div>
              <div
                className={`grid gap-2 pt-1 ${
                  aid.status !== 'تم الصرف' ? 'grid-cols-2' : 'grid-cols-1'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setDetailAid(aid)}
                  className="h-9 rounded-lg bg-slate-100 text-[#172B45] text-xs font-bold cursor-pointer"
                >
                  عرض التفاصيل
                </button>
                {aid.status !== 'تم الصرف' && (
                  <button
                    type="button"
                    onClick={() => onDisburseAid(aid.id)}
                    className="h-9 rounded-lg bg-[#EAF3FC] text-[#123B70] text-xs font-bold cursor-pointer"
                  >
                    اعتماد الصرف
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* View Aid Details Modal */}
      <Modal
        isOpen={Boolean(detailAid)}
        onClose={() => setDetailAid(null)}
        title="تفاصيل معونة الزواج"
        subtitle={detailAid?.memberName}
        size="sm"
      >
        {detailAid && (
          <div className="space-y-4 text-sm">
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#748399]">اسم العضو:</span>
                <strong className="text-[#123B70]">{detailAid.memberName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">رقم الهوية:</span>
                <strong className="tabular-nums">{detailAid.nationalId}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">تاريخ الميلاد:</span>
                <strong className="tabular-nums">{detailAid.birthDate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">المبلغ المخصص:</span>
                <strong className="text-[#16A36A] tabular-nums">
                  {formatCurrency(detailAid.amount)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">تاريخ الاستحقاق:</span>
                <strong className="tabular-nums">{detailAid.dueDate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#748399]">تاريخ الدفع / الصرف:</span>
                <strong className="tabular-nums">{detailAid.disbursementDate}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#748399]">حالة المساعدة:</span>
                <StatusIndicator
                  label={detailAid.status}
                  tone={
                    detailAid.status === 'تم الصرف'
                      ? 'success'
                      : detailAid.status === 'مستحقة'
                        ? 'info'
                        : 'warning'
                  }
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-[#172B45] mb-1">الملاحظات</div>
              <p className="text-xs text-[#748399] leading-relaxed p-3 rounded-xl border border-slate-200">
                {detailAid.notes}
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDetailAid(null)}
                className="h-10 px-5 rounded-xl bg-[#2878C8] text-white text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Marriage Aid Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="تسجيل معونة زواج جديدة"
        subtitle="أدخل بيانات المستفيد وموعد الاستحقاق والصرف"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#DC5555]/10 border border-[#DC5555]/25 text-[#DC5555] text-xs font-semibold">
              {formError}
            </div>
          )}
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
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                قيمة المعونة (ر.س)
              </label>
              <input
                type="number"
                required
                min={500}
                value={amount}
                onChange={(e) => {
                  setAmount(Number(e.target.value) || 0);
                  setFormError('');
                }}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                تاريخ الاستحقاق
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">تاريخ الصرف</label>
              <input
                type="date"
                value={disbursementDate}
                onChange={(e) => setDisbursementDate(e.target.value)}
                disabled={status !== 'تم الصرف'}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums disabled:bg-slate-100 focus:outline-none focus:border-[#2878C8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">حالة المعونة</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as MarriageAidStatus)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
            >
              <option value="مستحقة">مستحقة</option>
              <option value="تم الصرف">تم الصرف</option>
              <option value="قيد الانتظار">قيد الانتظار</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">ملاحظات</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات الاعتماد أو التسليم..."
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
              حفظ المعونة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
