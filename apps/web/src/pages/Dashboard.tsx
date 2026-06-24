import { useEffect, useState } from 'react'
import { Users, CalendarPlus, Boxes } from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { PipelineRail } from '@/components/dashboard/PipelineRail'
import { ServiceSummaryCard } from '@/components/dashboard/ServiceSummaryCard'
import { RecentContacts } from '@/components/dashboard/RecentContacts'
import { getServices, getAllContacts } from '@/services/api'
import type { Service, ReviewableContact, ReviewStatus } from '@onecrm/shared'

const EMPTY_COUNTS: Record<ReviewStatus, number> = { 'to-review': 0, 'under-review': 0, 'completed': 0 }

export function Dashboard() {
  const [services, setServices] = useState<Service[]>([])
  const [contacts, setContacts] = useState<ReviewableContact[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [s, c] = await Promise.all([getServices(), getAllContacts()])
        setServices(s)
        setContacts(c)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayContacts = contacts.filter((c) => c.date === today).length

  const counts = contacts.reduce(
    (acc, c) => {
      const s = c.reviewStatus ?? 'to-review'
      acc[s] = (acc[s] ?? 0) + 1
      return acc
    },
    { ...EMPTY_COUNTS }
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="animate-fade-in">
        <p className="eyebrow">Operations</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">Review desk</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything coming in across your connected services, in one queue.
        </p>
      </header>

      <PipelineRail counts={counts} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatsCard title="Total contacts" value={contacts.length} icon={Users} hint="all services" />
        <StatsCard title="New today" value={todayContacts} icon={CalendarPlus} hint={today} />
        <StatsCard title="Services" value={services.length} icon={Boxes} hint="connected" />
      </div>

      {services.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="eyebrow">Services</p>
            <span className="readout text-[11px] text-muted-foreground">{String(services.length).padStart(2, '0')}</span>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceSummaryCard key={service.id} service={service} />
            ))}
          </div>
        </section>
      )}

      {contacts.length > 0 && (
        <section className="rounded-lg border border-border bg-card animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <p className="eyebrow">Recent incoming</p>
            <span className="readout text-[11px] text-muted-foreground">last {Math.min(8, contacts.length)}</span>
          </div>
          <div className="px-5 py-1.5">
            <RecentContacts contacts={contacts} services={services} />
          </div>
        </section>
      )}
    </div>
  )
}
