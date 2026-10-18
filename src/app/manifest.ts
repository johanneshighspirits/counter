import type { MetadataRoute } from 'next';

// Lets "Add to home screen" on Android use the Bajen logo
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Hammarby Hockey',
    short_name: 'Bajen',
    description: 'Real-time visitor counter',
    start_url: '/',
    display: 'standalone',
    background_color: '#002600',
    theme_color: '#000000',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
