import { useEffect, useState } from 'react'
import { ServiceCard } from '@/components/services/ServiceCard'
import { getServices } from '@/services/api'
import type { Service } from '@/services/types'

export function Services() {
  const [services, setServices] = useState<Service[]>([])

  useEffect(() => {
    getServices().then(setServices)
  }, [])

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Services</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}
      </div>
    </div>
  )
}
