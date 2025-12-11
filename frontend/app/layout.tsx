import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Footer from "@/components/footer"
import Header from "@/components/header"
import DiscontinuationBanner from "@/components/discontinuation-banner"
import { GoogleAnalytics } from '@next/third-parties/google'
import { ErrorBoundary } from "@/components/providers/ErrorBoundary"
import { ThemeProvider } from "@/components/providers/ThemeProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "AkashChat API",
    template: "%s | AkashChat API"
  },
  description:
    "Build with the AkashChat API. Access the leading open-source AI models powered by the Akash Supercloud, completely free for developers.",
  keywords: [
    "AkashChat",
    "API",
    "LLaMA",
    "DeepSeek", 
    "Qwen",
    "AI models",
    "Akash Network",
    "free AI API",
    "open source",
    "machine learning",
    "chatbot API",
    "language models"
  ],
  authors: [{ name: "Akash Network" }],
  creator: "Akash Network",
  publisher: "Akash Network",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "AkashChat API",
    description:
      "Build with the AkashChat API. Access the leading open-source AI models powered by the Akash Supercloud, completely free for developers.",
    type: "website",
    locale: "en_US",
    siteName: "AkashChat API",
  },
  twitter: {
    card: "summary_large_image",
    title: "AkashChat API",
    description:
      "Access leading open-source AI models powered by the Akash Supercloud, completely free for developers.",
    creator: "@akashnet",
  },
  alternates: {
    canonical: "/",
  },
}

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorBoundary>
            <div className="flex flex-col justify-between w-full h-full min-h-screen">
              <Header />
              <DiscontinuationBanner />
              <main className="flex flex-col items-center justify-center flex-1 p-4">
                {children}
              </main>
            </div>
            <Footer />
          </ErrorBoundary>
        </ThemeProvider>
      </body>
      <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />
    </html>
  )
}
