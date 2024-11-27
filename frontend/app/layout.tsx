import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Footer from "@/components/footer"
import Header from "@/components/header"
import { GoogleTagManager } from '@next/third-parties/google'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Akash Chat API",
  description:
    "Welcome to the Akash Chat API, an open and permissionless Llama3.1 API powered by the Akash Supercloud that anyone can access at completely zero-cost.",
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
      <GoogleTagManager gtmId={"G-LFRGN2J2RV"}/>
    </html>
  )
}
