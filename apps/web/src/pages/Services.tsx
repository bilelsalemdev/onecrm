import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceCard } from '@/components/services/ServiceCard'
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog'
import { getServices, createService, updateService, deleteService } from '@/services/api'
import type { Service, ServiceFormData } from '@onecrm/shared'

export function Services() {
  const [services, setServices] = useState<Service[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | undefined>()

  const loadServices = useCallback(() => {
    getServices().then(setServices)
  }, [])

  useEffect(() => {
    loadServices()
  }, [loadServices])

  async function handleSubmit(data: ServiceFormData) {
    if (editingService) {
      await updateService(editingService.id, data)
    } else {
      await createService(data)
    }
    loadServices()
  }

  function handleEdit(service: Service) {
    setEditingService(service)
    setDialogOpen(true)
  }

  async function handleDelete(service: Service) {
    if (!confirm(`Delete "${service.name}"? This cannot be undone.`)) return
    await deleteService(service.id)
    loadServices()
  }

  function handleOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open) setEditingService(undefined)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Services</h2>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          No services configured yet. Click "Add Service" to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ServiceFormDialog
        open={dialogOpen}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
        editingService={editingService}
      />
    </div>
  )
}
