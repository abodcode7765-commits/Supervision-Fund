import React, { useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

export function RevenueExpenseChart({
  data,
  year,
}: {
  data: { month: string; revenue: number; expenses: number }[];
  year: number;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const rawMax = Math.max(...data.map((d) => Math.max(d.revenue, d.expenses)), 0);
  const stepUnit = rawMax <= 900 ? 300 : rawMax <= 3000 ? 1000 : Math.ceil(rawMax / 3 / 500) * 500;
  const maxVal = Math.max(stepUnit * 3, 900);
  const ySteps = [0, stepUnit, stepUnit * 2, stepUnit * 3];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_1px_3px_rgba(18,59,112,0.04)] h-full flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-bold text-[#172B45]">مخطط الإيرادات والمصروفات</h3>
          <p className="text-xs text-[#748399] mt-0.5 tabular-nums">
            حركة التحصيل والمصروفات خلال أشهر سنة {year}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-[#172B45]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2878C8]" />
            <span>الإيرادات</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#E99A35]" />
            <span>المصروفات</span>
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-2">
        <div className="min-w-[540px]">
          <div className="relative h-60 flex items-end gap-2 pt-6 pr-14 pl-2">
            {/* Y-axis grid lines */}
            <div className="absolute inset-0 right-14 left-2 top-6 bottom-7 pointer-events-none flex flex-col justify-between">
              {[...ySteps].reverse().map((step) => (
                <div key={step} className="relative flex items-center w-full border-t border-dashed border-slate-200">
                  <span className="absolute -right-14 text-[11px] text-[#748399] tabular-nums w-12 text-left">
                    {step.toLocaleString('en-US')}
                  </span>
                </div>
              ))}
            </div>

            {/* Bars */}
            {data.map((item, idx) => {
              const revH = Math.round((item.revenue / maxVal) * 100);
              const expH = Math.round((item.expenses / maxVal) * 100);
              const isHovered = hoveredIdx === idx;

              return (
                <div
                  key={item.month}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="relative flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                >
                  {isHovered && (
                    <div className="absolute -top-2 z-20 bg-[#123B70] text-white rounded-lg px-2.5 py-1.5 text-[11px] shadow-lg whitespace-nowrap pointer-events-none">
                      <div className="font-bold mb-0.5">{item.month} {year}</div>
                      <div className="tabular-nums text-[#93C5FD]">
                        الإيرادات: {formatCurrency(item.revenue)}
                      </div>
                      <div className="tabular-nums text-[#FCD34D]">
                        المصروفات: {formatCurrency(item.expenses)}
                      </div>
                    </div>
                  )}

                  <div
                    className={`w-full h-[calc(100%-28px)] flex items-end justify-center gap-1 px-0.5 rounded-t-md transition-colors ${
                      isHovered ? 'bg-[#EAF3FC]/60' : ''
                    }`}
                  >
                    <div
                      className="w-3 sm:w-3.5 rounded-t-md bg-[#2878C8] group-hover:bg-[#123B70] transition-all duration-150"
                      style={{ height: `${item.revenue > 0 ? Math.max(revH, 4) : 0}%` }}
                    />
                    <div
                      className="w-2.5 sm:w-3 rounded-t-md bg-[#E99A35] group-hover:bg-[#d18626] transition-all duration-150"
                      style={{ height: `${item.expenses > 0 ? Math.max(expH, 4) : 0}%` }}
                    />
                  </div>

                  <span className="mt-2 h-5 text-[11px] font-medium text-[#748399] group-hover:text-[#172B45] whitespace-nowrap">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SubscriptionDonutChart({
  paidCount,
  partialCount,
  overdueCount,
  year,
}: {
  paidCount: number;
  partialCount: number;
  overdueCount: number;
  year: number;
}) {
  const sum = paidCount + partialCount + overdueCount;
  const paidPct = sum === 0 ? 0 : Math.round((paidCount / sum) * 100);
  const partialPct = sum === 0 ? 0 : Math.round((partialCount / sum) * 100);
  const overduePct = sum === 0 ? 0 : Math.max(0, 100 - paidPct - partialPct);

  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  const paidDash = (paidPct / 100) * circumference;
  const partialDash = (partialPct / 100) * circumference;
  const overdueDash = (overduePct / 100) * circumference;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_1px_3px_rgba(18,59,112,0.04)] h-full flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold text-[#172B45]">حالة الاشتراكات</h3>
        <p className="text-xs text-[#748399] mt-0.5 tabular-nums">
          توزيع التزام الأعضاء للسنة المالية {year}
        </p>
      </div>

      <div className="my-5 flex items-center justify-center">
        <div className="relative w-44 h-44 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 150 150">
            <circle
              cx="75"
              cy="75"
              r={radius}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth="18"
            />
            {sum > 0 && (
              <>
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="none"
                  stroke="#16A36A"
                  strokeWidth="18"
                  strokeDasharray={`${paidDash} ${circumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="butt"
                />
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="none"
                  stroke="#E99A35"
                  strokeWidth="18"
                  strokeDasharray={`${partialDash} ${circumference}`}
                  strokeDashoffset={-paidDash}
                  strokeLinecap="butt"
                />
                <circle
                  cx="75"
                  cy="75"
                  r={radius}
                  fill="none"
                  stroke="#DC5555"
                  strokeWidth="18"
                  strokeDasharray={`${overdueDash} ${circumference}`}
                  strokeDashoffset={-(paidDash + partialDash)}
                  strokeLinecap="butt"
                />
              </>
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-2xl font-bold text-[#172B45] tabular-nums">{paidPct}%</span>
            <span className="text-[11px] font-medium text-[#748399]">نسبة الالتزام</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#172B45] font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#16A36A]" />
            <span>مسددون بالكامل</span>
          </div>
          <span className="font-bold text-[#172B45] tabular-nums">
            {paidCount} عضو ({paidPct}%)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#172B45] font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#E99A35]" />
            <span>سداد جزئي</span>
          </div>
          <span className="font-bold text-[#172B45] tabular-nums">
            {partialCount} عضو ({partialPct}%)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#172B45] font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#DC5555]" />
            <span>متأخرون عن السداد</span>
          </div>
          <span className="font-bold text-[#DC5555] tabular-nums">
            {overdueCount} عضو ({overduePct}%)
          </span>
        </div>
      </div>
    </div>
  );
}

export function ExpenseCategoryChart({
  items,
}: {
  items: { category: string; amount: number }[];
}) {
  const sum = items.reduce((acc, item) => acc + item.amount, 0);
  const colors = ['#123B70', '#2878C8', '#4A90D9', '#E99A35', '#16A36A'];

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-[0_1px_3px_rgba(18,59,112,0.04)] h-full">
      <div className="mb-4">
        <h3 className="text-base font-bold text-[#172B45]">توزيع المصروفات حسب التصنيف</h3>
        <p className="text-xs text-[#748399] mt-0.5">نسبة كل بند من إجمالي مصروفات الصندوق</p>
      </div>

      {items.length === 0 || sum === 0 ? (
        <div className="py-10 text-center text-xs text-[#748399]">
          لا توجد مصروفات مطابقة للتصفية الحالية.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, idx) => {
            const pct = Math.round((item.amount / sum) * 100);
            return (
              <div key={item.category}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#172B45]">{item.category}</span>
                  <span className="text-[#748399] tabular-nums">
                    <strong className="text-[#172B45]">{formatCurrency(item.amount)}</strong> ({pct}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(pct, 3)}%`,
                      backgroundColor: colors[idx % colors.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
