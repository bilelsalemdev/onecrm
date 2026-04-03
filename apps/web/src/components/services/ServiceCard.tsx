import { useNavigate } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Service } from '@onecrm/shared'
import { Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield, Pencil, Trash2, ExternalLink } from 'lucide-react'

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

  return (
    <Card
      className="animate-fade-in-up group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/20 overflow-hidden relative"
      onClick={() => navigate(`/services/${service.id}`)}
    >
      <div
        className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
        style={{ backgroundColor: service.color ?? 'transparent' }}
      />
      <CardHeader className="flex flex-row items-start gap-4 pb-3">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {service.logo ? (
            <img src={service.logo} alt={service.name} className="h-14 w-14 rounded-xl object-cover shadow-sm ring-1 ring-border" />
          ) : (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ring-1"
              style={service.color
                ? { backgroundColor: service.color + '15', borderColor: service.color + '30' }
                : undefined
              }
            >
              <span style={{ color: service.color ?? undefined }}><Icon className="h-7 w-7" /></span>
            </div>
          )}
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold">{service.name}</CardTitle>
            <p className="text-sm text-muted-foreground/70 mt-0.5 line-clamp-2">{service.description}</p>
          </div>
        </div>
        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onEdit(service) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); onDelete(service) }}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 flex items-center gap-2">
        <Badge variant="secondary" className="text-xs font-medium">{service.authType}</Badge>
        <span className="text-xs text-muted-foreground/50 truncate flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          {service.endpoint.replace(/^https?:\/\//, '').split('/')[0]}
        </span>
      </CardContent>
    </Card>
  )
}
