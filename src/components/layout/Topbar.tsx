import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  X,
} from 'lucide-react';
import { MarriageAid, Member, PageId, PaymentRecord, SystemUser } from '../../types';
import { NAV_ITEMS } from './Sidebar';
import { formatCurrency, getTodayArabicDate } from '../../utils/formatters';

export function Topbar({
  activePage,
  subBreadcrumb,
  onOpenMobileMenu,
  onNavigate,
  onSelectMember,
  onLogout,
  members,
  payments,
  marriageAids,
  currentUser,
}: {
  activePage: PageId;
  subBreadcrumb?: string;
  onOpenMobileMenu: () => void;
  onNavigate: (page: PageId) => void;
  onSelectMember: (memberId: string) => void;
  onLogout: () => void;
  members: Member[];
  payments: PaymentRecord[];
  marriageAids: MarriageAid[];
  currentUser: SystemUser;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [seenNotifKeys, setSeenNotifKeys] = useState<string[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      const target = e.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (userRef.current && !userRef.current.contains(target)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setSearchFocused(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifOpen(false);
        setUserMenuOpen(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  const currentNav = NAV_ITEMS.find((i) => i.id === activePage);
  const pageTitle = currentNav?.label ?? 'الرئيسية';

  const trimmed = searchQuery.trim();
  const visibleMembers =
    currentUser.role === 'رئيس المجموعة' && currentUser.groupId
      ? members.filter((m) => m.groupId === currentUser.groupId)
      : currentUser.role === 'مسؤول القطات'
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

  // Dynamic real notifications scoped to currentUser permissions & group
  const overdueMembersScoped = visibleMembers.filter(
    (m) => m.memberStatus === 'نشط' && m.subscriptionStatus !== 'مسدد'
  );
  const latestScopedPayment = payments.find((p) => {
    if (currentUser.role === 'رئيس المجموعة' && currentUser.groupId) {
      return visibleMembers.some((m) => m.id === p.memberId);
    }
    return true;
  });
  const eligibleAid = marriageAids.find((a) => a.status === 'مستحقة');

  const rawNotifications: {
    id: string;
    title: string;
    desc: string;
    time: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
    target: PageId;
  }[] = [];

  if (overdueMembersScoped.length > 0 && currentUser.permissions.includes('overdue')) {
    rawNotifications.push({
      id: `overdue-${overdueMembersScoped.length}`,
      title: 'تنبيه اشتراكات غير مسددة',
      desc: `يوجد ${overdueMembersScoped.length} عضو لديهم مبالغ متبقية أو متأخرة.`,
      time: 'تحديث مباشر',
      icon: AlertCircle,
      tone: 'text-[#DC5555] bg-[#DC5555]/10',
      target: 'overdue',
    });
  }

  if (latestScopedPayment && currentUser.permissions.includes('payments')) {
    rawNotifications.push({
      id: `payment-${latestScopedPayment.id}`,
      title: 'أحدث عملية سداد مسجلة',
      desc: `تم تسجيل سداد ${latestScopedPayment.memberName} بمبلغ ${formatCurrency(latestScopedPayment.amount)}.`,
      time: latestScopedPayment.date,
      icon: CheckCircle2,
      tone: 'text-[#16A36A] bg-[#16A36A]/10',
      target: 'payments',
    });
  }

  if (eligibleAid && currentUser.permissions.includes('marriage-aid')) {
    rawNotifications.push({
      id: `aid-${eligibleAid.id}`,
      title: 'معونة زواج مستحقة للصرف',
      desc: `معونة العضو ${eligibleAid.memberName} جاهزة بمبلغ ${formatCurrency(eligibleAid.amount)}.`,
      time: eligibleAid.dueDate,
      icon: HeartHandshake,
      tone: 'text-[#2878C8] bg-[#EAF3FC]',
      target: 'marriage-aid',
    });
  }

  const unreadCount = rawNotifications.filter((n) => !seenNotifKeys.includes(n.id)).length;

  return (
    <>
      {notifOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[35] bg-[#123B70]/25 backdrop-blur-[3px] transition-opacity no-print"
            onClick={() => setNotifOpen(false)}
            aria-hidden="true"
          />,
          document.body
        )}

      <header
        className={`sticky top-0 ${
          notifOpen ? 'z-40' : 'z-30'
        } bg-white/95 backdrop-blur-sm border-b border-slate-200/80 px-3 sm:px-6 h-[56px] lg:h-[68px] flex items-center justify-between gap-2 sm:gap-3 no-print`}
      >
        {/* Right zone: Mobile trigger + Page title & Breadcrumb */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-[#172B45] hover:bg-slate-100 transition-colors shrink-0"
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
                setUserMenuOpen(false);
                setSeenNotifKeys(rawNotifications.map((n) => n.id));
              }}
              className="relative w-10 h-10 rounded-xl border border-slate-200/80 bg-white hover:bg-[#F5F7FA] flex items-center justify-center text-[#172B45] transition-colors cursor-pointer"
              aria-label="الإشعارات"
              aria-expanded={notifOpen}
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[#DC5555] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div className="fixed left-3 right-3 top-[62px] sm:absolute sm:left-0 sm:right-auto sm:top-12 sm:w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-40 overflow-hidden max-h-[calc(100vh-6rem)] overflow-y-auto">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 sticky top-0 bg-white">
                  <span className="text-sm font-bold text-[#172B45]">الإشعارات والتنبيهات</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#2878C8] font-semibold">تحديثات الصندوق</span>
                    <button
                      type="button"
                      onClick={() => setNotifOpen(false)}
                      className="sm:hidden p-1 rounded-lg text-[#748399] hover:text-[#172B45] hover:bg-slate-100"
                      aria-label="إغلاق الإشعارات"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {rawNotifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-[#748399]">
                    لا توجد تنبيهات ضمن نطاق صلاحياتك الحالية.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {rawNotifications.map((n) => {
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
                            <div className="text-[10px] text-[#748399] mt-1 tabular-nums">{n.time}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div ref={userRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setUserMenuOpen((v) => !v);
                setNotifOpen(false);
              }}
              className="h-10 flex items-center gap-2 px-1.5 sm:pl-2.5 sm:pr-1.5 rounded-xl border border-slate-200/80 hover:bg-[#F5F7FA] transition-colors cursor-pointer"
              aria-label="حساب المستخدم"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#123B70] text-white text-xs font-bold flex items-center justify-center shrink-0">
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
              <div className="absolute left-0 top-12 w-64 max-w-[calc(100vw-2rem)] bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-40">
                <div className="px-3.5 py-2.5 border-b border-slate-100">
                  <div className="text-xs font-bold text-[#172B45]">{currentUser.name}</div>
                  <div className="text-[11px] text-[#748399] mt-0.5">
                    {currentUser.role} · {currentUser.groupName}
                  </div>
                </div>

                {currentUser.permissions.includes('users') && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate('users');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-[#172B45] hover:bg-[#F5F7FA] cursor-pointer"
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
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-[#172B45] hover:bg-[#F5F7FA] cursor-pointer"
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
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-[#DC5555] hover:bg-[#DC5555]/8 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
