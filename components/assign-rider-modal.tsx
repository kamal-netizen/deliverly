'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

interface AssignRiderModalProps {
  orderId: string
  currentRiderId?: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Assign or reassign an order.
 *
 * Mount conditionally ({open && <AssignRiderModal … />}): selectedRiderId is
 * seeded from currentRiderId once, so a permanently-mounted modal keeps the
 * rider it first saw and preselects the wrong one after a reassignment.
 */
export function AssignRiderModal({
  orderId,
  currentRiderId,
  open,
  onOpenChange,
}: AssignRiderModalProps) {
  const [selectedRiderId, setSelectedRiderId] = useState(currentRiderId || '')
  const queryClient = useQueryClient()


  const { data: riders = [], isLoading } = useQuery({
    queryKey: ['riders'],
    queryFn: () => apiClient.getRiders(),
  })

  const assignMutation = useMutation({
    mutationFn: async (riderId: string) => {
      if (!orderId) {
        throw new Error('Order ID is missing')
      }
      return apiClient.assignOrder({ orderId, riderId })
    },
    onSuccess: () => {
      toast.success('Rider assigned successfully')
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['order', orderId] })
      onOpenChange(false)
    },
    onError: (error: any) => {
      console.error('Assignment error:', error)
      toast.error(error.message || 'Failed to assign rider')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRiderId) {
      toast.error('Please select a rider')
      return
    }
    if (!orderId) {
      toast.error('Order ID is missing')
      return
    }
    assignMutation.mutate(selectedRiderId)
  }

  const activeRiders = riders.filter((rider) => rider.active)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {currentRiderId ? 'Reassign Rider' : 'Assign Rider'}
            </DialogTitle>
            <DialogDescription>
              Select a rider to assign to this order
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="rider">Select Rider</Label>
                <select
                  id="rider"
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-md bg-background"
                  required
                >
                  <option value="">-- Select a rider --</option>
                  {activeRiders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name} {rider.phone ? `(${rider.phone})` : ''}
                    </option>
                  ))}
                </select>
                {activeRiders.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No active riders available
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={assignMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={assignMutation.isPending || !selectedRiderId}>
              {assignMutation.isPending ? 'Assigning...' : 'Assign Rider'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
