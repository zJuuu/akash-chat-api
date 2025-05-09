import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Footer from "@/components/footer"
import Header from "@/components/header"
import { GoogleAnalytics } from '@next/third-parties/google'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AkashChat API",
  description:
    "Build with the AkashChat API. Access the leading open-source AI models powered by the Akash Supercloud, completely free for developers.",
  openGraph: {
    title: "AkashChat API",
    description:
      "Build with the AkashChat API. Access the leading open-source AI models powered by the Akash Supercloud, completely free for developers.",
    type: "website",
  },
}

export default function RootLayout({ children }: React.PropsWithChildren) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col justify-between w-full h-full min-h-screen">
          <Header />
          <main className="flex flex-col items-center justify-center flex-1 p-4">
            {children}
          </main>
        </div>
        <Footer />
      </body>
      <GoogleAnalytics gaId="G-LFRGN2J2RV" />
    </html>
  )
}
