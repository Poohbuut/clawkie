import type { Metadata } from 'next';
import { Cormorant_Garamond, Fraunces, Quicksand } from 'next/font/google';
import './globals.css';

const sans = Quicksand({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-sans' });
const display = Fraunces({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-display' });
const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['500'], style: ['normal', 'italic'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Clawsette & Cookie Cart',
  description: 'Nail appointments and fresh-baked cookies.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
