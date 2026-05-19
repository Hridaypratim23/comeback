import 'react-native-url-polyfill/auto';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useStore } from '../store';
import { requestNotificationPermissions, scheduleAllNotifications } from '../utils/notifications';
// import { useHealthKit } from '../hooks/useHealthKit'; // manual steps mode

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

function AppInit() {
  const { saveAndResetDay, notificationsScheduled, setNotificationsScheduled, loadFromCloud } = useStore();

  // Steps are logged manually via the Home screen steps card

  useEffect(() => {
    saveAndResetDay();
    // Load cloud data in background — local state renders immediately
    loadFromCloud();
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (!notificationsScheduled) {
      requestNotificationPermissions().then((granted) => {
        if (granted) {
          scheduleAllNotifications().then(() => setNotificationsScheduled(true));
        }
      });
    }
  }, [notificationsScheduled]);

  return null;
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" backgroundColor="#0D0D0D" />
      <AppInit />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </>
  );
}
