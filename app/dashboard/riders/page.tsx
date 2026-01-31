'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { Rider } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RiderModal } from '@/components/rider-modal'
import { UserPlus, Phone, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RidersPage() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null)
  const queryClient = useQueryClient()

  const { data: ridersData = [], isLoading } = useQuery({
    queryKey: ['riders'],
    queryFn: () => apiClient.getRiders(),
  })

  // Handle both array and object response formats
  const riders: Rider[] = Array.isArray(ridersData) ? ridersData : (ridersData as any)?.riders || []

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiClient.updateRider(id, { active }),
    onSuccess: () => {
      toast.success('Rider status updated')
      queryClient.invalidateQueries({ queryKey: ['riders'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update rider status')
    },
  })

  const handleToggleActive = (rider: Rider) => {
    toggleActiveMutation.mutate({ id: rider.id, active: !rider.active })
  }

  const handleAddRider = () => {
    setSelectedRider(null)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Riders</h1>
          <p className="text-gray-500 mt-1">Manage delivery riders</p>
        </div>
        <Button onClick={handleAddRider}>
          <UserPlus className="h-4 w-4 mr-2" />
          Add Rider
        </Button>
      </div>

      {/* Riders Table */}
      <div className="bg-white rounded-lg border">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : riders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <UserPlus className="h-12 w-12 mb-4 opacity-50" />
            <p>No riders yet</p>
            <Button variant="link" onClick={handleAddRider} className="mt-2">
              Add your first rider
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riders.map((rider: Rider) => (
                <TableRow key={rider.id}>
                  <TableCell className="font-medium">{rider.name}</TableCell>
                  <TableCell>
                    {rider.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        {rider.phone}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {rider.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        {rider.email}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {rider.active ? (
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={rider.active ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleToggleActive(rider)}
                        disabled={toggleActiveMutation.isPending}
                      >
                        {rider.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Add/Edit Rider Modal */}
      <RiderModal
        rider={selectedRider}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
