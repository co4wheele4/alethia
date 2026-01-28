import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ApolloClientProvider } from "./providers/apollo-provider";
import { MuiThemeProvider } from "./providers/mui-theme-provider";
import { MSWProvider } from "./providers/msw-provider";
import { ReviewerQueueProvider } from "./features/reviewerQueue";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aletheia",
  description: "Aletheia full-stack application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Emotion insertion point for consistent style injection */}
        <meta name="emotion-insertion-point" content="" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{
          position: 'relative',
          minHeight: '100vh',
        }}
        suppressHydrationWarning
      >
        <MuiThemeProvider>
          <MSWProvider>
            <ApolloClientProvider>
              <ReviewerQueueProvider>{children}</ReviewerQueueProvider>
            </ApolloClientProvider>
          </MSWProvider>
        </MuiThemeProvider>
      </body>
    </html>
  );
}
