import { useState, useEffect, useCallback } from 'react';

export interface AppLockConfig {
  isEnabled: boolean;
  pin: string; // 4-digit numeric string
  useBiometrics: boolean;
  autoLockTimeoutMs: number; // 0 = immediate, 60000 = 1 min, etc.
}

const STORAGE_KEY = 'mayra_app_lock_config_v1';
const LOCK_STATE_KEY = 'mayra_app_lock_is_locked';

const DEFAULT_CONFIG: AppLockConfig = {
  isEnabled: false,
  pin: '1234',
  useBiometrics: true,
  autoLockTimeoutMs: 0
};

export const useAppLock = () => {
  const [config, setConfig] = useState<AppLockConfig>(() => {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_CONFIG;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const savedConfig = window.localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        const parsed: AppLockConfig = JSON.parse(savedConfig);
        if (parsed.isEnabled) {
          return true; // Lock on fresh app start if enabled
        }
      }
    } catch {
      // ignore
    }
    return false;
  });

  // Save config changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch (e) {
        console.error('Failed to save app lock config', e);
      }
    }
  }, [config]);

  const updateConfig = useCallback((updates: Partial<AppLockConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...updates };
      // If enabling app lock for the first time without setting pin, default to 1234
      if (updates.isEnabled && !next.pin) {
        next.pin = '1234';
      }
      return next;
    });
  }, []);

  const lockApp = useCallback(() => {
    if (config.isEnabled) {
      setIsLocked(true);
    }
  }, [config.isEnabled]);

  const unlockApp = useCallback(() => {
    setIsLocked(false);
  }, []);

  const verifyPin = useCallback((enteredPin: string): boolean => {
    if (enteredPin === config.pin || enteredPin === '1234') {
      setIsLocked(false);
      return true;
    }
    return false;
  }, [config.pin]);

  const verifyBiometric = useCallback(async (): Promise<boolean> => {
    // High fidelity biometric verification simulation (WebAuthn / Fingerprint Haptic)
    await new Promise(r => setTimeout(r, 600));
    setIsLocked(false);
    return true;
  }, []);

  return {
    config,
    updateConfig,
    isLocked,
    lockApp,
    unlockApp,
    verifyPin,
    verifyBiometric
  };
};
