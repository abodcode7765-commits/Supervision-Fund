import React, { useMemo, useState } from 'react';
import {
  Plus,
  Coins,
  Wallet,
  Clock,
  ArrowRight,
  ShieldCheck,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Member, Qitta, QittaParticipant, QittaStatus, SystemUser } from '../types';
import { Modal, PageHeader, StatCard, StatusIndicator } from '../components/ui/SharedUI';
import {
  addCurrency,
  distributeAmountExactly,
  formatCurrency,
  fromHalalas,
  getTodayIsoDate,
  subtractCurrency,
  toHalalas,
} from '../utils/formatters';

export function QittatPage({
  qittat,
  members,
  users,
  onCreateQitta,
  onRecordParticipantPayment,
}: {
  qittat: Qitta[];
  members: Member[];
  users: SystemUser[];
  onCreateQitta: (qitta: Omit<Qitta, 'id'>) => void;
  onRecordParticipantPayment: (qittaId: string, memberId: string, paidAmount: number) => void;
}) {
  const [selectedQittaId, setSelectedQittaId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | QittaStatus>('all');

  const [payModalParticipant, setPayModalParticipant] = useState<QittaParticipant | null>(null);
  const [payInputAmount, setPayInputAmount] = useState<string>('');
  const [payError, setPayError] = useState('');

  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState(700);
  const [distributionMode, setDistributionMode] = useState<'equal' | 'custom'>('equal');
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(
    members.filter((m) => m.memberStatus === 'نشط').slice(0, 5).map((m) => m.id)
  );
  const [customShares, setCustomShares] = useState<Record<string, number>>({});
  const [createError, setCreateError] = useState('');

  // Resolve the actual designated Qitta manager dynamically from users list
  const designatedManager = useMemo(() => {
    return (
      users.find((u) => u.status === 'نشط' && u.role === 'مسؤول القطات') ??
      users.find(
        (u) =>
          u.status === 'نشط' &&
          u.role !== 'مدير الصندوق' &&
          u.permissions.includes('qittat')
      ) ??
      null
    );
  }, [users]);

  const equalSharesPreview = useMemo(() => {
    const shares = distributeAmountExactly(totalAmount, selectedParticipantIds.length);
    const map: Record<string, number> = {};
    selectedParticipantIds.forEach((id, idx) => {
      map[id] = shares[idx] ?? 0;
    });
    return map;
  }, [totalAmount, selectedParticipantIds]);

  const customSharesTotal = useMemo(() => {
    return addCurrency(
      ...selectedParticipantIds.map((id) => customShares[id] ?? equalSharesPreview[id] ?? 0)
    );
  }, [selectedParticipantIds, customShares, equalSharesPreview]);

  const customDiff = subtractCurrency(totalAmount, customSharesTotal);

  const filteredQittat = useMemo(() => {
    const qLower = search.trim().toLowerCase();
    return qittat.filter((q) => {
      const matchSearch =
        !qLower ||
        q.name.toLowerCase().includes(qLower) ||
        q.reason.toLowerCase().includes(qLower) ||
        q.participants.some((p) => p.memberName.toLowerCase().includes(qLower));
      const matchStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [qittat, search, statusFilter]);

  const totalRequired = useMemo(
    () => addCurrency(...filteredQittat.map((q) => q.totalAmount)),
    [filteredQittat]
  );
  const totalCollected = useMemo(
    () =>
      addCurrency(
        ...filteredQittat.flatMap((q) => q.participants.map((p) => p.paidAmount))
      ),
    [filteredQittat]
  );
  const totalRemaining = Math.max(0, subtractCurrency(totalRequired, totalCollected));

  const toggleParticipant = (id: string) => {
    setSelectedParticipantIds((prev) => {
      const next = prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id];
      if (distributionMode === 'custom') {
        const nextEqual = distributeAmountExactly(totalAmount, next.length);
        const nextMap: Record<string, number> = {};
        next.forEach((pid, idx) => {
          nextMap[pid] = customShares[pid] ?? nextEqual[idx] ?? 0;
        });
        setCustomShares(nextMap);
      }
      return next;
    });
    setCreateError('');
  };

  const handleModeSwitch = (mode: 'equal' | 'custom') => {
    setDistributionMode(mode);
    setCreateError('');
    if (mode === 'custom') {
      setCustomShares(equalSharesPreview);
    }
  };

  const handleAutoBalanceCustom = () => {
    setCustomShares(equalSharesPreview);
    setCreateError('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');

    if (!name.trim()) {
      setCreateError('يرجى إدخال اسم القطة.');
      return;
    }
    if (toHalalas(totalAmount) <= 0) {
      setCreateError('يجب أن يكون المبلغ الإجمالي أكبر من صفر.');
      return;
    }
    if (selectedParticipantIds.length === 0) {
      setCreateError('يرجى اختيار مشارك واحد على الأقل.');
      return;
    }

    if (
      distributionMode === 'custom' &&
      toHalalas(customSharesTotal) !== toHalalas(totalAmount)
    ) {
      setCreateError(
        `مجموع أنصبة المشاركين (${formatCurrency(customSharesTotal)}) يجب أن يطابق المبلغ الإجمالي (${formatCurrency(totalAmount)}).`
      );
      return;
    }

    const equalShares = distributeAmountExactly(totalAmount, selectedParticipantIds.length);
    const participants: QittaParticipant[] = selectedParticipantIds.map((id, idx) => {
      const mem = members.find((m) => m.id === id);
      const share =
        distributionMode === 'equal'
          ? equalShares[idx]
          : fromHalalas(toHalalas(customShares[id] ?? 0));
      return {
        memberId: id,
        memberName: mem?.name ?? 'عضو',
        shareAmount: share,
        paidAmount: 0,
        status: 'لم يدفع',
      };
    });

    onCreateQitta({
      name: name.trim(),
      reason: reason.trim() || 'مصروف مشترك',
      description: description.trim() || reason.trim() || 'تجميع قطة بين الأعضاء المشاركين.',
      createdAt: getTodayIsoDate(),
      totalAmount: fromHalalas(toHalalas(totalAmount)),
      distributionMode,
      status: 'جديدة',
      participants,
    });

    setName('');
    setReason('');
    setDescription('');
    setTotalAmount(700);
    setDistributionMode('equal');
    setCustomShares({});
    setCreateError('');
    setCreateOpen(false);
  };

  const selectedQitta = selectedQittaId
    ? qittat.find((q) => q.id === selectedQittaId) ?? null
    : null;

  if (selectedQitta) {
    const collected = addCurrency(...selectedQitta.participants.map((p) => p.paidAmount));
    const remaining = Math.max(0, subtractCurrency(selectedQitta.totalAmount, collected));
    const pct =
      selectedQitta.totalAmount > 0
        ? Math.min(100, Math.round((collected / selectedQitta.totalAmount) * 100))
        : 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedQittaId(null)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-slate-200 hover:border-[#2878C8] text-sm font-semibold text-[#172B45] cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى قائمة القطات</span>
          </button>
        </div>

        {/* Details Header + Progress */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(18,59,112,0.04)] space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-bold text-[#172B45]">
                  {selectedQitta.name}
                </h1>
                <StatusIndicator
                  label={selectedQitta.status}
                  tone={
                    selectedQitta.status === 'مكتملة'
                      ? 'success'
                      : selectedQitta.status === 'قيد التحصيل'
                        ? 'info'
                        : 'warning'
                  }
                />
              </div>
              <p className="mt-1.5 text-sm text-[#748399] max-w-2xl leading-relaxed">
                {selectedQitta.description}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#748399]">
                <span>
                  السبب: <strong className="text-[#172B45]">{selectedQitta.reason}</strong>
                </span>
                <span>
                  التوزيع:{' '}
                  <strong className="text-[#172B45]">
                    {selectedQitta.distributionMode === 'custom' ? 'مخصص' : 'متساوي'}
                  </strong>
                </span>
                <span>
                  التاريخ: <strong className="tabular-nums text-[#172B45]">{selectedQitta.createdAt}</strong>
                </span>
              </div>
            </div>

            <div className="px-4 py-3 rounded-xl bg-[#EAF3FC] text-right shrink-0">
              <div className="text-[11px] text-[#748399]">المبلغ الإجمالي المطلوب</div>
              <div className="text-xl font-extrabold text-[#123B70] tabular-nums">
                {formatCurrency(selectedQitta.totalAmount)}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/70 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-[#172B45]">نسبة تحصيل القطة ({pct}%)</span>
              <div className="flex items-center gap-4 tabular-nums">
                <span className="text-[#16A36A] font-bold">
                  المحصل: {formatCurrency(collected)}
                </span>
                <span className="text-[#DC5555] font-bold">
                  المتبقي: {formatCurrency(remaining)}
                </span>
              </div>
            </div>
            <div className="h-3.5 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-l from-[#16A36A] to-[#2878C8] transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Desktop Participants Table */}
        <div className="hidden md:block bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-[#172B45]">
              قائمة المشاركين ({selectedQitta.participants.length} مشاركين)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold text-[#748399]">
                  <th className="py-3.5 px-4">اسم المشارك</th>
                  <th className="py-3.5 px-4">نصيب المشارك</th>
                  <th className="py-3.5 px-4">المبلغ المسدد</th>
                  <th className="py-3.5 px-4">المبلغ المتبقي</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">تسجيل السداد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {selectedQitta.participants.map((p) => {
                  const rem = Math.max(0, subtractCurrency(p.shareAmount, p.paidAmount));
                  return (
                    <tr key={p.memberId} className="hover:bg-[#F8FAFC]">
                      <td className="py-3.5 px-4 font-bold text-[#172B45] whitespace-nowrap">
                        {p.memberName}
                      </td>
                      <td className="py-3.5 px-4 font-semibold tabular-nums whitespace-nowrap">
                        {formatCurrency(p.shareAmount)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#16A36A] tabular-nums whitespace-nowrap">
                        {formatCurrency(p.paidAmount)}
                      </td>
                      <td
                        className={`py-3.5 px-4 font-bold tabular-nums whitespace-nowrap ${
                          rem > 0 ? 'text-[#DC5555]' : 'text-[#748399]'
                        }`}
                      >
                        {formatCurrency(rem)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusIndicator
                          label={p.status}
                          tone={
                            p.status === 'سدد كامل المبلغ'
                              ? 'success'
                              : p.status === 'دفع جزئياً'
                                ? 'warning'
                                : 'danger'
                          }
                        />
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {rem > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPayModalParticipant(p);
                              setPayInputAmount(String(rem));
                              setPayError('');
                            }}
                            className="h-9 px-3.5 rounded-lg bg-[#EAF3FC] hover:bg-[#2878C8] text-[#123B70] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            تسجيل دفعة
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[#16A36A] font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            مكتمل
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Participants Cards */}
        <div className="md:hidden space-y-3">
          <div className="text-sm font-bold text-[#123B70] px-1">
            قائمة المشاركين ({selectedQitta.participants.length})
          </div>
          {selectedQitta.participants.map((p) => {
            const rem = Math.max(0, subtractCurrency(p.shareAmount, p.paidAmount));
            return (
              <div
                key={p.memberId}
                className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-bold text-[#172B45]">{p.memberName}</div>
                  <StatusIndicator
                    label={p.status}
                    tone={
                      p.status === 'سدد كامل المبلغ'
                        ? 'success'
                        : p.status === 'دفع جزئياً'
                          ? 'warning'
                          : 'danger'
                    }
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-[#F8FAFC] text-center text-[11px] tabular-nums">
                  <div>
                    <div className="text-[#748399]">النصيب</div>
                    <div className="font-bold text-[#172B45] mt-0.5">
                      {formatCurrency(p.shareAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#748399]">المسدد</div>
                    <div className="font-bold text-[#16A36A] mt-0.5">
                      {formatCurrency(p.paidAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#748399]">المتبقي</div>
                    <div
                      className={`font-bold mt-0.5 ${
                        rem > 0 ? 'text-[#DC5555]' : 'text-[#748399]'
                      }`}
                    >
                      {formatCurrency(rem)}
                    </div>
                  </div>
                </div>
                {rem > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPayModalParticipant(p);
                      setPayInputAmount(String(rem));
                      setPayError('');
                    }}
                    className="w-full h-9 rounded-lg bg-[#EAF3FC] text-[#123B70] text-xs font-bold cursor-pointer"
                  >
                    تسجيل دفعة
                  </button>
                ) : (
                  <div className="w-full h-9 rounded-lg bg-[#16A36A]/10 text-[#16A36A] text-xs font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>سدد كامل المبلغ</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Participant Partial/Full Payment Modal */}
        <Modal
          isOpen={Boolean(payModalParticipant)}
          onClose={() => setPayModalParticipant(null)}
          title="تسجيل سداد حصة قطة"
          subtitle={payModalParticipant?.memberName}
          size="sm"
        >
          {payModalParticipant && (() => {
            const rem = Math.max(
              0,
              subtractCurrency(payModalParticipant.shareAmount, payModalParticipant.paidAmount)
            );
            return (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const val = Number(payInputAmount);
                  if (!Number.isFinite(val) || toHalalas(val) <= 0) {
                    setPayError('يرجى إدخال مبلغ صحيح أكبر من صفر.');
                    return;
                  }
                  if (toHalalas(val) > toHalalas(rem)) {
                    setPayError(`المبلغ يتجاوز المتبقي على المشارك (${formatCurrency(rem)}).`);
                    return;
                  }
                  onRecordParticipantPayment(
                    selectedQitta.id,
                    payModalParticipant.memberId,
                    fromHalalas(toHalalas(val))
                  );
                  setPayModalParticipant(null);
                }}
                className="space-y-4"
              >
                <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs space-y-1.5 tabular-nums">
                  <div className="flex justify-between">
                    <span className="text-[#748399]">نصيب المشارك:</span>
                    <strong>{formatCurrency(payModalParticipant.shareAmount)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#748399]">المدفوع مسبقاً:</span>
                    <strong className="text-[#16A36A]">
                      {formatCurrency(payModalParticipant.paidAmount)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#748399]">المتبقي حالياً:</span>
                    <strong className="text-[#DC5555]">{formatCurrency(rem)}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                    المبلغ المدفوع الآن (يمكن الدفع جزئياً)
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min={0.01}
                    max={rem}
                    value={payInputAmount}
                    onChange={(e) => {
                      setPayInputAmount(e.target.value);
                      setPayError('');
                    }}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold tabular-nums focus:outline-none focus:border-[#2878C8]"
                  />
                </div>

                {payError && (
                  <div className="p-2.5 rounded-xl bg-[#DC5555]/10 text-[#DC5555] text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{payError}</span>
                  </div>
                )}

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayModalParticipant(null)}
                    className="h-10 px-4 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-5 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
                  >
                    اعتماد الدفعة
                  </button>
                </div>
              </form>
            );
          })()}
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة القطات"
        description="تنظيم المبالغ التشاركية للمناسبات والرحلات والاستراحات والمصروفات المشتركة بين الأعضاء."
        action={
          <button
            type="button"
            onClick={() => {
              setCreateError('');
              setCreateOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء قطة جديدة</span>
          </button>
        }
      />

      {/* Dynamic Designated Manager Banner */}
      <div className="bg-[#EAF3FC] border border-[#4A90D9]/35 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-start sm:items-center gap-2.5 text-[#123B70]">
          <ShieldCheck className="w-4 h-4 text-[#2878C8] shrink-0 mt-0.5 sm:mt-0" />
          <span>
            <strong>صلاحية إدارة القطات:</strong>{' '}
            {designatedManager ? (
              <>
                العضو المخوّل بإدارة هذا القسم{' '}
                <strong className="underline">
                  {designatedManager.name} ({designatedManager.role})
                </strong>{' '}
                — مستخدم مستقل مخصص لقسم القطات فقط دون صلاحيات المدير الكاملة.
              </>
            ) : (
              'لا يوجد حالياً مستخدم مستقل معيّن بصفة مسؤول القطات؛ يديرها مدير الصندوق أو يمكن تعيين مسؤول من صفحة المستخدمين.'
            )}
          </span>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي القطات"
          value={`${filteredQittat.length} قطات`}
          subtitle="وفق التصفية الحالية"
          icon={Coins}
          accent="royal"
        />
        <StatCard
          title="إجمالي المبالغ المطلوبة"
          value={formatCurrency(totalRequired)}
          subtitle="مجموع تكلفة القطات المسجلة"
          icon={Users}
          accent="blue"
        />
        <StatCard
          title="إجمالي المبالغ المحصلة"
          value={formatCurrency(totalCollected)}
          subtitle="تم استلامها من المشاركين"
          icon={Wallet}
          accent="green"
        />
        <StatCard
          title="إجمالي المبالغ المتبقية"
          value={formatCurrency(totalRemaining)}
          subtitle="حصص قيد التحصيل"
          icon={Clock}
          accent={totalRemaining > 0 ? 'amber' : 'green'}
        />
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(18,59,112,0.04)] grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-[#748399] absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم القطة أو السبب أو اسم أحد المشاركين..."
            className="w-full h-10 pr-10 pl-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm focus:outline-none focus:border-[#2878C8]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | QittaStatus)}
          className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm font-medium focus:outline-none focus:border-[#2878C8]"
        >
          <option value="all">جميع الحالات</option>
          <option value="جديدة">جديدة</option>
          <option value="قيد التحصيل">قيد التحصيل</option>
          <option value="مكتملة">مكتملة</option>
        </select>
      </div>

      {/* Qittat Cards Grid */}
      {filteredQittat.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center text-sm text-[#748399]">
          لا توجد قطات مطابقة لمعايير البحث أو التصفية.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredQittat.map((q) => {
            const collected = addCurrency(...q.participants.map((p) => p.paidAmount));
            const remaining = Math.max(0, subtractCurrency(q.totalAmount, collected));
            const pct =
              q.totalAmount > 0
                ? Math.min(100, Math.round((collected / q.totalAmount) * 100))
                : 0;

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(18,59,112,0.04)] flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-[#748399] tabular-nums">{q.createdAt}</div>
                    <StatusIndicator
                      label={q.status}
                      tone={
                        q.status === 'مكتملة'
                          ? 'success'
                          : q.status === 'قيد التحصيل'
                            ? 'info'
                            : 'warning'
                      }
                    />
                  </div>

                  <h3 className="mt-3 text-base sm:text-lg font-bold text-[#172B45] line-clamp-1">
                    {q.name}
                  </h3>
                  <p className="mt-1 text-xs text-[#748399] leading-relaxed line-clamp-2 min-h-[32px]">
                    {q.reason}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#748399]">المبلغ الإجمالي</span>
                      <span className="font-bold text-[#172B45] tabular-nums">
                        {formatCurrency(q.totalAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#748399]">عدد المشاركين</span>
                      <span className="font-bold text-[#172B45] tabular-nums">
                        {q.participants.length} مشاركين
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#748399]">المبلغ المحصل</span>
                      <span className="font-bold text-[#16A36A] tabular-nums">
                        {formatCurrency(collected)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#748399]">المبلغ المتبقي</span>
                      <span
                        className={`font-bold tabular-nums ${
                          remaining > 0 ? 'text-[#DC5555]' : 'text-[#748399]'
                        }`}
                      >
                        {formatCurrency(remaining)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-semibold">
                      <span className="text-[#748399]">نسبة التحصيل</span>
                      <span className="text-[#123B70] tabular-nums">{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#2878C8]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedQittaId(q.id)}
                  className="mt-5 w-full h-10 rounded-xl bg-[#EAF3FC] hover:bg-[#2878C8] text-[#123B70] hover:text-white text-sm font-bold transition-colors cursor-pointer"
                >
                  عرض تفاصيل القطة
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Qitta Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="إنشاء قطة جديدة"
        subtitle="اختر الأعضاء المشاركين ونمط التوزيع (متساوي دقيق بالهللة أو مخصص)"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">اسم القطة</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: قطة استراحة نهاية الأسبوع"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                المبلغ الإجمالي المطلوب (ر.س)
              </label>
              <input
                type="number"
                required
                step="0.01"
                min={1}
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value) || 0)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">سبب القطة</label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="مثال: إيجار استراحة وضيافة عائلية"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                طريقة تقسيم المبلغ
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('equal')}
                  className={`h-11 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    distributionMode === 'equal'
                      ? 'bg-[#2878C8] text-white border-[#2878C8]'
                      : 'bg-white text-[#172B45] border-slate-200'
                  }`}
                >
                  توزيع متساوي
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('custom')}
                  className={`h-11 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    distributionMode === 'custom'
                      ? 'bg-[#2878C8] text-white border-[#2878C8]'
                      : 'bg-white text-[#172B45] border-slate-200'
                  }`}
                >
                  توزيع مخصص
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">وصف إضافي</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="تفاصيل التكاليف أو موعد المناسبة..."
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold text-[#172B45]">
                المشاركون ({selectedParticipantIds.length} مختار)
              </label>
              {selectedParticipantIds.length > 0 && distributionMode === 'equal' && (
                <span className="text-xs font-bold text-[#2878C8] tabular-nums">
                  متوسط نصيب الفرد:{' '}
                  {formatCurrency(
                    fromHalalas(
                      Math.floor(
                        toHalalas(totalAmount) / Math.max(1, selectedParticipantIds.length)
                      )
                    )
                  )}{' '}
                  (المجموع النهائي: {formatCurrency(totalAmount)})
                </span>
              )}
              {selectedParticipantIds.length > 0 && distributionMode === 'custom' && (
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`font-bold tabular-nums ${
                      toHalalas(customDiff) === 0 ? 'text-[#16A36A]' : 'text-[#DC5555]'
                    }`}
                  >
                    {toHalalas(customDiff) === 0
                      ? 'المجموع متطابق ✓'
                      : `الفرق: ${formatCurrency(customDiff)}`}
                  </span>
                  <button
                    type="button"
                    onClick={handleAutoBalanceCustom}
                    className="px-2.5 py-1 rounded-lg bg-[#EAF3FC] text-[#123B70] font-semibold cursor-pointer"
                  >
                    إعادة مساواة
                  </button>
                </div>
              )}
            </div>

            <div className="max-h-40 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC]">
              {members.map((m) => {
                const checked = selectedParticipantIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleParticipant(m.id)}
                    className={`h-9 px-2.5 rounded-lg text-xs font-semibold text-right border transition-colors cursor-pointer truncate ${
                      checked
                        ? 'bg-[#2878C8] text-white border-[#2878C8]'
                        : 'bg-white text-[#172B45] border-slate-200'
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
            </div>

            {distributionMode === 'custom' && selectedParticipantIds.length > 0 && (
              <div className="mt-3 max-h-44 overflow-y-auto space-y-2 p-3 rounded-xl border border-slate-200 bg-white">
                <div className="text-[11px] font-bold text-[#748399] mb-1">
                  تحديد نصيب كل مشارك بالريال:
                </div>
                {selectedParticipantIds.map((pid) => {
                  const mem = members.find((m) => m.id === pid);
                  const val = customShares[pid] ?? equalSharesPreview[pid] ?? 0;
                  return (
                    <div key={pid} className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-[#172B45] truncate">
                        {mem?.name}
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={val}
                        onChange={(e) =>
                          setCustomShares((prev) => ({
                            ...prev,
                            [pid]: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-28 h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-bold tabular-nums text-left focus:outline-none focus:border-[#2878C8]"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {createError && (
            <div className="p-3 rounded-xl bg-[#DC5555]/10 text-[#DC5555] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="h-10 px-4 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
            >
              حفظ وإنشاء القطة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
