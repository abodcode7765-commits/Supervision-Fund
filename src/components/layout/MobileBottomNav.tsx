import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  ReceiptText,
  Coins,
  Menu,
} from 'lucide-react-native';
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
  const candidates: { id: PageId; label: string; icon: React.ComponentType<{ size?: number; color?: string }> }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
    { id: 'members', label: 'الأعضاء', icon: Users },
    { id: 'subscriptions', label: 'الاشتراكات', icon: CalendarCheck },
    { id: 'payments', label: 'السداد', icon: ReceiptText },
    { id: 'qittat', label: 'القطات', icon: Coins },
  ];

  const items = candidates.filter((c) => allowedPages.includes(c.id)).slice(0, 4);

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = activePage === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onNavigate(item.id)}
            style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
          >
            <Icon size={20} color={active ? '#2878C8' : '#748399'} />
            <Text style={{ fontSize: 10, fontWeight: '600', color: active ? '#2878C8' : '#748399', marginTop: 2 }} numberOfLines={1}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
      <Pressable
        onPress={onOpenMenu}
        style={({ pressed }) => [styles.tab, pressed && { opacity: 0.7 }]}
      >
        <Menu size={20} color="#748399" />
        <Text style={{ fontSize: 10, fontWeight: '600', color: '#748399', marginTop: 2 }}>القائمة</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    height: 60,
    paddingBottom: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
});
