import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
  Modal, TextInput, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
const haptic = (fn: () => void) => { if (Platform.OS !== 'web') fn(); };
import { COLORS, SPACING, RADIUS } from '../../constants/theme';
import { useStore, totalWater } from '../../store';

const QUICK_AMOUNTS = [
  { ml: 250, label: '250ml', icon: '🥛' },
  { ml: 500, label: '500ml', icon: '🍶' },
  { ml: 750, label: '750ml', icon: '🧴' },
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
  const fillColor = pct >= 100 ? COLORS.green : pct >= 66 ? COLORS.blue : pct >= 33 ? '#60A5FA' : '#93C5FD';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.screenTitle}>HYDRATION</Text>
          <Text style={styles.targetText}>Target: {target / 1000}L / day</Text>
        </View>

        {/* Main Display */}
        <View style={styles.mainCard}>
          <View style={styles.bottleWrap}>
            <WaterBottle progress={progress} color={fillColor} />
          </View>

          <Text style={[styles.waterAmount, { color: fillColor }]}>{liters}L</Text>
          <Text style={styles.waterTarget}>of {target / 1000}L target</Text>

          <View style={styles.pctBadge}>
            <Text style={[styles.pctText, { color: fillColor }]}>{pct}%</Text>
          </View>

          {pct >= 100 ? (
            <View style={styles.achievedBadge}>
              <Text style={styles.achievedText}>💧 HYDRATION GOAL HIT! +30 XP</Text>
            </View>
          ) : (
            <Text style={styles.remainingText}>{(remaining / 1000).toFixed(2)}L remaining</Text>
          )}
        </View>

        {/* Quick Add Buttons */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>QUICK ADD</Text>
          <View style={styles.quickRow}>
            {QUICK_AMOUNTS.map(({ ml, label, icon }) => (
              <TouchableOpacity key={ml} style={styles.quickBtn} onPress={() => handleAdd(ml)} activeOpacity={0.7}>
                <Text style={styles.quickIcon}>{icon}</Text>
                <Text style={styles.quickLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.quickBtn, styles.customBtn]} onPress={() => setCustomModal(true)} activeOpacity={0.7}>
              <Ionicons name="add-circle" size={24} color={COLORS.red} />
              <Text style={[styles.quickLabel, { color: COLORS.red }]}>CUSTOM</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Log */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TODAY'S LOG</Text>
          {store.today.waterEntries.length === 0 ? (
            <Text style={styles.emptyLog}>No water logged yet. Start drinking!</Text>
          ) : (
            [...store.today.waterEntries].reverse().map((entry) => (
              <View key={entry.id} style={styles.logItem}>
                <Ionicons name="water" size={16} color={COLORS.blue} />
                <Text style={styles.logTime}>{entry.time}</Text>
                <Text style={styles.logAmount}>{entry.ml}ml</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={() => store.removeWaterEntry(entry.id)}>
                  <Ionicons name="trash-outline" size={14} color={COLORS.dimmed} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Tips */}
        <View style={[styles.card, { borderColor: COLORS.blue + '44' }]}>
          <Text style={styles.cardTitle}>HYDRATION TIPS</Text>
          {[
            'Drink 500ml first thing after waking up.',
            'Sip 200–300ml every hour at work.',
            'Weigh lighter = drink more.',
            'Dark urine = you\'re dehydrated. Fix it now.',
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
            <Text style={styles.modalTitle}>ADD WATER</Text>
            <Text style={styles.modalSub}>Enter amount in ml (max 2000)</Text>
            <TextInput
              style={styles.modalInput}
              value={customVal}
              onChangeText={setCustomVal}
              keyboardType="number-pad"
              placeholder="e.g. 350"
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

function WaterBottle({ progress, color }: { progress: number; color: string }) {
  const fillHeight = Math.min(progress, 1) * 160;
  return (
    <View style={styles.bottle}>
      {/* Neck */}
      <View style={styles.bottleNeck} />
      {/* Body */}
      <View style={styles.bottleBody}>
        {/* Fill */}
        <View style={[styles.bottleFill, { height: fillHeight, backgroundColor: color + '99' }]} />
        {/* Wave lines */}
        {[0.25, 0.5, 0.75].map((mark) => (
          <View
            key={mark}
            style={[
              styles.bottleMark,
              { bottom: mark * 160 },
              fillHeight > mark * 160 ? { borderColor: 'rgba(255,255,255,0.3)' } : { borderColor: COLORS.border },
            ]}
          />
        ))}
        <Text style={styles.bottlePct}>{Math.round(progress * 100)}%</Text>
      </View>
      {/* Cap */}
      <View style={styles.bottleCap} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flex: 1, paddingHorizontal: SPACING.md },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: SPACING.lg, paddingBottom: SPACING.md },
  screenTitle: { fontSize: 26, fontWeight: '900', color: COLORS.white, letterSpacing: 4 },
  targetText: { fontSize: 12, color: COLORS.grey, fontWeight: '600' },

  mainCard: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.xl,
    alignItems: 'center', marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  bottleWrap: { marginBottom: SPACING.lg },
  waterAmount: { fontSize: 52, fontWeight: '900', letterSpacing: -1 },
  waterTarget: { fontSize: 14, color: COLORS.grey, fontWeight: '600', marginBottom: SPACING.sm },
  pctBadge: { backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 6, marginBottom: SPACING.sm },
  pctText: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  achievedBadge: { backgroundColor: COLORS.green + '22', borderRadius: RADIUS.full, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.green + '55' },
  achievedText: { fontSize: 13, color: COLORS.green, fontWeight: '700' },
  remainingText: { fontSize: 13, color: COLORS.grey, fontWeight: '600' },

  card: {
    backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 10, fontWeight: '800', color: COLORS.grey, letterSpacing: 2.5, marginBottom: SPACING.md },

  quickRow: { flexDirection: 'row', gap: SPACING.sm },
  quickBtn: {
    flex: 1, backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.md, padding: 12,
    alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border,
  },
  customBtn: { borderColor: COLORS.red + '55', backgroundColor: COLORS.red + '11' },
  quickIcon: { fontSize: 22 },
  quickLabel: { fontSize: 11, fontWeight: '700', color: COLORS.white, letterSpacing: 0.5 },

  emptyLog: { fontSize: 12, color: COLORS.dimmed, fontStyle: 'italic', paddingVertical: 6 },
  logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border + '66' },
  logTime: { fontSize: 12, color: COLORS.grey, fontWeight: '600', width: 60 },
  logAmount: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 10 },
  tipDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.blue, marginTop: 6 },
  tipText: { flex: 1, fontSize: 13, color: COLORS.grey, lineHeight: 20, fontWeight: '500' },

  bottle: { alignItems: 'center', width: 80 },
  bottleCap: { width: 36, height: 14, backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border },
  bottleNeck: { width: 30, height: 20, backgroundColor: COLORS.cardAlt, borderWidth: 1, borderColor: COLORS.border },
  bottleBody: {
    width: 80, height: 160, backgroundColor: COLORS.cardAlt,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border,
    overflow: 'hidden', justifyContent: 'flex-end', alignItems: 'center',
  },
  bottleFill: { position: 'absolute', bottom: 0, left: 0, right: 0, borderRadius: RADIUS.md },
  bottleMark: { position: 'absolute', left: 8, right: 8, borderTopWidth: 1, borderStyle: 'dashed' },
  bottlePct: { position: 'absolute', fontSize: 14, fontWeight: '800', color: COLORS.white, zIndex: 1 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  modalCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.xl, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white, letterSpacing: 2, marginBottom: 6 },
  modalSub: { fontSize: 13, color: COLORS.grey, marginBottom: SPACING.lg },
  modalInput: {
    width: '100%', backgroundColor: COLORS.cardAlt, borderRadius: RADIUS.md, padding: SPACING.md,
    color: COLORS.white, fontSize: 24, fontWeight: '800', textAlign: 'center',
    borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.lg,
  },
  modalBtn: { backgroundColor: COLORS.blue, borderRadius: RADIUS.full, paddingHorizontal: SPACING.xl, paddingVertical: 14, width: '100%', alignItems: 'center', marginBottom: SPACING.md },
  modalBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
  modalCancel: { color: COLORS.grey, fontSize: 13, fontWeight: '600' },
});
