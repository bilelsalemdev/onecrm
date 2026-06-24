import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  hint?: string
}

export function StatsCard({ title, value, icon: Icon, hint }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{title}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/50" />
      </div>
      <p className="readout mt-3 text-3xl font-medium tracking-tight tabular-nums text-foreground">{value}</p>
      {hint && <p className="readout mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )
}
