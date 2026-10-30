import { useState, useEffect, useCallback, useRef } from 'react';

// Global in-memory registry of locked reports to survive component re-renders or modal toggles
interface LockEntry {
  lockedUntil: number; // epoch ms
  lockedAt: number;    // epoch ms
  durationMs: number;  // total duration in ms
  nonce: number;       // increments on each manual or initial lock
}

const reportLockRegistry = new Map<string, LockEntry>();

export interface ReportLockState {
  isLocked: boolean;
  remainingSeconds: number;
  progressPct: number; // 0% (just locked) to 100% (lock expired)
  formattedTimeRemaining: string; // e.g. "02:45"
  lockedUntil: number | null;
  refreshNonce: number;
  triggerManualRefresh: () => void;
  lockReport: (customDurationSec?: number) => void;
}

/**
 * useReportLock
 * Manages a state-based stability lock for AI report components for a specified duration (default: 180 seconds).
 * Prevents background tickers and intervals from reloading/resetting the report while active.
 * Automatically unlocks and resumes auto-refresh after the duration expires.
 * Allows instant manual refresh which resets the lock and triggers a fresh analysis.
 *
 * @param reportKey Identifier for the report component (e.g. 'direct_chart', '360_stock', 'advisor_council')
 * @param symbol Identifier for the specific asset/stock (e.g. 'TMGH', 'GLOBAL')
 * @param lockDurationSeconds Duration in seconds to freeze auto-refreshes (default: 180 = 3 minutes)
 */
export function useReportLock(
  reportKey: string,
  symbol: string = 'global',
  lockDurationSeconds: number = 180
): ReportLockState {
  const registryKey = `${reportKey}_${symbol.toUpperCase()}`;
  const durationMs = lockDurationSeconds * 1000;

  // Initialize or retrieve current entry from registry
  const getInitialEntry = (): LockEntry => {
    const existing = reportLockRegistry.get(registryKey);
    const now = Date.now();
    if (existing && existing.lockedUntil > now) {
      return existing;
    }
    // Create new active lock starting now
    const newEntry: LockEntry = {
      lockedAt: now,
      lockedUntil: now + durationMs,
      durationMs,
      nonce: 1,
    };
    reportLockRegistry.set(registryKey, newEntry);
    return newEntry;
  };

  const [entry, setEntry] = useState<LockEntry>(getInitialEntry);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state if registry key changes
  useEffect(() => {
    const current = getInitialEntry();
    setEntry(current);
    setCurrentTime(Date.now());
  }, [registryKey, durationMs]);

  // 1-second continuous countdown interval
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const now = currentTime;
  const isLocked = entry.lockedUntil > now;
  const rawRemainingSec = Math.max(0, Math.ceil((entry.lockedUntil - now) / 1000));
  const remainingSeconds = isLocked ? rawRemainingSec : 0;

  // Progress percentage (0% at start of lock -> 100% when expired)
  const elapsedMs = Math.max(0, now - entry.lockedAt);
  const progressPct = Math.min(100, Math.max(0, Number(((elapsedMs / entry.durationMs) * 100).toFixed(1))));

  // Formatted MM:SS
  const mins = Math.floor(remainingSeconds / 60);
  const secs = remainingSeconds % 60;
  const formattedTimeRemaining = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Manual refresh bypass
  const triggerManualRefresh = useCallback(() => {
    const freshNow = Date.now();
    const updated: LockEntry = {
      lockedAt: freshNow,
      lockedUntil: freshNow + durationMs,
      durationMs,
      nonce: (entry.nonce || 0) + 1,
    };
    reportLockRegistry.set(registryKey, updated);
    setEntry(updated);
    setCurrentTime(freshNow);
  }, [registryKey, durationMs, entry.nonce]);

  // Explicitly lock report
  const lockReport = useCallback(
    (customDurationSec?: number) => {
      const durMs = (customDurationSec || lockDurationSeconds) * 1000;
      const freshNow = Date.now();
      const updated: LockEntry = {
        lockedAt: freshNow,
        lockedUntil: freshNow + durMs,
        durationMs: durMs,
        nonce: (entry.nonce || 0) + 1,
      };
      reportLockRegistry.set(registryKey, updated);
      setEntry(updated);
      setCurrentTime(freshNow);
    },
    [registryKey, lockDurationSeconds, entry.nonce]
  );

  return {
    isLocked,
    remainingSeconds,
    progressPct,
    formattedTimeRemaining,
    lockedUntil: isLocked ? entry.lockedUntil : null,
    refreshNonce: entry.nonce,
    triggerManualRefresh,
    lockReport,
  };
}
