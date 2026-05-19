import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { getTodaySteps, watchSteps } from '../utils/healthkit';
import { useStore } from '../store';

export function useHealthKit() {
  const setSteps = useStore((s) => s.setSteps);

  const sync = async () => {
    const steps = await getTodaySteps();
    if (steps > 0) setSteps(steps);
  };

  useEffect(() => {
    sync();

    // Live step updates
    const subscription = watchSteps((steps) => setSteps(steps));

    // Re-sync when app comes to foreground
    const appStateSub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') sync();
    });

    return () => {
      subscription.remove();
      appStateSub.remove();
    };
  }, []);
}
