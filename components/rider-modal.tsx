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
import { KeyRound } from 'lucide-react'
import toast from 'react-hot-toast'

interface RiderModalProps {
  rider?: Rider | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Matches the floor the API enforces; checked here to save a round trip. */
const MIN_PASSWORD = 8

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

  const [newPassword, setNewPassword] = useState('')

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

  const resetMutation = useMutation({
    mutationFn: (password: string) =>
      apiClient.resetRiderPassword(rider!.id, password),
    onSuccess: () => {
      // The dialog stays open on purpose. The dispatcher has just chosen a
      // password they now have to pass on to the rider, and closing the thing
      // out from under them is how it gets forgotten before it is written down.
      setNewPassword('')
      toast.success('Password set. Give it to the rider — it cannot be read back.')
    },
    onError: (error: any) =>
      toast.error(error.message || 'Could not reset the password'),
  })

  const pending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (isEdit) {
      updateMutation.mutate({
        name: formData.name,
        phone: formData.phone || null,
        email: formData.email,
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
            <DialogTitle>{isEdit ? 'Edit rider' : 'Add new rider'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Changing the email changes the address this rider signs in with.'
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

            {!isEdit && (
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
                  minLength={MIN_PASSWORD}
                  placeholder={`At least ${MIN_PASSWORD} characters`}
                />
              </div>
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
              {pending ? 'Saving…' : isEdit ? 'Save changes' : 'Create rider'}
            </Button>
          </DialogFooter>
        </form>

        {/*
          Outside the form, and below the footer, deliberately.

          Setting someone's password is a different act from correcting their
          phone number, so it gets its own button and its own confirmation
          rather than riding along on "Save changes" - where a dispatcher
          editing a phone number could set a password without meaning to.
        */}
        {isEdit && (
          <div className="border-t pt-4">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-gray-500" />
              <p className="text-sm font-medium">Reset password</p>
            </div>

            <p className="mt-1 text-xs text-gray-500">
              Sets a new password immediately. The rider is not told — pass it on
              yourself, and note it down first, because it cannot be read back.
            </p>

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={MIN_PASSWORD}
                placeholder={`New password, at least ${MIN_PASSWORD} characters`}
                aria-label="New password"
                className="sm:flex-1"
              />
              <Button
                type="button"
                variant="outline"
                disabled={newPassword.length < MIN_PASSWORD || resetMutation.isPending}
                onClick={() => resetMutation.mutate(newPassword)}
              >
                {resetMutation.isPending ? 'Setting…' : 'Set password'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
