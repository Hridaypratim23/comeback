import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import NavBar from '../../components/NavBar';
import { COLORS } from '../../constants/theme';

export default function TabLayout() {
  return (
    <View style={{
      flex: 1,
      backgroundColor: COLORS.bg,
      ...(Platform.OS === 'web' ? { height: '100vh' as any, overflow: 'hidden' as any } : {}),
    }}>
      <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="workout" />
        <Tabs.Screen name="nutrition" />
        <Tabs.Screen name="hydration" />
        <Tabs.Screen name="progress" />
      </Tabs>
      <NavBar />
    </View>
  );
}
