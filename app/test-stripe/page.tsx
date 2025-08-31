'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/providers/AuthProvider';

export default function TestStripePage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleTestPayment = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to test payments.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Create a test payment record
      const paymentResponse = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: 'test-listing-123',
          userId: user.id,
          amount: 500, // €5.00 in cents
          currency: 'EUR',
          description: 'Test payment for room listing',
          metadata: {
            listing_id: 'test-listing-123',
            listing_name: 'Test Property',
            payment_type: 'room_listing_fee'
          }
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment record');
      }

      const paymentData = await paymentResponse.json();
      
      // Create Stripe checkout session
      const checkoutResponse = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: 'test-listing-123',
          paymentId: paymentData.id,
          returnUrl: `${window.location.origin}/test-stripe?payment=success`,
        }),
      });

      if (!checkoutResponse.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkoutUrl } = await checkoutResponse.json();
      
      // Redirect to Stripe checkout
      window.location.href = checkoutUrl;
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Stripe Payment Test</CardTitle>
            <CardDescription>
              Test the Stripe payment integration for room listings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Test Payment Details:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Amount: €5.00</li>
                <li>• Product: Room Listing Fee</li>
                <li>• Duration: 30 days</li>
                <li>• Payment Method: Card (Stripe Test Mode)</li>
              </ul>
            </div>

            <Button 
              onClick={handleTestPayment}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Payment Session...
                </>
              ) : (
                'Test €5.00 Payment'
              )}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              <p>This will redirect you to Stripe's secure checkout page</p>
              <p>Use test card: 4242 4242 4242 4242</p>
              <p>Any future expiry date and CVC will work</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
