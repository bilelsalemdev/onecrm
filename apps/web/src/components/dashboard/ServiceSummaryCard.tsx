import { Link } from 'react-router'
import type { Service } from '@onecrm/shared'
import { Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield, ArrowUpRight } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield,
}

export function ServiceSummaryCard({ service }: { service: Service }) {
  const Icon = iconMap[service.icon] ?? Globe

  return (
    <Link to={`/services/${service.id}`} className="group block">
      <div className="relative flex items-center gap-3.5 overflow-hidden rounded-lg border border-border bg-card px-4 py-3.5 transition-colors duration-150 hover:border-foreground/20 hover:bg-accent/40">
        <span
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: service.color ?? 'var(--border)' }}
        />
        {service.logo ? (
          <img src={service.logo} alt={service.name} className="h-9 w-9 rounded-md object-cover ring-1 ring-border" />
        ) : (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md ring-1 ring-inset ring-border"
            style={service.color ? { backgroundColor: service.color + '14', borderColor: service.color + '33' } : undefined}
          >
            <span style={{ color: service.color ?? undefined }}><Icon className="h-5 w-5" /></span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{service.name}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{service.description}</p>
        </div>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-colors duration-150 group-hover:text-primary" />
      </div>
    </Link>
  )
}
