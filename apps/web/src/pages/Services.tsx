import { useEffect, useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
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
    if (!confirm(`Delete "${service.name}"? This removes the connection and its review history.`)) return
    await deleteService(service.id)
    loadServices()
  }

  function handleOpenChange(open: boolean) {
    setDialogOpen(open)
    if (!open) setEditingService(undefined)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 animate-fade-in">
        <div>
          <p className="eyebrow">Connections</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Services</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every source feeding contacts and orders into the desk.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add service
        </Button>
      </div>

      {services.length === 0 ? (
        <div className="grid-etch flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-20 text-center animate-fade-in">
          <p className="font-heading text-base font-semibold">No services connected</p>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            Connect a source to start pulling its contacts and orders into one review queue.
          </p>
          <Button variant="outline" className="mt-5" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add your first service
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 animate-fade-in sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} onEdit={handleEdit} onDelete={handleDelete} />
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
