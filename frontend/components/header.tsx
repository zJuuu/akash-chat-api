import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRightCircleIcon } from "lucide-react"


export default function Header() {

  return (
    <header className="top-0 left-0 right-0 bg-background border-b border-border">
      <div className="container flex items-center justify-between">
        <div className="flex items-center pr-4 py-8">
          <Link href="/">
            <img src="/akash-chat-api.svg" alt="AkashChat Logo" className="w-48" />
          </Link>
        </div>
        <div className="flex items-center justify-center md:mt-0">
          <Link href="https://akash.network" target="_blank">
            <Button variant="outline" className="rounded-full bg-[#f4f4f5] text-xs sm:text-sm">
              Go to akash.network
              <ArrowRightCircleIcon className="ml-2 h-4 w-4" style={{ transform: "rotate(-50deg)" }} />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}