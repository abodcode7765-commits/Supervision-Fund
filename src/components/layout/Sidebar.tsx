import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal as RNModal,
  Dimensions,
} from 'react-native';
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
} from 'lucide-react-native';
import { PageId } from '../../types';
import { LogoMark } from '../ui/SharedUI';

export interface NavItem {
  id: PageId;
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { id: 'members', label: 'الأعضاء', icon: Users },
  { id: 'groups', label: 'المجموعات', icon: Layers },
  { id: 'subscriptions', label: 'الاشتراكات', icon: CalendarCheck },
  { id: 'payments', label: 'سجل السداد', icon: ReceiptText },
  { id: 'overdue', label: 'المتأخرات', icon: AlertOctagon },
  { id: 'qittat', label: 'القطات', icon: Coins },
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
    <View style={styles.container}>
      <View style={styles.brandHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <LogoMark size={40} light />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#ffffff' }} numberOfLines={1}>صندوق الإشراف</Text>
            <Text style={{ fontSize: 12, color: '#A8C7EB', marginTop: 2 }} numberOfLines={1}>ذوي محسن</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onCloseMobile} style={{ padding: 6, borderRadius: 8 }}>
          <X size={20} color="rgba(255,255,255,0.75)" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleSelect(item.id)}
              style={({ pressed }) => [
                styles.navItem,
                isActive && styles.navItemActive,
                pressed && { opacity: 0.8 },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <Icon size={18} color={isActive ? '#ffffff' : '#9EC4EE'} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: isActive ? '#ffffff' : '#DCE9F8' }} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
              {item.id === 'overdue' && overdueCount > 0 && (
                <View style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(220,85,85,0.9)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#ffffff', fontVariant: ['tabular-nums'] }}>
                    {overdueCount}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.bottomSection}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8, paddingVertical: 8 }}>
          <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#2878C8', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#ffffff' }}>{userName.slice(0, 1)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }} numberOfLines={1}>{userName}</Text>
            <Text style={{ fontSize: 11, color: '#A8C7EB' }} numberOfLines={1}>{userRole}</Text>
          </View>
        </View>
        <Pressable
          onPress={onLogout}
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.8 }]}
        >
          <LogOut size={16} color="#DCE9F8" />
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#DCE9F8' }}>تسجيل الخروج</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <>
      <View style={[styles.sidebarFixed, { width: 0 }]} />

      {mobileOpen && (
        <RNModal visible={mobileOpen} transparent animationType="slide" onRequestClose={onCloseMobile}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(18,59,112,0.5)' }} onPress={onCloseMobile} />
          <View style={[styles.drawer, { width: 288 }]}>
            {sidebarContent}
          </View>
        </RNModal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#123B70',
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sidebarFixed: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    zIndex: 30,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: '#123B70',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 4,
  },
  navItemActive: {
    backgroundColor: '#2878C8',
  },
  bottomSection: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(14,47,90,0.7)',
  },
  logoutBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
});
