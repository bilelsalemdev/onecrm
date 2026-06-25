import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router'
import { getService, getContacts, getOrders } from '@/services/api'
import { KanbanBoard } from '@/components/services/KanbanBoard'
import { MappingDialog } from '@/components/services/MappingDialog'
import { Button } from '@/components/ui/button'
import type { Service, ReviewableContact, ReviewableOrder } from '@onecrm/shared'
import { Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield, Mail, ShoppingCart, Settings2 } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield,
}

type Tab = 'contacts' | 'orders'

export function ServiceDetail() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const [service, setService] = useState<Service | undefined>()
  const [contacts, setContacts] = useState<ReviewableContact[]>([])
  const [orders, setOrders] = useState<ReviewableOrder[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('contacts')
  const [mappingOpen, setMappingOpen] = useState(false)

  const loadData = useCallback(() => {
    if (!serviceId) return
    getService(serviceId).then(setService)
    getContacts(serviceId).then(setContacts)
    getOrders(serviceId).then(setOrders)
  }, [serviceId])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (!service) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const Icon = iconMap[service.icon] ?? Globe
  const host = (service.endpoint ?? service.ordersEndpoint ?? '').replace(/^https?:\/\//, '').split('/')[0]

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    ...(service.endpoint ? [{ id: 'contacts' as Tab, label: 'Contacts', icon: Mail, count: contacts.length }] : []),
    ...(service.ordersEndpoint ? [{ id: 'orders' as Tab, label: 'Orders', icon: ShoppingCart, count: orders.length }] : []),
  ]
  const currentTab: Tab = tabs.some((t) => t.id === activeTab) ? activeTab : (tabs[0]?.id ?? 'contacts')

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Service header — a module nameplate */}
      <div className="relative overflow-hidden rounded-lg border border-border bg-card">
        <span className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: service.color ?? 'var(--border)' }} />
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          {service.logo ? (
            <img src={service.logo} alt={service.name} className="h-12 w-12 rounded-md object-cover ring-1 ring-border" />
          ) : (
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md ring-1 ring-inset ring-border"
              style={service.color ? { backgroundColor: service.color + '14', borderColor: service.color + '33' } : undefined}
            >
              <span style={{ color: service.color ?? undefined }}><Icon className="h-6 w-6" /></span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold tracking-tight">{service.name}</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">{service.description}</p>
            <div className="mt-2 flex items-center gap-2.5">
              <span className="text-lamp-green"><span className="lamp lamp-sm" /></span>
              <span className="readout truncate text-[11px] text-muted-foreground">{host}</span>
              <span className="readout shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                {service.authType}
              </span>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setMappingOpen(true)} className="self-start sm:self-center">
            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
            Map fields
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => {
          const active = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 ${
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className={`readout rounded px-1.5 py-0.5 text-[11px] tabular-nums ${active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {tabs.length === 0 && (
        <div className="grid-etch flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
          <p className="font-heading text-sm font-semibold">No data sources</p>
          <p className="mt-1 text-xs text-muted-foreground">Add a contact-us or orders endpoint for this service.</p>
        </div>
      )}
      {currentTab === 'contacts' && service.endpoint && (
        <KanbanBoard items={contacts} serviceId={service.id} type="contacts" onUpdated={loadData} />
      )}
      {currentTab === 'orders' && service.ordersEndpoint && (
        <KanbanBoard items={orders} serviceId={service.id} type="orders" onUpdated={loadData} />
      )}

      <MappingDialog
        open={mappingOpen}
        onOpenChange={setMappingOpen}
        serviceId={service.id}
        type={currentTab}
        existingMapping={currentTab === 'contacts' ? service.contactsMapping : service.ordersMapping}
        onSaved={loadData}
      />
    </div>
  )
}
