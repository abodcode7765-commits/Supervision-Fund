import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Eye, EyeOff, Lock, User, ArrowLeft, ShieldCheck, AlertCircle, Users, Layers } from 'lucide-react-native';
import { LogoMark } from '../ui/SharedUI';
import { SystemUser } from '../../types';
import { authenticateMockUser } from '../../services/contracts';

export function LoginPage({
  users,
  membersCount,
  groupsCount,
  onLogin,
}: {
  users: SystemUser[];
  membersCount: number;
  groupsCount: number;
  onLogin: (user: SystemUser) => void;
}) {
  const [username, setUsername] = useState('m.mohsen');
  const [password, setPassword] = useState('ishraf2026');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const result = authenticateMockUser(users, { username, password });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError('');
    onLogin(result.session.user);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16, paddingVertical: 24 }} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <LogoMark size={54} />
            <Text style={{ marginTop: 16, fontSize: 20, fontWeight: '700', color: '#172B45', textAlign: 'center' }}>
              مرحباً بك في صندوق الإشراف
            </Text>
            <Text style={{ marginTop: 6, fontSize: 13, color: '#748399', textAlign: 'center' }}>
              نظام إدارة الصندوق العائلي – ذوي محسن
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#DC5555" />
              <Text style={{ flex: 1, fontSize: 12, fontWeight: '600', color: '#DC5555' }}>{error}</Text>
            </View>
          ) : null}

          <View style={{ gap: 16 }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#172B45', marginBottom: 6 }}>اسم المستخدم</Text>
              <View style={styles.inputRow}>
                <User size={16} color="#748399" style={{ position: 'absolute', right: 14, top: 14, zIndex: 1 }} />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="أدخل اسم المستخدم"
                  placeholderTextColor="#94A3B8"
                  style={[styles.input, { paddingRight: 40 }]}
                  textAlign="right"
                />
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#172B45', marginBottom: 6 }}>كلمة المرور</Text>
              <View style={styles.inputRow}>
                <Lock size={16} color="#748399" style={{ position: 'absolute', right: 14, top: 14, zIndex: 1 }} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="أدخل كلمة المرور"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  style={[styles.input, { paddingRight: 40, paddingLeft: 44 }]}
                  textAlign="right"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((v) => !v)}
                  style={{ position: 'absolute', left: 12, top: 12, padding: 4, zIndex: 1 }}
                >
                  {showPassword ? <EyeOff size={16} color="#748399" /> : <Eye size={16} color="#748399" />}
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={handleSubmit} style={styles.loginBtn} activeOpacity={0.85}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#ffffff' }}>تسجيل الدخول</Text>
              <ArrowLeft size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ marginTop: 20, gap: 20 }}>
          <View>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#123B70', lineHeight: 30 }}>
              إدارة مالية عائلية منظمة وشفافة
            </Text>
            <Text style={{ marginTop: 10, fontSize: 13, color: '#748399', lineHeight: 22 }}>
              منصة إدارية متكاملة لمتابعة اشتراكات الأعضاء السنوية والشهرية، تنظيم المجموعات، إدارة القطات ومعونة الزواج، وإصدار التقارير المالية الدقيقة.
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 14 }}>
            <View style={styles.statBox}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: '#EAF3FC', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Users size={16} color="#2878C8" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#123B70', fontVariant: ['tabular-nums'] }}>{membersCount}</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#748399', marginTop: 4 }}>عضو مسجل بالصندوق</Text>
            </View>
            <View style={styles.statBox}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(18,59,112,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Layers size={16} color="#123B70" />
              </View>
              <Text style={{ fontSize: 20, fontWeight: '700', color: '#123B70', fontVariant: ['tabular-nums'] }}>{groupsCount}</Text>
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#748399', marginTop: 4 }}>مجموعات عائلية منظمة</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: 1, borderTopColor: 'rgba(226,232,240,0.9)', paddingTop: 16 }}>
            <ShieldCheck size={16} color="#2878C8" />
            <Text style={{ fontSize: 12, color: '#748399' }}>نظام إداري خاص بصندوق الإشراف – ذوي محسن</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={{ fontSize: 12, color: '#748399', textAlign: 'center' }}>جميع الحقوق محفوظة لصندوق الإشراف – ذوي محسن © 2026</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.9)',
    padding: 24,
    shadowColor: 'rgba(18,59,112,0.06)',
    shadowOpacity: 1,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(220,85,85,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220,85,85,0.25)',
    marginBottom: 16,
  },
  inputRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#172B45',
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#2878C8',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.85)',
    padding: 16,
    shadowColor: 'rgba(18,59,112,0.04)',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(226,232,240,0.8)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
});
