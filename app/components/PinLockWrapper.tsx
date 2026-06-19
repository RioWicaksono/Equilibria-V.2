'use client';

import { useState, useEffect } from 'react';
import PinLockOverlay from './PinLockOverlay';
import { usePinLock } from '../hooks/usePinLock';

export default function PinLockWrapper() {
  const { isPinEnabled, isLocked, isLoading, updateLastActive } = usePinLock();
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Track if PIN has been verified this session
  useEffect(() => {
    if (!isLoading && !isPinEnabled) {
      setIsUnlocked(true);
    }
  }, [isLoading, isPinEnabled]);

  // Handle unlock
  const handleUnlock = () => {
    setIsUnlocked(true);
    updateLastActive();
  };

  // Update last active on visibility change (app background/foreground)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isUnlocked) {
        updateLastActive();
      }
    };

    const handleBeforeUnload = () => {
      if (isUnlocked) {
        updateLastActive();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isUnlocked, updateLastActive]);

  // Show loading state
  if (isLoading) {
    return null;
  }

  // PIN not enabled or already unlocked
  if (!isPinEnabled || isUnlocked) {
    return null;
  }

  // Still locked
  if (isLocked) {
    return <PinLockOverlay onUnlock={handleUnlock} />;
  }

  return null;
}
