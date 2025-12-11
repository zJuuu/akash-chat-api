"use client"

import { AlertTriangle, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function DiscontinuationBanner() {
  return (
    <div className="relative bg-akashred border-b-2 border-red-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <div className="text-center">
            <p className="text-sm md:text-base font-semibold text-white">
              Important Notice: AkashChat API migrated to AkashML
            </p>
            <p className="text-xs md:text-sm text-white/90 mt-1">
              Please migrate your applications to the new AkashML platform.{" "}
              <Link 
                href="https://akashml.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline hover:text-white transition-colors font-semibold"
              >
                Visit AkashML.com
                <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

