'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export const useOnAppFocus = (onAppFocus: () => void, maxStaleMs = 5_000) => {
  const lastActiveRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    lastActiveRef.current = Date.now();

    const checkStale = (e) => {
      console.log(e);
      if (e?.type === 'pageshow') {
        window.alert('pageshow!');
      }
      const now = Date.now();
      if (now - lastActiveRef.current > maxStaleMs) {
        onAppFocus();
      }
      lastActiveRef.current = now;
    };

    // Best-effort events (desktop + mobile Safari)
    globalThis.document.addEventListener('visibilitychange', checkStale);
    globalThis.window.addEventListener('pageshow', checkStale);
    globalThis.window.addEventListener('focus', checkStale);

    // Fallback: run when JS resumes execution
    intervalRef.current = setInterval(checkStale, 1000);

    return () => {
      globalThis.document.removeEventListener('visibilitychange', checkStale);
      globalThis.window.removeEventListener('pageshow', checkStale);
      globalThis.window.removeEventListener('focus', checkStale);
      clearInterval(intervalRef.current);
    };
  }, [onAppFocus, maxStaleMs]);

  return null;
};

export function RefreshOnFocus({ maxStaleMs = 10_000 }) {
  const router = useRouter();
  useOnAppFocus(() => router.refresh(), maxStaleMs);
  return null;
}
