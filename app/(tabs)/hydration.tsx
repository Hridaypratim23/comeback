import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
  Modal, TextInput, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
const haptic = (fn: () => void) => { if (Platform.OS !== 'web') fn(); };
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useStore, totalWater } from '../../store';

const QUICK_AMOUNTS = [
  { ml: 250, label: '250 ML', icon: 'water-outline' as const },
  { ml: 500, label: '500 ML', icon: 'water-outline' as const },
  { ml: 750, label: '750 ML', icon: 'water' as const },
];

export default function HydrationScreen() {
  const store = useStore();
  const water = totalWater(store);
  const target = store.profile.targetWaterMl;
  const progress = Math.min(water / target, 1);
  const [customModal, setCustomModal] = useState(false);
  const [customVal, setCustomVal] = useState('');

  const handleAdd = (ml: number) => {
    store.addWater(ml);
    haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    if (water + ml >= target) {
      haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
    }
  };

  const handleCustom = () => {
    const ml = parseInt(customVal) || 0;
    if (ml > 0 && ml <= 2000) {
      handleAdd(ml);
      setCustomVal('');
      setCustomModal(false);
    }
  };

  const liters = (water / 1000).toFixed(2);
  const remaining = Math.max(target - water, 0);
  const pct = Math.round(progress * 100);
  const fillColor = pct >= 100 ? COLORS.greenHot : COLORS.blueHot;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>H₂O</Text>
          <View style={styles.targetPill}>
            <Text style={styles.targetText}>TARGET {target / 1000}L / DAY</Text>
          </View>
        </View>

        {/* Main Display */}
        <View style={styles.mainCard}>
          <View style={styles.amountRow}>
            <Text style={[styles.waterAmount, { color: fillColor }]}>{liters}</Text>
            <Text style={styles.waterUnit}>L</Text>
          </View>
          <Text style={styles.waterTarget}>of {target / 1000}L target</Text>

          {/* Tank gauge */}
          <View style={styles.tankWrap}>
            <View style={styles.tankBg}>
              <View style={[styles.tankFill, { width: `${pct}%` as any, backgroundColor: fillColor }]} />
              {[25, 50, 75].map((mark) => (
                <View key={mark} style={[styles.tankMark, { left: `${mark}%` as any }]} />
              ))}
            </View>
            <View style={styles.tankLabels}>
              <Text style={styles.tankLabel}>0</Text>
              <Text style={styles.tankLabel}>1L</Text>
              <Text style={styles.tankLabel}>2L</Text>
              <Text style={styles.tankLabel}>3L</Text>
            </View>
          </View>

          <View style={styles.pctRow}>
            <View style={[styles.pctBadge, { borderColor: fillColor + '55' }]}>
              <Text style={[styles.pctText, { color: fillColor }]}>{pct}%</Text>
            </View>
            {pct >= 100 ? (
              <View style={styles.achievedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.greenHot} />
                <Text style={styles.achievedText}>GOAL ACHIEVED  +30 XP</Text>
              </View>
            ) : (
              <Text style={styles.remainingText}>{(remaining / 1000).toFixed(2)}L remaining</Text>
            )}
          </View>
        </View>

        {/* Quick Add */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>QUICK ADD</Text>
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map(({ ml, label, icon }) => (
              <TouchableOpacity key={ml} style={styles.quickBtn} onPress={() => handleAdd(ml)} activeOpacity={0.7}>
                <Ionicons name={icon} size={22} color={COLORS.blueHot} />
                <Text style={styles.quickLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.quickBtn, styles.customBtn]} onPress={() => setCustomModal(true)} activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={22} color={COLORS.redHot} />
              <Text style={[styles.quickLabel, { color: COLORS.redHot }]}>CUSTOM</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Log */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TODAY'S LOG</Text>
          {store.today.waterEntries.length === 0 ? (
            <Text style={styles.emptyLog}>No water logged yet. Start drinking.</Text>
          ) : (
            [...store.today.waterEntries].reverse().map((entry) => (
              <View key={entry.id} style={styles.logItem}>
                <Ionicons name="water" size={14} color={COLORS.blueHot} />
                <Text style={styles.logTime}>{entry.time}</Text>
                <Text style={styles.logAmount}>{entry.ml} ml</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => store.removeWaterEntry(entry.id)}>
                  <Ionicons name="trash-outline" size={13} color={COLORS.dimmed} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Tips */}
        <View style={[styles.card, { borderColor: COLORS.blueHot + '33' }]}>
          <Text style={styles.cardTitle}>HYDRATION INTEL</Text>
          {[
            'Down 500ml the moment you wake up.',
            'Sip 200–300ml every hour at work.',
            'Weigh lighter = drink more.',
            'Dark urine = dehydrated. Fix it now.',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* Custom Modal */}
      <Modal visible={customModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>LOG WATER</Text>
            <Text style={styles.modalSub}>ENTER AMOUNT IN ML (MAX 2000)</Text>
            <TextInput
              style={styles.modalInput}
              value={customVal}
              onChangeText={setCustomVal}
              keyboardType="number-pad"
              placeholder="350"
              placeholderTextColor={COLORS.dimmed}
              autoFocus
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleCustom}>
              <Text style={styles.modalBtnText}>ADD</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setCustomModal(false)}>
              <Text style={styles.modalCancel}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1, paddingHorizontal: SPACING.md },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  screenTitle: { fontSize: 30, fontWeight: '900', color: COLORS.white, letterSpacing: 6 },
  targetPill: { backgroundColor: COLORS.card, borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border },
  targetText: { fontSize: 9, fontWeight: '800', color: COLORS.grey, letterSpacing: 1.5 },

  mainCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.lg,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  amountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  waterAmount: { fontSize: 64, fontWeight: '900', letterSpacing: -2, lineHeight: 68 },
  waterUnit: { fontSize: 28, fontWeight: '900', color: COLORS.grey, marginBottom: 8 },
  waterTarget: { fontSize: 12, color: COLORS.grey, fontWeight: '600', marginBottom: SPACING.lg, letterSpacing: 0.5 },

  tankWrap: { marginBottom: SPACING.md },
  tankBg: {
    height: 16, backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.sm,
    overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, position: 'relative',
  },
  tankFill: { position: 'absolute', top: 0, left: 0, bottom: 0, borderRadius: RADIUS.sm },
  tankMark: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: COLORS.border },
  tankLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  tankLabel: { fontSize: 9, color: COLORS.grey, fontWeight: '700' },

  pctRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  pctBadge: { backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1 },
  pctText: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  achievedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.greenHot + '1A', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.greenHot + '44' },
  achievedText: { fontSize: 11, color: COLORS.greenHot, fontWeight: '800', letterSpacing: 1 },
  remainingText: { fontSize: 12, color: COLORS.grey, fontWeight: '600' },

  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 10, fontWeight: '800', color: COLORS.grey, letterSpacing: 2.5, marginBottom: SPACING.md },

  quickRow: { flexDirection: 'row', gap: SPACING.sm },
  quickBtn: {
    flex: 1, backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.md, paddingVertical: 14,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border,
  },
  customBtn: { borderColor: COLORS.redHot + '44', backgroundColor: COLORS.redHot + '0D' },
  quickLabel: { fontSize: 10, fontWeight: '800', color: COLORS.white, letterSpacing: 1 },

  emptyLog: { fontSize: 12, color: COLORS.dimmed, fontStyle: 'italic', paddingVertical: 6 },
  logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border + '55' },
  logTime: { fontSize: 12, color: COLORS.grey, fontWeight: '600', width: 60 },
  logAmount: { fontSize: 14, fontWeight: '800', color: COLORS.white },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  tipDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: COLORS.blueHot, marginTop: 7 },
  tipText: { flex: 1, fontSize: 13, color: COLORS.grey, lineHeight: 20, fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  modalCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.xl,
    width: '100%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderHigh,
  },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white, letterSpacing: 2, marginBottom: 6 },
  modalSub: { fontSize: 10, color: COLORS.grey, marginBottom: SPACING.lg, letterSpacing: 2, fontWeight: '700', textAlign: 'center' },
  modalInput: {
    width: '100%', backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.md, padding: SPACING.md,
    color: COLORS.white, fontSize: 32, fontWeight: '900', textAlign: 'center',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg,
  },
  modalBtn: {
    backgroundColor: COLORS.blueHot, borderRadius: RADIUS.full, paddingHorizontal: SPACING.xl,
    paddingVertical: 16, width: '100%', alignItems: 'center', marginBottom: SPACING.md,
  },
  modalBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  modalCancel: { color: COLORS.grey, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
});
