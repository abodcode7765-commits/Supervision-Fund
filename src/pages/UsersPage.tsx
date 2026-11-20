import React, { useState } from 'react';
import {
  Plus,
  ShieldCheck,
  Crown,
  Coins,
  CheckSquare,
  Square,
  Pencil,
  AlertCircle,
  Info,
} from 'lucide-react';
import { Group, PageId, SystemUser, UserRole } from '../types';
import { NAV_ITEMS } from '../components/layout/Sidebar';
import { Modal, PageHeader, StatusIndicator } from '../components/ui/SharedUI';

const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, PageId[]> = {
  'مدير الصندوق': NAV_ITEMS.map((n) => n.id),
  'رئيس المجموعة': ['dashboard', 'members', 'groups', 'subscriptions', 'overdue', 'reports'],
  'مسؤول القطات': ['qittat'],
};

export function UsersPage({
  users,
  groups,
  onAddUser,
  onUpdateUser,
  onToggleUserStatus,
}: {
  users: SystemUser[];
  groups: Group[];
  onAddUser: (user: Omit<SystemUser, 'id' | 'createdAt'>) => { ok: boolean; error?: string };
  onUpdateUser: (user: SystemUser) => { ok: boolean; error?: string };
  onToggleUserStatus: (userId: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('رئيس المجموعة');
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [permissions, setPermissions] = useState<PageId[]>(
    ROLE_DEFAULT_PERMISSIONS['رئيس المجموعة']
  );
  const [formError, setFormError] = useState('');

  const existingQittaManager = users.find(
    (u) =>
      u.id !== editingUser?.id &&
      u.status === 'نشط' &&
      (u.role === 'مسؤول القطات' ||
        (u.role !== 'مدير الصندوق' && u.permissions.includes('qittat')))
  );

  const wantsQittaExclusive =
    role === 'مسؤول القطات' || (role !== 'مدير الصندوق' && permissions.includes('qittat'));

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setPassword('');
    setRole('رئيس المجموعة');
    setGroupId(groups[0]?.id ?? '');
    setPermissions(ROLE_DEFAULT_PERMISSIONS['رئيس المجموعة']);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (u: SystemUser) => {
    setEditingUser(u);
    setName(u.name);
    setUsername(u.username);
    setPassword('');
    setRole(u.role);
    setGroupId(u.groupId ?? groups[0]?.id ?? '');
    setPermissions(u.permissions);
    setFormError('');
    setModalOpen(true);
  };

  const handleRoleChange = (nextRole: UserRole) => {
    setRole(nextRole);
    setPermissions(ROLE_DEFAULT_PERMISSIONS[nextRole]);
    setFormError('');
  };

  const togglePermission = (pageId: PageId) => {
    setPermissions((prev) =>
      prev.includes(pageId) ? prev.filter((p) => p !== pageId) : [...prev, pageId]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !username.trim()) {
      setFormError('يرجى إدخال الاسم واسم المستخدم.');
      return;
    }
    if (!editingUser && password.trim().length < 4) {
      setFormError('يرجى إدخال كلمة مرور لا تقل عن 4 خانات.');
      return;
    }
    if (permissions.length === 0) {
      setFormError('يجب تحديد صلاحية صفحة واحدة على الأقل.');
      return;
    }

    const cleanUsername = username.trim().toLowerCase();
    if (
      users.some(
        (ex) => ex.id !== editingUser?.id && ex.username.toLowerCase() === cleanUsername
      )
    ) {
      setFormError(
        editingUser ? 'اسم المستخدم مستخدم من حساب آخر.' : 'اسم المستخدم مسجل مسبقاً.'
      );
      return;
    }

    const selectedGroup = groups.find((g) => g.id === groupId);

    // Ensure only one non-manager user holds 'qittat' permission at a time
    if (wantsQittaExclusive && existingQittaManager) {
      const cleanedPerms = existingQittaManager.permissions.filter((p) => p !== 'qittat');
      onUpdateUser({
        ...existingQittaManager,
        permissions: cleanedPerms.length > 0 ? cleanedPerms : ['dashboard'],
      });
    }

    if (editingUser) {
      const res = onUpdateUser({
        ...editingUser,
        name: name.trim(),
        username: username.trim(),
        role,
        groupId: role === 'مدير الصندوق' ? undefined : selectedGroup?.id,
        groupName:
          role === 'مدير الصندوق'
            ? 'جميع المجموعات'
            : selectedGroup?.name ?? editingUser.groupName,
        permissions,
      });
      if (!res.ok) {
        setFormError(res.error ?? 'تعذر حفظ التعديلات.');
        return;
      }
    } else {
      const res = onAddUser({
        name: name.trim(),
        username: username.trim(),
        role,
        groupId: role === 'مدير الصندوق' ? undefined : selectedGroup?.id,
        groupName:
          role === 'مدير الصندوق'
            ? 'جميع المجموعات'
            : selectedGroup?.name ?? groups[0]?.name ?? 'مجموعة الصندوق',
        permissions,
        status: 'نشط',
      });
      if (!res.ok) {
        setFormError(res.error ?? 'تعذر إنشاء المستخدم.');
        return;
      }
    }

    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="المستخدمون والصلاحيات"
        description="إدارة حسابات مسؤولي النظام ورؤساء المجموعات ومسؤول القطات وصلاحيات الوصول."
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء مستخدم جديد</span>
          </button>
        }
      />

      {/* Role Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-start gap-3 h-full">
          <div className="w-10 h-10 rounded-xl bg-[#123B70]/10 text-[#123B70] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#172B45]">مدير الصندوق</div>
            <p className="text-xs text-[#748399] mt-0.5 leading-relaxed">
              صلاحية كاملة على جميع الأقسام وتسجيل المدفوعات والمصروفات والإعدادات والمستخدمين.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-start gap-3 h-full">
          <div className="w-10 h-10 rounded-xl bg-[#EAF3FC] text-[#2878C8] flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#172B45]">رئيس المجموعة</div>
            <p className="text-xs text-[#748399] mt-0.5 leading-relaxed">
              مشاهدة أعضاء مجموعته فقط وبياناتهم وحساباتهم دون صلاحية التعديل أو تسجيل المدفوعات.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-start gap-3 h-full">
          <div className="w-10 h-10 rounded-xl bg-[#E99A35]/14 text-[#C67B1B] flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-[#172B45]">مسؤول القطات</div>
            <p className="text-xs text-[#748399] mt-0.5 leading-relaxed">
              مستخدم واحد مستقل مخصص لقسم القطات فقط، ولا يحصل تلقائياً على صلاحيات المدير.
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="hidden md:block bg-white rounded-xl border border-slate-200/80 shadow-[0_1px_3px_rgba(18,59,112,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-200 text-xs font-bold text-[#748399]">
                <th className="py-3.5 px-4">الاسم</th>
                <th className="py-3.5 px-4">اسم المستخدم</th>
                <th className="py-3.5 px-4">نوع الحساب</th>
                <th className="py-3.5 px-4">المجموعة التابعة له</th>
                <th className="py-3.5 px-4">الصلاحيات</th>
                <th className="py-3.5 px-4">الحالة</th>
                <th className="py-3.5 px-4">تاريخ الإنشاء</th>
                <th className="py-3.5 px-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3.5 px-4 font-bold text-[#172B45] whitespace-nowrap">
                    {u.name}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#748399] font-mono" dir="ltr">
                    {u.username}
                  </td>
                  <td className="py-3.5 px-4 text-xs font-bold text-[#123B70] whitespace-nowrap">
                    {u.role}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#172B45] whitespace-nowrap">
                    {u.groupName}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#748399]">
                    {u.permissions.length === NAV_ITEMS.length
                      ? `كافة الصفحات (${NAV_ITEMS.length})`
                      : u.role === 'مسؤول القطات'
                        ? 'قسم القطات فقط'
                        : `${u.permissions.length} صفحات`}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <StatusIndicator
                      label={u.status}
                      tone={u.status === 'نشط' ? 'success' : 'neutral'}
                    />
                  </td>
                  <td className="py-3.5 px-4 text-xs text-[#748399] tabular-nums whitespace-nowrap">
                    {u.createdAt}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="h-8 px-2.5 rounded-lg bg-[#EAF3FC] hover:bg-[#2878C8] text-[#123B70] hover:text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleUserStatus(u.id)}
                        className="h-8 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-[#172B45] transition-colors cursor-pointer"
                      >
                        {u.status === 'نشط' ? 'تعطيل' : 'تفعيل'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {users.map((u) => (
          <div key={u.id} className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#172B45] truncate">{u.name}</div>
                <div className="text-xs text-[#2878C8] font-semibold">{u.role}</div>
              </div>
              <StatusIndicator
                label={u.status}
                tone={u.status === 'نشط' ? 'success' : 'neutral'}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-[#748399]">
              <span>
                المجموعة: <strong className="text-[#172B45]">{u.groupName}</strong>
              </span>
              <span>{u.permissions.length} صلاحيات</span>
            </div>
            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openEditModal(u)}
                className="h-9 rounded-lg bg-[#EAF3FC] text-[#123B70] text-xs font-bold cursor-pointer"
              >
                تعديل الصلاحيات
              </button>
              <button
                type="button"
                onClick={() => onToggleUserStatus(u.id)}
                className="h-9 rounded-lg bg-slate-100 text-[#172B45] text-xs font-bold cursor-pointer"
              >
                {u.status === 'نشط' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'تعديل بيانات وصلاحيات المستخدم' : 'إنشاء مستخدم جديد'}
        subtitle="حدد بيانات الحساب ونوع الدور والصفحات المسموح بالوصول إليها"
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">الاسم</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم الكامل للمستخدم"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">اسم المستخدم</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="مثال: a.mohsen"
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {!editingUser && (
              <div>
                <label className="block text-xs font-bold text-[#172B45] mb-1.5">كلمة المرور</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">نوع الحساب</label>
              <select
                value={role}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#2878C8]"
              >
                <option value="مدير الصندوق">مدير الصندوق</option>
                <option value="رئيس المجموعة">رئيس المجموعة</option>
                <option value="مسؤول القطات">مسؤول القطات</option>
              </select>
            </div>

            <div className={editingUser ? 'sm:col-span-2' : ''}>
              <label className="block text-xs font-bold text-[#172B45] mb-1.5">المجموعة</label>
              <select
                value={role === 'مدير الصندوق' ? 'all' : groupId}
                onChange={(e) => setGroupId(e.target.value)}
                disabled={role === 'مدير الصندوق'}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 text-sm disabled:bg-slate-100 focus:outline-none focus:border-[#2878C8]"
              >
                {role === 'مدير الصندوق' ? (
                  <option value="all">جميع المجموعات</option>
                ) : (
                  groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {wantsQittaExclusive && existingQittaManager && (
            <div className="p-3 rounded-xl bg-[#EAF3FC] border border-[#4A90D9]/35 text-xs text-[#123B70] flex items-start gap-2">
              <Info className="w-4 h-4 text-[#2878C8] shrink-0 mt-0.5" />
              <span>
                ملاحظة: يوجد حالياً مسؤول قطات مفعّل (<strong>{existingQittaManager.name}</strong>).
                عند الحفظ سيتم نقل صلاحية إدارة القطات الحصرية لهذا المستخدم تلقائياً.
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#172B45] mb-2">
              الصفحات المسموح الوصول إليها ({permissions.length} من {NAV_ITEMS.length})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl border border-slate-200 bg-[#F8FAFC]">
              {NAV_ITEMS.map((item) => {
                const checked = permissions.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => togglePermission(item.id)}
                    className={`flex items-center gap-2 h-9 px-2.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      checked
                        ? 'bg-[#EAF3FC] text-[#123B70] border-[#2878C8]/50'
                        : 'bg-white text-[#748399] border-slate-200'
                    }`}
                  >
                    {checked ? (
                      <CheckSquare className="w-4 h-4 text-[#2878C8] shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 shrink-0" />
                    )}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {formError && (
            <div className="p-3 rounded-xl bg-[#DC5555]/10 text-[#DC5555] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

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
              {editingUser ? 'حفظ التعديلات' : 'إنشاء المستخدم'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
