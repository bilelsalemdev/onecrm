import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import type { Service } from '@onecrm/shared'
import { Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield, ArrowUpRight } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield,
}

export function ServiceSummaryCard({ service }: { service: Service }) {
  const Icon = iconMap[service.icon] ?? Globe

  return (
    <Link to={`/services/${service.id}`}>
      <Card className="animate-fade-in-up cursor-pointer group transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/20 overflow-hidden relative">
        {service.color && (
          <div className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: service.color }} />
        )}
        <CardContent className="flex items-center gap-4 p-4">
          {service.logo ? (
            <img src={service.logo} alt={service.name} className="h-10 w-10 rounded-lg object-cover ring-1 ring-border" />
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg ring-1"
              style={service.color
                ? { backgroundColor: service.color + '15', borderColor: service.color + '30' }
                : undefined
              }
            >
              <span style={{ color: service.color ?? undefined }}><Icon className="h-5 w-5" /></span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{service.name}</p>
            <p className="text-xs text-muted-foreground/70 truncate">{service.description}</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors duration-200" />
        </CardContent>
      </Card>
    </Link>
  )
}
