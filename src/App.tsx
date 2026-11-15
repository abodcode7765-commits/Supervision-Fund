/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Expense,
  FundSettings,
  Group,
  MarriageAid,
  Member,
  MemberYearSubscription,
  MonthCellStatus,
  PageId,
  PaymentRecord,
  Qitta,
  QittaParticipantStatus,
  SystemUser,
  YearConfig,
} from './types';
import {
  INITIAL_EXPENSES,
  INITIAL_GROUPS,
  INITIAL_MARRIAGE_AIDS,
  INITIAL_MEMBERS,
  INITIAL_PAYMENTS,
  INITIAL_QITTAT,
  INITIAL_SETTINGS,
  INITIAL_SUBSCRIPTIONS,
  INITIAL_USERS,
  INITIAL_YEAR_CONFIGS,
} from './data/mockData';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ToastBanner } from './components/ui/SharedUI';
import { DashboardPage } from './pages/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { GroupsPage } from './pages/GroupsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { OverduePage } from './pages/OverduePage';
import { QittatPage } from './pages/QittatPage';
import { MarriageAidPage } from './pages/MarriageAidPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ReportsPage } from './pages/ReportsPage';
import { UsersPage } from './pages/UsersPage';
import { SettingsPage } from './pages/SettingsPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<SystemUser[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<SystemUser>(INITIAL_USERS[0]);

  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [groups, setGroups] = useState<Group[]>(INITIAL_GROUPS);
  const [yearConfigs, setYearConfigs] = useState<YearConfig[]>(INITIAL_YEAR_CONFIGS);
  const [subscriptions, setSubscriptions] =
    useState<MemberYearSubscription[]>(INITIAL_SUBSCRIPTIONS);
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [qittat, setQittat] = useState<Qitta[]>(INITIAL_QITTAT);
  const [marriageAids, setMarriageAids] = useState<MarriageAid[]>(INITIAL_MARRIAGE_AIDS);
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [settings, setSettings] = useState<FundSettings>(INITIAL_SETTINGS);

  const [toast, setToast] = useState<{
    id: number;
    message: string;
    type: 'success' | 'info' | 'warning';
  } | null>(null);

  const notify = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 3500);
  };

  const handleNavigate = (page: PageId) => {
    if (!currentUser.permissions.includes(page)) {
      notify('ليس لديك صلاحية للوصول إلى هذا القسم.', 'warning');
      return;
    }
    setActivePage(page);
    if (page !== 'members') {
      setSelectedMemberId(null);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwitchUser = (user: SystemUser) => {
    setCurrentUser(user);
    setSelectedMemberId(null);
    const defaultPage = user.permissions.includes('dashboard')
      ? 'dashboard'
      : user.permissions[0] ?? 'qittat';
    setActivePage(defaultPage);
    notify(`تم التبديل إلى حساب: ${user.name} (${user.role})`, 'info');
  };

  const handleSelectMemberFromAnywhere = (memberId: string) => {
    if (!currentUser.permissions.includes('members')) return;
    setSelectedMemberId(memberId);
    setActivePage('members');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Member actions
  const handleAddMember = (data: {
    name: string;
    nationalId: string;
    birthDate: string;
    groupId: string;
    phone: string;
  }) => {
    const grp = groups.find((g) => g.id === data.groupId);
    const newId = `mem-${Date.now()}`;
    const newMember: Member = {
      id: newId,
      serial: members.length + 1,
      name: data.name,
      nationalId: data.nationalId,
      birthDate: data.birthDate,
      groupId: data.groupId,
      groupName: grp?.name ?? 'مجموعة أبناء محسن الأول',
      joinDate: '2026-11-15',
      memberStatus: 'نشط',
      subscriptionStatus: 'مسدد',
      phone: data.phone || '0500000000',
    };
    setMembers((prev) => [...prev, newMember]);
    setSubscriptions((prev) => [
      ...prev,
      {
        memberId: newId,
        year: 2026,
        foundingStatus: 'paid',
        foundingPaidAmount: 200,
        months: [
          'paid',
          'paid',
          'paid',
          'paid',
          'paid',
          'paid',
          'paid',
          'paid',
          'paid',
          'paid',
          'paid',
          'upcoming',
        ],
      },
    ]);
    notify(`تمت إضافة العضو "${data.name}" بنجاح.`);
  };

  const handleUpdateMember = (updated: Member) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    notify(`تم تحديث بيانات العضو "${updated.name}".`);
  };

  const handleDeleteMember = (id: string) => {
    const target = members.find((m) => m.id === id);
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (selectedMemberId === id) setSelectedMemberId(null);
    notify(`تم حذف العضو "${target?.name ?? ''}" من السجل.`, 'warning');
  };

  // Group actions
  const handleCreateGroup = (data: { name: string; leaderId: string; description: string }) => {
    const leader = members.find((m) => m.id === data.leaderId);
    const newGroup: Group = {
      id: `grp-${Date.now()}`,
      name: data.name,
      leaderId: data.leaderId,
      leaderName: leader?.name ?? 'غير محدد',
      description: data.description,
      createdAt: '2026-11-15',
      baseMemberCount: 1,
    };
    setGroups((prev) => [...prev, newGroup]);
    notify(`تم إنشاء "${data.name}" بنجاح.`);
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
    setMembers((prev) =>
      prev.map((m) =>
        m.groupId === updatedGroup.id ? { ...m, groupName: updatedGroup.name } : m
      )
    );
    notify(`تم تحديث بيانات "${updatedGroup.name}".`);
  };

  const handleChangeGroupLeader = (groupId: string, newLeaderId: string) => {
    const leader = members.find((m) => m.id === newLeaderId);
    if (!leader) return;
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, leaderId: leader.id, leaderName: leader.name } : g
      )
    );
    notify(`تم تعيين "${leader.name}" رئيساً للمجموعة.`);
  };

  const handleAssignMemberToGroup = (memberId: string, groupId: string) => {
    const grp = groups.find((g) => g.id === groupId);
    if (!grp) return;
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId ? { ...m, groupId: grp.id, groupName: grp.name } : m
      )
    );
    notify(`تم نقل العضو إلى "${grp.name}".`);
  };

  // Subscription actions
  const handleAddYearConfig = (cfg: YearConfig) => {
    setYearConfigs((prev) => [cfg, ...prev].sort((a, b) => b.year - a.year));
    const newSubs: MemberYearSubscription[] = members.map((m) => ({
      memberId: m.id,
      year: cfg.year,
      foundingStatus: 'overdue',
      foundingPaidAmount: 0,
      months: Array(12).fill('upcoming') as MonthCellStatus[],
    }));
    setSubscriptions((prev) => [...prev, ...newSubs]);
    notify(`تمت إضافة السنة المالية ${cfg.year} وإعداد رسومها بشكل مستقل.`);
  };

  const handleUpdateYearConfig = (cfg: YearConfig) => {
    setYearConfigs((prev) => prev.map((y) => (y.year === cfg.year ? cfg : y)));
    notify(`تم تحديث رسوم السنة المالية ${cfg.year} دون المساس بالسنوات السابقة.`);
  };

  const handleToggleMonthStatus = (memberId: string, year: number, monthIndex: number) => {
    const order: MonthCellStatus[] = ['paid', 'partial', 'overdue', 'upcoming'];
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.memberId !== memberId || sub.year !== year) return sub;
        const nextMonths = [...sub.months];
        const curr = nextMonths[monthIndex] ?? 'upcoming';
        const next = order[(order.indexOf(curr) + 1) % order.length];
        nextMonths[monthIndex] = next;
        return { ...sub, months: nextMonths };
      })
    );
    notify('تم تحديث حالة اشتراك الشهر في المعاينة.');
  };

  // Payment actions (supports partial payments)
  const handleAddPayment = (record: Omit<PaymentRecord, 'id'>) => {
    const newRec: PaymentRecord = { ...record, id: `pay-${Date.now()}` };
    setPayments((prev) => [newRec, ...prev]);

    if (record.status === 'مدفوع جزئياً') {
      setMembers((prev) =>
        prev.map((m) =>
          m.id === record.memberId
            ? { ...m, subscriptionStatus: 'مسدد جزئياً' }
            : m
        )
      );
      notify(
        `تم تسجيل دفعة جزئية بمبلغ ${record.amount} ر.س (المتبقي ${record.remainingAmount} ر.س).`,
        'warning'
      );
    } else {
      notify(`تم تسجيل سداد مكتمل بمبلغ ${record.amount} ر.س للعضو ${record.memberName}.`);
    }
  };

  // Qittat actions (supports partial participant payments)
  const handleCreateQitta = (qitta: Omit<Qitta, 'id'>) => {
    const newQ: Qitta = { ...qitta, id: `qit-${Date.now()}` };
    setQittat((prev) => [newQ, ...prev]);
    notify(`تم إنشاء "${qitta.name}" بنجاح.`);
  };

  const handleRecordParticipantPayment = (
    qittaId: string,
    memberId: string,
    amountPaidNow: number
  ) => {
    setQittat((prev) =>
      prev.map((q) => {
        if (q.id !== qittaId) return q;
        const nextParticipants = q.participants.map((p) => {
          if (p.memberId !== memberId) return p;
          const totalPaid = Math.min(p.shareAmount, p.paidAmount + amountPaidNow);
          const status: QittaParticipantStatus =
            totalPaid >= p.shareAmount
              ? 'سدد كامل المبلغ'
              : totalPaid > 0
                ? 'دفع جزئياً'
                : 'لم يدفع';
          return { ...p, paidAmount: totalPaid, status };
        });
        const allPaid = nextParticipants.every((p) => p.paidAmount >= p.shareAmount);
        return {
          ...q,
          participants: nextParticipants,
          status: allPaid ? ('مكتملة' as const) : ('قيد التحصيل' as const),
        };
      })
    );
    notify('تم تسجيل دفعة المشارك في القطة بنجاح.');
  };

  // Marriage aid actions
  const handleAddMarriageAid = (aid: Omit<MarriageAid, 'id'>) => {
    const newAid: MarriageAid = { ...aid, id: `mar-${Date.now()}` };
    setMarriageAids((prev) => [newAid, ...prev]);
    notify(`تم تسجيل معونة زواج للعضو "${aid.memberName}".`);
  };

  const handleDisburseAid = (aidId: string) => {
    setMarriageAids((prev) =>
      prev.map((a) =>
        a.id === aidId
          ? { ...a, status: 'تم الصرف', disbursementDate: '2026-11-15' }
          : a
      )
    );
    notify('تم اعتماد صرف معونة الزواج وتحديث السجل.');
  };

  // Expense actions
  const handleAddExpense = (exp: Omit<Expense, 'id' | 'operationNumber'>) => {
    const nextNum = 42 + Math.max(0, expenses.length - 5);
    const newExp: Expense = {
      ...exp,
      id: `exp-${Date.now()}`,
      operationNumber: `EXP-2026-0${nextNum}`,
    };
    setExpenses((prev) => [newExp, ...prev]);
    notify(`تم تسجيل المصروف "${exp.title}" وتحديث رصيد الصندوق.`);
  };

  // User actions
  const handleAddUser = (u: Omit<SystemUser, 'id' | 'createdAt'>) => {
    const newU: SystemUser = {
      ...u,
      id: `usr-${Date.now()}`,
      createdAt: '2026-11-15',
    };
    setUsers((prev) => [...prev, newU]);
    notify(`تم إنشاء حساب المستخدم "${u.name}" بنجاح.`);
  };

  const handleToggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, status: u.status === 'نشط' ? 'معطل' : 'نشط' } : u
      )
    );
    notify('تم تحديث حالة حساب المستخدم.');
  };

  if (!isAuthenticated) {
    return (
      <LoginPage
        users={users}
        onLogin={(matchedUser) => {
          setCurrentUser(matchedUser);
          setIsAuthenticated(true);
          const defaultPage = matchedUser.permissions.includes('dashboard')
            ? 'dashboard'
            : matchedUser.permissions[0] ?? 'qittat';
          setActivePage(defaultPage);
        }}
      />
    );
  }

  const scopedOverdueCount =
    currentUser.role === 'رئيس المجموعة' && currentUser.groupId
      ? members.filter(
          (m) => m.groupId === currentUser.groupId && m.subscriptionStatus === 'متأخر'
        ).length
      : members.filter((m) => m.subscriptionStatus === 'متأخر').length;

  const selectedMemberName =
    activePage === 'members' && selectedMemberId
      ? members.find((m) => m.id === selectedMemberId)?.name
      : undefined;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172B45]">
      <Sidebar
        activePage={activePage}
        allowedPages={currentUser.permissions}
        onNavigate={handleNavigate}
        onLogout={() => setIsAuthenticated(false)}
        userName={currentUser.name}
        userRole={currentUser.role}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        overdueCount={scopedOverdueCount}
      />

      <div className="lg:pr-64 min-h-screen flex flex-col">
        <Topbar
          activePage={activePage}
          subBreadcrumb={selectedMemberName}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onNavigate={handleNavigate}
          onSelectMember={handleSelectMemberFromAnywhere}
          onLogout={() => setIsAuthenticated(false)}
          members={members}
          currentUser={currentUser}
          allUsers={users}
          onSwitchUser={handleSwitchUser}
        />

        <main className="flex-1 p-4 sm:p-6 pb-20 lg:pb-8 max-w-[1440px] w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              members={members}
              groups={groups}
              payments={payments}
              expenses={expenses}
              currentUser={currentUser}
              onNavigate={handleNavigate}
              onSelectMember={handleSelectMemberFromAnywhere}
            />
          )}

          {activePage === 'members' && (
            <MembersPage
              members={members}
              groups={groups}
              subscriptions={subscriptions}
              yearConfigs={yearConfigs}
              payments={payments}
              qittat={qittat}
              marriageAids={marriageAids}
              currentUser={currentUser}
              selectedMemberId={selectedMemberId}
              onSelectMember={setSelectedMemberId}
              onAddMember={handleAddMember}
              onUpdateMember={handleUpdateMember}
              onDeleteMember={handleDeleteMember}
            />
          )}

          {activePage === 'groups' && (
            <GroupsPage
              groups={groups}
              members={members}
              subscriptions={subscriptions}
              yearConfigs={yearConfigs}
              currentUser={currentUser}
              onCreateGroup={handleCreateGroup}
              onUpdateGroup={handleUpdateGroup}
              onChangeGroupLeader={handleChangeGroupLeader}
              onAssignMemberToGroup={handleAssignMemberToGroup}
              onSelectMember={handleSelectMemberFromAnywhere}
            />
          )}

          {activePage === 'subscriptions' && (
            <SubscriptionsPage
              members={members}
              yearConfigs={yearConfigs}
              subscriptions={subscriptions}
              currentUser={currentUser}
              onAddYearConfig={handleAddYearConfig}
              onUpdateYearConfig={handleUpdateYearConfig}
              onToggleMonthStatus={handleToggleMonthStatus}
              onSelectMember={handleSelectMemberFromAnywhere}
            />
          )}

          {activePage === 'payments' && (
            <PaymentsPage
              payments={payments}
              members={members}
              yearConfigs={yearConfigs}
              onAddPayment={handleAddPayment}
              onSelectMember={handleSelectMemberFromAnywhere}
            />
          )}

          {activePage === 'overdue' && (
            <OverduePage
              members={members}
              groups={groups}
              subscriptions={subscriptions}
              yearConfigs={yearConfigs}
              currentUser={currentUser}
              onSelectMember={handleSelectMemberFromAnywhere}
              onNavigate={handleNavigate}
            />
          )}

          {activePage === 'qittat' && (
            <QittatPage
              qittat={qittat}
              members={members}
              onCreateQitta={handleCreateQitta}
              onRecordParticipantPayment={handleRecordParticipantPayment}
            />
          )}

          {activePage === 'marriage-aid' && (
            <MarriageAidPage
              marriageAids={marriageAids}
              members={members}
              onAddMarriageAid={handleAddMarriageAid}
              onDisburseAid={handleDisburseAid}
              onSelectMember={handleSelectMemberFromAnywhere}
            />
          )}

          {activePage === 'expenses' && (
            <ExpensesPage
              expenses={expenses}
              payments={payments}
              onAddExpense={handleAddExpense}
            />
          )}

          {activePage === 'reports' && (
            <ReportsPage
              members={members}
              groups={groups}
              yearConfigs={yearConfigs}
              subscriptions={subscriptions}
              payments={payments}
              expenses={expenses}
              qittat={qittat}
              marriageAids={marriageAids}
              onNotify={(msg) => notify(msg, 'info')}
            />
          )}

          {activePage === 'users' && (
            <UsersPage
              users={users}
              groups={groups}
              onAddUser={handleAddUser}
              onToggleUserStatus={handleToggleUserStatus}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              settings={settings}
              yearConfigs={yearConfigs}
              groups={groups}
              users={users}
              onSaveSettings={(next) => {
                setSettings(next);
                notify('تم حفظ إعدادات الصندوق بنجاح.');
              }}
              onUpdateYearConfig={handleUpdateYearConfig}
              onNavigate={handleNavigate}
              onNotify={(msg) => notify(msg, 'info')}
            />
          )}
        </main>
      </div>

      <MobileBottomNav
        activePage={activePage}
        allowedPages={currentUser.permissions}
        onNavigate={handleNavigate}
        onOpenMenu={() => setMobileMenuOpen(true)}
      />

      <ToastBanner toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
