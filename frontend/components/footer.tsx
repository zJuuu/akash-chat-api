import { GithubIcon, YoutubeIcon } from "lucide-react"
import Link from "next/link"
import { DiscordIcon } from "./ui/discord-icon"
import { XIcon } from "./ui/x-icon"
import { TelegramIcon } from "./ui/telegram-icon"

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-white py-6">
      <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="https://akash.network" className="flex items-center space-x-2">
            <img src="/akash-network-wordmark-lockup.svg" alt="Akash Network Logo" className="w-64" />
          </Link>
        </div>
        <div className="flex space-x-4 mt-4 md:mt-0">
          <Link href="https://twitter.com/akashnet_" className="hover:underline">
            <XIcon className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link href="https://github.com/akash-network" className="hover:underline">
            <GithubIcon className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link href="https://discord.com/invite/akash" className="hover:underline">
            <DiscordIcon className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link href="https://www.youtube.com/c/AkashNetwork" className="hover:underline">
            <YoutubeIcon className="h-5 w-5 text-muted-foreground" />
          </Link>
          <Link href="https://t.me/AkashNW" className="hover:underline">
            <TelegramIcon className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>
      </div>
      <div className="container mx-auto px-4 mt-4 border-t border-muted-foreground pt-4 text-sm text-muted-foreground flex flex-col md:flex-row justify-between items-center">
        <p className="md:text-left">
          © Akash Network 2024 | The Akash Network Authors Documentation Distributed under CC BY 4.0 | Open-source
          Apache 2.0 Licensed.
        </p>
        <div className="flex space-x-4 mt-4 md:mt-0 md:justify-end">
          <Link href="https://akash.network/privacy" className="hover:underline" prefetch={false}>
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}
