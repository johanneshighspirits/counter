'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function RefreshOnFocus({ maxStaleMs = 10_000 }) {
  const router = useRouter();
  const lastActiveRef = useRef<number>(0);

  useEffect(() => {
    lastActiveRef.current = Date.now();

    const checkStale = () => {
      const now = Date.now();
      if (now - lastActiveRef.current > maxStaleMs) {
        router.refresh();
      }
      lastActiveRef.current = now;
    };

    // Best-effort events (desktop + mobile Safari)
    globalThis.document.addEventListener('visibilitychange', checkStale);
    globalThis.window.addEventListener('pageshow', checkStale);
    globalThis.window.addEventListener('focus', checkStale);

    // Fallback: run when JS resumes execution
    const interval = setInterval(checkStale, 1000);

    return () => {
      globalThis.document.removeEventListener('visibilitychange', checkStale);
      globalThis.window.removeEventListener('pageshow', checkStale);
      globalThis.window.removeEventListener('focus', checkStale);
      clearInterval(interval);
    };
  }, [router, maxStaleMs]);

  return null;
}
