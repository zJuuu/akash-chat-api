"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createRegistrationUrl } from "@/lib/ory"

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams?.get("returnTo") || "/dashboard"

  useEffect(() => {
    // Redirect to Ory's registration UI flow with proper return URL
    router.push(createRegistrationUrl(returnTo))
  }, [router, returnTo])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-lg">Redirecting to registration...</p>
    </div>
  )
} 