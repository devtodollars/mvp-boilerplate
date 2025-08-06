'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, UserCheck, ArrowRight } from 'lucide-react';

interface ProfileCompletionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function ProfileCompletionDialog({ 
  isOpen, 
  onClose, 
  user 
}: ProfileCompletionDialogProps) {
  const router = useRouter();

  const handleCompleteProfile = () => {
    onClose();
    router.push('/account/profile');
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-primary">
            <UserCheck className="h-5 w-5" />
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-base">
            Hi {user?.email?.split('@')[0] || 'there'}! 👋
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800 mb-3">
              To post a room listing, we need you to complete your profile first. This helps us:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Build trust with potential tenants</li>
              <li>• Verify your identity</li>
              <li>• Provide better matching</li>
              <li>• Ensure platform safety</li>
            </ul>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 mb-2 font-medium">Profile completion includes:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Your full name and contact details</li>
              <li>• A brief bio about yourself</li>
              <li>• Your occupation and background</li>
              <li>• Date of birth for verification</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleCompleteProfile}
            className="flex items-center gap-2"
          >
            Complete Profile
            <ArrowRight className="h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 