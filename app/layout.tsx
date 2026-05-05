import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '700'],
});

const SITE_URL = 'https://oh-messy-life.vercel.app';

export const metadata: Metadata = {
  title: 'Oh Messy Life',
  description: 'Oh Messy Life is part confessional, part ledger.',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: 'Oh Messy Life',
    description: 'Oh Messy Life is part confessional, part ledger.',
    url: SITE_URL,
    siteName: 'Oh Messy Life',
    images: [{ url: '/og-image.png', width: 1080, height: 1080, alt: 'Oh Messy Life' }],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Oh Messy Life',
    description: 'Oh Messy Life is part confessional, part ledger.',
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <Providers>
          <Nav />
          <div className="flex-grow">{children}</div>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
