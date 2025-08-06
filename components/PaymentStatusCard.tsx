"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Calendar,
  Euro,
  Loader2
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { simulatePaymentCompletion } from "@/utils/supabase/payments"

interface PaymentStatusCardProps {
  listing: {
    id: string
    property_name: string
    address: string
    city: string
    county: string
    active: boolean
    payment_status?: string
    payment_expires_at?: string
    payment_amount?: number
  }
  onStatusUpdate?: () => void
}

export function PaymentStatusCard({ listing, onStatusUpdate }: PaymentStatusCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)
  const { toast } = useToast()

  // Calculate days remaining
  useEffect(() => {
    if (listing.payment_expires_at) {
      const expiryDate = new Date(listing.payment_expires_at)
      const now = new Date()
      const diffTime = expiryDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysRemaining(diffDays > 0 ? diffDays : 0)
    }
  }, [listing.payment_expires_at])

  const getPaymentStatusInfo = () => {
    const status = listing.payment_status || 'unpaid'
    
    switch (status) {
      case 'paid':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: 'Active',
          color: 'bg-green-100 text-green-800 border-green-200',
          description: daysRemaining !== null ? `${daysRemaining} days remaining` : 'Active listing'
        }
      case 'expired':
        return {
          icon: <XCircle className="h-4 w-4" />,
          label: 'Expired',
          color: 'bg-red-100 text-red-800 border-red-200',
          description: 'Payment has expired'
        }
      case 'unpaid':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          label: 'Unpaid',
          color: 'bg-amber-100 text-amber-800 border-amber-200',
          description: 'Payment required to activate listing'
        }
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Payment status unknown'
        }
    }
  }

  const getProgressPercentage = () => {
    if (!listing.payment_expires_at || daysRemaining === null) return 0
    const totalDays = 30 // Assuming 30-day payment period
    const remainingDays = Math.max(0, daysRemaining)
    return Math.max(0, Math.min(100, ((totalDays - remainingDays) / totalDays) * 100))
  }

  const handleTestPayment = async () => {
    setIsProcessing(true)
    try {
      const success = await simulatePaymentCompletion(listing.id)
      
      if (success) {
        toast({
          title: "Payment Successful",
          description: "Your listing is now active for 30 days!",
          variant: "default",
        })
        onStatusUpdate?.()
      } else {
        toast({
          title: "Payment Failed",
          description: "Failed to process payment. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while processing payment.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const statusInfo = getPaymentStatusInfo()
  const progressPercentage = getProgressPercentage()

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CreditCard className="h-5 w-5 text-blue-600" />
          Payment Status
        </CardTitle>
        <CardDescription>
          Manage your listing's payment and activation status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <Badge className={`${statusInfo.color} flex items-center gap-1`}>
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Euro className="h-4 w-4" />
            <span className="font-medium">{listing.payment_amount || 5.00}</span>
            <span>/30 days</span>
          </div>
        </div>

        {/* Progress Bar */}
        {listing.payment_status === 'paid' && daysRemaining !== null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Time Remaining</span>
              <span className="font-medium">{daysRemaining} days</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}

        {/* Status Description */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>{statusInfo.description}</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {listing.payment_status === 'unpaid' && (
            <Button 
              onClick={handleTestPayment}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay €5.00 to Activate (30 Days)
                </>
              )}
            </Button>
          )}

          {listing.payment_status === 'expired' && (
            <Button 
              onClick={handleTestPayment}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Renew Listing (€5.00 for 30 Days)
                </>
              )}
            </Button>
          )}

          {listing.payment_status === 'paid' && daysRemaining !== null && daysRemaining <= 7 && (
            <Button 
              onClick={handleTestPayment}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Renewal...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4 mr-2" />
                  Renew Early (€5.00 for 30 Days)
                </>
              )}
            </Button>
          )}
        </div>

        {/* Additional Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Listings are active for 30 days after payment</p>
          <p>• You can renew anytime before expiration</p>
          <p>• Expired listings are automatically deactivated</p>
        </div>
      </CardContent>
    </Card>
  )
} 