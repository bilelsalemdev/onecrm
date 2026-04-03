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
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const Icon = iconMap[service.icon] ?? Globe

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: 'contacts', label: 'Contacts', icon: Mail, count: contacts.length },
    { id: 'orders', label: 'Orders', icon: ShoppingCart, count: orders.length },
  ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        {service.logo ? (
          <img src={service.logo} alt={service.name} className="h-14 w-14 rounded-xl object-cover shadow-sm" />
        ) : (
          <div
            className="flex h-14 w-14 items-center justify-center rounded-xl ring-1"
            style={service.color
              ? { backgroundColor: service.color + '15', borderColor: service.color + '30' }
              : undefined
            }
          >
            <span style={{ color: service.color ?? undefined }}><Icon className="h-7 w-7" /></span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            {service.color && <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: service.color }} />}
            <h2 className="text-2xl font-bold tracking-tight">{service.name}</h2>
          </div>
          <p className="text-muted-foreground">{service.description}</p>
        </div>
      </div>

      <div className="flex items-center justify-between border-b">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium cursor-pointer transition-all duration-200 border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              <span className={`text-xs rounded-full px-2 py-0.5 ${
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMappingOpen(true)}
          className="mb-1"
        >
          <Settings2 className="mr-2 h-3.5 w-3.5" />
          Map Fields
        </Button>
      </div>

      {activeTab === 'contacts' && (
        <KanbanBoard
          items={contacts}
          serviceId={service.id}
          type="contacts"
          onUpdated={loadData}
        />
      )}
      {activeTab === 'orders' && (
        <KanbanBoard
          items={orders}
          serviceId={service.id}
          type="orders"
          onUpdated={loadData}
        />
      )}

      <MappingDialog
        open={mappingOpen}
        onOpenChange={setMappingOpen}
        serviceId={service.id}
        type={activeTab}
        existingMapping={activeTab === 'contacts' ? service.contactsMapping : service.ordersMapping}
        onSaved={loadData}
      />
    </div>
  )
}
