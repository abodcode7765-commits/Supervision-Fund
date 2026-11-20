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
import {
  addCurrency,
  applyPaymentToSubscription,
  computeMemberYearTotals,
  createDefaultSubscription,
  deriveMemberOverallStatus,
  deriveSubscriptionCellStatuses,
  formatCurrency,
  fromHalalas,
  getTodayIsoDate,
  recalculateExpensesRunningBalance,
  reversePaymentFromSubscription,
  roundCurrency,
  toHalalas,
} from './utils/formatters';

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

  const handleSelectMemberFromAnywhere = (memberId: string) => {
    if (!currentUser.permissions.includes('members')) return;
    setSelectedMemberId(memberId);
    setActivePage('members');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Helper to sync member overall subscription statuses after any subscription/config mutation
  const syncMembersStatus = (
    nextSubs: MemberYearSubscription[],
    nextConfigs: YearConfig[] = yearConfigs
  ) => {
    setMembers((prev) =>
      prev.map((m) => ({
        ...m,
        subscriptionStatus: deriveMemberOverallStatus(m.id, nextSubs, nextConfigs),
      }))
    );
  };

  // Member actions (Non-destructive archive, duplicate nationalId check, real unpaid baseline)
  const handleAddMember = (data: {
    name: string;
    nationalId: string;
    birthDate: string;
    groupId: string;
  }): { ok: boolean; error?: string } => {
    const cleanNationalId = data.nationalId.trim();
    if (members.some((m) => m.nationalId.trim() === cleanNationalId)) {
      return { ok: false, error: 'رقم الهوية مسجل مسبقاً لعضو آخر في الصندوق.' };
    }

    const grp = groups.find((g) => g.id === data.groupId);
    if (!grp) {
      return { ok: false, error: 'يرجى اختيار مجموعة صحيحة.' };
    }

    const newId = `mem-${Date.now()}`;
    const nextSerial = members.reduce((max, m) => Math.max(max, m.serial), 0) + 1;

    const newMember: Member = {
      id: newId,
      serial: nextSerial,
      name: data.name.trim(),
      nationalId: cleanNationalId,
      birthDate: data.birthDate,
      groupId: grp.id,
      groupName: grp.name,
      joinDate: getTodayIsoDate(),
      memberStatus: 'نشط',
      subscriptionStatus: 'متأخر',
    };

    const initialSubs: MemberYearSubscription[] = yearConfigs.map((yc) =>
      createDefaultSubscription(newId, yc.year)
    );

    setMembers((prev) => [newMember, ...prev]);
    setSubscriptions((prev) => [...prev, ...initialSubs]);
    notify(`تمت إضافة العضو "${newMember.name}" بنجاح.`);
    return { ok: true };
  };

  const handleUpdateMember = (updated: Member): { ok: boolean; error?: string } => {
    const cleanNationalId = updated.nationalId.trim();
    if (
      members.some(
        (m) => m.id !== updated.id && m.nationalId.trim() === cleanNationalId
      )
    ) {
      return { ok: false, error: 'رقم الهوية مسجل مسبقاً لعضو آخر.' };
    }

    const grp = groups.find((g) => g.id === updated.groupId);
    const normalized: Member = {
      ...updated,
      name: updated.name.trim(),
      nationalId: cleanNationalId,
      groupName: grp?.name ?? updated.groupName,
    };

    setMembers((prev) => prev.map((m) => (m.id === normalized.id ? normalized : m)));
    setGroups((prev) =>
      prev.map((g) =>
        g.leaderId === normalized.id ? { ...g, leaderName: normalized.name } : g
      )
    );
    setPayments((prev) =>
      prev.map((p) =>
        p.memberId === normalized.id
          ? {
              ...p,
              memberName: normalized.name,
              nationalId: normalized.nationalId,
              groupId: normalized.groupId,
              groupName: normalized.groupName,
            }
          : p
      )
    );
    setQittat((prev) =>
      prev.map((q) => ({
        ...q,
        participants: q.participants.map((pt) =>
          pt.memberId === normalized.id ? { ...pt, memberName: normalized.name } : pt
        ),
      }))
    );
    setMarriageAids((prev) =>
      prev.map((a) =>
        a.memberId === normalized.id
          ? {
              ...a,
              memberName: normalized.name,
              nationalId: normalized.nationalId,
              birthDate: normalized.birthDate,
            }
          : a
      )
    );

    notify(`تم تحديث بيانات العضو "${normalized.name}".`);
    return { ok: true };
  };

  const handleToggleArchiveMember = (id: string) => {
    const target = members.find((m) => m.id === id);
    if (!target) return;
    const nextStatus = target.memberStatus === 'نشط' ? 'موقوف' : 'نشط';
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, memberStatus: nextStatus } : m))
    );
    notify(
      nextStatus === 'موقوف'
        ? `تم إيقاف/أرشفة العضو "${target.name}" مع الحفاظ على كامل سجله المالي.`
        : `تمت إعادة تفعيل العضو "${target.name}".`,
      nextStatus === 'موقوف' ? 'warning' : 'success'
    );
  };

  // Group actions
  const handleCreateGroup = (data: { name: string; leaderId: string; description: string }) => {
    const leader = members.find((m) => m.id === data.leaderId);
    const matchingUser = users.find(
      (u) => u.name === leader?.name && u.role === 'رئيس المجموعة'
    );
    const newGroup: Group = {
      id: `grp-${Date.now()}`,
      name: data.name.trim(),
      leaderId: data.leaderId,
      leaderUserId: matchingUser?.id,
      leaderName: leader?.name ?? 'غير محدد',
      description: data.description.trim(),
      createdAt: getTodayIsoDate(),
    };
    setGroups((prev) => [...prev, newGroup]);
    notify(`تم إنشاء "${newGroup.name}" بنجاح.`);
  };

  const handleUpdateGroup = (updatedGroup: Group) => {
    setGroups((prev) => prev.map((g) => (g.id === updatedGroup.id ? updatedGroup : g)));
    setMembers((prev) =>
      prev.map((m) =>
        m.groupId === updatedGroup.id ? { ...m, groupName: updatedGroup.name } : m
      )
    );
    setPayments((prev) =>
      prev.map((p) =>
        p.groupId === updatedGroup.id ? { ...p, groupName: updatedGroup.name } : p
      )
    );
    setUsers((prev) =>
      prev.map((u) =>
        u.groupId === updatedGroup.id ? { ...u, groupName: updatedGroup.name } : u
      )
    );
    notify(`تم تحديث بيانات "${updatedGroup.name}".`);
  };

  const handleChangeGroupLeader = (groupId: string, newLeaderId: string, newLeaderUserId?: string) => {
    const leader = members.find((m) => m.id === newLeaderId);
    if (!leader) return;
    const grp = groups.find((g) => g.id === groupId);
    const matchedUser =
      users.find((u) => u.id === newLeaderUserId) ??
      users.find((u) => u.name === leader.name && u.role === 'رئيس المجموعة');

    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              leaderId: leader.id,
              leaderUserId: matchedUser?.id ?? g.leaderUserId,
              leaderName: leader.name,
            }
          : g
      )
    );

    if (matchedUser && grp) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === matchedUser.id ? { ...u, groupId: grp.id, groupName: grp.name } : u
        )
      );
    }

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
  const handleAddYearConfig = (cfg: YearConfig): { ok: boolean; error?: string } => {
    if (yearConfigs.some((y) => y.year === cfg.year)) {
      return { ok: false, error: `السنة المالية ${cfg.year} موجودة بالفعل.` };
    }

    const nextConfigs = [...yearConfigs, cfg].sort((a, b) => a.year - b.year);
    const newSubs: MemberYearSubscription[] = members.map((m) =>
      createDefaultSubscription(m.id, cfg.year)
    );

    const nextSubs = [...subscriptions, ...newSubs];
    setYearConfigs(nextConfigs);
    setSubscriptions(nextSubs);
    syncMembersStatus(nextSubs, nextConfigs);
    notify(`تمت إضافة السنة المالية ${cfg.year} وإعداد رسومها بشكل مستقل.`);
    return { ok: true };
  };

  const handleUpdateYearConfig = (cfg: YearConfig) => {
    const nextConfigs = yearConfigs.map((y) => (y.year === cfg.year ? cfg : y));
    const nextSubs = subscriptions.map((sub) =>
      sub.year === cfg.year ? deriveSubscriptionCellStatuses(sub, cfg) : sub
    );
    setYearConfigs(nextConfigs);
    setSubscriptions(nextSubs);
    syncMembersStatus(nextSubs, nextConfigs);
    notify(`تم تحديث رسوم السنة المالية ${cfg.year} دون المساس بالسنوات السابقة.`);
  };

  const handleToggleMonthStatus = (memberId: string, year: number, monthIndex: number) => {
    const cfg = yearConfigs.find((y) => y.year === year);
    if (!cfg) return;
    const order: MonthCellStatus[] = ['paid', 'partial', 'overdue', 'upcoming'];
    const hasExisting = subscriptions.some((s) => s.memberId === memberId && s.year === year);
    const baseSubs = hasExisting
      ? subscriptions
      : [...subscriptions, createDefaultSubscription(memberId, year)];

    const nextSubs = baseSubs.map((sub) => {
      if (sub.memberId !== memberId || sub.year !== year) return sub;
      const nextMonths = [...sub.months];
      const nextAmounts = [...(sub.monthPaidAmounts ?? Array(12).fill(0))];
      const curr = nextMonths[monthIndex] ?? 'upcoming';
      const next = order[(order.indexOf(curr) + 1) % order.length];
      nextMonths[monthIndex] = next;
      nextAmounts[monthIndex] =
        next === 'paid'
          ? cfg.monthlyFee
          : next === 'partial'
            ? roundCurrency(cfg.monthlyFee / 2)
            : 0;
      return deriveSubscriptionCellStatuses(
        { ...sub, months: nextMonths, monthPaidAmounts: nextAmounts },
        cfg
      );
    });
    setSubscriptions(nextSubs);
    syncMembersStatus(nextSubs);
    notify('تم تحديث حالة اشتراك الشهر.');
  };

  const handleUpdateSubscriptionDetails = (
    memberId: string,
    year: number,
    foundingPaidAmount: number,
    monthPaidAmounts: number[]
  ) => {
    const cfg = yearConfigs.find((y) => y.year === year);
    if (!cfg) return;
    const hasExisting = subscriptions.some((s) => s.memberId === memberId && s.year === year);
    const baseSubs = hasExisting
      ? subscriptions
      : [...subscriptions, createDefaultSubscription(memberId, year)];

    const nextSubs = baseSubs.map((sub) => {
      if (sub.memberId !== memberId || sub.year !== year) return sub;
      return deriveSubscriptionCellStatuses(
        {
          ...sub,
          foundingPaidAmount,
          monthPaidAmounts,
        },
        cfg
      );
    });
    setSubscriptions(nextSubs);
    syncMembersStatus(nextSubs);
    notify(`تم تحديث تفاصيل اشتراك سنة ${year}.`);
  };

  // Payment actions (supports partial & multi-installment allocation + edit recalculation)
  const handleAddPayment = (
    record: Omit<PaymentRecord, 'id'>
  ): { ok: boolean; error?: string } => {
    const cfg = yearConfigs.find((y) => y.year === record.year);
    if (!cfg) return { ok: false, error: 'السنة المالية غير موجودة.' };

    const foundSub = subscriptions.find(
      (s) => s.memberId === record.memberId && s.year === record.year
    );
    const existingSub = foundSub ?? createDefaultSubscription(record.memberId, record.year);
    const baseSubs = foundSub ? subscriptions : [...subscriptions, existingSub];

    const currentTotals = computeMemberYearTotals(existingSub, cfg);
    if (toHalalas(record.amount) <= 0) {
      return { ok: false, error: 'يجب أن يكون المبلغ المدفوع أكبر من صفر.' };
    }
    if (toHalalas(record.amount) > toHalalas(currentTotals.remaining)) {
      return {
        ok: false,
        error: `المبلغ المدفوع (${formatCurrency(record.amount)}) يتجاوز المتبقي على العضو (${formatCurrency(currentTotals.remaining)}).`,
      };
    }

    const updatedSub = applyPaymentToSubscription(existingSub, cfg, record.amount, {
      allocatedToFounding: record.allocatedToFounding,
      allocatedMonthIndices: record.allocatedMonthIndices,
    });
    const afterTotals = computeMemberYearTotals(updatedSub, cfg);

    const newRec: PaymentRecord = {
      ...record,
      id: `pay-${Date.now()}`,
      dueAmount: currentTotals.remaining,
      remainingAmount: afterTotals.remaining,
      status: afterTotals.remaining > 0 ? 'مدفوع جزئياً' : 'مكتمل',
    };

    const nextPayments = [newRec, ...payments];
    const nextSubs = baseSubs.map((s) =>
      s.memberId === record.memberId && s.year === record.year ? updatedSub : s
    );

    const nextTotalRevenue = fromHalalas(
      nextPayments.reduce((acc, p) => acc + toHalalas(p.amount), 0)
    );

    setPayments(nextPayments);
    setSubscriptions(nextSubs);
    syncMembersStatus(nextSubs);
    setExpenses((prev) => recalculateExpensesRunningBalance(prev, nextTotalRevenue));

    if (newRec.status === 'مدفوع جزئياً') {
      notify(
        `تم تسجيل دفعة جزئية بمبلغ ${formatCurrency(newRec.amount)} (المتبقي السنوي ${formatCurrency(newRec.remainingAmount)}).`,
        'warning'
      );
    } else {
      notify(`تم تسجيل سداد مكتمل بمبلغ ${formatCurrency(newRec.amount)} للعضو ${newRec.memberName}.`);
    }
    return { ok: true };
  };

  const handleUpdatePayment = (
    updated: PaymentRecord
  ): { ok: boolean; error?: string } => {
    const oldRec = payments.find((p) => p.id === updated.id);
    if (!oldRec) return { ok: false, error: 'عملية السداد غير موجودة.' };

    const oldCfg = yearConfigs.find((y) => y.year === oldRec.year);
    const newCfg = yearConfigs.find((y) => y.year === updated.year);
    if (!oldCfg || !newCfg) return { ok: false, error: 'السنة المالية غير صالحة.' };

    if (toHalalas(updated.amount) <= 0) {
      return { ok: false, error: 'يجب أن يكون المبلغ المدفوع أكبر من صفر.' };
    }

    // Step 1: Reverse old payment from its subscription
    let nextSubs = subscriptions.map((s) => {
      if (s.memberId === oldRec.memberId && s.year === oldRec.year) {
        return reversePaymentFromSubscription(s, oldCfg, oldRec.amount, {
          allocatedToFounding: oldRec.allocatedToFounding,
          allocatedMonthIndices: oldRec.allocatedMonthIndices,
        });
      }
      return s;
    });

    // Step 2: Validate against target subscription remaining
    let targetSub = nextSubs.find(
      (s) => s.memberId === updated.memberId && s.year === updated.year
    );
    if (!targetSub) {
      targetSub = createDefaultSubscription(updated.memberId, updated.year);
      nextSubs = [...nextSubs, targetSub];
    }
    const beforeTargetTotals = computeMemberYearTotals(targetSub, newCfg);
    if (toHalalas(updated.amount) > toHalalas(beforeTargetTotals.remaining)) {
      return {
        ok: false,
        error: `المبلغ المعدّل (${formatCurrency(updated.amount)}) يتجاوز المتاح للسداد (${formatCurrency(beforeTargetTotals.remaining)}).`,
      };
    }

    // Step 3: Apply updated payment
    const appliedSub = applyPaymentToSubscription(targetSub, newCfg, updated.amount, {
      allocatedToFounding: updated.allocatedToFounding,
      allocatedMonthIndices: updated.allocatedMonthIndices,
    });
    const afterTargetTotals = computeMemberYearTotals(appliedSub, newCfg);

    nextSubs = nextSubs.map((s) =>
      s.memberId === updated.memberId && s.year === updated.year ? appliedSub : s
    );

    const normalizedPayment: PaymentRecord = {
      ...updated,
      dueAmount: beforeTargetTotals.remaining,
      remainingAmount: afterTargetTotals.remaining,
      status: afterTargetTotals.remaining > 0 ? 'مدفوع جزئياً' : 'مكتمل',
    };

    const nextPayments = payments.map((p) => (p.id === updated.id ? normalizedPayment : p));
    const nextTotalRevenue = fromHalalas(
      nextPayments.reduce((acc, p) => acc + toHalalas(p.amount), 0)
    );

    setPayments(nextPayments);
    setSubscriptions(nextSubs);
    syncMembersStatus(nextSubs);
    setExpenses((prev) => recalculateExpensesRunningBalance(prev, nextTotalRevenue));
    notify(`تم تحديث عملية السداد للعضو "${updated.memberName}" وإعادة احتساب الأرصدة.`);
    return { ok: true };
  };

  // Qittat actions
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
    if (toHalalas(amountPaidNow) <= 0) return;
    setQittat((prev) =>
      prev.map((q) => {
        if (q.id !== qittaId) return q;
        const nextParticipants = q.participants.map((p) => {
          if (p.memberId !== memberId) return p;
          const totalPaid = Math.min(p.shareAmount, addCurrency(p.paidAmount, amountPaidNow));
          const status: QittaParticipantStatus =
            toHalalas(totalPaid) >= toHalalas(p.shareAmount)
              ? 'سدد كامل المبلغ'
              : toHalalas(totalPaid) > 0
                ? 'دفع جزئياً'
                : 'لم يدفع';
          return { ...p, paidAmount: totalPaid, status };
        });
        const allPaid = nextParticipants.every(
          (p) => toHalalas(p.paidAmount) >= toHalalas(p.shareAmount)
        );
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
    const today = getTodayIsoDate();
    setMarriageAids((prev) =>
      prev.map((a) =>
        a.id === aidId ? { ...a, status: 'تم الصرف', disbursementDate: today } : a
      )
    );
    notify('تم اعتماد صرف معونة الزواج وتحديث السجل.');
  };

  // Expense actions
  const totalFundRevenue = fromHalalas(
    payments.reduce((acc, p) => acc + toHalalas(p.amount), 0)
  );

  const handleAddExpense = (exp: Omit<Expense, 'id' | 'operationNumber' | 'balanceBefore' | 'balanceAfter' | 'recordedBy'>) => {
    const nextSeq =
      expenses.reduce((max, e) => {
        const parts = e.operationNumber.split('-');
        const num = Number(parts[parts.length - 1]);
        return Number.isFinite(num) ? Math.max(max, num) : max;
      }, 41) + 1;

    const newExp: Expense = {
      ...exp,
      id: `exp-${Date.now()}`,
      operationNumber: `EXP-${exp.year}-${String(nextSeq).padStart(4, '0')}`,
      balanceBefore: 0,
      balanceAfter: 0,
      recordedBy: currentUser.name,
    };

    const nextExpenses = recalculateExpensesRunningBalance(
      [newExp, ...expenses],
      totalFundRevenue
    );
    setExpenses(nextExpenses);
    notify(`تم تسجيل المصروف "${exp.title}" وتحديث رصيد الصندوق.`);
  };

  const handleUpdateExpense = (updated: Expense) => {
    const nextExpenses = recalculateExpensesRunningBalance(
      expenses.map((e) => (e.id === updated.id ? updated : e)),
      totalFundRevenue
    );
    setExpenses(nextExpenses);
    notify(`تم تحديث بيانات المصروف "${updated.title}" وإعادة احتساب الأرصدة.`);
  };

  // User actions
  const handleAddUser = (u: Omit<SystemUser, 'id' | 'createdAt'>): { ok: boolean; error?: string } => {
    if (users.some((ex) => ex.username.toLowerCase() === u.username.trim().toLowerCase())) {
      return { ok: false, error: 'اسم المستخدم مسجل مسبقاً.' };
    }
    const newU: SystemUser = {
      ...u,
      username: u.username.trim(),
      id: `usr-${Date.now()}`,
      createdAt: getTodayIsoDate(),
    };
    setUsers((prev) => [...prev, newU]);
    notify(`تم إنشاء حساب المستخدم "${u.name}" بنجاح.`);
    return { ok: true };
  };

  const handleUpdateUser = (updated: SystemUser): { ok: boolean; error?: string } => {
    if (
      users.some(
        (ex) =>
          ex.id !== updated.id &&
          ex.username.toLowerCase() === updated.username.trim().toLowerCase()
      )
    ) {
      return { ok: false, error: 'اسم المستخدم مستخدم من حساب آخر.' };
    }
    setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    if (currentUser.id === updated.id) {
      setCurrentUser(updated);
    }
    notify(`تم تحديث حساب وصلاحيات "${updated.name}".`);
    return { ok: true };
  };

  const handleToggleUserStatus = (userId: string) => {
    if (userId === currentUser.id) {
      notify('لا يمكنك تعطيل حسابك الشخصي أثناء تسجيل الدخول.', 'warning');
      return;
    }
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
        membersCount={members.length}
        groupsCount={groups.length}
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
          (m) =>
            m.groupId === currentUser.groupId &&
            m.memberStatus === 'نشط' &&
            m.subscriptionStatus !== 'مسدد'
        ).length
      : members.filter((m) => m.memberStatus === 'نشط' && m.subscriptionStatus !== 'مسدد').length;

  const selectedMemberName =
    activePage === 'members' && selectedMemberId
      ? members.find((m) => m.id === selectedMemberId)?.name
      : undefined;

  const handleLogout = () => {
    setIsAuthenticated(false);
    setMobileMenuOpen(false);
    setSelectedMemberId(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172B45]">
      <Sidebar
        activePage={activePage}
        allowedPages={currentUser.permissions}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
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
          onLogout={handleLogout}
          members={members}
          payments={payments}
          marriageAids={marriageAids}
          currentUser={currentUser}
        />

        <main className="flex-1 p-3.5 sm:p-6 pb-20 lg:pb-8 max-w-[1440px] w-full mx-auto">
          {activePage === 'dashboard' && (
            <DashboardPage
              members={members}
              groups={groups}
              yearConfigs={yearConfigs}
              subscriptions={subscriptions}
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
              onToggleArchiveMember={handleToggleArchiveMember}
            />
          )}

          {activePage === 'groups' && (
            <GroupsPage
              groups={groups}
              members={members}
              users={users}
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
              onUpdateSubscriptionDetails={handleUpdateSubscriptionDetails}
              onSelectMember={handleSelectMemberFromAnywhere}
            />
          )}

          {activePage === 'payments' && (
            <PaymentsPage
              payments={payments}
              members={members}
              groups={groups}
              yearConfigs={yearConfigs}
              subscriptions={subscriptions}
              onAddPayment={handleAddPayment}
              onUpdatePayment={handleUpdatePayment}
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
              users={users}
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
              yearConfigs={yearConfigs}
              currentUser={currentUser}
              onAddExpense={handleAddExpense}
              onUpdateExpense={handleUpdateExpense}
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
              settings={settings}
              currentUser={currentUser}
              onNotify={(msg) => notify(msg, 'info')}
            />
          )}

          {activePage === 'users' && (
            <UsersPage
              users={users}
              groups={groups}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onToggleUserStatus={handleToggleUserStatus}
            />
          )}

          {activePage === 'settings' && (
            <SettingsPage
              settings={settings}
              yearConfigs={yearConfigs}
              groups={groups}
              users={users}
              currentUser={currentUser}
              onSaveSettings={(next) => {
                setSettings(next);
                notify('تم حفظ إعدادات الصندوق بنجاح.');
              }}
              onUpdateYearConfig={handleUpdateYearConfig}
              onNavigate={handleNavigate}
              onNotify={(msg, type = 'info') => notify(msg, type)}
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
