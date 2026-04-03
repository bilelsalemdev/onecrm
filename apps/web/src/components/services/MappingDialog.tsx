import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { testEndpoint, saveMapping } from '@/services/api'
import type { FieldMapping } from '@onecrm/shared'
import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

const CONTACT_FIELDS = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'message', label: 'Message' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
]

const ORDER_FIELDS = [
  { key: 'id', label: 'ID' },
  { key: 'customerName', label: 'Customer Name' },
  { key: 'customerEmail', label: 'Customer Email' },
  { key: 'product', label: 'Product' },
  { key: 'amount', label: 'Amount' },
  { key: 'currency', label: 'Currency' },
  { key: 'date', label: 'Date' },
  { key: 'status', label: 'Status' },
]

interface MappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  serviceId: string
  type: 'contacts' | 'orders'
  existingMapping?: FieldMapping
  onSaved: () => void
}

export function MappingDialog({ open, onOpenChange, serviceId, type, existingMapping, onSaved }: MappingDialogProps) {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [remoteFields, setRemoteFields] = useState<string[]>([])
  const [sample, setSample] = useState<Record<string, unknown> | null>(null)
  const [mapping, setMapping] = useState<FieldMapping>(existingMapping ?? {})
  const [fetched, setFetched] = useState(false)

  const ourFields = type === 'contacts' ? CONTACT_FIELDS : ORDER_FIELDS

  async function handleFetchSample() {
    setLoading(true)
    setError(null)
    try {
      const result = await testEndpoint(serviceId, type)
      setRemoteFields(result.fields)
      setSample(result.sample)
      setFetched(true)

      // Auto-map fields with exact name matches
      if (Object.keys(mapping).length === 0) {
        const autoMap: FieldMapping = {}
        for (const field of ourFields) {
          if (result.fields.includes(field.key)) {
            autoMap[field.key] = field.key
          }
        }
        setMapping(autoMap)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch from endpoint')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveMapping(serviceId, type, mapping)
      onSaved()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  function updateMapping(ourField: string, remoteField: string) {
    setMapping((prev) => {
      const next = { ...prev }
      if (remoteField === '__none__') {
        delete next[ourField]
      } else {
        next[ourField] = remoteField
      }
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Map {type === 'contacts' ? 'Contact' : 'Order'} Fields</DialogTitle>
          <DialogDescription>
            Fetch a sample from the API and map each field to our data structure.
          </DialogDescription>
        </DialogHeader>

        {!fetched ? (
          <div className="flex flex-col items-center gap-5 py-6">
            <div className="w-full rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/70">How it works</p>
              <p className="text-sm text-muted-foreground">
                External APIs often use different field names. This tool lets you map them to OneCRM's structure.
              </p>
              <div className="rounded-md bg-background p-3 space-y-2 text-xs">
                <p className="font-medium text-foreground/80">Example: your API returns</p>
                <pre className="text-muted-foreground bg-muted/50 rounded px-2 py-1.5 overflow-x-auto">{type === 'contacts'
  ? `{ "full_name": "Ahmed", "mail": "ahmed@co.dz", "tel": "+213..." }`
  : `{ "client": "Ahmed", "total_price": 150, "order_date": "2026-01-15" }`}</pre>
                <p className="font-medium text-foreground/80 pt-1">You map it like this:</p>
                <div className="space-y-1">
                  {type === 'contacts' ? (
                    <>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium text-foreground/70 w-16">Name</span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <span className="bg-muted/50 rounded px-1.5 py-0.5 font-mono">full_name</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium text-foreground/70 w-16">Email</span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <span className="bg-muted/50 rounded px-1.5 py-0.5 font-mono">mail</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium text-foreground/70 w-16">Phone</span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <span className="bg-muted/50 rounded px-1.5 py-0.5 font-mono">tel</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium text-foreground/70 w-28">Customer Name</span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <span className="bg-muted/50 rounded px-1.5 py-0.5 font-mono">client</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium text-foreground/70 w-28">Amount</span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <span className="bg-muted/50 rounded px-1.5 py-0.5 font-mono">total_price</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium text-foreground/70 w-28">Date</span>
                        <ArrowRight className="h-3 w-3 shrink-0" />
                        <span className="bg-muted/50 rounded px-1.5 py-0.5 font-mono">order_date</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button onClick={handleFetchSample} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                'Fetch Sample & Start Mapping'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {sample && (
              <div className="rounded-lg bg-muted/50 p-3 text-xs">
                <p className="font-medium text-muted-foreground mb-2">Sample response (first record):</p>
                <pre className="overflow-x-auto whitespace-pre-wrap break-all text-foreground/80">
                  {JSON.stringify(sample, null, 2)}
                </pre>
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                <span>Our Field</span>
                <span />
                <span>API Field</span>
              </div>

              {ourFields.map((field) => (
                <div key={field.key} className="grid grid-cols-[1fr,auto,1fr] gap-2 items-center">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm font-medium">{field.label}</Label>
                    {mapping[field.key] && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                  <Select
                    value={mapping[field.key] ?? '__none__'}
                    onValueChange={(val) => { if (val != null) updateMapping(field.key, val) }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Not mapped" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Not mapped —</SelectItem>
                      {remoteFields.map((rf) => (
                        <SelectItem key={rf} value={rf}>
                          {rf}
                          {sample && sample[rf] !== undefined && (
                            <span className="ml-2 text-muted-foreground text-xs">
                              ({String(sample[rf]).slice(0, 30)})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {fetched && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Mapping'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
