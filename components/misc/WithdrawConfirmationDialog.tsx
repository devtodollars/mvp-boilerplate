'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';

interface WithdrawConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isWithdrawing: boolean;
  propertyName: string;
}

export default function WithdrawConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  isWithdrawing,
  propertyName,
}: WithdrawConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Withdraw Application
          </DialogTitle>
          <DialogDescription className="text-base">
            Are you sure you want to withdraw your application?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2">What happens when you withdraw:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Your application will be removed from the queue</li>
              <li>• You'll lose your position in line</li>
              <li>• You can apply again, but you'll be at the end of the queue</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>Property:</strong> {propertyName}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isWithdrawing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isWithdrawing}
            className="flex items-center gap-2"
          >
            {isWithdrawing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Withdrawing...
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                Yes, Withdraw Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 