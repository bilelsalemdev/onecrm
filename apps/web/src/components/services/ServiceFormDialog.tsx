"use client"

import { useEffect, useState } from "react"
import type { AuthConfig, AuthType, Service } from "@onecrm/shared"
import { createService, updateService, uploadLogo } from "@/services/api"
import { ImageIcon, Palette } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ICON_OPTIONS = [
  "Globe",
  "Sparkles",
  "TrendingUp",
  "Award",
  "Building",
  "Store",
  "Landmark",
  "Heart",
  "Zap",
  "Shield",
] as const

const AUTH_TYPE_OPTIONS: { value: AuthType; label: string }[] = [
  { value: "none", label: "None" },
  { value: "api-key", label: "API Key" },
  { value: "basic", label: "Basic Auth" },
  { value: "bearer", label: "Bearer Token" },
]

interface ServiceFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  editingService?: Service
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  onSaved,
  editingService,
}: ServiceFormDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("Globe")
  const [color, setColor] = useState("")
  const [endpoint, setEndpoint] = useState("")
  const [ordersEndpoint, setOrdersEndpoint] = useState("")
  const [authType, setAuthType] = useState<AuthType>("none")
  const [apiKey, setApiKey] = useState("")
  const [headerName, setHeaderName] = useState("X-API-Key")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [token, setToken] = useState("")
  const [logoMode, setLogoMode] = useState<'icon' | 'upload'>('icon')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (editingService && open) {
      setName(editingService.name)
      setDescription(editingService.description)
      setIcon(editingService.icon)
      setColor(editingService.color ?? "")
      setEndpoint(editingService.endpoint)
      setOrdersEndpoint(editingService.ordersEndpoint ?? "")
      setAuthType(editingService.authType)
      // Leave credential fields empty for editing
      setApiKey("")
      setHeaderName("X-API-Key")
      setUsername("")
      setPassword("")
      setToken("")
      setLogoFile(null)
      setLogoPreview(editingService?.logo ?? null)
      setLogoMode(editingService?.logo ? 'upload' : 'icon')
    } else if (open) {
      // Reset all fields for fresh dialog
      setName("")
      setDescription("")
      setIcon("Globe")
      setColor("")
      setEndpoint("")
      setOrdersEndpoint("")
      setAuthType("none")
      setApiKey("")
      setHeaderName("X-API-Key")
      setUsername("")
      setPassword("")
      setToken("")
      setLogoFile(null)
      setLogoPreview(null)
      setLogoMode('icon')
    }
  }, [editingService, open])

  function buildAuthConfig(): AuthConfig {
    switch (authType) {
      case "api-key":
        return { type: "api-key", apiKey, headerName }
      case "basic":
        return { type: "basic", username, password }
      case "bearer":
        return { type: "bearer", token }
      case "none":
      default:
        return { type: "none" }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      let result: Service
      if (editingService) {
        result = await updateService(editingService.id, { name, description, icon, color: color || undefined, endpoint, ordersEndpoint: ordersEndpoint || undefined, auth: buildAuthConfig() })
      } else {
        result = await createService({ name, description, icon, color: color || undefined, endpoint, ordersEndpoint: ordersEndpoint || undefined, auth: buildAuthConfig() })
      }
      if (logoFile) {
        await uploadLogo(result.id, logoFile)
      }
      onSaved()
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  const isEditing = !!editingService
  const credentialPlaceholder = isEditing ? "••••••••" : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Service" : "Add Service"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the service configuration."
              : "Configure a new service connection."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="service-name">Name</Label>
            <Input
              id="service-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Brand Color</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: '#ef4444', label: 'Red' },
                { value: '#f97316', label: 'Orange' },
                { value: '#eab308', label: 'Yellow' },
                { value: '#22c55e', label: 'Green' },
                { value: '#06b6d4', label: 'Cyan' },
                { value: '#3b82f6', label: 'Blue' },
                { value: '#8b5cf6', label: 'Purple' },
                { value: '#ec4899', label: 'Pink' },
                { value: '#6b7280', label: 'Gray' },
                { value: '#0f172a', label: 'Dark' },
              ].map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(color === c.value ? '' : c.value)}
                  className={`h-7 w-7 rounded-full cursor-pointer transition-all duration-150 ring-offset-2 ring-offset-background ${
                    color === c.value ? 'ring-2 ring-foreground scale-110' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Service Image</Label>
            <div className="flex gap-1 rounded-lg border p-1 w-fit">
              <button
                type="button"
                onClick={() => setLogoMode('icon')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  logoMode === 'icon'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <Palette className="h-3.5 w-3.5" />
                Icon
              </button>
              <button
                type="button"
                onClick={() => setLogoMode('upload')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  logoMode === 'upload'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Upload Logo
              </button>
            </div>

            {logoMode === 'icon' ? (
              <Select
                value={icon}
                onValueChange={(value) => {
                  if (value != null) setIcon(value)
                }}
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((iconName) => (
                    <SelectItem key={iconName} value={iconName} className="cursor-pointer">
                      {iconName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <img src={logoPreview} alt="Logo preview" className="h-12 w-12 rounded-lg object-cover border shadow-sm" />
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setLogoFile(file)
                      setLogoPreview(URL.createObjectURL(file))
                    }
                  }}
                  className="flex-1 cursor-pointer"
                />
              </div>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="service-description">Description</Label>
            <Input
              id="service-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="service-endpoint">Contacts Endpoint URL</Label>
            <Input
              id="service-endpoint"
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://example.com/api/contacts"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="service-orders-endpoint">Orders Endpoint URL (optional)</Label>
            <Input
              id="service-orders-endpoint"
              type="url"
              value={ordersEndpoint}
              onChange={(e) => setOrdersEndpoint(e.target.value)}
              placeholder="https://example.com/api/orders"
            />
          </div>

          <div className="grid gap-2">
            <Label>Auth Type</Label>
            <Select
              value={authType}
              onValueChange={(value) => {
                if (value != null) setAuthType(value as AuthType)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUTH_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {authType === "api-key" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="auth-api-key">API Key</Label>
                <Input
                  id="auth-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={credentialPlaceholder}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auth-header-name">Header Name</Label>
                <Input
                  id="auth-header-name"
                  value={headerName}
                  onChange={(e) => setHeaderName(e.target.value)}
                />
              </div>
            </>
          )}

          {authType === "basic" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="auth-username">Username</Label>
                <Input
                  id="auth-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={credentialPlaceholder}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auth-password">Password</Label>
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={credentialPlaceholder}
                />
              </div>
            </>
          )}

          {authType === "bearer" && (
            <div className="grid gap-2">
              <Label htmlFor="auth-token">Token</Label>
              <Input
                id="auth-token"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder={credentialPlaceholder}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {isEditing ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
