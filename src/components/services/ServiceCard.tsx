import { Link } from 'react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Service } from '@/services/types'
import { Globe, Sparkles, TrendingUp, Award, Building } from 'lucide-react'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Globe,
  Sparkles,
  TrendingUp,
  Award,
  Building,
}

export function ServiceCard({ service }: { service: Service }) {
  const Icon = iconMap[service.icon] ?? Globe

  return (
    <Link to={`/services/${service.id}`}>
      <Card className="transition-all hover:shadow-md hover:border-primary/50">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">{service.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{service.description}</p>
          </div>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">{service.contactCount} contacts</Badge>
        </CardContent>
      </Card>
    </Link>
  )
}
