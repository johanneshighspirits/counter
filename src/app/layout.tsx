import type { Metadata } from 'next';
import { Anton, Bebas_Neue, Geist, Geist_Mono, Oswald } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const oswald = Oswald({ variable: '--font-oswald', subsets: ['latin'] });
const anton = Anton({
  variable: '--font-anton',
  subsets: ['latin'],
  weight: ['400'],
});
const bebasNeue = Bebas_Neue({
  variable: '--font-bebas',
  weight: ['400'],
  subsets: ['latin-ext'],
});

export const metadata: Metadata = {
  title: 'Event Visitor Counter',
  description: 'Real-time visitor counter with Supabase',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={[
          geistSans.variable,
          geistMono.variable,
          oswald.variable,
          anton.variable,
          bebasNeue.variable,
          'antialiased',
        ].join(' ')}>
        {children}
      </body>
    </html>
  );
}
