import React, { useState } from 'react';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ArrowRight,
  Users,
  Phone,
  CreditCard,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import {
  Group,
  MarriageAid,
  Member,
  MemberYearSubscription,
  PaymentRecord,
  Qitta,
  SubscriptionStatus,
  SystemUser,
  YearConfig,
} from '../types';
import {
  ConfirmModal,
  EmptyState,
  Modal,
  PageHeader,
  StatCard,
  StatusIndicator,
} from '../components/ui/SharedUI';
import { computeMemberYearTotals, formatCurrency } from '../utils/formatters';
import { ARABIC_MONTHS } from '../data/mockData';

function getStatusTone(status: SubscriptionStatus) {
  if (status === 'مسدد') return 'success';
  if (status === 'متأخر') return 'danger';
  return 'warning';
}

export function MembersPage({
  members,
  groups,
  subscriptions,
  yearConfigs,
  payments,
  qittat,
  marriageAids,
  currentUser,
  selectedMemberId,
  onSelectMember,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
}: {
  members: Member[];
  groups: Group[];
  subscriptions: MemberYearSubscription[];
  yearConfigs: YearConfig[];
  payments: PaymentRecord[];
  qittat: Qitta[];
  marriageAids: MarriageAid[];
  currentUser: SystemUser;
  selectedMemberId: string | null;
  onSelectMember: (id: string | null) => void;
  onAddMember: (data: {
    name: string;
    nationalId: string;
    birthDate: string;
    groupId: string;
    phone: string;
  }) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
}) {
  const isGroupLeader = currentUser.role === 'رئيس المجموعة';
  const canEdit = currentUser.role === 'مدير الصندوق';

  const scopedMembers =
    isGroupLeader && currentUser.groupId
      ? members.filter((m) => m.groupId === currentUser.groupId)
      : members;

  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);

  const [formName, setFormName] = useState('');
  const [formNationalId, setFormNationalId] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formGroupId, setFormGroupId] = useState(groups[0]?.id ?? '');
  const [formPhone, setFormPhone] = useState('');
  const [formStatus, setFormStatus] = useState<SubscriptionStatus>('مسدد');

  const openAddModal = () => {
    setEditingMember(null);
    setFormName('');
    setFormNationalId('');
    setFormBirthDate('1995-01-01');
    setFormGroupId(groups[0]?.id ?? '');
    setFormPhone('0500000000');
    setFormStatus('مسدد');
    setModalOpen(true);
  };

  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormNationalId(m.nationalId);
    setFormBirthDate(m.birthDate);
    setFormGroupId(m.groupId);
    setFormPhone(m.phone);
    setFormStatus(m.subscriptionStatus);
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formNationalId.trim()) return;
    const grp = groups.find((g) => g.id === formGroupId);
    if (editingMember) {
      onUpdateMember({
        ...editingMember,
        name: formName.trim(),
        nationalId: formNationalId.trim(),
        birthDate: formBirthDate,
        groupId: formGroupId,
        groupName: grp?.name ?? editingMember.groupName,
        phone: formPhone.trim(),
        subscriptionStatus: formStatus,
      });
    } else {
      onAddMember({
        name: formName.trim(),
        nationalId: formNationalId.trim(),
        birthDate: formBirthDate,
        groupId: formGroupId,
        phone: formPhone.trim(),
      });
    }
    setModalOpen(false);
  };

  const selectedMember = selectedMemberId
    ? scopedMembers.find((m) => m.id === selectedMemberId) ?? null
    : null;

  if (selectedMember) {
    return (
      <MemberDetailsView
        member={selectedMember}
        subscriptions={subscriptions}
        yearConfigs={yearConfigs}
        payments={payments}
        qittat={qittat}
        marriageAids={marriageAids}
        canEdit={canEdit}
        onBack={() => onSelectMember(null)}
        onEdit={() => openEditModal(selectedMember)}
      />
    );
  }

  const filtered = scopedMembers.filter((m) => {
    const q = search.trim();
    const matchesSearch =
      !q || m.name.includes(q) || m.nationalId.includes(q) || m.groupName.includes(q);
    const matchesGroup = groupFilter === 'all' || m.groupId === groupFilter;
    const matchesStatus = statusFilter === 'all' || m.subscriptionStatus === statusFilter;
    return matchesSearch && matchesGroup && matchesStatus;
  });

  return (
    <div className="space-y-5">
      <PageHeader
        title="إدارة الأعضاء"
        description={
          isGroupLeader
            ? `عرض أعضاء ${currentUser.groupName} وحساباتهم واشتراكاتهم (صلاحية عرض فقط).`
            : 'عرض ومتابعة بيانات أعضاء صندوق الإشراف وحالات اشتراكاتهم حسب المجموعات.'
        }
        action={
          canEdit ? (
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عضو جديد</span>
            </button>
          ) : undefined
        }
      />

      {isGroupLeader && (
        <div className="bg-[#EAF3FC] border border-[#4A90D9]/35 rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs text-[#123B70]">
          <ShieldAlert className="w-4 h-4 text-[#2878C8] shrink-0" />
          <span>
            أنت تتصفح بصلاحية <strong>رئيس المجموعة ({currentUser.groupName})</strong>: يمكنك
            استعراض بيانات واشتراكات أعضاء مجموعتك فقط دون صلاحية التعديل أو تسجيل المدفوعات.
          </span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-[0_1px_3px_rgba(18,59,112,0.04)]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className={`${isGroupLeader ? 'md:col-span-8' : 'md:col-span-6'} relative`}>
            <Search className="w-4 h-4 text-[#748399] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم، رقم الهوية، أو المجموعة..."
              className="w-full h-11 pr-10 pl-4 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm text-[#172B45] focus:bg-white focus:outline-none focus:border-[#2878C8]"
            />
          </div>

          {!isGroupLeader && (
            <div className="md:col-span-3">
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm text-[#172B45] focus:bg-white focus:outline-none focus:border-[#2878C8]"
              >
                <option value="all">جميع المجموعات</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={isGroupLeader ? 'md:col-span-4' : 'md:col-span-3'}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm text-[#172B45] focus:bg-white focus:outline-none focus:border-[#2878C8]"
            >
              <option value="all">جميع حالات الاشتراك</option>
              <option value="مسدد">مسدد</option>
              <option value="متأخر">متأخر</option>
              <option value="مسدد جزئياً">مسدد جزئياً</option>
            </select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title="لا يوجد أعضاء مطابقون للبحث"
          description="جرّب تغيير كلمات البحث أو إعادة تعيين فلاتر المجموعة والحالة."
          action={
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setGroupFilter('all');
                setStatusFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-[#EAF3FC] text-[#2878C8] text-sm font-semibold hover:bg-[#d8ebfc] transition-colors cursor-pointer"
            >
              إعادة تعيين الفلاتر
            </button>
          }
        />
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-slate-200/80 text-xs font-bold text-[#748399]">
                    <th className="py-3.5 px-4">م</th>
                    <th className="py-3.5 px-4">اسم العضو</th>
                    <th className="py-3.5 px-4">رقم الهوية</th>
                    <th className="py-3.5 px-4">تاريخ الميلاد</th>
                    <th className="py-3.5 px-4">المجموعة</th>
                    <th className="py-3.5 px-4">تاريخ الانضمام</th>
                    <th className="py-3.5 px-4">حالة الاشتراك</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filtered.map((member, index) => (
                    <tr key={member.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4 text-xs font-semibold text-[#748399] tabular-nums">
                        {index + 1}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectMember(member.id)}
                          className="font-bold text-[#123B70] hover:text-[#2878C8] hover:underline cursor-pointer"
                        >
                          {member.name}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#172B45] tabular-nums whitespace-nowrap">
                        {member.nationalId}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#748399] tabular-nums whitespace-nowrap">
                        {member.birthDate}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-[#172B45] whitespace-nowrap">
                        {member.groupName}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#748399] tabular-nums whitespace-nowrap">
                        {member.joinDate}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusIndicator
                          label={member.subscriptionStatus}
                          tone={getStatusTone(member.subscriptionStatus)}
                        />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectMember(member.id)}
                            title="عرض ملف العضو"
                            className="p-2 rounded-lg text-[#2878C8] hover:bg-[#EAF3FC] transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(member)}
                                title="تعديل البيانات"
                                className="p-2 rounded-lg text-[#172B45] hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(member)}
                                title="حذف العضو"
                                className="p-2 rounded-lg text-[#DC5555] hover:bg-[#DC5555]/10 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Responsive Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((member) => (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectMember(member.id)}
                    className="text-base font-bold text-[#123B70] text-right"
                  >
                    {member.name}
                  </button>
                  <StatusIndicator
                    label={member.subscriptionStatus}
                    tone={getStatusTone(member.subscriptionStatus)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[#748399]">
                  <div>
                    الهوية: <span className="text-[#172B45] tabular-nums">{member.nationalId}</span>
                  </div>
                  <div>
                    الميلاد: <span className="text-[#172B45] tabular-nums">{member.birthDate}</span>
                  </div>
                  <div className="col-span-2">
                    المجموعة: <span className="text-[#172B45] font-medium">{member.groupName}</span>
                  </div>
                </div>
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectMember(member.id)}
                    className="flex-1 py-2 rounded-lg bg-[#EAF3FC] text-[#2878C8] text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>عرض الملف</span>
                  </button>
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(member)}
                        className="px-3 py-2 rounded-lg bg-slate-100 text-[#172B45] text-xs font-semibold"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(member)}
                        className="px-3 py-2 rounded-lg bg-[#DC5555]/10 text-[#DC5555] text-xs font-semibold"
                      >
                        حذف
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMember ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}
        subtitle="أدخل البيانات الأساسية للعضو وحدد المجموعة التابعة له"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">الاسم الكامل</label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="مثال: عبدالعزيز محمد محسن"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">رقم الهوية</label>
              <input
                type="text"
                required
                value={formNationalId}
                onChange={(e) => setFormNationalId(e.target.value)}
                placeholder="10xxxxxxxx"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">تاريخ الميلاد</label>
              <input
                type="date"
                required
                value={formBirthDate}
                onChange={(e) => setFormBirthDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                المجموعة التابعة له
              </label>
              <select
                value={formGroupId}
                onChange={(e) => setFormGroupId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">رقم الجوال</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="05xxxxxxxx"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>
          </div>

          {editingMember && (
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">حالة الاشتراك</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as SubscriptionStatus)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              >
                <option value="مسدد">مسدد</option>
                <option value="مسدد جزئياً">مسدد جزئياً</option>
                <option value="متأخر">متأخر</option>
              </select>
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-[#172B45] transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              حفظ البيانات
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && onDeleteMember(deleteTarget.id)}
        title="تأكيد حذف العضو"
        message={`هل أنت متأكد من حذف العضو "${deleteTarget?.name ?? ''}" من سجل الصندوق؟`}
      />
    </div>
  );
}

function MemberDetailsView({
  member,
  subscriptions,
  yearConfigs,
  payments,
  qittat,
  marriageAids,
  canEdit,
  onBack,
  onEdit,
}: {
  member: Member;
  subscriptions: MemberYearSubscription[];
  yearConfigs: YearConfig[];
  payments: PaymentRecord[];
  qittat: Qitta[];
  marriageAids: MarriageAid[];
  canEdit: boolean;
  onBack: () => void;
  onEdit: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'payments' | 'qittat' | 'marriage'>(
    'subscriptions'
  );

  const memberSubs = subscriptions.filter((s) => s.memberId === member.id);
  let totalDueAll = 0;
  let totalPaidAll = 0;
  let totalRemainingAll = 0;

  const yearRows = memberSubs.map((sub) => {
    const cfg = yearConfigs.find((y) => y.year === sub.year);
    const totals = computeMemberYearTotals(sub, cfg);
    totalDueAll += totals.totalDue;
    totalPaidAll += totals.totalPaid;
    totalRemainingAll += totals.remaining;
    return { sub, cfg, totals };
  });

  const memberPayments = payments.filter((p) => p.memberId === member.id);
  const memberQittat = qittat
    .map((q) => {
      const p = q.participants.find((part) => part.memberId === member.id);
      return p ? { qitta: q, participant: p } : null;
    })
    .filter(Boolean) as { qitta: Qitta; participant: Qitta['participants'][0] }[];

  const memberAids = marriageAids.filter((a) => a.memberId === member.id);

  const tabs = [
    { id: 'subscriptions' as const, label: 'سجل الاشتراكات حسب السنوات' },
    { id: 'payments' as const, label: 'سجل المدفوعات' },
    { id: 'qittat' as const, label: 'القِطّات المشاركة' },
    { id: 'marriage' as const, label: 'معونة الزواج' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#2878C8] text-sm font-semibold text-[#172B45] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة الأعضاء</span>
        </button>

        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            <span>تعديل بيانات العضو</span>
          </button>
        )}
      </div>

      {/* Member Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(18,59,112,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#123B70] to-[#2878C8] text-white text-xl font-bold flex items-center justify-center shrink-0">
              {member.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl font-bold text-[#172B45]">{member.name}</h1>
                <StatusIndicator
                  label={member.subscriptionStatus}
                  tone={getStatusTone(member.subscriptionStatus)}
                />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#748399]">
                <span>عضو {member.memberStatus}</span>
                <span>·</span>
                <span>الرقم التسلسلي: #{member.serial}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-[#2878C8] shrink-0" />
            <div>
              <div className="text-[11px] text-[#748399]">رقم الهوية</div>
              <div className="font-semibold text-[#172B45] tabular-nums">{member.nationalId}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-[#2878C8] shrink-0" />
            <div>
              <div className="text-[11px] text-[#748399]">تاريخ الميلاد</div>
              <div className="font-semibold text-[#172B45] tabular-nums">{member.birthDate}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-[#2878C8] shrink-0" />
            <div>
              <div className="text-[11px] text-[#748399]">المجموعة</div>
              <div className="font-semibold text-[#172B45]">{member.groupName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-[#2878C8] shrink-0" />
            <div>
              <div className="text-[11px] text-[#748399]">تاريخ الانضمام</div>
              <div className="font-semibold text-[#172B45] tabular-nums">{member.joinDate}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-[#2878C8] shrink-0" />
            <div>
              <div className="text-[11px] text-[#748399]">رقم الجوال</div>
              <div className="font-semibold text-[#172B45] tabular-nums">{member.phone}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="إجمالي الاشتراكات المستحقة"
          value={formatCurrency(totalDueAll)}
          subtitle="لكافة السنوات المسجلة"
          icon={CreditCard}
          accent="blue"
        />
        <StatCard
          title="إجمالي المبالغ المسددة"
          value={formatCurrency(totalPaidAll)}
          subtitle="شاملة رسوم التأسيس والاشتراكات"
          icon={CheckCircle2}
          accent="green"
        />
        <StatCard
          title="إجمالي المبالغ المتأخرة"
          value={formatCurrency(totalRemainingAll)}
          subtitle={totalRemainingAll === 0 ? 'لا توجد متأخرات على العضو' : 'متبقي قيد السداد'}
          icon={AlertCircle}
          accent={totalRemainingAll > 0 ? 'red' : 'royal'}
        />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden">
        <div className="flex items-center gap-1 p-2 bg-[#F8FAFC] border-b border-slate-200/80 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#2878C8] text-white shadow-sm'
                  : 'text-[#748399] hover:text-[#172B45] hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              {yearRows.length === 0 ? (
                <p className="text-sm text-[#748399]">لا توجد اشتراكات مسجلة لهذا العضو بعد.</p>
              ) : (
                yearRows.map(({ sub, totals }) => (
                  <div key={sub.year} className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-bold text-[#123B70]">السنة المالية {sub.year}</div>
                      <div className="flex flex-wrap items-center gap-4 text-xs tabular-nums">
                        <span>المستحق: {formatCurrency(totals.totalDue)}</span>
                        <span className="text-[#16A36A] font-semibold">
                          المسدد: {formatCurrency(totals.totalPaid)}
                        </span>
                        <span
                          className={
                            totals.remaining > 0 ? 'text-[#DC5555] font-bold' : 'text-[#748399]'
                          }
                        >
                          المتبقي: {formatCurrency(totals.remaining)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                      {sub.months.map((st, idx) => {
                        const cls =
                          st === 'paid'
                            ? 'bg-[#16A36A]/10 text-[#16A36A] border-[#16A36A]/25'
                            : st === 'overdue'
                              ? 'bg-[#DC5555]/10 text-[#DC5555] border-[#DC5555]/25'
                              : st === 'partial'
                                ? 'bg-[#E99A35]/12 text-[#C67B1B] border-[#E99A35]/30'
                                : 'bg-slate-100 text-[#748399] border-slate-200';
                        const label =
                          st === 'paid'
                            ? 'مسدد'
                            : st === 'overdue'
                              ? 'متأخر'
                              : st === 'partial'
                                ? 'جزئي'
                                : 'قادم';
                        return (
                          <div
                            key={ARABIC_MONTHS[idx]}
                            className={`rounded-lg border p-2 text-center ${cls}`}
                          >
                            <div className="text-[11px] font-bold">{ARABIC_MONTHS[idx]}</div>
                            <div className="text-[10px] mt-0.5 font-medium">{label}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="overflow-x-auto">
              {memberPayments.length === 0 ? (
                <p className="text-sm text-[#748399]">لا توجد عمليات سداد مسجلة لهذا العضو.</p>
              ) : (
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold text-[#748399]">
                      <th className="py-3 px-4">السنة</th>
                      <th className="py-3 px-4">الأشهر / البيان</th>
                      <th className="py-3 px-4">المستحق</th>
                      <th className="py-3 px-4">المدفوع</th>
                      <th className="py-3 px-4">المتبقي</th>
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {memberPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3 px-4 font-bold tabular-nums">{p.year}</td>
                        <td className="py-3 px-4 text-xs text-[#172B45]">{p.monthsLabel}</td>
                        <td className="py-3 px-4 text-xs tabular-nums">{formatCurrency(p.dueAmount)}</td>
                        <td className="py-3 px-4 font-bold text-[#16A36A] tabular-nums">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#DC5555] tabular-nums">
                          {formatCurrency(p.remainingAmount)}
                        </td>
                        <td className="py-3 px-4 text-xs text-[#748399] tabular-nums">{p.date}</td>
                        <td className="py-3 px-4">
                          <StatusIndicator
                            label={p.status}
                            tone={p.status === 'مكتمل' ? 'success' : 'warning'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'qittat' && (
            <div className="overflow-x-auto">
              {memberQittat.length === 0 ? (
                <p className="text-sm text-[#748399]">لم يشارك هذا العضو في قِطّات مسجلة حالياً.</p>
              ) : (
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold text-[#748399]">
                      <th className="py-3 px-4">اسم القِطّة</th>
                      <th className="py-3 px-4">التاريخ</th>
                      <th className="py-3 px-4">حصة العضو</th>
                      <th className="py-3 px-4">المسدد</th>
                      <th className="py-3 px-4">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {memberQittat.map(({ qitta, participant }) => (
                      <tr key={qitta.id}>
                        <td className="py-3 px-4 font-bold text-[#172B45]">{qitta.name}</td>
                        <td className="py-3 px-4 text-xs text-[#748399] tabular-nums">
                          {qitta.createdAt}
                        </td>
                        <td className="py-3 px-4 font-semibold tabular-nums">
                          {formatCurrency(participant.shareAmount)}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#16A36A] tabular-nums">
                          {formatCurrency(participant.paidAmount)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusIndicator
                            label={participant.status}
                            tone={
                              participant.status === 'سدد كامل المبلغ'
                                ? 'success'
                                : participant.status === 'دفع جزئياً'
                                  ? 'warning'
                                  : 'danger'
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'marriage' && (
            <div className="overflow-x-auto">
              {memberAids.length === 0 ? (
                <p className="text-sm text-[#748399]">لا توجد سجلات معونة زواج لهذا العضو.</p>
              ) : (
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold text-[#748399]">
                      <th className="py-3 px-4">قيمة المعونة</th>
                      <th className="py-3 px-4">تاريخ الاستحقاق</th>
                      <th className="py-3 px-4">تاريخ الصرف</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {memberAids.map((a) => (
                      <tr key={a.id}>
                        <td className="py-3 px-4 font-bold text-[#123B70] tabular-nums">
                          {formatCurrency(a.amount)}
                        </td>
                        <td className="py-3 px-4 text-xs tabular-nums">{a.dueDate}</td>
                        <td className="py-3 px-4 text-xs tabular-nums">{a.disbursementDate}</td>
                        <td className="py-3 px-4">
                          <StatusIndicator
                            label={a.status}
                            tone={
                              a.status === 'تم الصرف'
                                ? 'success'
                                : a.status === 'مستحقة'
                                  ? 'info'
                                  : 'warning'
                            }
                          />
                        </td>
                        <td className="py-3 px-4 text-xs text-[#748399]">{a.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
