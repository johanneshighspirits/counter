'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function RefreshOnFocus() {
  const router = useRouter();

  useEffect(() => {
    const onVisibilityChange = () => {
      if (globalThis.document.visibilityState === 'visible') {
        console.log('refreshing');
        router.refresh();
      }
    };

    const onPageShow = () => {
      // Fires on iOS when restoring from background / bfcache
      router.refresh();
    };

    globalThis.document.addEventListener(
      'visibilitychange',
      onVisibilityChange,
    );
    globalThis.window.addEventListener('pageshow', onPageShow);
    return () => {
      globalThis.document.removeEventListener(
        'visibilitychange',
        onVisibilityChange,
      );
      globalThis.window.removeEventListener('pageshow', onPageShow);
    };
  }, [router]);

  return null;
}
