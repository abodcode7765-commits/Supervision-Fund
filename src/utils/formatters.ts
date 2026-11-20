import {
  Expense,
  MemberYearSubscription,
  MonthCellStatus,
  PaymentRecord,
  SubscriptionStatus,
  YearConfig,
} from '../types';

export const ARABIC_MONTHS = [
  'يناير',
  'فبراير',
  'مارس',
  'أبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
];

export const BASELINE_ACTIVE_YEAR = 2026;

export function getCurrentFiscalYear(): number {
  return Math.max(BASELINE_ACTIVE_YEAR, new Date().getFullYear());
}

export function getDefaultActiveYear(yearConfigs: YearConfig[]): number {
  if (yearConfigs.length === 0) return getCurrentFiscalYear();
  const current = getCurrentFiscalYear();
  if (yearConfigs.some((y) => y.year === current)) return current;
  if (yearConfigs.some((y) => y.year === BASELINE_ACTIVE_YEAR)) return BASELINE_ACTIVE_YEAR;
  return [...yearConfigs].sort((a, b) => a.year - b.year)[0].year;
}

export function isFutureScheduledYear(year: number): boolean {
  return year > getCurrentFiscalYear();
}

export function createDefaultSubscription(
  memberId: string,
  year: number
): MemberYearSubscription {
  const future = isFutureScheduledYear(year);
  return {
    memberId,
    year,
    foundingStatus: 'overdue',
    foundingPaidAmount: 0,
    months: Array(12).fill(future ? 'upcoming' : 'overdue') as MonthCellStatus[],
    monthPaidAmounts: Array(12).fill(0),
  };
}

export function isSubscriptionRowOverdue(
  sub: MemberYearSubscription | undefined,
  totals: SubscriptionTotals,
  year: number
): boolean {
  if (toHalalas(totals.remaining) <= 0) return false;
  if (!isFutureScheduledYear(year)) return true;
  if (!sub) return false;
  const hasExplicitOverdueCell = sub.months.some((m) => m === 'overdue' || m === 'partial');
  return toHalalas(totals.totalPaid) > 0 || hasExplicitOverdueCell;
}

