import React, { useState } from 'react';
import {
  Plus,
  Coins,
  Wallet,
  Clock,
  ArrowRight,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Member, Qitta, QittaParticipant } from '../types';
import { Modal, PageHeader, StatCard, StatusIndicator } from '../components/ui/SharedUI';
import { formatCurrency } from '../utils/formatters';

export function QittatPage({
  qittat,
  members,
  onCreateQitta,
  onRecordParticipantPayment,
}: {
  qittat: Qitta[];
  members: Member[];
  onCreateQitta: (qitta: Omit<Qitta, 'id'>) => void;
  onRecordParticipantPayment: (qittaId: string, memberId: string, paidAmount: number) => void;
}) {
  const [selectedQittaId, setSelectedQittaId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [payModalParticipant, setPayModalParticipant] = useState<QittaParticipant | null>(null);
  const [payInputAmount, setPayInputAmount] = useState(0);

  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState(1000);
  const [selectedParticipantIds, setSelectedParticipantIds] = useState<string[]>(
    members.slice(0, 5).map((m) => m.id)
  );

  const totalRequired = qittat.reduce((s, q) => s + q.totalAmount, 0);
  const totalCollected = qittat.reduce(
    (s, q) => s + q.participants.reduce((ps, p) => ps + p.paidAmount, 0),
    0
  );
  const totalRemaining = Math.max(0, totalRequired - totalCollected);

  const toggleParticipant = (id: string) => {
    setSelectedParticipantIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selectedParticipantIds.length === 0) return;
    const share = Math.round(totalAmount / selectedParticipantIds.length);
    const participants: QittaParticipant[] = selectedParticipantIds.map((id) => {
      const mem = members.find((m) => m.id === id);
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
      description: description.trim() || reason.trim() || 'تجميع قِطّة بين الأعضاء المشاركين.',
      createdAt: '2026-11-15',
      totalAmount,
      status: 'جديدة',
      participants,
    });

    setName('');
    setReason('');
    setDescription('');
    setCreateOpen(false);
  };

  const selectedQitta = selectedQittaId
    ? qittat.find((q) => q.id === selectedQittaId) ?? null
    : null;

  if (selectedQitta) {
    const collected = selectedQitta.participants.reduce((s, p) => s + p.paidAmount, 0);
    const remaining = Math.max(0, selectedQitta.totalAmount - collected);
    const pct = Math.min(
      100,
      Math.round((collected / Math.max(1, selectedQitta.totalAmount)) * 100)
    );

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedQittaId(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#2878C8] text-sm font-semibold text-[#172B45] cursor-pointer"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى قائمة القِطّات</span>
          </button>
        </div>

        {/* Details Header + Progress */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(18,59,112,0.04)] space-y-5">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-[#172B45]">{selectedQitta.name}</h1>
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
              <div className="mt-2 text-xs text-[#748399]">
                السبب: <span className="text-[#172B45] font-semibold">{selectedQitta.reason}</span> ·
                تاريخ القِطّة:{' '}
                <span className="tabular-nums text-[#172B45]">{selectedQitta.createdAt}</span>
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
              <span className="font-bold text-[#172B45]">نسبة تحصيل القِطّة ({pct}%)</span>
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

        {/* Participants Table */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden">
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
                  const rem = Math.max(0, p.shareAmount - p.paidAmount);
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
                              setPayInputAmount(rem);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#EAF3FC] hover:bg-[#2878C8] text-[#123B70] hover:text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            تسجيل دفعة
                          </button>
                        ) : (
                          <span className="text-xs text-[#16A36A] font-semibold">مكتمل</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Participant Partial/Full Payment Modal */}
        <Modal
          isOpen={Boolean(payModalParticipant)}
          onClose={() => setPayModalParticipant(null)}
          title="تسجيل سداد حصة قِطّة"
          subtitle={payModalParticipant?.memberName}
          size="sm"
        >
          {payModalParticipant && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onRecordParticipantPayment(
                  selectedQitta.id,
                  payModalParticipant.memberId,
                  payInputAmount
                );
                setPayModalParticipant(null);
              }}
              className="space-y-4"
            >
              <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs space-y-1 tabular-nums">
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
                  <strong className="text-[#DC5555]">
                    {formatCurrency(
                      Math.max(0, payModalParticipant.shareAmount - payModalParticipant.paidAmount)
                    )}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                  المبلغ المدفوع الآن (يمكن الدفع جزئياً)
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={payModalParticipant.shareAmount - payModalParticipant.paidAmount}
                  value={payInputAmount}
                  onChange={(e) => setPayInputAmount(Number(e.target.value))}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold tabular-nums focus:outline-none focus:border-[#2878C8]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalParticipant(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
                >
                  اعتماد الدفعة
                </button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة القِطّات"
        description="تنظيم المبالغ التشاركية للمناسبات والرحلات والاستراحات والمصروفات المشتركة بين الأعضاء."
        action={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء قِطّة جديدة</span>
          </button>
        }
      />

      {/* Special Permission Banner */}
      <div className="bg-[#EAF3FC] border border-[#4A90D9]/35 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2.5 text-[#123B70]">
          <ShieldCheck className="w-4 h-4 text-[#2878C8] shrink-0" />
          <span>
            <strong>صلاحية إدارة القِطّات:</strong> العضو المخوّل بإدارة هذا القسم{' '}
            <strong className="underline">تركي عبدالله (مسؤول القِطّات)</strong> — مستخدم مستقل
            مخصص لقسم القِطّات فقط دون صلاحيات المدير الكاملة.
          </span>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي القِطّات"
          value={`${qittat.length} قِطّات`}
          subtitle="الحالية والسابقة"
          icon={Coins}
          accent="royal"
        />
        <StatCard
          title="إجمالي المبالغ المطلوبة"
          value={formatCurrency(totalRequired)}
          subtitle="مجموع تكلفة القِطّات المسجلة"
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

      {/* Qittat Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {qittat.map((q) => {
          const collected = q.participants.reduce((s, p) => s + p.paidAmount, 0);
          const remaining = Math.max(0, q.totalAmount - collected);
          const pct = Math.min(100, Math.round((collected / Math.max(1, q.totalAmount)) * 100));

          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(18,59,112,0.04)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
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

                <h3 className="mt-3 text-lg font-bold text-[#172B45]">{q.name}</h3>
                <p className="mt-1 text-xs text-[#748399] leading-relaxed">{q.reason}</p>

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
                className="mt-5 w-full py-2.5 rounded-xl bg-[#EAF3FC] hover:bg-[#2878C8] text-[#123B70] hover:text-white text-sm font-bold transition-colors cursor-pointer"
              >
                عرض تفاصيل القِطّة
              </button>
            </div>
          );
        })}
      </div>

      {/* Create Qitta Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="إنشاء قِطّة جديدة"
        subtitle="حدد تفاصيل القِطّة واختر الأعضاء المشاركين لحساب نصيب كل مشارك تلقائياً"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">اسم القِطّة</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثال: قِطّة استراحة نهاية الأسبوع"
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
                min={100}
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm font-bold tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">سبب القِطّة</label>
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-[#172B45]">
                المشاركون ({selectedParticipantIds.length} مختار)
              </label>
              {selectedParticipantIds.length > 0 && (
                <span className="text-xs font-bold text-[#2878C8] tabular-nums">
                  نصيب الفرد:{' '}
                  {formatCurrency(Math.round(totalAmount / selectedParticipantIds.length))}
                </span>
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
                    className={`px-2.5 py-2 rounded-lg text-xs font-semibold text-right border transition-colors cursor-pointer truncate ${
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
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
            >
              حفظ وإنشاء القِطّة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
