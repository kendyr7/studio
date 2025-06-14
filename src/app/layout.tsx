
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AppProviders } from './providers';

export const metadata: Metadata = {
  title: 'BuildMaster - Gaming PC Purchase Tracker',
  description: 'Track your gaming PC build expenses with BuildMaster.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // The ThemeProvider will handle setting the class on document.documentElement
  // We can set a default here or let ThemeProvider initialize it.
  // For initial load, it might be better to not set a class here to avoid flash
  // if localStorage has a different theme.
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body font-headline antialiased">
        <AppProviders>
          {children}
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
