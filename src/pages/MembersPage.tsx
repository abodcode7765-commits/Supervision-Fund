import React, { useState } from 'react';
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Archive,
  RotateCcw,
  ArrowRight,
  Users,
  CreditCard,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  Group,
  MarriageAid,
  Member,
  MemberStatus,
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
import {
  addCurrency,
  computeMemberYearTotals,
  formatCurrency,
  getTodayIsoDate,
  isFutureScheduledYear,
  isSubscriptionRowOverdue,
  toHalalas,
} from '../utils/formatters';
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
  onToggleArchiveMember,
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
  }) => { ok: boolean; error?: string };
  onUpdateMember: (member: Member) => { ok: boolean; error?: string };
  onToggleArchiveMember: (id: string) => void;
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
  const [sortMode, setSortMode] = useState<'serial' | 'recent'>('recent');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Member | null>(null);

  const [formName, setFormName] = useState('');
  const [formNationalId, setFormNationalId] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('');
  const [formGroupId, setFormGroupId] = useState(groups[0]?.id ?? '');
  const [formMemberStatus, setFormMemberStatus] = useState<MemberStatus>('نشط');
  const [formError, setFormError] = useState('');

  const openAddModal = () => {
    setEditingMember(null);
    setFormName('');
    setFormNationalId('');
    setFormBirthDate('1995-01-01');
    setFormGroupId(groups[0]?.id ?? '');
    setFormMemberStatus('نشط');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setFormName(m.name);
    setFormNationalId(m.nationalId);
    setFormBirthDate(m.birthDate);
    setFormGroupId(m.groupId);
    setFormMemberStatus(m.memberStatus);
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    const cleanNationalId = formNationalId.trim();

    if (!cleanName) {
      setFormError('يرجى إدخال الاسم الكامل للعضو.');
      return;
    }
    if (!cleanNationalId) {
      setFormError('يرجى إدخال رقم الهوية.');
      return;
    }
    if (!formBirthDate) {
      setFormError('يرجى تحديد تاريخ الميلاد.');
      return;
    }
    if (formBirthDate > getTodayIsoDate()) {
      setFormError('تاريخ الميلاد لا يمكن أن يكون في المستقبل.');
      return;
    }
    if (!formGroupId) {
      setFormError('يرجى اختيار المجموعة.');
      return;
    }

    const grp = groups.find((g) => g.id === formGroupId);
    if (editingMember) {
      const res = onUpdateMember({
        ...editingMember,
        name: cleanName,
        nationalId: cleanNationalId,
        birthDate: formBirthDate,
        groupId: formGroupId,
        groupName: grp?.name ?? editingMember.groupName,
        memberStatus: formMemberStatus,
      });
      if (!res.ok) {
        setFormError(res.error ?? 'تعذر حفظ التعديلات.');
        return;
      }
    } else {
      const res = onAddMember({
        name: cleanName,
        nationalId: cleanNationalId,
        birthDate: formBirthDate,
        groupId: formGroupId,
      });
      if (!res.ok) {
        setFormError(res.error ?? 'تعذر إضافة العضو.');
        return;
      }
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

  const filtered = scopedMembers
    .filter((m) => {
      const q = search.trim();
      const matchesSearch =
        !q || m.name.includes(q) || m.nationalId.includes(q) || m.groupName.includes(q);
      const matchesGroup = groupFilter === 'all' || m.groupId === groupFilter;
      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'موقوف'
            ? m.memberStatus === 'موقوف'
            : statusFilter === 'نشط'
              ? m.memberStatus === 'نشط'
              : m.subscriptionStatus === statusFilter;
      return matchesSearch && matchesGroup && matchesStatus;
    })
    .sort((a, b) => {
      if (sortMode === 'recent') {
        const cmp = b.joinDate.localeCompare(a.joinDate);
        return cmp !== 0 ? cmp : b.serial - a.serial;
      }
      return a.serial - b.serial;
    });

  const recentIds = new Set(
    [...scopedMembers]
      .sort((a, b) => {
        const cmp = b.joinDate.localeCompare(a.joinDate);
        return cmp !== 0 ? cmp : b.serial - a.serial;
      })
      .slice(0, 3)
      .map((m) => m.id)
  );

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
              className="w-full sm:w-auto h-10 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          <div className={`${isGroupLeader ? 'lg:col-span-6' : 'lg:col-span-4'} relative`}>
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
            <div className="lg:col-span-3">
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

          <div className={isGroupLeader ? 'lg:col-span-3' : 'lg:col-span-3'}>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm text-[#172B45] focus:bg-white focus:outline-none focus:border-[#2878C8]"
            >
              <option value="all">جميع الحالات</option>
              <option value="مسدد">مسدد</option>
              <option value="مسدد جزئياً">مسدد جزئياً</option>
              <option value="متأخر">متأخر</option>
              <option value="نشط">الأعضاء النشطون</option>
              <option value="موقوف">الأعضاء المؤرشفون/الموقوفون</option>
            </select>
          </div>

          <div className={isGroupLeader ? 'lg:col-span-3' : 'lg:col-span-2'}>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as 'serial' | 'recent')}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-[#F8FAFC] text-sm text-[#172B45] focus:bg-white focus:outline-none focus:border-[#2878C8]"
              aria-label="ترتيب الأعضاء"
            >
              <option value="recent">الأحدث إضافة</option>
              <option value="serial">الترتيب التسلسلي</option>
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
              className="h-10 px-4 rounded-xl bg-[#EAF3FC] text-[#2878C8] text-sm font-semibold hover:bg-[#d8ebfc] transition-colors cursor-pointer"
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
                    <th className="py-3.5 px-4">الرقم</th>
                    <th className="py-3.5 px-4">اسم العضو</th>
                    <th className="py-3.5 px-4">رقم الهوية</th>
                    <th className="py-3.5 px-4">تاريخ الميلاد</th>
                    <th className="py-3.5 px-4">المجموعة</th>
                    <th className="py-3.5 px-4">تاريخ الإضافة</th>
                    <th className="py-3.5 px-4">حالة الاشتراك</th>
                    <th className="py-3.5 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filtered.map((member) => (
                    <tr
                      key={member.id}
                      className={`hover:bg-[#F8FAFC] transition-colors ${
                        member.memberStatus === 'موقوف' ? 'bg-slate-50/70 opacity-80' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 text-xs font-semibold text-[#748399] tabular-nums">
                        #{member.serial}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectMember(member.id)}
                            className="font-bold text-[#123B70] hover:text-[#2878C8] hover:underline cursor-pointer"
                          >
                            {member.name}
                          </button>
                          {recentIds.has(member.id) && sortMode === 'recent' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EAF3FC] text-[#2878C8] text-[10px] font-bold">
                              <Sparkles className="w-2.5 h-2.5" />
                              حديث
                            </span>
                          )}
                          {member.memberStatus === 'موقوف' && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-[#748399] text-[10px] font-bold">
                              موقوف
                            </span>
                          )}
                        </div>
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
                                onClick={() => setArchiveTarget(member)}
                                title={
                                  member.memberStatus === 'نشط'
                                    ? 'أرشفة / إيقاف العضو مع حفظ السجل المالي'
                                    : 'إعادة تفعيل العضو'
                                }
                                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                  member.memberStatus === 'نشط'
                                    ? 'text-[#C67B1B] hover:bg-[#E99A35]/15'
                                    : 'text-[#16A36A] hover:bg-[#16A36A]/10'
                                }`}
                              >
                                {member.memberStatus === 'نشط' ? (
                                  <Archive className="w-4 h-4" />
                                ) : (
                                  <RotateCcw className="w-4 h-4" />
                                )}
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

          {/* Mobile Responsive Cards (Uniform heights & consistent action buttons) */}
          <div className="md:hidden space-y-3">
            {filtered.map((member) => (
              <div
                key={member.id}
                className={`bg-white rounded-xl border border-slate-200/80 p-4 space-y-3 ${
                  member.memberStatus === 'موقوف' ? 'bg-slate-50 opacity-85' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-[#748399] tabular-nums">
                        #{member.serial}
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectMember(member.id)}
                        className="text-sm font-bold text-[#123B70] text-right truncate"
                      >
                        {member.name}
                      </button>
                      {member.memberStatus === 'موقوف' && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-200 text-[#748399] text-[10px] font-bold">
                          موقوف
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#748399] mt-0.5 truncate">
                      {member.groupName}
                    </div>
                  </div>
                  <StatusIndicator
                    label={member.subscriptionStatus}
                    tone={getStatusTone(member.subscriptionStatus)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-[#F8FAFC] text-xs text-[#748399]">
                  <div className="truncate">
                    الهوية: <span className="text-[#172B45] font-medium tabular-nums">{member.nationalId}</span>
                  </div>
                  <div className="truncate">
                    الميلاد: <span className="text-[#172B45] font-medium tabular-nums">{member.birthDate}</span>
                  </div>
                  <div className="col-span-2 truncate">
                    تاريخ الإضافة: <span className="text-[#172B45] font-medium tabular-nums">{member.joinDate}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectMember(member.id)}
                    className={`h-9 rounded-lg bg-[#EAF3FC] text-[#2878C8] text-xs font-bold flex items-center justify-center gap-1 ${
                      canEdit ? 'col-span-1' : 'col-span-3'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>الملف</span>
                  </button>
                  {canEdit && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEditModal(member)}
                        className="h-9 rounded-lg bg-slate-100 text-[#172B45] text-xs font-semibold flex items-center justify-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setArchiveTarget(member)}
                        className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 ${
                          member.memberStatus === 'نشط'
                            ? 'bg-[#E99A35]/14 text-[#C67B1B]'
                            : 'bg-[#16A36A]/10 text-[#16A36A]'
                        }`}
                      >
                        {member.memberStatus === 'نشط' ? (
                          <>
                            <Archive className="w-3.5 h-3.5" />
                            <span>أرشفة</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>تفعيل</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add / Edit Member Modal (Strictly Approved Fields Only) */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMember ? 'تعديل بيانات العضو' : 'إضافة عضو جديد'}
        subtitle="البيانات المعتمدة: الاسم، رقم الهوية، تاريخ الميلاد، والمجموعة التابعة له"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-[#DC5555]/10 border border-[#DC5555]/25 text-[#DC5555] text-xs font-semibold">
              {formError}
            </div>
          )}

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
                placeholder="أدخل رقم الهوية"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">تاريخ الميلاد</label>
              <input
                type="date"
                required
                max={getTodayIsoDate()}
                value={formBirthDate}
                onChange={(e) => setFormBirthDate(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm tabular-nums focus:outline-none focus:border-[#2878C8]"
              />
            </div>
          </div>

          <div className={editingMember ? 'grid grid-cols-1 sm:grid-cols-2 gap-3.5' : ''}>
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

            {editingMember && (
              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1.5">حالة العضوية</label>
                <select
                  value={formMemberStatus}
                  onChange={(e) => setFormMemberStatus(e.target.value as MemberStatus)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
                >
                  <option value="نشط">نشط</option>
                  <option value="موقوف">موقوف / مؤرشف</option>
                </select>
              </div>
            )}
          </div>

          {!editingMember && (
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-200/80 text-[11px] text-[#748399]">
              يتم تسجيل العضو الجديد برصيد سداد مبدئي (0 ر.س) ويُحسب له اشتراك السنة المالية الحالية
              حتى يتم تسجيل مدفوعاته في سجل السداد.
            </div>
          )}

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="h-10 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-[#172B45] transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              حفظ البيانات
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => archiveTarget && onToggleArchiveMember(archiveTarget.id)}
        variant={archiveTarget?.memberStatus === 'نشط' ? 'warning' : 'primary'}
        confirmLabel={archiveTarget?.memberStatus === 'نشط' ? 'تأكيد الأرشفة' : 'تأكيد التفعيل'}
        title={archiveTarget?.memberStatus === 'نشط' ? 'تأكيد إيقاف / أرشفة العضو' : 'إعادة تفعيل العضو'}
        message={
          archiveTarget?.memberStatus === 'نشط'
            ? `سيتم تحويل حالة العضو "${archiveTarget?.name ?? ''}" إلى موقوف مع الحفاظ الكامل على تاريخه المالي وسجلات السداد والقطات دون حذف.`
            : `هل تريد إعادة تفعيل العضو "${archiveTarget?.name ?? ''}" إلى الحالة النشطة؟`
        }
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

  const yearRows = [...memberSubs]
    .sort((a, b) => a.year - b.year)
    .map((sub) => {
      const cfg = yearConfigs.find((y) => y.year === sub.year);
      const totals = computeMemberYearTotals(sub, cfg);
      const isFutureUntouched =
        isFutureScheduledYear(sub.year) &&
        toHalalas(totals.totalPaid) === 0 &&
        !isSubscriptionRowOverdue(sub, totals, sub.year);

      totalPaidAll = addCurrency(totalPaidAll, totals.totalPaid);
      if (!isFutureUntouched) {
        totalDueAll = addCurrency(totalDueAll, totals.totalDue);
        totalRemainingAll = addCurrency(totalRemainingAll, totals.remaining);
      }
      return { sub, cfg, totals, isFutureUntouched };
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
    { id: 'qittat' as const, label: 'القطات المشاركة' },
    { id: 'marriage' as const, label: 'معونة الزواج' },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="h-10 inline-flex items-center gap-2 px-3.5 rounded-xl bg-white border border-slate-200 hover:border-[#2878C8] text-xs sm:text-sm font-semibold text-[#172B45] transition-colors cursor-pointer"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة الأعضاء</span>
        </button>

        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="h-10 inline-flex items-center gap-2 px-4 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-xs sm:text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            <span>تعديل بيانات العضو</span>
          </button>
        )}
      </div>

      {/* Member Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-[0_1px_3px_rgba(18,59,112,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#123B70] to-[#2878C8] text-white text-lg sm:text-xl font-bold flex items-center justify-center shrink-0">
              {member.name.slice(0, 1)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-[#172B45]">{member.name}</h1>
                <StatusIndicator
                  label={member.subscriptionStatus}
                  tone={getStatusTone(member.subscriptionStatus)}
                />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#748399]">
                <span>الحالة: {member.memberStatus}</span>
                <span>·</span>
                <span className="tabular-nums">الرقم التسلسلي: #{member.serial}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-4 h-4 text-[#2878C8] shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-[#748399]">رقم الهوية</div>
              <div className="font-semibold text-[#172B45] tabular-nums">{member.nationalId}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-[#2878C8] shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-[#748399]">تاريخ الميلاد</div>
              <div className="font-semibold text-[#172B45] tabular-nums">{member.birthDate}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-[#2878C8] shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-[#748399]">المجموعة</div>
              <div className="font-semibold text-[#172B45] truncate">{member.groupName}</div>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-[#2878C8] shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] text-[#748399]">تاريخ الإضافة</div>
              <div className="font-semibold text-[#172B45] tabular-nums">{member.joinDate}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="إجمالي الاشتراكات المستحقة"
          value={formatCurrency(totalDueAll)}
          subtitle="للسنوات المستحقة والنشطة"
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
        <div className="flex items-center gap-1.5 p-2 bg-[#F8FAFC] border-b border-slate-200/80 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 px-3.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#2878C8] text-white shadow-sm'
                  : 'text-[#748399] hover:text-[#172B45] hover:bg-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              {yearRows.length === 0 ? (
                <p className="text-sm text-[#748399]">لا توجد اشتراكات مسجلة لهذا العضو بعد.</p>
              ) : (
                yearRows.map(({ sub, cfg, totals, isFutureUntouched }) => (
                  <div key={sub.year} className="rounded-xl border border-slate-200 p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#123B70]">السنة المالية {sub.year}</span>
                        {isFutureUntouched && (
                          <StatusIndicator label="سنة قادمة مجدولة" tone="neutral" />
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs tabular-nums">
                        <span>المستحق: {formatCurrency(totals.totalDue)}</span>
                        <span className="text-[#16A36A] font-semibold">
                          المسدد: {formatCurrency(totals.totalPaid)}
                        </span>
                        <span
                          className={
                            totals.remaining > 0
                              ? isFutureUntouched
                                ? 'text-[#748399]'
                                : 'text-[#DC5555] font-bold'
                              : 'text-[#748399]'
                          }
                        >
                          المتبقي: {formatCurrency(totals.remaining)}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs flex items-center justify-between p-2.5 rounded-lg bg-[#F8FAFC] border border-slate-200/70">
                      <span className="text-[#748399]">رسوم التأسيس السنوية:</span>
                      <span className="font-bold tabular-nums text-[#172B45]">
                        {formatCurrency(totals.foundingPaid)} من {formatCurrency(totals.foundingDue)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2">
                      {sub.months.map((st, idx) => {
                        const paidAmt = totals.monthPaidAmounts[idx] ?? 0;
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
                                ? `${paidAmt}/${cfg?.monthlyFee ?? 0}`
                                : 'قادم';
                        return (
                          <div
                            key={ARABIC_MONTHS[idx]}
                            className={`rounded-lg border p-2 text-center ${cls}`}
                          >
                            <div className="text-[11px] font-bold">{ARABIC_MONTHS[idx]}</div>
                            <div className="text-[10px] mt-0.5 font-medium tabular-nums">{label}</div>
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
                <table className="w-full text-right border-collapse min-w-[600px]">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold text-[#748399]">
                      <th className="py-3 px-4">السنة</th>
                      <th className="py-3 px-4">الأشهر / البيان</th>
                      <th className="py-3 px-4">المطلوب قبل</th>
                      <th className="py-3 px-4">المدفوع</th>
                      <th className="py-3 px-4">المتبقي بعد</th>
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
                <p className="text-sm text-[#748399]">لم يشارك هذا العضو في قطات مسجلة حالياً.</p>
              ) : (
                <table className="w-full text-right border-collapse min-w-[520px]">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold text-[#748399]">
                      <th className="py-3 px-4">اسم القطة</th>
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
                <table className="w-full text-right border-collapse min-w-[520px]">
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
