/**
 * Gesture Usage Service
 * Tracks daily gesture triggers, usage stats, and tutorial completion state.
 */

const GESTURE_USAGE_STORAGE_KEY = 'mayra_gesture_daily_usage';
const GESTURE_TUTORIAL_STORAGE_KEY = 'mayra_gesture_tutorial_completed';

interface DailyUsageRecord {
  date: string; // YYYY-MM-DD
  count: number;
  lastGesture?: string;
  lastTimestamp?: number;
}

function getTodayDateString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export class GestureUsageService {
  /**
   * Retrieves the count of gestures triggered today.
   */
  public static getTodayGestureCount(): number {
    if (typeof window === 'undefined') return 0;
    try {
      const saved = localStorage.getItem(GESTURE_USAGE_STORAGE_KEY);
      if (saved) {
        const record: DailyUsageRecord = JSON.parse(saved);
        if (record.date === getTodayDateString()) {
          return record.count || 0;
        }
      }
    } catch (e) {
      console.warn('[GestureUsageService] Error reading daily count:', e);
    }
    return 0;
  }

  /**
   * Increments the today's gesture trigger count and returns the updated number.
   */
  public static incrementTodayGestureCount(gestureName?: string): number {
    if (typeof window === 'undefined') return 1;
    try {
      const today = getTodayDateString();
      let currentCount = 0;
      const saved = localStorage.getItem(GESTURE_USAGE_STORAGE_KEY);
      if (saved) {
        const record: DailyUsageRecord = JSON.parse(saved);
        if (record.date === today) {
          currentCount = record.count || 0;
        }
      }

      const newCount = currentCount + 1;
      const updatedRecord: DailyUsageRecord = {
        date: today,
        count: newCount,
        lastGesture: gestureName || 'Gesture Action',
        lastTimestamp: Date.now()
      };
      localStorage.setItem(GESTURE_USAGE_STORAGE_KEY, JSON.stringify(updatedRecord));
      return newCount;
    } catch (e) {
      console.warn('[GestureUsageService] Error incrementing count:', e);
      return 1;
    }
  }

  /**
   * Checks if user has already completed the first-time gesture onboarding tutorial.
   */
  public static hasCompletedGestureTutorial(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(GESTURE_TUTORIAL_STORAGE_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  /**
   * Marks the gesture tutorial as completed.
   */
  public static setGestureTutorialCompleted(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(GESTURE_TUTORIAL_STORAGE_KEY, 'true');
    } catch (e) {}
  }

  /**
   * Resets the tutorial status to allow replaying on demand.
   */
  public static resetGestureTutorial(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(GESTURE_TUTORIAL_STORAGE_KEY);
    } catch (e) {}
  }
}
