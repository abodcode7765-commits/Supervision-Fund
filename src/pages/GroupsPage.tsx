import React, { useState } from 'react';
import {
  Plus,
  Users,
  Crown,
  AlertCircle,
  ArrowRight,
  UserPlus,
  RefreshCw,
  Layers,
  Pencil,
  ArrowLeftRight,
  ShieldAlert,
} from 'lucide-react';
import {
  Group,
  Member,
  MemberYearSubscription,
  SystemUser,
  YearConfig,
} from '../types';
import { Modal, PageHeader, StatCard, StatusIndicator } from '../components/ui/SharedUI';
import { computeMemberYearTotals, formatCurrency } from '../utils/formatters';

export function GroupsPage({
  groups,
  members,
  subscriptions,
  yearConfigs,
  currentUser,
  onCreateGroup,
  onUpdateGroup,
  onChangeGroupLeader,
  onAssignMemberToGroup,
  onSelectMember,
}: {
  groups: Group[];
  members: Member[];
  subscriptions: MemberYearSubscription[];
  yearConfigs: YearConfig[];
  currentUser: SystemUser;
  onCreateGroup: (data: { name: string; leaderId: string; description: string }) => void;
  onUpdateGroup: (group: Group) => void;
  onChangeGroupLeader: (groupId: string, newLeaderId: string) => void;
  onAssignMemberToGroup: (memberId: string, groupId: string) => void;
  onSelectMember: (memberId: string) => void;
}) {
  const isGroupLeader = currentUser.role === 'رئيس المجموعة';
  const canManageGroups = currentUser.role === 'مدير الصندوق';

  const visibleGroups =
    isGroupLeader && currentUser.groupId
      ? groups.filter((g) => g.id === currentUser.groupId)
      : groups;

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    isGroupLeader && currentUser.groupId ? currentUser.groupId : null
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [leaderModalOpen, setLeaderModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [moveMemberTarget, setMoveMemberTarget] = useState<Member | null>(null);
  const [moveDestinationGroupId, setMoveDestinationGroupId] = useState('');

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupLeaderId, setNewGroupLeaderId] = useState(members[0]?.id ?? '');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');

  const [chosenLeaderId, setChosenLeaderId] = useState('');
  const [chosenMemberId, setChosenMemberId] = useState('');

  const config2026 = yearConfigs.find((y) => y.year === 2026) ?? yearConfigs[0];

  const getGroupMetrics = (group: Group) => {
    const groupMembers = members.filter((m) => m.groupId === group.id);
    const overdueMembers = groupMembers.filter((m) => m.subscriptionStatus === 'متأخر');
    let totalDue = 0;
    let totalRemaining = 0;

    groupMembers.forEach((m) => {
      const sub = subscriptions.find((s) => s.memberId === m.id && s.year === 2026);
      const totals = computeMemberYearTotals(sub, config2026);
      totalDue += totals.totalDue;
      totalRemaining += totals.remaining;
    });

    const displayMemberCount = Math.max(groupMembers.length, group.baseMemberCount);
    return {
      groupMembers,
      displayMemberCount,
      overdueCount: overdueMembers.length,
      totalDue: totalDue > 0 ? totalDue : displayMemberCount * 750,
      totalRemaining,
    };
  };

  const selectedGroup = selectedGroupId
    ? visibleGroups.find((g) => g.id === selectedGroupId) ?? null
    : null;

  if (selectedGroup) {
    const metrics = getGroupMetrics(selectedGroup);
    const otherMembers = members.filter((m) => m.groupId !== selectedGroup.id);
    const otherGroups = groups.filter((g) => g.id !== selectedGroup.id);

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {!isGroupLeader ? (
            <button
              type="button"
              onClick={() => setSelectedGroupId(null)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#2878C8] text-sm font-semibold text-[#172B45] transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للمجموعات</span>
            </button>
          ) : (
            <div className="text-sm font-bold text-[#123B70]">لوحة مجموعتي</div>
          )}

          {canManageGroups && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditGroupName(selectedGroup.name);
                  setEditGroupDesc(selectedGroup.description);
                  setEditModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#2878C8] text-xs sm:text-sm font-semibold text-[#172B45] cursor-pointer"
              >
                <Pencil className="w-4 h-4 text-[#2878C8]" />
                <span>تعديل المجموعة</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChosenLeaderId(selectedGroup.leaderId);
                  setLeaderModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#2878C8] text-xs sm:text-sm font-semibold text-[#172B45] cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-[#2878C8]" />
                <span>تغيير رئيس المجموعة</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChosenMemberId(otherMembers[0]?.id ?? '');
                  setAddMemberModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-xs sm:text-sm font-semibold text-white cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة عضو للمجموعة</span>
              </button>
            </div>
          )}
        </div>

        {isGroupLeader && (
          <div className="bg-[#EAF3FC] border border-[#4A90D9]/35 rounded-xl px-4 py-3 flex items-center gap-2.5 text-xs text-[#123B70]">
            <ShieldAlert className="w-4 h-4 text-[#2878C8] shrink-0" />
            <span>
              صلاحية <strong>رئيس المجموعة</strong>: يمكنك الاطلاع على أعضاء مجموعتك وبياناتهم
              واشتراكاتهم فقط دون إمكانية تعديل البيانات أو إدارة مجموعات أخرى.
            </span>
          </div>
        )}

        {/* Group Info Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-[0_1px_3px_rgba(18,59,112,0.04)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#172B45]">{selectedGroup.name}</h1>
              <p className="mt-1 text-sm text-[#748399]">{selectedGroup.description}</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#EAF3FC] text-[#123B70] shrink-0">
              <Crown className="w-5 h-5 text-[#2878C8]" />
              <div>
                <div className="text-[11px] text-[#748399]">رئيس المجموعة</div>
                <div className="text-sm font-bold">{selectedGroup.leaderName}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Group KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="أعضاء المجموعة المسجلون"
            value={`${metrics.groupMembers.length} عضو`}
            subtitle={`إجمالي الفرع: ${metrics.displayMemberCount} عضواً`}
            icon={Users}
            accent="royal"
          />
          <StatCard
            title="إجمالي الاشتراكات المستحقة"
            value={formatCurrency(metrics.totalDue)}
            subtitle="للسنة المالية 2026"
            icon={Layers}
            accent="blue"
          />
          <StatCard
            title="المتأخرات في المجموعة"
            value={formatCurrency(metrics.totalRemaining)}
            subtitle={`${metrics.overdueCount} عضو متأخر`}
            icon={AlertCircle}
            accent={metrics.totalRemaining > 0 ? 'red' : 'green'}
          />
        </div>

        {/* Members inside Group */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-[#172B45]">أعضاء المجموعة وحالة السداد</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold text-[#748399]">
                  <th className="py-3.5 px-4">اسم العضو</th>
                  <th className="py-3.5 px-4">رقم الهوية</th>
                  <th className="py-3.5 px-4">المستحق (2026)</th>
                  <th className="py-3.5 px-4">المسدد</th>
                  <th className="py-3.5 px-4">المتبقي</th>
                  <th className="py-3.5 px-4">حالة الاشتراك</th>
                  {canManageGroups && <th className="py-3.5 px-4 text-center">نقل</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {metrics.groupMembers.map((m) => {
                  const sub = subscriptions.find((s) => s.memberId === m.id && s.year === 2026);
                  const totals = computeMemberYearTotals(sub, config2026);
                  return (
                    <tr key={m.id} className="hover:bg-[#F8FAFC]">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectMember(m.id)}
                          className="font-bold text-[#123B70] hover:text-[#2878C8] hover:underline cursor-pointer"
                        >
                          {m.name}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-xs tabular-nums">{m.nationalId}</td>
                      <td className="py-3.5 px-4 font-semibold tabular-nums">
                        {formatCurrency(totals.totalDue)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#16A36A] tabular-nums">
                        {formatCurrency(totals.totalPaid)}
                      </td>
                      <td
                        className={`py-3.5 px-4 font-bold tabular-nums ${
                          totals.remaining > 0 ? 'text-[#DC5555]' : 'text-[#748399]'
                        }`}
                      >
                        {formatCurrency(totals.remaining)}
                      </td>
                      <td className="py-3.5 px-4">
                        <StatusIndicator
                          label={m.subscriptionStatus}
                          tone={
                            m.subscriptionStatus === 'مسدد'
                              ? 'success'
                              : m.subscriptionStatus === 'متأخر'
                                ? 'danger'
                                : 'warning'
                          }
                        />
                      </td>
                      {canManageGroups && (
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setMoveMemberTarget(m);
                              setMoveDestinationGroupId(otherGroups[0]?.id ?? '');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#EAF3FC] text-xs font-semibold text-[#172B45] hover:text-[#123B70] transition-colors cursor-pointer"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span>نقل</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Group Modal */}
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title="تعديل بيانات المجموعة"
          size="sm"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editGroupName.trim()) return;
              onUpdateGroup({
                ...selectedGroup,
                name: editGroupName.trim(),
                description: editGroupDesc.trim(),
              });
              setEditModalOpen(false);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">اسم المجموعة</label>
              <input
                type="text"
                required
                value={editGroupName}
                onChange={(e) => setEditGroupName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">وصف المجموعة</label>
              <textarea
                rows={3}
                value={editGroupDesc}
                onChange={(e) => setEditGroupDesc(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              />
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
              >
                حفظ التعديلات
              </button>
            </div>
          </form>
        </Modal>

        {/* Change Leader Modal */}
        <Modal
          isOpen={leaderModalOpen}
          onClose={() => setLeaderModalOpen(false)}
          title="تغيير رئيس المجموعة"
          subtitle={selectedGroup.name}
          size="sm"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (chosenLeaderId) {
                onChangeGroupLeader(selectedGroup.id, chosenLeaderId);
                setLeaderModalOpen(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                اختر رئيس المجموعة الجديد
              </label>
              <select
                value={chosenLeaderId}
                onChange={(e) => setChosenLeaderId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.groupName})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setLeaderModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
              >
                اعتماد الرئيس
              </button>
            </div>
          </form>
        </Modal>

        {/* Add Member to Group Modal */}
        <Modal
          isOpen={addMemberModalOpen}
          onClose={() => setAddMemberModalOpen(false)}
          title="إضافة عضو إلى المجموعة"
          subtitle={selectedGroup.name}
          size="sm"
        >
          {otherMembers.length === 0 ? (
            <p className="text-sm text-[#748399]">جميع الأعضاء مضافون بالفعل إلى هذه المجموعة.</p>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (chosenMemberId) {
                  onAssignMemberToGroup(chosenMemberId, selectedGroup.id);
                  setAddMemberModalOpen(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                  اختر العضو المراد نقله أو إضافته
                </label>
                <select
                  value={chosenMemberId}
                  onChange={(e) => setChosenMemberId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
                >
                  {otherMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — حالياً: {m.groupName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setAddMemberModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
                >
                  إضافة للمجموعة
                </button>
              </div>
            </form>
          )}
        </Modal>

        {/* Move Member to Another Group Modal */}
        <Modal
          isOpen={Boolean(moveMemberTarget)}
          onClose={() => setMoveMemberTarget(null)}
          title="نقل عضو إلى مجموعة أخرى"
          subtitle={moveMemberTarget?.name}
          size="sm"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (moveMemberTarget && moveDestinationGroupId) {
                onAssignMemberToGroup(moveMemberTarget.id, moveDestinationGroupId);
                setMoveMemberTarget(null);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">
                المجموعة الجديدة
              </label>
              <select
                value={moveDestinationGroupId}
                onChange={(e) => setMoveDestinationGroupId(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              >
                {otherGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMoveMemberTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
              >
                تأكيد النقل
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="إدارة المجموعات"
        description="تنظيم المجموعات العائلية ورؤسائها ومتابعة مستحقات كل مجموعة."
        action={
          canManageGroups ? (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء مجموعة جديدة</span>
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {visibleGroups.map((group) => {
          const metrics = getGroupMetrics(group);
          return (
            <div
              key={group.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-[0_1px_3px_rgba(18,59,112,0.04)] hover:border-[#4A90D9]/60 transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#EAF3FC] text-[#123B70] flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <StatusIndicator
                    label={
                      metrics.overdueCount > 0
                        ? `${metrics.overdueCount} متأخر`
                        : 'منتظمة السداد'
                    }
                    tone={metrics.overdueCount > 0 ? 'warning' : 'success'}
                  />
                </div>

                <h3 className="mt-4 text-lg font-bold text-[#172B45]">{group.name}</h3>
                <p className="mt-1 text-xs text-[#748399] leading-relaxed">{group.description}</p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#748399]">رئيس المجموعة</span>
                    <span className="font-bold text-[#123B70]">{group.leaderName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#748399]">عدد الأعضاء</span>
                    <span className="font-bold text-[#172B45] tabular-nums">
                      {metrics.displayMemberCount} عضواً
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#748399]">إجمالي الاشتراكات المستحقة</span>
                    <span className="font-bold text-[#2878C8] tabular-nums">
                      {formatCurrency(metrics.totalDue)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedGroupId(group.id)}
                className="mt-5 w-full py-2.5 rounded-xl bg-[#EAF3FC] hover:bg-[#2878C8] text-[#123B70] hover:text-white text-sm font-bold transition-colors cursor-pointer"
              >
                عرض المجموعة
              </button>
            </div>
          );
        })}
      </div>

      {/* Create Group Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="إنشاء مجموعة جديدة"
        subtitle="أضف مجموعة عائلية جديدة وحدد رئيسها"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newGroupName.trim()) return;
            onCreateGroup({
              name: newGroupName.trim(),
              leaderId: newGroupLeaderId,
              description: newGroupDesc.trim() || 'مجموعة عائلية ضمن صندوق الإشراف.',
            });
            setNewGroupName('');
            setNewGroupDesc('');
            setCreateModalOpen(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">اسم المجموعة</label>
            <input
              type="text"
              required
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="مثال: مجموعة ذوي حسن"
              className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">رئيس المجموعة</label>
            <select
              value={newGroupLeaderId}
              onChange={(e) => setNewGroupLeaderId(e.target.value)}
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
            <label className="block text-xs font-bold text-[#172B45] mb-1.5">وصف المجموعة</label>
            <textarea
              rows={3}
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              placeholder="نبذة مختصرة عن أفراد المجموعة ومهامها..."
              className="w-full p-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
            />
          </div>
          <div className="pt-2 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-sm font-semibold text-[#172B45] cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#2878C8] text-sm font-semibold text-white cursor-pointer"
            >
              إنشاء المجموعة
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
