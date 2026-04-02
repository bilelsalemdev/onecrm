import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Service } from '@/services/types'
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

  return (
    <Card className="transition-all hover:shadow-md hover:border-primary/50">
      <CardHeader className="flex flex-row items-center gap-4">
        <Link to={`/services/${service.id}`} className="flex items-center gap-4 flex-1">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{service.description}</p>
          </div>
        </Link>
        <div className="flex gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.preventDefault(); onEdit(service) }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.preventDefault(); onDelete(service) }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Badge variant="secondary">{service.authType}</Badge>
      </CardContent>
    </Card>
  )
}
