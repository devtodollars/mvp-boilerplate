import { Badge } from "@/components/ui/badge"
import { Shield, CheckCircle } from "lucide-react"
import { cn } from "@/utils/cn"

interface VerifiedBadgeProps {
  verified: boolean
  variant?: "default" | "compact" | "inline"
  className?: string
  showText?: boolean
}

export function VerifiedBadge({ 
  verified, 
  variant = "default", 
  className,
  showText = true 
}: VerifiedBadgeProps) {
  if (!verified) return null

  const getBadgeContent = () => {
    const icon = variant === "compact" ? (
      <Shield className="w-3 h-3" />
    ) : (
      <CheckCircle className="w-4 h-4" />
    )

    if (variant === "compact") {
      return icon
    }

    if (variant === "inline") {
      return (
        <span className="flex items-center gap-1 text-xs">
          {icon}
          {showText && "Verified"}
        </span>
      )
    }

    return (
      <>
        {icon}
        {showText && "Verified"}
      </>
    )
  }

  const getBadgeStyles = () => {
    switch (variant) {
      case "compact":
        return "h-6 w-6 p-0 rounded-full bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
      case "inline":
        return "bg-transparent text-green-700 border-0 p-0 h-auto font-medium hover:bg-transparent"
      default:
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
    }
  }

  return (
    <Badge 
      variant="secondary" 
      className={cn(getBadgeStyles(), className)}
    >
      {getBadgeContent()}
    </Badge>
  )
}

// Specialized badges for different contexts
export function UserVerifiedBadge({ verified, className }: { verified: boolean; className?: string }) {
  return (
    <VerifiedBadge 
      verified={verified} 
      variant="inline" 
      className={cn("text-green-700", className)}
    />
  )
}

export function ListingVerifiedBadge({ verified, className }: { verified: boolean; className?: string }) {
  return (
    <VerifiedBadge 
      verified={verified} 
      variant="default" 
      className={cn("bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100", className)}
    />
  )
}

export function ApplicationVerifiedBadge({ verified, className }: { verified: boolean; className?: string }) {
  return (
    <VerifiedBadge 
      verified={verified} 
      variant="compact" 
      className={cn("bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100", className)}
    />
  )
}
