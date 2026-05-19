import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { WEEKLY_SCHEDULE } from '../constants/workouts';

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('comeback', {
      name: 'COMEBACK',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF3B30',
      sound: 'default',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

const WORKOUT_MESSAGES = [
  "TODAY IS {DAY}. THE GYM IS WAITING.",
  "NO SNOOZE. NO EXCUSES. {DAY} SESSION.",
  "COMMIT TO THE COMEBACK. {DAY} TODAY.",
];

const DAILY_NOTIFICATIONS = [
  {
    id: 'rise-530',
    hour: 5, minute: 30,
    title: '⚡ RISE AND GRIND',
    body: 'It\'s 5:30. You said 6am. Get up and get ready.',
  },
  {
    id: 'gym-time-600',
    hour: 6, minute: 0,
    title: '🏋️ GYM TIME',
    body: 'It\'s 6AM. Your body is waiting for the punishment you\'re about to give it.',
  },
  {
    id: 'breakfast-830',
    hour: 8, minute: 30,
    title: '🍳 FUEL UP',
    body: 'Breakfast time. Load protein. Your muscles need it after that session.',
  },
  {
    id: 'water-1000',
    hour: 10, minute: 0,
    title: '💧 DRINK WATER',
    body: 'You\'re probably dehydrated right now. Hit that water bottle.',
  },
  {
    id: 'water-1200',
    hour: 12, minute: 0,
    title: '💧 MIDDAY HYDRATION',
    body: 'Halfway through the day. Are you at 1.5L yet? Let\'s go.',
  },
  {
    id: 'lunch-1300',
    hour: 13, minute: 0,
    title: '🥗 LUNCH TIME',
    body: 'Don\'t skip lunch. High protein. Stay on your macros.',
  },
  {
    id: 'water-1500',
    hour: 15, minute: 0,
    title: '💧 AFTERNOON WATER',
    body: '3pm. You should be at 2L of water. How are those steps looking?',
  },
  {
    id: 'snack-1630',
    hour: 16, minute: 30,
    title: '🍗 PROTEIN SNACK',
    body: 'Pre-dinner protein. Keep the muscle-building going all day.',
  },
  {
    id: 'steps-1800',
    hour: 18, minute: 0,
    title: '👣 STEPS CHECK',
    body: 'Where are your steps? If you\'re under 7k, go for a walk. Don\'t miss 10k.',
  },
  {
    id: 'dinner-1900',
    hour: 19, minute: 0,
    title: '🍽️ DINNER',
    body: 'Dinner time. Keep it clean. You\'ve been good all day — don\'t wreck it.',
  },
  {
    id: 'steps-final-2000',
    hour: 20, minute: 0,
    title: '👣 FINAL STEPS PUSH',
    body: 'Last call for 10k steps. If you\'re short — walk. It\'s only 20 minutes.',
  },
  {
    id: 'sleep-prep-2030',
    hour: 20, minute: 30,
    title: '🌙 PREP FOR TOMORROW',
    body: 'Tomorrow\'s session starts tonight. Lay out your gym kit. Set the alarm.',
  },
  {
    id: 'lights-out-2050',
    hour: 20, minute: 50,
    title: '😴 LIGHTS OUT SOON',
    body: 'The comeback continues at 6am. Sleep is training. Rest well.',
  },
];

export async function scheduleAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const notif of DAILY_NOTIFICATIONS) {
    await Notifications.scheduleNotificationAsync({
      identifier: notif.id,
      content: {
        title: notif.title,
        body: notif.body,
        sound: 'default',
        data: { type: 'daily' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: notif.hour,
        minute: notif.minute,
      } as Notifications.DailyTriggerInput,
    });
  }

  // Day-specific workout notifications
  const dayMap: Record<string, number> = {
    Sunday: 1, Monday: 2, Tuesday: 3, Wednesday: 4,
    Thursday: 5, Friday: 6, Saturday: 7,
  };

  for (const workout of WEEKLY_SCHEDULE) {
    if (workout.day === 'REST') continue;
    const weekday = dayMap[workout.weekday];
    if (!weekday) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `workout-day-${workout.day}`,
      content: {
        title: `⚡ ${workout.label}`,
        body: `Today: ${workout.muscles}. Get in there.`,
        sound: 'default',
        data: { type: 'workout', day: workout.day },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: 5,
        minute: 45,
      } as Notifications.WeeklyTriggerInput,
    });
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
