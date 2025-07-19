"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRightCircleIcon, User, LogOut, LogIn } from "lucide-react"
import { ThemeAwareLogo } from "@/components/ui/theme-aware-logo"
import { useUser } from '@auth0/nextjs-auth0/client'
import { useAppUser } from '@/components/providers/UserProvider'
import { usePathname } from 'next/navigation'

export default function Header() {
  const { user } = useUser();
  const { isAuthenticated, authType, logout } = useAppUser();
  const pathname = usePathname();
  const isOnAccountPage = pathname === '/account';

  const handleLogout = async () => {
    try {
      // Trigger logout from UserProvider which handles both Auth0 and session logout
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: redirect to home page
      window.location.href = '/';
    }
  };

  const handleLogin = () => {
    // Redirect to Auth0 login with return to account page
    window.location.href = '/api/auth/login?returnTo=' + encodeURIComponent(window.location.origin + '/account');
  };

  return (
    <header className="top-0 left-0 right-0 bg-background border-b border-border">
      <div className="container flex items-center justify-between">
        <div className="flex items-center pr-4 py-8">
          <Link href="/">
            <ThemeAwareLogo />
          </Link>
        </div>
        <div className="flex items-center gap-4 justify-center md:mt-0">
          {isAuthenticated ? (
            <>
              {isOnAccountPage ? (
                <Button 
                  variant="outline" 
                  className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs sm:text-sm"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <Link href="/account">
                  <Button variant="outline" className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs sm:text-sm">
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <Button 
              variant="outline" 
              className="rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-xs sm:text-sm"
              onClick={handleLogin}
            >
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
          )}
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