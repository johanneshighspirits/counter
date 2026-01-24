import type { Viewport, Metadata } from 'next';
import { Bebas_Neue, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Head from 'next/head';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const bebasNeue = Bebas_Neue({
  variable: '--font-bebas',
  weight: ['400'],
  subsets: ['latin-ext'],
});

export const metadata: Metadata = {
  title: 'Hammarby Hockey | Team 17',
  description: 'Real-time visitor counter',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
  },
};

export const viewport: Viewport = {
  themeColor: 'black',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <link rel="apple-touch-icon" href="/bajen-bg.png" />
      </Head>
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          bebasNeue.variable,
          'antialiased',
        ].join(' ')}>
        {children}
      </body>
    </html>
  );
}
