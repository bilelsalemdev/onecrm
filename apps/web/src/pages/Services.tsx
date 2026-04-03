import { useEffect, useState, useCallback } from 'react'
import { Plus, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceCard } from '@/components/services/ServiceCard'
import { ServiceFormDialog } from '@/components/services/ServiceFormDialog'
import { getServices, deleteService } from '@/services/api'
import type { Service } from '@onecrm/shared'

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

  function handleSaved() {
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
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Services</h2>
          <p className="text-muted-foreground/70 mt-1">Manage your connected services and integrations.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="py-16 text-center animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
              <Building2 className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </div>
          <p className="text-muted-foreground font-medium">No services configured yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">Click &quot;Add Service&quot; to get started.</p>
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
        onSaved={handleSaved}
        editingService={editingService}
      />
    </div>
  )
}
