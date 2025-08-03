"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Trash2, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

interface DeleteListingDialogProps {
  isOpen: boolean
  onClose: () => void
  listing: {
    id: string
    property_name: string
    address: string
    city: string
    county: string
  }
}

export function DeleteListingDialog({ isOpen, onClose, listing }: DeleteListingDialogProps) {
  const [confirmationText, setConfirmationText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const requiredText = "permanently delete"
  const isConfirmationValid = confirmationText.toLowerCase() === requiredText.toLowerCase()

  const handleDelete = async () => {
    if (!isConfirmationValid) return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      
      // Delete the listing
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listing.id)

      if (error) {
        throw error
      }

      toast({
        title: "Listing Deleted",
        description: "Your listing has been permanently deleted.",
        variant: "default",
      })

      onClose()
      router.push('/dashboard')
      router.refresh()
    } catch (error) {
      console.error('Error deleting listing:', error)
      toast({
        title: "Error",
        description: "Failed to delete listing. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Delete Listing
          </DialogTitle>
          <DialogDescription className="text-red-600">
            This action cannot be undone. This will permanently delete your listing and remove it from our platform.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Listing Info */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">{listing.property_name}</h4>
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <span>{listing.address}</span>
            </p>
            <p className="text-sm text-gray-600">
              {listing.city}, {listing.county}
            </p>
          </div>
          
          {/* Warning Box */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              What happens when you delete:
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• Your listing will be permanently removed from GoLet.ie</li>
              <li>• All applications will be cancelled</li>
              <li>• Any remaining paid time will be forfeited</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>

          {/* Confirmation Input */}
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium text-gray-700">
              Type <span className="font-mono bg-gray-100 px-1 rounded">{requiredText}</span> to confirm:
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={requiredText}
              className={confirmationText && !isConfirmationValid ? "border-red-300 focus:border-red-500" : ""}
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-xs text-red-600">
                Please type exactly "{requiredText}" to confirm deletion
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmationValid || isDeleting}
            className="flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Listing
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 