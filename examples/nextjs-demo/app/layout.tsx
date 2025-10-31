import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { getQueryClient, prefetchQuery, getDehydratedState, fetchUser } from '../lib/utils';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MFestack Query - Next.js SSR Demo",
  description: "Server-side rendering example with MFestack Query",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Prefetch some data on the server
  const queryClient = getQueryClient()
  
  // Prefetch a default user for the demo
  await prefetchQuery(queryClient, ['user', '1'], () => fetchUser('1'))

  // Dehydrate the query client state
  const dehydratedState = getDehydratedState(queryClient)

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__MFESTACK_STATE__ = ${JSON.stringify(dehydratedState)}`,
          }}
        />
        <Providers dehydratedState={dehydratedState}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
