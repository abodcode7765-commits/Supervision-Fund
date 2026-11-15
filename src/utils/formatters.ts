import { MemberYearSubscription, YearConfig } from '../types';
import { ARABIC_MONTHS } from '../data/mockData';

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

export function formatCurrency(value: number, currency = 'ر.س'): string {
  return `${value.toLocaleString('en-US')} ${currency}`;
}

export function getTodayArabicDate(): string {
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const now = new Date(2026, 10, 15); // Consistent prototype date: الأحد 15 نوفمبر 2026
  return `${days[now.getDay()]}، ${now.getDate()} ${ARABIC_MONTHS[now.getMonth()]} ${now.getFullYear()} م`;
}

export interface SubscriptionTotals {
  totalDue: number;
  totalPaid: number;
  remaining: number;
  overdueMonths: string[];
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
      totalDue: 0,
      totalPaid: 0,
      remaining: 0,
      overdueMonths: [],
      paidMonthsCount: 0,
      overdueMonthsCount: 0,
      partialMonthsCount: 0,
    };
  }

  let dueMonthsCount = 0;
  let paidAmountFromMonths = 0;
  let paidMonthsCount = 0;
  let overdueMonthsCount = 0;
  let partialMonthsCount = 0;
  const overdueMonths: string[] = [];

  sub.months.forEach((status, idx) => {
    if (status === 'upcoming') return;
    dueMonthsCount += 1;
    if (status === 'paid') {
      paidMonthsCount += 1;
      paidAmountFromMonths += config.monthlyFee;
    } else if (status === 'partial') {
      partialMonthsCount += 1;
      paidAmountFromMonths += Math.round(config.monthlyFee / 2);
      overdueMonths.push(ARABIC_MONTHS[idx]);
    } else if (status === 'overdue') {
      overdueMonthsCount += 1;
      overdueMonths.push(ARABIC_MONTHS[idx]);
    }
  });

  const totalDue = config.foundingFee + dueMonthsCount * config.monthlyFee;
  const totalPaid = sub.foundingPaidAmount + paidAmountFromMonths;
  const remaining = Math.max(0, totalDue - totalPaid);

  return {
    totalDue,
    totalPaid,
    remaining,
    overdueMonths,
    paidMonthsCount,
    overdueMonthsCount,
    partialMonthsCount,
  };
}
