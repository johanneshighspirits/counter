'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function RefreshOnFocus() {
  const router = useRouter();

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('refreshing');
        router.refresh();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [router]);

  return null;
}
