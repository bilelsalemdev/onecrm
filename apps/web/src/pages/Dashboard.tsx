import { useEffect, useState } from 'react'
import { Users, CalendarDays, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { ServiceSummaryCard } from '@/components/dashboard/ServiceSummaryCard'
import { RecentContacts } from '@/components/dashboard/RecentContacts'
import { getServices, getAllContacts } from '@/services/api'
import type { Service, Contact } from '@onecrm/shared'

export function Dashboard() {
  const [services, setServices] = useState<Service[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
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

  const totalContacts = contacts.length
  const todayContacts = contacts.filter(
    (c) => c.date === new Date().toISOString().split('T')[0]
  ).length
  const newContacts = contacts.filter((c) => c.status === 'new').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Overview of all your connected services.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div style={{ animationDelay: '0ms' }}><StatsCard title="Total Contacts" value={totalContacts} icon={Users} /></div>
        <div style={{ animationDelay: '75ms' }}><StatsCard title="Today" value={todayContacts} icon={CalendarDays} /></div>
        <div style={{ animationDelay: '150ms' }}><StatsCard title="New (Pending)" value={newContacts} icon={Clock} /></div>
      </div>

      {services.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Services</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <div key={service.id} style={{ animationDelay: `${200 + i * 75}ms` }} className="animate-fade-in-up">
                <ServiceSummaryCard service={service} />
              </div>
            ))}
          </div>
        </div>
      )}

      {contacts.length > 0 && (
        <Card className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle>Recent Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentContacts contacts={contacts} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
