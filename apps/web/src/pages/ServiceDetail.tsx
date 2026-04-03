import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { getService, getContacts } from '@/services/api'
import { ContactsTable } from '@/components/services/ContactsTable'
import type { Service, Contact } from '@onecrm/shared'
import { Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield,
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const Icon = iconMap[service.icon] ?? Globe

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        {service.logo ? (
          <img src={service.logo} alt={service.name} className="h-14 w-14 rounded-xl object-cover shadow-sm" />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-primary/5">
            <Icon className="h-7 w-7 text-primary" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{service.name}</h2>
          <p className="text-muted-foreground">{service.description}</p>
        </div>
      </div>

      <ContactsTable contacts={contacts} />
    </div>
  )
}
