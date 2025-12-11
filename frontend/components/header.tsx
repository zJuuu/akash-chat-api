"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRightCircleIcon, BookOpen } from "lucide-react"
import { ThemeAwareLogo } from "@/components/ui/theme-aware-logo"

export default function Header() {
  return (
    <header className="top-0 left-0 right-0 bg-background border-b border-border">
      <div className="container flex items-center justify-between">
        <div className="flex items-center pr-4 py-8">
          <Link href="/">
            <ThemeAwareLogo />
          </Link>
        </div>
        <div className="flex items-center gap-4 justify-center md:mt-0">
          <Link href="/documentation">
            <Button variant="outline" className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs sm:text-sm">
              <BookOpen className="mr-2 h-4 w-4" />
              Documentation
            </Button>
          </Link>
          <Link href="https://akash.network" target="_blank">
            <Button variant="outline" className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs sm:text-sm">
              Go to akash.network
              <ArrowRightCircleIcon className="ml-2 h-4 w-4" style={{ transform: "rotate(-50deg)" }} />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
