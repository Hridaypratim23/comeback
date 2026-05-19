import { Pedometer } from 'expo-sensors';

export const isHealthKitAvailable = () => false; // HealthKit not used

export const initHealthKit = () => Promise.resolve(false); // no-op

export const getTodaySteps = async (): Promise<number> => {
  const available = await Pedometer.isAvailableAsync();
  if (!available) return 0;

  const start = new Date();
  start.setHours(0, 0, 0, 0);

  try {
    const result = await Pedometer.getStepCountAsync(start, new Date());
    return result.steps ?? 0;
  } catch {
    return 0;
  }
};

export const watchSteps = (onChange: (steps: number) => void) => {
  return Pedometer.watchStepCount((result) => {
    // watchStepCount gives steps since watching started — re-fetch total
    getTodaySteps().then(onChange);
  });
};
