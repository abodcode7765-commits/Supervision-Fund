import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  UserCheck,
  Calendar,
  AlertCircle,
  CheckCircle2,
  HeartHandshake,
  Shield,
} from 'lucide-react';
import { Member, PageId, SystemUser } from '../../types';
import { NAV_ITEMS } from './Sidebar';
import { getTodayArabicDate } from '../../utils/formatters';

export function Topbar({
  activePage,
  subBreadcrumb,
  onOpenMobileMenu,
  onNavigate,
  onSelectMember,
  onLogout,
  members,
  currentUser,
  allUsers,
  onSwitchUser,
}: {
  activePage: PageId;
  subBreadcrumb?: string;
  onOpenMobileMenu: () => void;
  onNavigate: (page: PageId) => void;
  onSelectMember: (memberId: string) => void;
  onLogout: () => void;
  members: Member[];
  currentUser: SystemUser;
  allUsers: SystemUser[];
  onSwitchUser: (user: SystemUser) => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(3);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentNav = NAV_ITEMS.find((i) => i.id === activePage);
  const pageTitle = currentNav?.label ?? 'الرئيسية';

  const trimmed = searchQuery.trim();
  const visibleMembers =
    currentUser.role === 'رئيس المجموعة' && currentUser.groupId
      ? members.filter((m) => m.groupId === currentUser.groupId)
      : currentUser.role === 'مسؤول القِطّات'
        ? []
        : members;

  const matchedMembers = trimmed
    ? visibleMembers
        .filter(
          (m) =>
            m.name.includes(trimmed) ||
            m.nationalId.includes(trimmed) ||
            m.groupName.includes(trimmed)
        )
        .slice(0, 5)
    : [];

  const matchedPages = trimmed
    ? NAV_ITEMS.filter(
        (n) => currentUser.permissions.includes(n.id) && n.label.includes(trimmed)
      ).slice(0, 3)
    : [];

  const notifications = [
    {
      id: 'n1',
      title: 'تنبيه اشتراكات متأخرة',
      desc: 'يوجد أعضاء متأخرين عن سداد اشتراكات شهر نوفمبر 2026.',
      time: 'منذ ساعتين',
      icon: AlertCircle,
      tone: 'text-[#DC5555] bg-[#DC5555]/10',
      target: 'overdue' as PageId,
    },
    {
      id: 'n2',
      title: 'عملية سداد جديدة',
      desc: 'تم تسجيل سداد محمد محسن بمبلغ 750 ر.س.',
      time: 'منذ 5 ساعات',
      icon: CheckCircle2,
      tone: 'text-[#16A36A] bg-[#16A36A]/10',
      target: 'payments' as PageId,
    },
    {
      id: 'n3',
      title: 'معونة زواج مستحقة',
      desc: 'معونة العضو سلطان فهد جاهزة للصرف بمبلغ 5,000 ر.س.',
      time: 'أمس',
      icon: HeartHandshake,
      tone: 'text-[#2878C8] bg-[#EAF3FC]',
      target: 'marriage-aid' as PageId,
    },
  ].filter((n) => currentUser.permissions.includes(n.target));

  // Quick role demo switchers (one from each role)
  const rolePreviewAccounts = [
    allUsers.find((u) => u.role === 'مدير الصندوق'),
    allUsers.find((u) => u.role === 'رئيس المجموعة'),
    allUsers.find((u) => u.role === 'مسؤول القِطّات'),
  ].filter(Boolean) as SystemUser[];

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-4 sm:px-6 h-[56px] lg:h-[68px] flex items-center justify-between gap-3 no-print">
      {/* Right zone: Mobile trigger + Page title & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-[#172B45] hover:bg-slate-100 transition-colors shrink-0"
          aria-label="فتح القائمة الجانبية"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="text-sm sm:text-base font-bold text-[#172B45] truncate">
            {pageTitle}
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#748399]">
            <button
              type="button"
              onClick={() => onNavigate(currentUser.permissions[0] ?? 'dashboard')}
              className="hover:text-[#2878C8] transition-colors cursor-pointer"
            >
              صندوق الإشراف
            </button>
            <span>/</span>
            <span className={subBreadcrumb ? '' : 'text-[#172B45] font-medium'}>
              {pageTitle}
            </span>
            {subBreadcrumb && (
              <>
                <span>/</span>
                <span className="text-[#172B45] font-medium truncate max-w-[180px]">
                  {subBreadcrumb}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center zone: Global Search */}
      <div ref={searchRef} className="hidden md:block relative flex-1 max-w-sm mx-4">
        <Search className="w-4 h-4 text-[#748399] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onFocus={() => setSearchFocused(true)}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchFocused(true);
          }}
          placeholder="ابحث عن عضو، رقم هوية، أو صفحة..."
          className="w-full h-10 pr-10 pl-4 rounded-xl border border-slate-200 bg-[#F5F7FA] text-xs sm:text-sm text-[#172B45] placeholder:text-[#748399] focus:bg-white focus:outline-none focus:border-[#2878C8] transition-all"
        />

        {searchFocused && trimmed.length > 0 && (
          <div className="absolute top-12 right-0 left-0 bg-white rounded-xl border border-slate-200 shadow-xl p-2 z-40">
            {matchedMembers.length === 0 && matchedPages.length === 0 ? (
              <div className="py-4 text-center text-xs text-[#748399]">
                لا توجد نتائج مطابقة للبحث "{trimmed}"
              </div>
            ) : (
              <div className="space-y-1">
                {matchedMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      onSelectMember(m.id);
                      setSearchQuery('');
                      setSearchFocused(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-right hover:bg-[#EAF3FC] transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-[#172B45]">{m.name}</div>
                      <div className="text-[11px] text-[#748399]">
                        {m.groupName} · <span className="tabular-nums">{m.nationalId}</span>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-[#2878C8]">ملف العضو</span>
                  </button>
                ))}
                {matchedPages.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      onNavigate(p.id);
                      setSearchQuery('');
                      setSearchFocused(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-right hover:bg-[#EAF3FC] transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-[#172B45]">{p.label}</span>
                    <span className="text-[11px] text-[#748399]">انتقال للصفحة</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Left zone: Date, Notifications, User dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F5F7FA] text-xs font-medium text-[#748399]">
          <Calendar className="w-3.5 h-3.5 text-[#2878C8]" />
          <span>{getTodayArabicDate()}</span>
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setUnreadNotifs(0);
            }}
            className="relative w-10 h-10 rounded-xl border border-slate-200/80 bg-white hover:bg-[#F5F7FA] flex items-center justify-center text-[#172B45] transition-colors cursor-pointer"
            aria-label="الإشعارات"
          >
            <Bell className="w-[18px] h-[18px]" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#DC5555] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadNotifs}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute left-0 top-12 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-slate-200 shadow-xl z-40 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-bold text-[#172B45]">الإشعارات والتنبيهات</span>
                <span className="text-[11px] text-[#2878C8] font-semibold">تحديثات الصندوق</span>
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#748399]">
                  لا توجد تنبيهات ضمن نطاق صلاحياتك الحالية.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {notifications.map((n) => {
                    const Icon = n.icon;
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          onNavigate(n.target);
                          setNotifOpen(false);
                        }}
                        className="w-full p-3.5 flex items-start gap-3 text-right hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.tone}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#172B45]">{n.title}</div>
                          <div className="text-[11px] text-[#748399] mt-0.5 leading-relaxed">
                            {n.desc}
                          </div>
                          <div className="text-[10px] text-[#748399] mt-1">{n.time}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu + Role Switcher */}
        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 pl-2.5 pr-1.5 py-1.5 rounded-xl border border-slate-200/80 hover:bg-[#F5F7FA] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg bg-[#123B70] text-white text-xs font-bold flex items-center justify-center shrink-0">
              {currentUser.name.slice(0, 1)}
            </div>
            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-[#172B45] leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-[#748399] leading-tight">
                {currentUser.role}
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[#748399] hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute left-0 top-12 w-64 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-40">
              <div className="px-3.5 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-[#172B45]">{currentUser.name}</div>
                <div className="text-[11px] text-[#748399]">
                  {currentUser.role} · {currentUser.groupName}
                </div>
              </div>

              {/* Role Preview Switcher */}
              <div className="px-3.5 py-2 border-b border-slate-100 space-y-1">
                <div className="text-[10px] font-bold text-[#748399] flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#2878C8]" />
                  <span>تجربة صلاحيات الأدوار:</span>
                </div>
                {rolePreviewAccounts.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onSwitchUser(u);
                        setUserMenuOpen(false);
                      }}
                      className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer flex items-center justify-between ${
                        isCurrent
                          ? 'bg-[#EAF3FC] text-[#123B70] font-bold'
                          : 'text-[#172B45] hover:bg-[#F5F7FA]'
                      }`}
                    >
                      <span>{u.role}</span>
                      <span className="text-[10px] text-[#748399]">{u.name}</span>
                    </button>
                  );
                })}
              </div>

              {currentUser.permissions.includes('users') && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('users');
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#172B45] hover:bg-[#F5F7FA] cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-[#2878C8]" />
                  <span>المستخدمون والصلاحيات</span>
                </button>
              )}
              {currentUser.permissions.includes('settings') && (
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('settings');
                    setUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium text-[#172B45] hover:bg-[#F5F7FA] cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#2878C8]" />
                  <span>إعدادات الصندوق</span>
                </button>
              )}
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-[#DC5555] hover:bg-[#DC5555]/8 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
