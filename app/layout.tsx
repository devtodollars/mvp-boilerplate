import { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import { getURL } from '@/utils/helpers';
import '@/styles/main.css';
import { PHProvider } from './providers';
import { ThemeProvider } from '@/components/landing/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import PostHogPageViewWrapper from '@/components/misc/PostHogPageViewWrapper';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { ScrollToTop } from '@/components/landing/ScrollToTop';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { createClient } from '@/utils/supabase/server';
import ChatTabs from '@/components/ChatTabs';

const meta = {
  title: "GoLet.ie | Ireland's First Scam-Free Rental Platform",
  description: "Ireland's first rental platform with Scam and Deposit protection, in-app messaging, tenant profiles, ID verification, and a fair queueing system.",
  cardImage: '/og_cozy_studio.png',
  robots: 'follow, index',
  favicon: '/golet-app.png',
  url: getURL()
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: meta.title,
    description: meta.description,
    referrer: 'origin-when-cross-origin',
    keywords: ['Vercel', 'Supabase', 'Next.js', 'Stripe', 'Subscription'],
    authors: [{ name: 'Vercel', url: 'https://vercel.com/' }],
    creator: 'Vercel',
    publisher: 'Vercel',
    robots: meta.robots,
    icons: [
      { rel: 'icon', url: '/golet-app.png', type: 'image/png' },
      { rel: 'apple-touch-icon', url: '/golet-app.png' },
    ],
    metadataBase: new URL(meta.url),
    openGraph: {
      url: meta.url,
      title: meta.title,
      description: meta.description,
      images: [meta.cardImage],
      type: 'website',
      siteName: meta.title
    },
    twitter: {
      card: 'summary_large_image',
      site: '@Vercel',
      creator: '@Vercel',
      title: meta.title,
      description: meta.description,
      images: [meta.cardImage]
    }
  };
}

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <ThemeProvider>
        <PHProvider>
          <body>
            <AuthProvider>
              <PostHogPageViewWrapper />
              <Navbar />
              <main
                id="skip"
                className="min-h-[calc(100dvh-4rem)] md:min-h[calc(100dvh-5rem)]"
              >
                {children}
              </main>
              <Footer />
              <ScrollToTop />
              <ChatTabs />
              <Toaster />
            </AuthProvider>
          </body>
        </PHProvider>
      </ThemeProvider>
    </html>
  );
}
