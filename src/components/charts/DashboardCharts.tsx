import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
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

  return (
    <View style={styles.card}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#172B45' }}>مخطط الإيرادات والمصروفات</Text>
          <Text style={{ fontSize: 12, color: '#748399', marginTop: 2, fontVariant: ['tabular-nums'] }}>
            حركة التحصيل والمصروفات خلال أشهر سنة {year}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#2878C8' }} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#172B45' }}>الإيرادات</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#E99A35' }} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#172B45' }}>المصروفات</Text>
          </View>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingBottom: 8 }}>
        <View style={{ minWidth: 540, height: 240, flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingRight: 56, paddingLeft: 8, paddingTop: 24 }}>
          {data.map((item, idx) => {
            const revH = Math.round((item.revenue / maxVal) * 100);
            const expH = Math.round((item.expenses / maxVal) * 100);
            const isHovered = hoveredIdx === idx;

            return (
              <Pressable
                key={item.month}
                onPressIn={() => setHoveredIdx(idx)}
                onPointerLeave={() => setHoveredIdx(null)}
                style={{ flex: 1, height: '100%', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center' }}
              >
                {isHovered && (
                  <View style={styles.tooltip}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#ffffff', marginBottom: 2 }}>{item.month} {year}</Text>
                    <Text style={{ fontSize: 11, color: '#93C5FD', fontVariant: ['tabular-nums'] }}>الإيرادات: {formatCurrency(item.revenue)}</Text>
                    <Text style={{ fontSize: 11, color: '#FCD34D', fontVariant: ['tabular-nums'] }}>المصروفات: {formatCurrency(item.expenses)}</Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4, height: '85%' }}>
                  <View style={{ width: 13, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: '#2878C8', height: `${item.revenue > 0 ? Math.max(revH, 4) : 0}%` }} />
                  <View style={{ width: 11, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: '#E99A35', height: `${item.expenses > 0 ? Math.max(expH, 4) : 0}%` }} />
                </View>
                <Text style={{ marginTop: 8, fontSize: 11, fontWeight: '500', color: isHovered ? '#172B45' : '#748399' }}>{item.month}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
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

  return (
    <View style={styles.card}>
      <View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#172B45' }}>حالة الاشتراكات</Text>
        <Text style={{ fontSize: 12, color: '#748399', marginTop: 2, fontVariant: ['tabular-nums'] }}>
          توزيع التزام الأعضاء للسنة المالية {year}
        </Text>
      </View>

      <View style={{ marginVertical: 20, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 176, height: 176, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={176} height={176} viewBox="0 0 150 150" style={{ transform: [{ rotate: '-90deg' }] }}>
            <Circle cx={75} cy={75} r={radius} fill="none" stroke="#F1F5F9" strokeWidth={18} />
            {sum > 0 && (
              <>
                <Circle cx={75} cy={75} r={radius} fill="none" stroke="#16A36A" strokeWidth={18} strokeDasharray={`${paidDash} ${circumference}`} strokeDashoffset={0} />
                <Circle cx={75} cy={75} r={radius} fill="none" stroke="#E99A35" strokeWidth={18} strokeDasharray={`${partialDash} ${circumference}`} strokeDashoffset={-paidDash} />
                <Circle cx={75} cy={75} r={radius} fill="none" stroke="#DC5555" strokeWidth={18} strokeDasharray={`${circumference - paidDash - partialDash} ${circumference}`} strokeDashoffset={-(paidDash + partialDash)} />
              </>
            )}
          </Svg>
          <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: '#172B45', fontVariant: ['tabular-nums'] }}>{paidPct}%</Text>
            <Text style={{ fontSize: 11, fontWeight: '500', color: '#748399' }}>نسبة الالتزام</Text>
          </View>
        </View>
      </View>

      <View style={{ gap: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
        <View style={styles.legendRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#16A36A' }} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#172B45' }}>مسددون بالكامل</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#172B45', fontVariant: ['tabular-nums'] }}>{paidCount} عضو ({paidPct}%)</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#E99A35' }} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#172B45' }}>سداد جزئي</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#172B45', fontVariant: ['tabular-nums'] }}>{partialCount} عضو ({partialPct}%)</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: '#DC5555' }} />
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#172B45' }}>متأخرون عن السداد</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#DC5555', fontVariant: ['tabular-nums'] }}>{overdueCount} عضو ({overduePct}%)</Text>
        </View>
      </View>
    </View>
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
    <View style={styles.card}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#172B45' }}>توزيع المصروفات حسب التصنيف</Text>
        <Text style={{ fontSize: 12, color: '#748399', marginTop: 2 }}>نسبة كل بند من إجمالي مصروفات الصندوق</Text>
      </View>

      {items.length === 0 || sum === 0 ? (
        <Text style={{ paddingVertical: 40, textAlign: 'center', fontSize: 12, color: '#748399' }}>لا توجد مصروفات مطابقة للتصفية الحالية.</Text>
      ) : (
        <View style={{ gap: 16 }}>
          {items.map((item, idx) => {
            const pct = Math.round((item.amount / sum) * 100);
            return (
              <View key={item.category}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: '#172B45' }}>{item.category}</Text>
                  <Text style={{ fontSize: 12, color: '#748399', fontVariant: ['tabular-nums'] }}>
                    <Text style={{ fontWeight: '700', color: '#172B45' }}>{formatCurrency(item.amount)}</Text> ({pct}%)
                  </Text>
                </View>
                <View style={{ height: 10, borderRadius: 9999, backgroundColor: '#F1F5F9', overflow: 'hidden' }}>
                  <View style={{ height: '100%', borderRadius: 9999, width: `${Math.max(pct, 3)}%`, backgroundColor: colors[idx % colors.length] }} />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
  tooltip: {
    position: 'absolute',
    top: -8,
    zIndex: 20,
    backgroundColor: '#123B70',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
