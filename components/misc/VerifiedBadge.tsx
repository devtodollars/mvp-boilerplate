import { Shield, CheckCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

interface VerifiedBadgeProps {
  verified: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function VerifiedBadge({ verified, size = 'md', className }: VerifiedBadgeProps) {
  if (!verified) {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-green-100 text-green-800 border border-green-200 font-medium',
        sizeClasses[size],
        className
      )}
    >
      <CheckCircle className={cn('text-green-600', iconSizes[size])} />
      <span>Verified</span>
    </div>
  )
}

// Alternative badge with shield icon
export function VerifiedShieldBadge({ verified, size = 'md', className }: VerifiedBadgeProps) {
  if (!verified) {
    return null
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-medium',
        sizeClasses[size],
        className
      )}
    >
      <Shield className={cn('text-blue-600', iconSizes[size])} />
      <span>Verified</span>
    </div>
  )
}
