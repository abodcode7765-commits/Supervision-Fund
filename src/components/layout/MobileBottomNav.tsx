import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ReceiptText,
  Coins,
  Menu,
} from 'lucide-react';
import { PageId } from '../../types';

export function MobileBottomNav({
  activePage,
  allowedPages,
  onNavigate,
  onOpenMenu,
}: {
  activePage: PageId;
  allowedPages: PageId[];
  onNavigate: (page: PageId) => void;
  onOpenMenu: () => void;
}) {
  const candidates: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'members', label: 'الأعضاء', icon: Users },
    { id: 'subscriptions', label: 'الاشتراكات', icon: CalendarCheck },
    { id: 'payments', label: 'السداد', icon: ReceiptText },
    { id: 'qittat', label: 'القطات', icon: Coins },
  ];

  const items = candidates.filter((c) => allowedPages.includes(c.id)).slice(0, 4);

  return (
    <nav
      className="lg:hidden fixed bottom-0 right-0 left-0 z-30 bg-white border-t border-slate-200 px-2 flex items-center justify-around no-print"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', height: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
      aria-label="التنقل السريع"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = activePage === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 px-1.5 py-1 rounded-lg ${
              active ? 'text-[#2878C8]' : 'text-[#748399]'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] font-semibold whitespace-nowrap truncate max-w-full">
              {item.label}
            </span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 px-1.5 py-1 rounded-lg text-[#748399]"
      >
        <Menu className="w-5 h-5 shrink-0" />
        <span className="text-[10px] font-semibold whitespace-nowrap truncate max-w-full">
          القائمة
        </span>
      </button>
    </nav>
  );
}
