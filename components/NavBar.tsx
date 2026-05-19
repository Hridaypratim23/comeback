import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

type Tab = {
  label: string;
  path: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconActive: React.ComponentProps<typeof Ionicons>['name'];
};

const TABS: Tab[] = [
  { label: 'HOME',   path: '/',          icon: 'home-outline',       iconActive: 'home'       },
  { label: 'LIFT',   path: '/workout',   icon: 'barbell-outline',    iconActive: 'barbell'    },
  { label: 'FUEL',   path: '/nutrition', icon: 'restaurant-outline', iconActive: 'restaurant' },
  { label: 'H₂O',   path: '/hydration', icon: 'water-outline',      iconActive: 'water'      },
  { label: 'GAINS',  path: '/progress',  icon: 'trophy-outline',     iconActive: 'trophy'     },
];

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/' || pathname === '/index';
    return pathname.startsWith(path);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {TABS.map((tab) => {
          const active = isActive(tab.path);
          return (
            <TouchableOpacity
              key={tab.path}
              style={styles.tab}
              onPress={() => router.push(tab.path as any)}
              activeOpacity={0.6}
            >
              <View style={[styles.indicator, active && styles.indicatorActive]} />
              <Ionicons
                name={active ? tab.iconActive : tab.icon}
                size={22}
                color={active ? COLORS.redHot : COLORS.dimmed}
              />
              <Text style={[styles.label, active && styles.labelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {Platform.OS === 'ios' && <View style={styles.iosBottom} />}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  bar: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 0 : 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingBottom: 4,
  },
  indicator: {
    position: 'absolute',
    top: -10,
    width: 28,
    height: 2,
    backgroundColor: 'transparent',
    borderRadius: 1,
  },
  indicatorActive: {
    backgroundColor: COLORS.redHot,
  },
  label: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.dimmed,
    letterSpacing: 1.5,
  },
  labelActive: {
    color: COLORS.redHot,
  },
  iosBottom: {
    height: 28,
  },
});
