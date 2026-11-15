import React, { useState } from 'react';
import {
  Plus,
  ShieldCheck,
  Crown,
  Coins,
  CheckSquare,
  Square,
} from 'lucide-react';
import { Group, PageId, SystemUser, UserRole } from '../types';
import { NAV_ITEMS } from '../components/layout/Sidebar';
import { Modal, PageHeader, StatusIndicator } from '../components/ui/SharedUI';

const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, PageId[]> = {
  'مدير الصندوق': NAV_ITEMS.map((n) => n.id),
  'رئيس المجموعة': ['dashboard', 'members', 'groups', 'subscriptions', 'overdue'],
  'مسؤول القطات': ['qittat'],
};

export function UsersPage({
  users,
  groups,
  onAddUser,
  onToggleUserStatus,
}: {
  users: SystemUser[];
  groups: Group[];
  onAddUser: (user: Omit<SystemUser, 'id' | 'createdAt'>) => void;
  onToggleUserStatus: (userId: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('رئيس المجموعة');
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '');
  const [permissions, setPermissions] = useState<PageId[]>(
    ROLE_DEFAULT_PERMISSIONS['رئيس المجموعة']
  );

  const handleRoleChange = (nextRole: UserRole) => {
    setRole(nextRole);
    setPermissions(ROLE_DEFAULT_PERMISSIONS[nextRole]);
  };

  const togglePermission = (pageId: PageId) => {
    setPermissions((prev) =>
      prev.includes(pageId) ? prev.filter((p) => p !== pageId) : [...prev, pageId]
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !username.trim()) return;
    const selectedGroup = groups.find((g) => g.id === groupId);
    onAddUser({
      name: name.trim(),
      username: username.trim(),
      role,
      groupId: role === 'مدير الصندوق' ? undefined : selectedGroup?.id,
      groupName:
        role === 'مدير الصندوق'
          ? 'جميع المجموعات'
          : selectedGroup?.name ?? 'مجموعة أبناء محسن الأول',
      permissions,
      status: 'نشط',
    });
    setName('');
    setUsername('');
    setPassword('');
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
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2878C8] hover:bg-[#123B70] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء مستخدم جديد</span>
          </button>
        }
      />

      {/* Role Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-start gap-3">
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

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-start gap-3">
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

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 flex items-start gap-3">
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
                <th className="py-3.5 px-4 text-center">إجراء</th>
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
                      ? 'كافة الصفحات (12 صفحة)'
                      : u.role === 'مسؤول القطات'
                        ? 'قسم القطات فقط'
                        : `${u.permissions.length} صفحات (عرض المجموعة فقط)`}
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
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onToggleUserStatus(u.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-[#EAF3FC] text-xs font-semibold text-[#172B45] hover:text-[#123B70] transition-colors cursor-pointer"
                    >
                      {u.status === 'نشط' ? 'تعطيل' : 'تفعيل'}
                    </button>
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
          <div key={u.id} className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-bold text-[#172B45]">{u.name}</div>
                <div className="text-xs text-[#2878C8] font-semibold">{u.role}</div>
              </div>
              <StatusIndicator
                label={u.status}
                tone={u.status === 'نشط' ? 'success' : 'neutral'}
              />
            </div>
            <div className="text-xs text-[#748399]">
              المجموعة: <span className="text-[#172B45]">{u.groupName}</span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[#748399]">{u.permissions.length} صلاحيات</span>
              <button
                type="button"
                onClick={() => onToggleUserStatus(u.id)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-[#172B45] font-semibold"
              >
                {u.status === 'نشط' ? 'تعطيل الحساب' : 'تفعيل الحساب'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create User Modal with Permissions Matrix */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="إنشاء مستخدم جديد"
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

            <div>
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
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
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
              إنشاء المستخدم
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
