"use client"

import { useEffect, useState } from "react"
import type { AuthConfig, AuthType, Service, ServiceFormData } from "@onecrm/shared"
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
  onSubmit: (data: ServiceFormData) => Promise<void>
  editingService?: Service
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  onSubmit,
  editingService,
}: ServiceFormDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("Globe")
  const [endpoint, setEndpoint] = useState("")
  const [authType, setAuthType] = useState<AuthType>("none")
  const [apiKey, setApiKey] = useState("")
  const [headerName, setHeaderName] = useState("X-API-Key")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [token, setToken] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (editingService && open) {
      setName(editingService.name)
      setDescription(editingService.description)
      setIcon(editingService.icon)
      setEndpoint(editingService.endpoint)
      setAuthType(editingService.authType)
      // Leave credential fields empty for editing
      setApiKey("")
      setHeaderName("X-API-Key")
      setUsername("")
      setPassword("")
      setToken("")
    } else if (open) {
      // Reset all fields for fresh dialog
      setName("")
      setDescription("")
      setIcon("Globe")
      setEndpoint("")
      setAuthType("none")
      setApiKey("")
      setHeaderName("X-API-Key")
      setUsername("")
      setPassword("")
      setToken("")
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
      await onSubmit({
        name,
        description,
        icon,
        endpoint,
        auth: buildAuthConfig(),
      })
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
            <Label>Icon</Label>
            <Select
              value={icon}
              onValueChange={(value) => {
                if (value != null) setIcon(value)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ICON_OPTIONS.map((iconName) => (
                  <SelectItem key={iconName} value={iconName}>
                    {iconName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="service-endpoint">Endpoint URL</Label>
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
