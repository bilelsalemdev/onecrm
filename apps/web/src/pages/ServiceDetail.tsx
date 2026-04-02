import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { getService, getContacts } from '@/services/api'
import { ContactsTable } from '@/components/services/ContactsTable'
import type { Service, Contact } from '@onecrm/shared'
import { Globe, Sparkles, TrendingUp, Award, Building } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Sparkles,
  TrendingUp,
  Award,
  Building,
}

export function ServiceDetail() {
  const { serviceId } = useParams<{ serviceId: string }>()
  const [service, setService] = useState<Service | undefined>()
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    if (!serviceId) return
    getService(serviceId).then(setService)
    getContacts(serviceId).then(setContacts)
  }, [serviceId])

  if (!service) {
    return <div className="p-8 text-center text-muted-foreground">Service not found</div>
  }

  const Icon = iconMap[service.icon] ?? Globe

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{service.name}</h2>
          <p className="text-muted-foreground">{service.description}</p>
        </div>
      </div>

      <ContactsTable contacts={contacts} />
    </div>
  )
}