export function toHalalas(sar: number): number {
  const n = Number(sar);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromHalalas(halalas: number): number {
  if (!Number.isFinite(halalas)) return 0;
  return Math.round(halalas) / 100;
}

export function roundCurrency(sar: number): number {
  return fromHalalas(toHalalas(sar));
}

export function addCurrency(...values: number[]): number {
  const sumH = values.reduce((acc, v) => acc + toHalalas(v), 0);
  return fromHalalas(sumH);
}

export function subtractCurrency(a: number, b: number): number {
  return fromHalalas(toHalalas(a) - toHalalas(b));
}

export function distributeAmountExactly(totalAmount: number, count: number): number[] {
  if (count <= 0) return [];
  const totalH = Math.max(0, toHalalas(totalAmount));
  const baseH = Math.floor(totalH / count);
  const remH = totalH % count;
  return Array.from({ length: count }, (_, idx) =>
    fromHalalas(baseH + (idx < remH ? 1 : 0))
  );
}

export function formatNumber(value: number): string {
  const clean = roundCurrency(value);
  return clean.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export function formatCurrency(value: number, currency = 'ر.س'): string {
  const formatted = formatNumber(value);
  return currency ? `${formatted} ${currency}` : formatted;
}

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTodayArabicDate(): string {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const now = new Date();
  return `${days[now.getDay()]}، ${now.getDate()} ${ARABIC_MONTHS[now.getMonth()]} ${now.getFullYear()} م`;
}

export function getMonthPaidAmounts(
  sub: MemberYearSubscription,
  config: YearConfig
): number[] {
  return Array.from({ length: config.monthsCount }, (_, idx) => {
    const explicit = sub.monthPaidAmounts?.[idx];
    if (explicit !== undefined) {
      return Math.min(config.monthlyFee, Math.max(0, roundCurrency(explicit)));
    }
    const status = sub.months[idx];
    if (status === 'paid') return config.monthlyFee;
    if (status === 'partial') return roundCurrency(config.monthlyFee / 2);
    return 0;
  });
}

export interface SubscriptionTotals {
  foundingDue: number;
  foundingPaid: number;
  foundingRemaining: number;
  monthsDue: number;
  monthsPaid: number;
  monthsRemaining: number;
  monthPaidAmounts: number[];
  totalDue: number;
  totalPaid: number;
  remaining: number;
  overdueMonths: string[];
  unpaidMonthIndices: number[];
  paidMonthsCount: number;
  overdueMonthsCount: number;
  partialMonthsCount: number;
}

export function computeMemberYearTotals(
  sub: MemberYearSubscription | undefined,
  config: YearConfig | undefined
): SubscriptionTotals {
  if (!sub || !config) {
    return {
      foundingDue: 0,
      foundingPaid: 0,
      foundingRemaining: 0,
      monthsDue: 0,
      monthsPaid: 0,
      monthsRemaining: 0,
      monthPaidAmounts: [],
      totalDue: 0,
      totalPaid: 0,
      remaining: 0,
      overdueMonths: [],
      unpaidMonthIndices: [],
      paidMonthsCount: 0,
      overdueMonthsCount: 0,
      partialMonthsCount: 0,
    };
  }

  const foundingDue = roundCurrency(config.foundingFee);
  const foundingPaid = Math.min(foundingDue, Math.max(0, roundCurrency(sub.foundingPaidAmount || 0)));
  const foundingRemaining = Math.max(0, subtractCurrency(foundingDue, foundingPaid));

  const monthPaidAmounts = getMonthPaidAmounts(sub, config);
  const futureYear = isFutureScheduledYear(sub.year);

  let paidMonthsCount = 0;
  let overdueMonthsCount = 0;
  let partialMonthsCount = 0;
  const overdueMonths: string[] = [];
  const unpaidMonthIndices: number[] = [];

  for (let idx = 0; idx < config.monthsCount; idx++) {
    const paidForMonth = monthPaidAmounts[idx] ?? 0;
    const cellStatus = sub.months[idx] ?? (futureYear ? 'upcoming' : 'overdue');

    if (toHalalas(paidForMonth) >= toHalalas(config.monthlyFee) && config.monthlyFee > 0) {
      paidMonthsCount += 1;
    } else if (toHalalas(paidForMonth) > 0 || cellStatus === 'partial') {
      partialMonthsCount += 1;
      overdueMonths.push(ARABIC_MONTHS[idx]);
      unpaidMonthIndices.push(idx);
    } else {
      unpaidMonthIndices.push(idx);
      if (cellStatus === 'overdue' || (!futureYear && cellStatus === 'upcoming')) {
        overdueMonthsCount += 1;
        overdueMonths.push(ARABIC_MONTHS[idx]);
      }
    }
  }

  const monthsDue = roundCurrency(config.monthlyFee * config.monthsCount);
  const monthsPaid = addCurrency(...monthPaidAmounts);
  const monthsRemaining = Math.max(0, subtractCurrency(monthsDue, monthsPaid));

  const totalDue = addCurrency(foundingDue, monthsDue);
  const totalPaid = addCurrency(foundingPaid, monthsPaid);
  const remaining = Math.max(0, subtractCurrency(totalDue, totalPaid));

  return {
    foundingDue,
    foundingPaid,
    foundingRemaining,
    monthsDue,
    monthsPaid,
    monthsRemaining,
    monthPaidAmounts,
    totalDue,
    totalPaid,
    remaining,
    overdueMonths,
    unpaidMonthIndices,
    paidMonthsCount,
    overdueMonthsCount,
    partialMonthsCount,
  };
}

export function deriveSubscriptionCellStatuses(
  sub: MemberYearSubscription,
  config: YearConfig
): MemberYearSubscription {
  const paidAmounts = getMonthPaidAmounts(sub, config);
  const months: MonthCellStatus[] = paidAmounts.map((amt, idx) => {
    const amtH = toHalalas(amt);
    const feeH = toHalalas(config.monthlyFee);
    if (feeH > 0 && amtH >= feeH) return 'paid';
    if (amtH > 0) return 'partial';
    return sub.months[idx] === 'upcoming' ? 'upcoming' : 'overdue';
  });

  const foundingH = toHalalas(sub.foundingPaidAmount);
  const foundingFeeH = toHalalas(config.foundingFee);
  const foundingStatus: MemberYearSubscription['foundingStatus'] =
    foundingFeeH === 0 || foundingH >= foundingFeeH
      ? 'paid'
      : foundingH > 0
        ? 'partial'
        : 'overdue';

  return {
    ...sub,
    foundingPaidAmount: Math.min(config.foundingFee, Math.max(0, roundCurrency(sub.foundingPaidAmount))),
    foundingStatus,
    months,
    monthPaidAmounts: paidAmounts,
  };
}

/**
 * Applies a payment amount to a MemberYearSubscription using exact halala math.
 * Supports:
 * - Paying toward founding fee first (or explicitly via allocatedToFounding)
 * - Distributing across specific allocatedMonthIndices, or sequentially across unpaid months 0..11
 */
export function applyPaymentToSubscription(
  sub: MemberYearSubscription,
  config: YearConfig,
  paymentAmount: number,
  options?: {
    allocatedToFounding?: number;
    allocatedMonthIndices?: number[];
  }
): MemberYearSubscription {
  let remainingH = toHalalas(paymentAmount);
  if (remainingH <= 0) return sub;

  const foundingFeeH = toHalalas(config.foundingFee);
  let foundingPaidH = toHalalas(sub.foundingPaidAmount);
  const monthPaidH = getMonthPaidAmounts(sub, config).map((a) => toHalalas(a));
  const monthlyFeeH = toHalalas(config.monthlyFee);

  // 1. Apply to founding fee if requested or if no specific months were picked
  const foundingRoomH = Math.max(0, foundingFeeH - foundingPaidH);
  if (foundingRoomH > 0) {
    if (options?.allocatedToFounding !== undefined) {
      const targetFoundingH = Math.min(
        remainingH,
        foundingRoomH,
        Math.max(0, toHalalas(options.allocatedToFounding))
      );
      foundingPaidH += targetFoundingH;
      remainingH -= targetFoundingH;
    } else if (!options?.allocatedMonthIndices || options.allocatedMonthIndices.length === 0) {
      const appliedFoundingH = Math.min(remainingH, foundingRoomH);
      foundingPaidH += appliedFoundingH;
      remainingH -= appliedFoundingH;
    }
  }

  // 2. Apply remaining amount across target month indices first, then any remaining unpaid months
  const targetOrder: number[] = [];
  if (options?.allocatedMonthIndices && options.allocatedMonthIndices.length > 0) {
    options.allocatedMonthIndices.forEach((idx) => {
      if (idx >= 0 && idx < config.monthsCount && !targetOrder.includes(idx)) {
        targetOrder.push(idx);
      }
    });
  }
  for (let i = 0; i < config.monthsCount; i++) {
    if (!targetOrder.includes(i)) targetOrder.push(i);
  }

  for (const idx of targetOrder) {
    if (remainingH <= 0) break;
    const roomH = Math.max(0, monthlyFeeH - monthPaidH[idx]);
    if (roomH > 0) {
      const addH = Math.min(remainingH, roomH);
      monthPaidH[idx] += addH;
      remainingH -= addH;
    }
  }

  // If still remaining (e.g. founding wasn't targeted originally), put into founding room
  if (remainingH > 0 && foundingPaidH < foundingFeeH) {
    const extraF = Math.min(remainingH, foundingFeeH - foundingPaidH);
    foundingPaidH += extraF;
    remainingH -= extraF;
  }

  const nextSub: MemberYearSubscription = {
    ...sub,
    foundingPaidAmount: fromHalalas(foundingPaidH),
    monthPaidAmounts: monthPaidH.map(fromHalalas),
  };
  return deriveSubscriptionCellStatuses(nextSub, config);
}

/**
 * Reverses a payment amount (used when editing an existing payment).
 */
export function reversePaymentFromSubscription(
  sub: MemberYearSubscription,
  config: YearConfig,
  paymentAmount: number,
  options?: {
    allocatedToFounding?: number;
    allocatedMonthIndices?: number[];
  }
): MemberYearSubscription {
  let removeH = toHalalas(paymentAmount);
  if (removeH <= 0) return sub;

  let foundingPaidH = toHalalas(sub.foundingPaidAmount);
  const monthPaidH = getMonthPaidAmounts(sub, config).map((a) => toHalalas(a));

  const targetOrder: number[] = [];
  if (options?.allocatedMonthIndices && options.allocatedMonthIndices.length > 0) {
    [...options.allocatedMonthIndices].reverse().forEach((idx) => {
      if (idx >= 0 && idx < config.monthsCount && !targetOrder.includes(idx)) {
        targetOrder.push(idx);
      }
    });
  }
  for (let i = config.monthsCount - 1; i >= 0; i--) {
    if (!targetOrder.includes(i)) targetOrder.push(i);
  }

  // Reverse from months in reverse order first
  for (const idx of targetOrder) {
    if (removeH <= 0) break;
    if (monthPaidH[idx] > 0) {
      const takeH = Math.min(removeH, monthPaidH[idx]);
      monthPaidH[idx] -= takeH;
      removeH -= takeH;
    }
  }

  if (removeH > 0 && foundingPaidH > 0) {
    const takeF = Math.min(removeH, foundingPaidH);
    foundingPaidH -= takeF;
    removeH -= takeF;
  }

  const nextSub: MemberYearSubscription = {
    ...sub,
    foundingPaidAmount: fromHalalas(foundingPaidH),
    monthPaidAmounts: monthPaidH.map(fromHalalas),
  };
  return deriveSubscriptionCellStatuses(nextSub, config);
}

export function deriveMemberOverallStatus(
  memberId: string,
  subscriptions: MemberYearSubscription[],
  yearConfigs: YearConfig[]
): SubscriptionStatus {
  const memberSubs = subscriptions.filter((s) => s.memberId === memberId);
  if (memberSubs.length === 0) return 'متأخر';

  let totalDueH = 0;
  let totalPaidH = 0;
  let totalRemainingH = 0;
  let hasPartial = false;
  let overdueMonthsCount = 0;
  let evaluatedCount = 0;

  memberSubs.forEach((sub) => {
    const cfg = yearConfigs.find((y) => y.year === sub.year);
    if (!cfg) return;
    const totals = computeMemberYearTotals(sub, cfg);
    const hasExplicitOverdue = sub.months.some((m) => m === 'overdue' || m === 'partial');
    if (isFutureScheduledYear(sub.year) && toHalalas(totals.totalPaid) === 0 && !hasExplicitOverdue) {
      return;
    }
    evaluatedCount += 1;
    totalDueH += toHalalas(totals.totalDue);
    totalPaidH += toHalalas(totals.totalPaid);
    totalRemainingH += toHalalas(totals.remaining);
    if (totals.partialMonthsCount > 0 || sub.foundingStatus === 'partial') {
      hasPartial = true;
    }
    overdueMonthsCount += totals.overdueMonthsCount;
  });

  if (evaluatedCount === 0) return 'مسدد';
  if (totalDueH > 0 && totalRemainingH === 0) return 'مسدد';
  if (totalPaidH === 0) return 'متأخر';
  if (hasPartial || overdueMonthsCount < 5) return 'مسدد جزئياً';
  return 'متأخر';
}

export function recalculateExpensesRunningBalance(
  expenses: Expense[],
  totalFundRevenue: number
): Expense[] {
  // Sort oldest-to-newest by date then id so running balances reflect chronological order
  const chronological = [...expenses].sort((a, b) => {
    const dateDiff = a.date.localeCompare(b.date);
    if (dateDiff !== 0) return dateDiff;
    return a.id.localeCompare(b.id);
  });

  let runningBalanceH = toHalalas(totalFundRevenue);
  const updatedMap = new Map<string, Expense>();

  chronological.forEach((exp) => {
    const before = fromHalalas(runningBalanceH);
    runningBalanceH -= toHalalas(exp.amount);
    const after = fromHalalas(runningBalanceH);
    updatedMap.set(exp.id, {
      ...exp,
      balanceBefore: before,
      balanceAfter: after,
    });
  });

  return expenses.map((e) => updatedMap.get(e.id) ?? e);
}

export function buildMonthlyFinancialSeries(
  payments: PaymentRecord[],
  expenses: Expense[],
  year: number
): { month: string; revenue: number; expenses: number }[] {
  return ARABIC_MONTHS.map((month, idx) => {
    const monthStr = String(idx + 1).padStart(2, '0');
    const yearMonthPrefix = `${year}-${monthStr}`;

    const revH = payments
      .filter((p) => p.year === year || p.date.startsWith(`${year}-`))
      .filter((p) => {
        if (p.date.startsWith(yearMonthPrefix)) return true;
        // Support Hijri fiscal year where Gregorian payment date falls in same month slot when year !== Gregorian year
        if (p.year === year && !p.date.startsWith(`${year}-`)) {
          return p.date.slice(5, 7) === monthStr;
        }
        return false;
      })
      .reduce((acc, p) => acc + toHalalas(p.amount), 0);

    const expH = expenses
      .filter((e) => e.year === year || e.date.startsWith(`${year}-`))
      .filter((e) => {
        if (e.date.startsWith(yearMonthPrefix)) return true;
        if (e.year === year && !e.date.startsWith(`${year}-`)) {
          return e.date.slice(5, 7) === monthStr;
        }
        return false;
      })
      .reduce((acc, e) => acc + toHalalas(e.amount), 0);

    return {
      month,
      revenue: fromHalalas(revH),
      expenses: fromHalalas(expH),
    };
  });
}
