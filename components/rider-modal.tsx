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

export function RiderModal({ rider, open, onOpenChange }: RiderModalProps) {
  const [formData, setFormData] = useState({
    name: rider?.name || '',
    phone: rider?.phone || '',
    email: rider?.email || '',
  })
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: { name: string; phone?: string; email?: string }) =>
      apiClient.createRider(data),
    onSuccess: () => {
      toast.success('Rider created successfully')
      queryClient.invalidateQueries({ queryKey: ['riders'] })
      onOpenChange(false)
      setFormData({ name: '', phone: '', email: '' })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create rider')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const payload: any = { name: formData.name }
    if (formData.phone) payload.phone = formData.phone
    if (formData.email) payload.email = formData.email

    createMutation.mutate(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{rider ? 'Edit Rider' : 'Add New Rider'}</DialogTitle>
            <DialogDescription>
              {rider
                ? 'Update rider information'
                : 'Create a new delivery rider'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
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
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1234567890"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false)
                setFormData({ name: '', phone: '', email: '' })
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? 'Saving...'
                : rider
                ? 'Update Rider'
                : 'Create Rider'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
