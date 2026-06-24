import { ChevronRight } from 'lucide-react'
import type { ReviewStatus } from '@onecrm/shared'

interface Stage {
  id: ReviewStatus
  label: string
  lamp: string // text-color class driving the lamp + bar
}

const STAGES: Stage[] = [
  { id: 'to-review', label: 'To review', lamp: 'text-lamp-red' },
  { id: 'under-review', label: 'Under review', lamp: 'text-lamp-amber' },
  { id: 'completed', label: 'Completed', lamp: 'text-lamp-green' },
]

export function PipelineRail({ counts }: { counts: Record<ReviewStatus, number> }) {
  const total = STAGES.reduce((sum, s) => sum + (counts[s.id] ?? 0), 0)

  return (
    <section className="rounded-lg border border-border bg-card overflow-hidden animate-fade-in-up">
      {/* header strip */}
      <div className="grid-etch flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <p className="eyebrow">Review pipeline</p>
        <p className="readout text-xs text-muted-foreground">
          <span className="text-foreground">{total}</span> incoming
        </p>
      </div>

      {/* stages */}
      <div className="flex flex-col md:flex-row">
        {STAGES.map((stage, i) => {
          const value = counts[stage.id] ?? 0
          const pct = total > 0 ? Math.round((value / total) * 100) : 0
          return (
            <div key={stage.id} className="flex flex-1 items-stretch">
              <div className="flex-1 px-5 py-5">
                <div className={`flex items-center gap-2 ${stage.lamp}`}>
                  <span className="lamp" />
                  <span className="eyebrow text-foreground/80">{stage.label}</span>
                </div>
                <div className="mt-3.5 flex items-baseline gap-2">
                  <span className="readout text-4xl font-medium tracking-tight text-foreground tabular-nums">
                    {String(value).padStart(2, '0')}
                  </span>
                  <span className="readout text-xs text-muted-foreground">{pct}%</span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full animate-rail ${stage.lamp}`}
                    style={{ width: `${pct}%`, backgroundColor: 'currentColor' }}
                  />
                </div>
              </div>
              {i < STAGES.length - 1 && (
                <div className="hidden md:flex items-center text-muted-foreground/30">
                  <ChevronRight className="h-4 w-4" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
