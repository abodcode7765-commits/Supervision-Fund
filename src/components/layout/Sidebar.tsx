import React from 'react';
import {
  LayoutDashboard,
  Users,
  Layers,
  CalendarCheck,
  ReceiptText,
  AlertOctagon,
  Coins,
  HeartHandshake,
  Wallet,
  FileBarChart2,
  ShieldCheck,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { PageId } from '../../types';
import { LogoMark } from '../ui/SharedUI';

export interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'members', label: 'الأعضاء', icon: Users },
  { id: 'groups', label: 'المجموعات', icon: Layers },
  { id: 'subscriptions', label: 'الاشتراكات', icon: CalendarCheck },
  { id: 'payments', label: 'سجل السداد', icon: ReceiptText },
  { id: 'overdue', label: 'المتأخرات', icon: AlertOctagon },
  { id: 'qittat', label: 'القِطّات', icon: Coins },
  { id: 'marriage-aid', label: 'معونة الزواج', icon: HeartHandshake },
  { id: 'expenses', label: 'مصروفات الصندوق', icon: Wallet },
  { id: 'reports', label: 'التقارير والكشوفات', icon: FileBarChart2 },
  { id: 'users', label: 'المستخدمون والصلاحيات', icon: ShieldCheck },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export function Sidebar({
  activePage,
  allowedPages,
  onNavigate,
  onLogout,
  userName,
  userRole,
  mobileOpen,
  onCloseMobile,
  overdueCount,
}: {
  activePage: PageId;
  allowedPages: PageId[];
  onNavigate: (page: PageId) => void;
  onLogout: () => void;
  userName: string;
  userRole: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  overdueCount: number;
}) {
  const handleSelect = (id: PageId) => {
    onNavigate(id);
    onCloseMobile();
  };

  const visibleItems = NAV_ITEMS.filter((item) => allowedPages.includes(item.id));

  const sidebarContent = (
    <div className="h-full flex flex-col bg-[#123B70] text-white select-none">
      {/* Brand Header */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <LogoMark size={40} light />
          <div className="min-w-0">
            <div className="text-base font-bold leading-tight truncate">صندوق الإشراف</div>
            <div className="text-xs text-[#A8C7EB] mt-0.5 truncate">ذوي محسن</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-white/75 hover:text-white hover:bg-white/10"
          aria-label="إغلاق القائمة"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#2878C8] text-white shadow-sm'
                  : 'text-[#DCE9F8] hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-[18px] h-[18px] shrink-0 ${
                    isActive ? 'text-white' : 'text-[#9EC4EE]'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.id === 'overdue' && overdueCount > 0 && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md tabular-nums shrink-0 ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[#DC5555]/90 text-white'
                  }`}
                >
                  {overdueCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom User & Logout */}
      <div className="p-3.5 border-t border-white/10 bg-[#0E2F5A]/70">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-xl bg-[#2878C8] text-white font-bold text-sm flex items-center justify-center shrink-0">
            {userName.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white truncate">{userName}</div>
            <div className="text-[11px] text-[#A8C7EB] truncate">{userRole}</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#DCE9F8] bg-white/8 hover:bg-[#DC5555] hover:text-white transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:block fixed top-0 right-0 bottom-0 w-64 z-30 border-l border-[#123B70] no-print">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex no-print"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="fixed inset-0 bg-[#123B70]/50 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full z-10 shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
