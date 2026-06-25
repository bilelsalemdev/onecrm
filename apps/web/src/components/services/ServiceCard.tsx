import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import type { Service } from '@onecrm/shared'
import { Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield, Pencil, Trash2 } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield,
}

interface ServiceCardProps {
  service: Service
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
}

export function ServiceCard({ service, onEdit, onDelete }: ServiceCardProps) {
  const Icon = iconMap[service.icon] ?? Globe
  const navigate = useNavigate()
  const host = (service.endpoint ?? service.ordersEndpoint ?? '').replace(/^https?:\/\//, '').split('/')[0]

  return (
    <div
      className="group relative cursor-pointer overflow-hidden rounded-lg border border-border bg-card transition-colors duration-150 hover:border-foreground/20"
      onClick={() => navigate(`/services/${service.id}`)}
    >
      {/* brand color rail */}
      <span className="absolute inset-x-0 top-0 h-0.5" style={{ backgroundColor: service.color ?? 'var(--border)' }} />

      <div className="flex items-start gap-3.5 p-4">
        {service.logo ? (
          <img src={service.logo} alt={service.name} className="h-11 w-11 rounded-md object-cover ring-1 ring-border" />
        ) : (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md ring-1 ring-inset ring-border"
            style={service.color ? { backgroundColor: service.color + '14', borderColor: service.color + '33' } : undefined}
          >
            <span style={{ color: service.color ?? undefined }}><Icon className="h-5 w-5" /></span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-[15px] font-semibold leading-tight tracking-tight truncate">{service.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{service.description}</p>
        </div>
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <Button variant="ghost" size="icon-sm" aria-label="Edit service" onClick={(e) => { e.stopPropagation(); onEdit(service) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Delete service" onClick={(e) => { e.stopPropagation(); onDelete(service) }}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>

      {/* readout footer */}
      <div className="flex items-center gap-2 border-t border-border px-4 py-2.5">
        <span className="text-lamp-green"><span className="lamp lamp-sm" /></span>
        <span className="readout truncate text-[11px] text-muted-foreground">{host}</span>
        <span className="readout ml-auto shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
          {service.authType}
        </span>
      </div>
    </div>
  )
}
