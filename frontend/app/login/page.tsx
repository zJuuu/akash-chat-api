"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createLoginUrl } from "@/lib/ory"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams?.get("returnTo") || "/dashboard"

  useEffect(() => {
    // Redirect to Ory's login UI flow with proper return URL
    router.push(createLoginUrl(returnTo))
  }, [router, returnTo])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-lg">Redirecting to login...</p>
    </div>
  )
} 