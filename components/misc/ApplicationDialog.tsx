'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, MapPin, Euro, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ApplicationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  property: any;
  onApply: (notes?: string) => Promise<void>;
  isApplying: boolean;
  isAuthenticated: boolean;
  isReapplication?: boolean;
}

export default function ApplicationDialog({ 
  isOpen, 
  onClose, 
  property, 
  onApply, 
  isApplying,
  isAuthenticated,
  isReapplication = false
}: ApplicationDialogProps) {
  const [notes, setNotes] = useState('');
  const { toast } = useToast();

  const handleApply = async () => {
    try {
      await onApply(notes.trim() || undefined);
      setNotes('');
      onClose();
    } catch (error) {
      console.error('Error applying:', error);
      toast({
        title: 'Application Failed',
        description: error instanceof Error ? error.message : 'There was an error submitting your application.',
        variant: 'destructive',
      });
    }
  };

  const handleSignIn = () => {
    const currentUrl = window.location.pathname + window.location.search;
    window.location.href = `/auth/signin?redirect=${encodeURIComponent(currentUrl)}`;
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <User className="h-5 w-5" />
            {isReapplication ? 'Re-apply to Property' : 'Apply to Property'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isReapplication ? 'Resubmit your application to join the queue' : 'Join the queue for this property'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Property Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{property.property_name}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>{property.address}, {property.city}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Euro className="h-4 w-4" />
                <span>€{property.monthly_rent} per {property.rent_frequency || 'month'}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="h-4 w-4" />
                <span>{property.current_males + property.current_females} current occupants</span>
              </div>
            </div>
          </div>

          {/* Queue Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">How the Queue Works</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Applications are processed in order (first-come, first-served)</li>
              <li>• You'll be notified of your position in the queue</li>
              <li>• The property owner will review applications in order</li>
              <li>• You can withdraw your application at any time</li>
            </ul>
            {isReapplication && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-sm text-blue-700 font-medium">
                  📝 <strong>Re-applying:</strong> Your previous application will be updated and you'll be added to the end of the queue.
                </p>
              </div>
            )}
          </div>

          {/* Application Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Additional Notes (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="Tell the property owner about yourself, why you're interested in this property, your move-in timeline, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] resize-none"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">
              {notes.length}/500 characters
            </div>
          </div>

          {/* Current Queue Status */}
          {property.applicants && property.applicants.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Current Queue</span>
              </div>
              <p className="text-sm text-yellow-700">
                {property.applicants.length} applicant{property.applicants.length !== 1 ? 's' : ''} in queue
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isApplying}
          >
            Cancel
          </Button>
          {isAuthenticated ? (
            <Button
              onClick={handleApply}
              disabled={isApplying}
              className="flex items-center gap-2"
            >
              {isApplying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isReapplication ? 'Re-applying...' : 'Applying...'}
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  {isReapplication ? 'Re-apply to Property' : 'Apply to Property'}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSignIn}
              className="flex items-center gap-2"
            >
              <User className="h-4 w-4" />
              Sign In to Apply
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 