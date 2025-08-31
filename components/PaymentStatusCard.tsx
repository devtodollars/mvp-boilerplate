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
import { useAuth } from "@/components/providers/AuthProvider"

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
  const { user } = useAuth()

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

  const handleStripePayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to make a payment.",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      console.log('Creating payment for listing:', listing.id, 'user:', user.id);
      
      // Create a payment record first
      const paymentResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing.id,
          userId: user.id,
          amount: 500, // €5.00 in cents
          currency: 'EUR',
          description: `Room listing fee for ${listing.property_name}`,
          metadata: {
            listing_id: listing.id,
            listing_name: listing.property_name,
            payment_type: 'room_listing_fee'
          }
        }),
      })

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json();
        console.error('Payment creation failed:', errorData);
        throw new Error(`Failed to create payment record: ${errorData.error || 'Unknown error'}`);
      }

      const paymentData = await paymentResponse.json()
      console.log('Payment created successfully:', paymentData);
      
      // Redirect to Stripe checkout
      const checkoutResponse = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing.id,
          paymentId: paymentData.id,
          returnUrl: `${window.location.origin}/dashboard?tab=listings`,
        }),
      })

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        console.error('Checkout creation failed:', errorData);
        throw new Error(`Failed to create checkout session: ${errorData.error || 'Unknown error'}`);
      }

      const { checkoutUrl } = await checkoutResponse.json()
      console.log('Redirecting to Stripe checkout:', checkoutUrl);
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl
      
    } catch (error) {
      console.error('Payment error:', error)
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment. Please try again.",
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
            <span className="font-medium">€5.00</span>
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
              onClick={handleStripePayment}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting to Payment...
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
              onClick={handleStripePayment}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting to Payment...
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
              onClick={handleStripePayment}
              disabled={isProcessing}
              variant="outline"
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting to Payment...
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
          <p>• Secure payment via Stripe</p>
        </div>
      </CardContent>
    </Card>
  )
} 