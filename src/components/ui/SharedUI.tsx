import React, { useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal as RNModal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MinusCircle,
  X,
  AlertTriangle,
} from 'lucide-react-native';
import type { StatusTone } from './types';

export function LogoMark({ size = 40, light = false }: { size?: number; light?: boolean }) {
  return (
    <View
      style={[
        styles.logoContainer,
        {
          width: size,
          height: size,
          borderRadius: 12,
          backgroundColor: light ? 'rgba(255,255,255,0.12)' : undefined,
          borderColor: light ? 'rgba(255,255,255,0.2)' : undefined,
          borderWidth: light ? 1 : 0,
        },
        !light && { backgroundColor: '#123B70' },
      ]}
    >
      <SvgLogo width={size * 0.58} height={size * 0.58} color="#ffffff" />
    </View>
  );
}

import Svg, { Path } from 'react-native-svg';

function SvgLogo({ width, height, color }: { width: number; height: number; color: string }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 32 32" fill="none">
      <Path
        d="M16 3L27 7.5V15.5C27 22.3 22.3 27.6 16 29.5C9.7 27.6 5 22.3 5 15.5V7.5L16 3Z"
        stroke={color}
        strokeWidth={2.1}
        strokeLinejoin="round"
      />
      <Path
        d="M16 9V22M16 9C13.5 11.2 11.5 11.8 10 12M16 9C18.5 11.2 20.5 11.8 22 12M11.5 16.5H20.5"
        stroke={color}
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export type { StatusTone };

export function StatusIndicator({ label, tone }: { label: string; tone: StatusTone }) {
  const stylesMap: Record<StatusTone, { color: string; bg: string }> = {
    success: { color: '#16A36A', bg: 'rgba(22,163,106,0.1)' },
    danger: { color: '#DC5555', bg: 'rgba(220,85,85,0.1)' },
    warning: { color: '#C67B1B', bg: 'rgba(233,154,53,0.14)' },
    neutral: { color: '#748399', bg: '#F1F5F9' },
    info: { color: '#2878C8', bg: '#EAF3FC' },
  };

  const Icon =
    tone === 'success'
      ? CheckCircle2
      : tone === 'danger'
        ? AlertCircle
        : tone === 'warning'
          ? Clock
          : MinusCircle;

  const s = stylesMap[tone];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: s.bg }}>
      <Icon size={14} color={s.color} />
      <Text style={{ fontSize: 12, fontWeight: '600', color: s.color }}>{label}</Text>
    </View>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'blue',
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  accent?: 'blue' | 'royal' | 'green' | 'red' | 'amber';
}) {
  const accentMap: Record<string, { bg: string; color: string; valColor: string }> = {
    blue: { bg: '#EAF3FC', color: '#2878C8', valColor: '#172B45' },
    royal: { bg: 'rgba(18,59,112,0.1)', color: '#123B70', valColor: '#123B70' },
    green: { bg: 'rgba(22,163,106,0.1)', color: '#16A36A', valColor: '#16A36A' },
    red: { bg: 'rgba(220,85,85,0.1)', color: '#DC5555', valColor: '#DC5555' },
    amber: { bg: 'rgba(233,154,53,0.14)', color: '#C67B1B', valColor: '#C67B1B' },
  };

  const a = accentMap[accent];

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#748399' }} numberOfLines={1}>{title}</Text>
          <Text style={{ marginTop: 8, fontSize: 20, fontWeight: '700', color: a.valColor, fontVariant: ['tabular-nums'] }}>
            {value}
          </Text>
          {subtitle ? <Text style={{ marginTop: 6, fontSize: 12, color: '#748399' }} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: a.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={a.color} />
        </View>
      </View>
    </View>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'column', gap: 12, marginBottom: 20 }}>
      <View style={{ flexShrink: 1 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#172B45', lineHeight: 28 }}>{title}</Text>
        <Text style={{ marginTop: 4, fontSize: 13, color: '#748399', lineHeight: 20 }}>{description}</Text>
      </View>
      {action && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>{action}</View>}
    </View>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <RNModal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12, backgroundColor: 'rgba(18,59,112,0.45)' }}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#172B45' }}>{title}</Text>
              {subtitle ? <Text style={{ fontSize: 12, color: '#748399', marginTop: 2 }}>{subtitle}</Text> : null}
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8, borderRadius: 8 }}>
              <X size={20} color="#748399" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 24 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </RNModal>
  );
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'تأكيد',
  variant = 'danger',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
}) {
  const iconTone =
    variant === 'warning'
      ? { bg: 'rgba(233,154,53,0.15)', color: '#C67B1B' }
      : variant === 'primary'
        ? { bg: '#EAF3FC', color: '#2878C8' }
        : { bg: 'rgba(220,85,85,0.1)', color: '#DC5555' };

  const btnTone =
    variant === 'warning'
      ? '#C67B1B'
      : variant === 'primary'
        ? '#2878C8'
        : '#DC5555';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: iconTone.bg, alignItems: 'center', justifyContent: 'center' }}>
          <AlertTriangle size={20} color={iconTone.color} />
        </View>
        <Text style={{ flex: 1, fontSize: 14, color: '#172B45', lineHeight: 22 }}>{message}</Text>
      </View>
      <View style={{ marginTop: 24, flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
        <TouchableOpacity onPress={onClose} style={{ height: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#172B45' }}>إلغاء</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { onConfirm(); onClose(); }}
          style={{ height: 40, paddingHorizontal: 16, borderRadius: 12, backgroundColor: btnTone, justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#ffffff' }}>{confirmLabel}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(226,232,240,0.8)', paddingVertical: 48, paddingHorizontal: 20, alignItems: 'center' }}>
      <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: '#EAF3FC', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} color="#2878C8" />
      </View>
      <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '700', color: '#172B45' }}>{title}</Text>
      <Text style={{ marginTop: 6, fontSize: 14, color: '#748399', textAlign: 'center', lineHeight: 22 }}>{description}</Text>
      {action && <View style={{ marginTop: 20 }}>{action}</View>}
    </View>
  );
}

export function ToastBanner({
  toast,
  onDismiss,
}: {
  toast: { id: number; message: string; type: 'success' | 'info' | 'warning' } | null;
  onDismiss: () => void;
}) {
  if (!toast) return null;

  const bgColor = toast.type === 'warning' ? '#172B45' : '#123B70';
  const borderColor = toast.type === 'warning' ? '#E99A35' : '#2878C8';

  return (
    <View style={{ position: 'absolute', bottom: 80, left: 16, right: 16, zIndex: 50 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: bgColor, borderLeftWidth: 4, borderLeftColor: borderColor, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <CheckCircle2 size={16} color="#4ADE80" />
          <Text style={{ fontSize: 14, fontWeight: '500', color: '#ffffff', flexShrink: 1 }}>{toast.message}</Text>
        </View>
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <X size={16} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    padding: 20,
    shadowColor: 'rgba(18,59,112,0.04)',
    shadowOpacity: 1,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
});
