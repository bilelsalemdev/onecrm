import { formatDate } from '@/lib/utils'
import type { ReviewableContact, ReviewStatus, Service } from '@onecrm/shared'

const REVIEW_LAMP: Record<ReviewStatus, string> = {
  'to-review': 'text-lamp-red',
  'under-review': 'text-lamp-amber',
  'completed': 'text-lamp-green',
}

export function RecentContacts({
  contacts,
  services,
}: {
  contacts: ReviewableContact[]
  services: Service[]
}) {
  const byId = Object.fromEntries(services.map((s) => [s.id, s]))

  return (
    <div className="divide-y divide-border">
      {contacts.slice(0, 8).map((c, i) => {
        const svc = byId[c.serviceId]
        const lamp = REVIEW_LAMP[c.reviewStatus ?? 'to-review']
        return (
          <div key={`${c.serviceId}-${c.id}-${i}`} className="flex items-center gap-3 py-2.5 text-sm">
            <span className={lamp} title={c.reviewStatus ?? 'to-review'}>
              <span className="lamp lamp-sm" />
            </span>
            <span className="w-36 shrink-0 truncate font-medium">{c.name}</span>
            <span className="readout hidden flex-1 truncate text-xs text-muted-foreground md:block">{c.email}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-[2px] ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: svc?.color ?? 'var(--muted-foreground)' }}
              />
              <span className="readout hidden text-xs text-muted-foreground sm:inline">{svc?.name ?? c.serviceId}</span>
            </span>
            <span className="readout ml-auto shrink-0 text-xs tabular-nums text-muted-foreground/70">{formatDate(c.date)}</span>
          </div>
        )
      })}
    </div>
  )
}
