import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
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
} from 'lucide-react-native';
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
    icon: React.ComponentType<{ size?: number; color?: string }>;
    iconColor: string;
    iconBg: string;
    target: PageId;
  }[] = [];

  if (overdueMembersScoped.length > 0 && currentUser.permissions.includes('overdue')) {
    rawNotifications.push({
      id: `overdue-${overdueMembersScoped.length}`,
      title: 'تنبيه اشتراكات غير مسددة',
      desc: `يوجد ${overdueMembersScoped.length} عضو لديهم مبالغ متبقية أو متأخرة.`,
      time: 'تحديث مباشر',
      icon: AlertCircle,
      iconColor: '#DC5555',
      iconBg: 'rgba(220,85,85,0.1)',
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
      iconColor: '#16A36A',
      iconBg: 'rgba(22,163,106,0.1)',
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
      iconColor: '#2878C8',
      iconBg: '#EAF3FC',
      target: 'marriage-aid',
    });
  }

  const unreadCount = rawNotifications.filter((n) => !seenNotifKeys.includes(n.id)).length;

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
        <TouchableOpacity onPress={onOpenMobileMenu} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }}>
          <Menu size={20} color="#172B45" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#172B45' }} numberOfLines={1}>{pageTitle}</Text>
          {subBreadcrumb ? (
            <Text style={{ fontSize: 12, color: '#172B45', fontWeight: '500' }} numberOfLines={1}>{subBreadcrumb}</Text>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          onPress={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); setSeenNotifKeys(rawNotifications.map((n) => n.id)); }}
          style={styles.iconBtn}
        >
          <Bell size={18} color="#172B45" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#ffffff' }}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)' }}
        >
          <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: '#123B70', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#ffffff' }}>{currentUser.name.slice(0, 1)}</Text>
          </View>
          <ChevronDown size={16} color="#748399" />
        </TouchableOpacity>
      </View>

      {notifOpen && (
        <View style={styles.dropdown}>
          <View style={styles.dropdownHeader}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#172B45' }}>الإشعارات والتنبيهات</Text>
            <TouchableOpacity onPress={() => setNotifOpen(false)}>
              <X size={16} color="#748399" />
            </TouchableOpacity>
          </View>
          {rawNotifications.length === 0 ? (
            <Text style={{ padding: 16, textAlign: 'center', fontSize: 12, color: '#748399' }}>لا توجد تنبيهات ضمن نطاق صلاحياتك الحالية.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {rawNotifications.map((n) => {
                const Icon = n.icon;
                return (
                  <TouchableOpacity
                    key={n.id}
                    onPress={() => { onNavigate(n.target); setNotifOpen(false); }}
                    style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: n.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                      <Icon size={16} color={n.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#172B45' }}>{n.title}</Text>
                      <Text style={{ fontSize: 11, color: '#748399', marginTop: 2, lineHeight: 18 }}>{n.desc}</Text>
                      <Text style={{ fontSize: 10, color: '#748399', marginTop: 4 }}>{n.time}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      )}

      {userMenuOpen && (
        <View style={[styles.dropdown, { left: 12, right: 12, maxWidth: 260 }]}>
          <View style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#172B45' }}>{currentUser.name}</Text>
            <Text style={{ fontSize: 11, color: '#748399', marginTop: 2 }}>{currentUser.role} · {currentUser.groupName}</Text>
          </View>
          {currentUser.permissions.includes('users') && (
            <TouchableOpacity onPress={() => { onNavigate('users'); setUserMenuOpen(false); }} style={styles.menuItem}>
              <UserCheck size={16} color="#2878C8" />
              <Text style={styles.menuItemText}>المستخدمون والصلاحيات</Text>
            </TouchableOpacity>
          )}
          {currentUser.permissions.includes('settings') && (
            <TouchableOpacity onPress={() => { onNavigate('settings'); setUserMenuOpen(false); }} style={styles.menuItem}>
              <Settings size={16} color="#2878C8" />
              <Text style={styles.menuItemText}>إعدادات الصندوق</Text>
            </TouchableOpacity>
          )}
          <View style={{ height: 1, backgroundColor: '#F1F5F9', marginVertical: 4 }} />
          <TouchableOpacity onPress={() => { setUserMenuOpen(false); onLogout(); }} style={styles.menuItem}>
            <LogOut size={16} color="#DC5555" />
            <Text style={[styles.menuItemText, { color: '#DC5555' }]}>تسجيل الخروج</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.8)',
    zIndex: 30,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#DC5555',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 50,
    left: 60,
    right: 60,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 40,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#ffffff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#172B45',
  },
});
