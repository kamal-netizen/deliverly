'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Rider } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

interface RiderModalProps {
  rider?: Rider | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Create or edit a rider.
 *
 * Mount this conditionally ({open && <RiderModal … />}). The form state is
 * seeded from `rider` once, so a modal that stays mounted across openings keeps
 * whichever rider it first saw - which is how the edit form used to come up
 * blank for an existing rider.
 */
export function RiderModal({ rider, open, onOpenChange }: RiderModalProps) {
  const isEdit = Boolean(rider)

  const [formData, setFormData] = useState({
    name: rider?.name || '',
    phone: rider?.phone || '',
    email: rider?.email || '',
    password: '',
  })

  const queryClient = useQueryClient()

  const onSettled = (message: string) => {
    toast.success(message)
    queryClient.invalidateQueries({ queryKey: ['riders'] })
    onOpenChange(false)
  }

  const createMutation = useMutation({
    mutationFn: (data: {
      name: string
      email: string
      password: string
      phone?: string
    }) => apiClient.createRider(data),
    onSuccess: () => onSettled('Rider created'),
    onError: (error: any) => toast.error(error.message || 'Could not create rider'),
  })

  // This branch existed in the UI but not in the code: handleSubmit always
  // called createRider, so saving an edit would have created a duplicate.
  const updateMutation = useMutation({
    mutationFn: (data: Partial<Rider>) => apiClient.updateRider(rider!.id, data),
    onSuccess: () => onSettled('Rider updated'),
    onError: (error: any) => toast.error(error.message || 'Could not update rider'),
  })

  const pending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEdit) {
      updateMutation.mutate({
        name: formData.name,
        phone: formData.phone || null,
      })
      return
    }

    createMutation.mutate({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      ...(formData.phone ? { phone: formData.phone } : {}),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Rider' : 'Add New Rider'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update rider information'
                : 'Creates the rider and their login together, so they can sign in to the rider app.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+971500000000"
              />
            </div>

            {!isEdit && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="john@example.com"
                  />
                  <p className="text-xs text-gray-500">
                    This is also the rider&apos;s login.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : isEdit ? 'Update Rider' : 'Create Rider'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
