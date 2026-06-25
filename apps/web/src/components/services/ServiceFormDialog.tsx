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
  { value: "login", label: "Login (JWT)" },
  { value: "bearer", label: "Bearer token" },
  { value: "api-key", label: "API key" },
  { value: "basic", label: "Basic auth" },
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
  const [resultsPath, setResultsPath] = useState("")
  const [authType, setAuthType] = useState<AuthType>("none")
  const [apiKey, setApiKey] = useState("")
  const [headerName, setHeaderName] = useState("X-API-Key")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [token, setToken] = useState("")
  // login auth
  const [loginUrl, setLoginUrl] = useState("")
  const [usernameField, setUsernameField] = useState("email")
  const [tokenPath, setTokenPath] = useState("")
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
      setEndpoint(editingService.endpoint ?? "")
      setOrdersEndpoint(editingService.ordersEndpoint ?? "")
      setResultsPath(editingService.resultsPath ?? "")
      setAuthType(editingService.authType)
      // Leave credential fields empty for editing (server preserves blanks)
      setApiKey("")
      setHeaderName("X-API-Key")
      setUsername("")
      setPassword("")
      setToken("")
      setLoginUrl("")
      setUsernameField("email")
      setTokenPath("")
      setLogoFile(null)
      setLogoPreview(editingService?.logo ?? null)
      setLogoMode(editingService?.logo ? 'upload' : 'icon')
    } else if (open) {
      setName("")
      setDescription("")
      setIcon("Globe")
      setColor("")
      setEndpoint("")
      setOrdersEndpoint("")
      setResultsPath("")
      setAuthType("none")
      setApiKey("")
      setHeaderName("X-API-Key")
      setUsername("")
      setPassword("")
      setToken("")
      setLoginUrl("")
      setUsernameField("email")
      setTokenPath("")
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
      case "login":
        return {
          type: "login",
          loginUrl,
          username,
          password,
          usernameField: usernameField.trim() || undefined,
          tokenPath: tokenPath.trim() || undefined,
        }
      case "none":
      default:
        return { type: "none" }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        name,
        description,
        icon,
        color: color || undefined,
        endpoint: endpoint.trim() || undefined,
        ordersEndpoint: ordersEndpoint.trim() || undefined,
        resultsPath: resultsPath.trim() || undefined,
        auth: buildAuthConfig(),
      }
      const result: Service = editingService
        ? await updateService(editingService.id, payload)
        : await createService(payload)
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
  const credentialPlaceholder = isEditing ? "•••••••• (unchanged)" : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit service" : "Add service"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update how this source connects and authenticates."
              : "Connect a source so its contacts and orders flow into the desk."}
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
            <Label>Brand color</Label>
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
            <Label>Service image</Label>
            <div className="flex gap-1 rounded-lg border border-border p-1 w-fit">
              <button
                type="button"
                onClick={() => setLogoMode('icon')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  logoMode === 'icon'
                    ? 'bg-primary text-primary-foreground'
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
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Upload logo
              </button>
            </div>

            {logoMode === 'icon' ? (
              <Select value={icon} onValueChange={(value) => { if (value != null) setIcon(value) }}>
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
                  <img src={logoPreview} alt="Logo preview" className="h-12 w-12 rounded-md object-cover border border-border" />
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
            <Label htmlFor="service-endpoint">Contact-us submissions endpoint (optional)</Label>
            <Input
              id="service-endpoint"
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="https://api.example.com/api/v1/contact-us"
            />
            <p className="text-xs text-muted-foreground">
              Your &ldquo;Contact&nbsp;Us&rdquo; form submissions. Leave blank if this app has no contact-us form.
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="service-orders-endpoint">Orders endpoint URL (optional)</Label>
            <Input
              id="service-orders-endpoint"
              type="url"
              value={ordersEndpoint}
              onChange={(e) => setOrdersEndpoint(e.target.value)}
              placeholder="https://api.example.com/api/v1/orders"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="service-results-path">List path (optional)</Label>
            <Input
              id="service-results-path"
              value={resultsPath}
              onChange={(e) => setResultsPath(e.target.value)}
              placeholder="auto-detect"
            />
            <p className="text-xs text-muted-foreground">
              For paginated APIs, the field holding the array. Blank auto-detects <code className="readout">results</code>, <code className="readout">items</code>, <code className="readout">data</code>.
            </p>
          </div>

          <div className="grid gap-2">
            <Label>Auth type</Label>
            <Select value={authType} onValueChange={(value) => { if (value != null) setAuthType(value as AuthType) }}>
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

          {authType === "login" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="auth-login-url">Login URL</Label>
                <Input
                  id="auth-login-url"
                  type="url"
                  value={loginUrl}
                  onChange={(e) => setLoginUrl(e.target.value)}
                  placeholder={isEditing ? "•••••••• (unchanged)" : "https://api.example.com/api/v1/auth/login"}
                  required={!isEditing}
                />
                <p className="text-xs text-muted-foreground">
                  onecrm posts the credentials here, then sends the returned token on every request.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="auth-login-username">Email or username</Label>
                  <Input
                    id="auth-login-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={credentialPlaceholder}
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="auth-login-password">Password</Label>
                  <Input
                    id="auth-login-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={credentialPlaceholder}
                    autoComplete="new-password"
                  />
                </div>
              </div>
              <details className="rounded-md border border-border px-3 py-2">
                <summary className="cursor-pointer text-sm text-muted-foreground">Advanced</summary>
                <div className="grid gap-3 pt-3">
                  <div className="grid gap-2">
                    <Label htmlFor="auth-username-field">Username field name</Label>
                    <Input
                      id="auth-username-field"
                      value={usernameField}
                      onChange={(e) => setUsernameField(e.target.value)}
                      placeholder="email"
                    />
                    <p className="text-xs text-muted-foreground">
                      JSON field the login endpoint expects (e.g. <code className="readout">email</code>, <code className="readout">identifier</code>).
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="auth-token-path">Token path</Label>
                    <Input
                      id="auth-token-path"
                      value={tokenPath}
                      onChange={(e) => setTokenPath(e.target.value)}
                      placeholder="auto-detect"
                    />
                    <p className="text-xs text-muted-foreground">
                      Where the token lives in the response. Blank auto-detects <code className="readout">access</code>, <code className="readout">access_token</code>, <code className="readout">accessToken</code>.
                    </p>
                  </div>
                </div>
              </details>
            </>
          )}

          {authType === "api-key" && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="auth-api-key">API key</Label>
                <Input
                  id="auth-api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={credentialPlaceholder}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auth-header-name">Header name</Label>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {isEditing ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
