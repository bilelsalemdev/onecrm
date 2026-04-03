import { Link } from 'react-router'
import { Card, CardContent } from '@/components/ui/card'
import type { Service } from '@onecrm/shared'
import { Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe, Sparkles, TrendingUp, Award, Building, Store, Landmark, Heart, Zap, Shield,
}

export function ServiceSummaryCard({ service }: { service: Service }) {
  const Icon = iconMap[service.icon] ?? Globe

  return (
    <Link to={`/services/${service.id}`}>
      <Card className="animate-fade-in-up cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30">
        <CardContent className="flex items-center gap-4 p-4">
          {service.logo ? (
            <img src={service.logo} alt={service.name} className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{service.name}</p>
            <p className="text-xs text-muted-foreground truncate">{service.description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
